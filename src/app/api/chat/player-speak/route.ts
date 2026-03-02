import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { buildSystemPrompt, PLAYER_SPEAK_HARD_LIMIT_TOKENS } from '@/lib/player-speak-prompt';

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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { gameName, gameTemplate, rules, gamePhase, player, recentMessages, preferredModel, channelGoal, playerNotes } = body as {
      gameName?: string;
      gameTemplate?: string;
      rules?: string;
      gamePhase?: string;
      preferredModel?: string;
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
    };

    if (!player?.name || !Array.isArray(recentMessages)) {
      return NextResponse.json({ error: 'player.name and recentMessages array required' }, { status: 400 });
    }

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-14)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const system = buildSystemPrompt(player.name, gameTemplate, gameName || 'the game');

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

    if (rules?.trim()) {
      lines.push('');
      lines.push(`Game rules (summary):\n${rules.slice(0, 1200)}`);
    }

    if (channelGoal?.trim()) {
      lines.push(`Current group task: ${channelGoal.trim()}`);
      lines.push(`React to what was just said and help the group reach this decision. Once you agree or the group has decided, state the conclusion clearly.`);
      lines.push('');
    }

    lines.push('');
    lines.push(`Recent conversation:\n${recentText || '(No messages yet)'}`);
    lines.push('');
    lines.push(`Your turn. Reply as ${player.name}.`);

    const userContent = lines.join('\n');

    const chatModel = preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.2';
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      max_completion_tokens: PLAYER_SPEAK_HARD_LIMIT_TOKENS,
      temperature: 0.85,
    });

    const message = (completion.choices[0]?.message?.content || '').trim();
    return NextResponse.json({ message: message || '...' });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate player message' },
      { status: 500 }
    );
  }
}
