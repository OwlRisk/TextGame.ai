import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/chat/player-speak
 * Body: { gameName, rules, player: { name, role?, personality?, background? }, recentMessages: { senderName, content }[] }
 * Returns: { message: string } — one short in-character reply from that AI player.
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
    const { gameName, rules, player, recentMessages } = body as {
      gameName?: string;
      rules?: string;
      player: { name: string; role?: string; personality?: string; background?: string };
      recentMessages: Array<{ senderName: string; content: string }>;
    };

    if (!player?.name || !Array.isArray(recentMessages)) {
      return NextResponse.json({ error: 'player.name and recentMessages array required' }, { status: 400 });
    }

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-12)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');
    const system = `You are ${player.name}, a real person playing a social deduction game with friends. Speak exactly like a real player at a game table—casual, direct, and to the point. Short sentences. React to what was just said. Make accusations, ask questions, defend yourself, or cast doubt—whatever fits the moment.

STRICT RULES:
- No dramatic monologues, no poetic metaphors, no philosophical speeches.
- No "In the shadows of..." or "I sense a deeper darkness..." style language.
- Talk like a real person, not a movie villain or a literary character.
- 1–2 sentences max. Plain spoken English.
- Never break character. No labels, no "As ${player.name}, I say...".`;
    let userContent = `Game: ${gameName || 'Social deduction game'}\n\nRecent chat:\n${recentText || '(No messages yet)'}\n\nYour turn. Reply as ${player.name}.`;
    if (player.role) userContent += ` Your secret role: ${player.role}.`;
    if (player.personality) userContent += ` Your vibe: ${player.personality}.`;
    if (player.background) userContent += ` Background: ${player.background}.`;
    if (rules && rules.trim()) userContent += `\n\nGame rules:\n${rules.slice(0, 1500)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      max_tokens: 80,
      temperature: 0.9,
    });
    const message = (completion.choices[0]?.message?.content || '').trim();
    return NextResponse.json({ message: message || "..." });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate player message' },
      { status: 500 }
    );
  }
}
