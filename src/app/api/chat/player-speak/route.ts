import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { buildSystemPrompt, getPlayerTokenLimit } from '@/lib/player-speak-prompt';
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

    const { gameName, gameTemplate, rules, gamePhase, player, recentMessages, playerRoster, preferredModel, channelGoal, playerNotes, isSeedGreeting } = body as {
      gameName?: string;
      gameTemplate?: string;
      rules?: string;
      gamePhase?: string;
      preferredModel?: string;
      isSeedGreeting?: boolean;
      /** Optional task injected when the player is in a private "decision" channel. */
      channelGoal?: string;
      /** Player's own private notes from previous turns (written via [MY_NOTES] tags). */
      playerNotes?: string;
      player: {
        name: string;
        role?: string;
        personality?: string;
        background?: string;
        /** Private My Board content the host wrote for this player (secret info they know). */
        boardContent?: string;
      };
      recentMessages: Array<{ senderName: string; content: string }>;
      /** All players in the game — same list the human sees in the sidebar. */
      playerRoster?: Array<{ name: string; role?: string; isHuman?: boolean }>;
    };

    if (!player?.name || !Array.isArray(recentMessages)) {
      return NextResponse.json({ error: 'player.name and recentMessages array required' }, { status: 400 });
    }

    const chatModel = sanitizeModel(preferredModel);
    const estCoins = estimatedTokensToCoins(1500, chatModel);
    if (!(await hasTokens(user.id, estCoins))) {
      return NextResponse.json({ error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' }, { status: 402 });
    }

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-50)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const system = buildSystemPrompt(player.name, gameTemplate, gameName || 'the game', player.personality, player.background, player.role);

    // Build user content: game context + private knowledge + recent chat
    const lines: string[] = [];
    lines.push(`Game: ${gameName || 'Unknown game'}`);
    if (gameTemplate) lines.push(`Type: ${gameTemplate}`);
    if (gamePhase) lines.push(`Current phase: ${gamePhase}`);
    lines.push('');

    // Private info this player knows (from Host's My Board)
    if (player.boardContent?.trim()) {
      lines.push(`Your private info (only you know this — act accordingly):\n${player.boardContent.trim()}`);
      lines.push('');
    } else if (player.role) {
      lines.push(`Your secret role: ${player.role}`);
    }

    // Personality and background are already in the system prompt — no need to repeat here

    // Player's own persistent notes from previous turns
    if (playerNotes?.trim()) {
      lines.push('');
      lines.push(`Your private notes from previous turns:\n${playerNotes.trim().slice(0, 500)}`);
    }

    // Player roster: same list the human sees in the sidebar
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

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      max_completion_tokens: getPlayerTokenLimit(gameTemplate),
    }, { signal: ac.signal });
    clearTimeout(timer);

    const message = (completion.choices[0]?.message?.content || '').trim();

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const actualModel = (completion as { model?: string }).model ?? chatModel;
    if (promptTokens + completionTokens > 0) {
      const coins = gptUsageToCoins(actualModel, promptTokens, completionTokens);
      await deductTokens(user.id, Math.max(1, coins), 'ai_player_speak', `Player speak ${promptTokens}+${completionTokens} tokens (${actualModel})`);
    }

    return NextResponse.json({ message });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate player message' },
      { status: 500 }
    );
  }
}
