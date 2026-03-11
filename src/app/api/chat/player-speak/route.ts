import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { buildSystemPrompt, PLAYER_SPEAK_HARD_LIMIT_TOKENS } from '@/lib/player-speak-prompt';
import { deductTokens, estimatedTokensToCoins } from '@/lib/tokens';
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

/** For 20 Questions: find who the Thinker is from Host messages. */
function extractThinkerName(messages: Array<{ senderName: string; content: string }>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i].content;
    const match = m.match(/(\w[\w\s]+?)\s+is\s+the\s+Thinker/i) ?? m.match(/Thinker[:\s—]+(\w[\w\s]+)/i);
    if (match) return match[1].trim();
  }
  return '';
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

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-50)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const system = buildSystemPrompt(player.name, gameTemplate, gameName || 'the game', player.personality, player.background);

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

    if (player.personality) lines.push(`Your personality: ${player.personality}`);
    if (player.background) lines.push(`Your background: ${player.background}`);

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
      lines.push(`The game just started. Introduce yourself or react as ${player.name} — make it unmistakably YOU. Do NOT repeat what others already said (read the recent messages above carefully). Your personality, background, and way of seeing the world should be obvious from just these 1-2 sentences. Maybe you're sizing someone up, maybe you're cracking a joke, maybe you're already suspicious of someone — show it.`);
    } else if (gameTemplate === '20-questions') {
      // Inject structured Q&A history so the model can reason from confirmed facts
      const allMessages = recentMessages;
      const qaLog = extractQALog(allMessages);
      const thinker = extractThinkerName(allMessages);
      if (thinker) lines.push(`Thinker (the person answering): ${thinker}`);
      if (qaLog) {
        lines.push('');
        lines.push(`CONFIRMED Q&A HISTORY (do NOT ask these again):\n${qaLog}`);
        lines.push(`(${qaLog.split('\n').length} question(s) used so far)`);
      }
      lines.push('');
      lines.push(`Your turn as ${player.name} (GUESSER). RULES:
1. Check the Q&A history above — NEVER repeat a question already listed there.
2. Ask ONE new yes/no question that builds on the confirmed facts, OR make a final guess if you're confident.
3. React briefly to the last answer first (surprise, frustration, excitement) — 1 sentence — then ask your question.
4. 1–2 sentences total. No strategies, no "we should ask...", just play.
5. If you truly have nothing new, output an emoji reaction: REACT: 🤔`);
    } else {
      lines.push(`Your turn as ${player.name}. RULES:
1. Read every recent message carefully. If someone already said exactly what you were going to say, do NOT repeat it — find a different angle, or react emotionally to what was said.
2. Do NOT ask for confirmation on answers already given. Accept them and build forward.
3. NO meta-commentary. Never say "we should ask X" or "that's ambiguous" — just play.
4. LAST RESORT ONLY: if you truly have zero to add and no emotional reaction either, output "..." — but exhaust every other option first. Emotional reactions (doubt, excitement, discomfort, amusement) count as a contribution.`);
    }

    const userContent = lines.join('\n');

    const chatModel = sanitizeModel(preferredModel);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      max_completion_tokens: PLAYER_SPEAK_HARD_LIMIT_TOKENS,
      temperature: 0.85,
    }, { signal: ac.signal });
    clearTimeout(timer);

    const message = (completion.choices[0]?.message?.content || '').trim();

    // Deduct tokens after successful generation
    const totalTokens = completion.usage?.total_tokens;
    if (totalTokens && totalTokens > 0) {
      const coins = estimatedTokensToCoins(totalTokens, chatModel);
      deductTokens(user.id, Math.max(1, coins), 'ai_player_speak', `Player speak ${totalTokens} tokens`)
        .catch((e) => console.error('[player-speak] deduct error:', e));
    }

    return NextResponse.json({ message: message || '...' });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate player message' },
      { status: 500 }
    );
  }
}
