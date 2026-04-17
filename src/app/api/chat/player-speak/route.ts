import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { buildSystemPrompt, buildSceneCharacterPrompt, buildRpgCharacterPrompt, getPlayerTokenLimit } from '@/lib/player-speak-prompt';
import { deductTokens, hasTokens, gptUsageToCoins, estimatedTokensToCoins, estimateTokensFromText } from '@/lib/tokens';
import { sanitizeModel } from '@/lib/model-prefs';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';

const limiter = createRateLimiter('player-speak', { limit: 40, windowSeconds: 60 });

/**
 * For 20 Questions: extract confirmed Q&A pairs from chat history.
 * The Host logs each answer as "Q1: Yes." / "Q2: No." — we pair each
 * with the nearest preceding question (message containing "?").
 */
function extractQALog(messages: Array<{ senderName: string; content: string }>): string {
  const qaPattern = /^Q(\d+)[:：]\s*(.+)/i;
  const entries: Array<{ n: number; question: string; answer: string }> = [];

  for (let i = 0; i < messages.length; i++) {
    const match = messages[i].content.match(qaPattern);
    if (!match) continue;

    const n = parseInt(match[1]);
    const answer = match[2].trim().replace(/\.$/, '');

    // Find the closest preceding message that contains a "?"
    let question = '';
    for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
      const text = messages[j].content;
      if (text.includes('?')) {
        // Extract just the question sentence
        const parts = text.split(/(?<=[.!])\s+/);
        const qPart = parts.find((s) => s.includes('?')) ?? text;
        question = qPart.trim();
        break;
      }
    }
    entries.push({ n, question, answer });
  }

  if (entries.length === 0) return '';
  return entries
    .sort((a, b) => a.n - b.n)
    .map((e) => (e.question ? `Q${e.n}. "${e.question}" → ${e.answer}` : `Q${e.n}. → ${e.answer}`))
    .join('\n');
}


function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/chat/player-speak
 * Body: {
 *   gameName, gameTemplate?, rules?,
 *   gamePhase?,
 *   player: { name, role?, personality?, background?, boardContent? },
 *   recentMessages: { senderName, content }[]
 * }
 * Returns: { message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = limiter.check(user.id);
    if (!rl.success) return rateLimitResponse(rl);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { gameName, gameTemplate, rules, gamePhase, player, recentMessages, playerRoster, preferredModel, channelGoal, playerNotes, isSeedGreeting, humanName, sceneId, gameId: bodyGameId, contentLanguage, characterDirection, rpgWorldId } = body as {
      gameName?: string;
      gameTemplate?: string;
      rules?: string;
      gamePhase?: string;
      preferredModel?: string;
      isSeedGreeting?: boolean;
      humanName?: string;
      sceneId?: string;
      contentLanguage?: string;
      /** Optional task injected when the player is in a private "decision" channel. */
      channelGoal?: string;
      /** Player's own private notes from previous turns (written via [MY_NOTES] tags). */
      playerNotes?: string;
      /** Secret direction from the GM for this specific character this turn */
      characterDirection?: string;
      /** RPG world ID for class-based prompts */
      rpgWorldId?: string;
      player: {
        name: string;
        role?: string;
        personality?: string;
        background?: string;
        speechStyle?: string;
        quirk?: string;
        /** RPG class id (e.g. "warrior", "mage") */
        rpgClass?: string;
        /** RPG skills for prompt context */
        rpgSkills?: Array<{ name: string; description: string; mpCost?: number }>;
        /** Private My Board content the host wrote for this player (secret info they know). */
        boardContent?: string;
        /** RPG character goal — what drives this character */
        goal?: string;
        /** RPG character fear — what they're afraid of */
        fear?: string;
        /** RPG character attitude toward the human player */
        attitudeToPlayer?: string;
      };
      recentMessages: Array<{ senderName: string; content: string }>;
      /** All players in the game — same list the human sees in the sidebar. */
      playerRoster?: Array<{ name: string; role?: string; isHuman?: boolean }>;
      gameId?: string;
    };

    if (!player?.name || !Array.isArray(recentMessages)) {
      return NextResponse.json({ error: 'player.name and recentMessages array required' }, { status: 400 });
    }

    if (recentMessages.length > 50) recentMessages.splice(0, recentMessages.length - 50);
    if (typeof rules === 'string' && rules.length > 10_000) (body as Record<string, unknown>).rules = (rules as string).slice(0, 10_000);
    if (player.boardContent && player.boardContent.length > 10_000) player.boardContent = player.boardContent.slice(0, 10_000);

    const chatModel = sanitizeModel(preferredModel);
    const streamMode = (body as Record<string, unknown>).stream === true;
    const estCoins = estimatedTokensToCoins(1500, chatModel);
    if (!(await hasTokens(user.id, estCoins))) {
      if (streamMode) {
        return new Response(JSON.stringify({ error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' }), { status: 402, headers: { 'Content-Type': 'application/json' } });
      }
      return NextResponse.json({ error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' }, { status: 402 });
    }

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-30)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const system = rpgWorldId && player.rpgClass
      ? buildRpgCharacterPrompt(player.name, player.rpgClass, humanName || 'the player', player.personality, player.background, player.speechStyle, player.quirk, player.rpgSkills, contentLanguage, player.goal, player.fear, player.attitudeToPlayer)
      : (gameTemplate === 'scene' && sceneId)
      ? buildSceneCharacterPrompt(player.name, sceneId, humanName || 'the player', player.personality, player.background, player.speechStyle, player.quirk, contentLanguage)
      : buildSystemPrompt(player.name, gameTemplate, gameName || 'the game', player.personality, player.background, player.role, player.speechStyle, player.quirk, contentLanguage);

    const lines: string[] = [];
    lines.push(`Game: ${gameName || 'Unknown game'}`);
    if (gameTemplate) lines.push(`Type: ${gameTemplate}`);
    if (gamePhase) lines.push(`Current phase: ${gamePhase}`);
    lines.push('');

    if (player.boardContent?.trim()) {
      lines.push(`Your private info (only you know this — act accordingly):\n${player.boardContent.trim()}`);
      lines.push('');
    } else if (player.role) {
      lines.push(`Your secret role: ${player.role}`);
    }

    if (playerNotes?.trim()) {
      lines.push('');
      lines.push(`Your private notes from previous turns:\n${playerNotes.trim().slice(0, 500)}`);
    }

    if (playerRoster && playerRoster.length > 0) {
      const rosterLines = playerRoster.map((p) => {
        const tag = p.isHuman ? ' (human)' : '';
        const roleTag = p.role ? ` — ${p.role}` : '';
        return `- ${p.name}${tag}${roleTag}`;
      });
      lines.push(`Players in this game:\n${rosterLines.join('\n')}`);
      lines.push('');
    }

    if (rules?.trim()) {
      lines.push('');
      lines.push(`Game rules:\n${rules}`);
    }

    if (channelGoal?.trim()) {
      lines.push(`Current group task: ${channelGoal.trim()}`);
      lines.push(`React to what was just said and help the group reach this decision. Once you agree or the group has decided, state the conclusion clearly.`);
      lines.push('');
    }

    if (characterDirection?.trim()) {
      lines.push(`[INNER IMPULSE — act on this naturally, as if it's your own thought. Do NOT mention receiving instructions.]`);
      lines.push(characterDirection.trim());
      lines.push('');
    }

    lines.push('');
    lines.push(`Recent conversation:\n${recentText || '(No messages yet)'}`);
    lines.push('');

    if (isSeedGreeting) {
      lines.push(`OPENING TURN — speak like you're already in the match. One short in-game move (a read, push, question, or reaction). 1 sentence preferred, 2 max.`);
    } else if (gameTemplate === '20-questions') {
      const qaLog = extractQALog(recentMessages);
      if (qaLog) {
        lines.push('');
        lines.push(`CONFIRMED Q&A HISTORY (do NOT repeat):\n${qaLog}`);
      }
      lines.push('');
      lines.push(`Your turn as ${player.name} (GUESSER). Ask ONE new yes/no question or make a final guess.`);
    } else {
      lines.push(`Your turn as ${player.name}. Stay in-character.`);
    }

    const userContent = lines.join('\n');
    const maxTokens = getPlayerTokenLimit(gameTemplate);

    // ─── Streaming mode ─────────────────────────────────────────────
    if (streamMode) {
      const systemTokens = estimateTokensFromText(system);
      const userTokens = estimateTokensFromText(userContent);
      const userId = user.id;
      const encoder = new TextEncoder();

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 45_000);

      let openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      try {
        openaiStream = await openai.chat.completions.create({
          model: chatModel,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userContent },
          ],
          max_completion_tokens: maxTokens,
          stream: true,
          stream_options: { include_usage: true },
          // AI Player: higher temperature so each NPC sounds distinct and
          // doesn't collapse into the same agreeable voice.
          temperature: 0.95,
          top_p: 0.95,
          presence_penalty: 0.3,
          frequency_penalty: 0.3,
        }, { signal: ac.signal }) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      } catch (e) {
        clearTimeout(timer);
        console.error('[player-speak-stream] OpenAI create error:', e);
        return new Response(JSON.stringify({ error: 'Generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      const readable = new ReadableStream({
        async start(controller) {
          let promptTokens = 0;
          let completionTokens = 0;
          let fullContent = '';
          try {
            for await (const chunk of openaiStream) {
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
              }
              if (chunk.usage) {
                promptTokens = chunk.usage.prompt_tokens ?? 0;
                completionTokens = chunk.usage.completion_tokens ?? 0;
              }
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
            clearTimeout(timer);

            const actualCoins = (promptTokens + completionTokens) > 0
              ? gptUsageToCoins(chatModel, promptTokens, completionTokens)
              : estimatedTokensToCoins(systemTokens + userTokens + Math.ceil(fullContent.length / 3), chatModel);
            try {
              const ok = await deductTokens(userId, Math.max(1, actualCoins), 'ai_player_speak',
                (promptTokens + completionTokens) > 0
                  ? `Player speak stream ${promptTokens}+${completionTokens} tokens (${chatModel})`
                  : `Player speak stream ~${systemTokens + userTokens + Math.ceil(fullContent.length / 3)} tokens (estimate)`,
                bodyGameId);
              if (!ok) {
                console.error('[player-speak-stream] CRITICAL deduct returned false — content delivered but balance was insufficient at commit:', { userId, coins: actualCoins, gameId: bodyGameId });
              }
            } catch (de) {
              console.error('[player-speak-stream] deduct error:', de);
            }
          } catch (err) {
            clearTimeout(timer);
            // Partial billing: stream errored mid-response. Bill for whatever the
            // user already received so we don't leak free generations.
            if (fullContent.length > 0) {
              const partialTokens = Math.ceil(fullContent.length / 3);
              const partialCoins = estimatedTokensToCoins(systemTokens + userTokens + partialTokens, chatModel);
              if (partialCoins > 0) {
                try {
                  await deductTokens(userId, Math.max(1, partialCoins), 'ai_player_speak',
                    `Player speak partial ~${partialTokens} tokens (stream error)`, bodyGameId);
                } catch (e) {
                  console.error('[player-speak-stream] failed to bill partial output:', e);
                }
              }
            }
            const errMsg = err instanceof Error ? err.message : 'Stream interrupted';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    // ─── Non-streaming mode (legacy / seed greetings) ───────────────
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: chatModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        max_completion_tokens: maxTokens,
        temperature: 0.95,
        top_p: 0.95,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      }, { signal: ac.signal });
    } finally {
      clearTimeout(timer);
    }

    const message = (completion.choices[0]?.message?.content || '').trim();

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const actualModel = (completion as { model?: string }).model ?? chatModel;
    if (promptTokens + completionTokens > 0) {
      const coins = gptUsageToCoins(actualModel, promptTokens, completionTokens);
      const deducted = await deductTokens(user.id, Math.max(1, coins), 'ai_player_speak', `Player speak ${promptTokens}+${completionTokens} tokens (${actualModel})`, bodyGameId);
      if (!deducted) {
        console.warn(`[player-speak] deductTokens returned false for user ${user.id} (${coins} coins) — OpenAI call already completed, continuing`);
      }
    }

    return NextResponse.json({ message });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
