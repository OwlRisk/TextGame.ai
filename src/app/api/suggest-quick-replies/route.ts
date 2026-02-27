import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/suggest-quick-replies
 * Body: { gameName, rules, recentMessages: { senderName, content }[], gamePhase? }
 * Returns: { suggestions: string[] } — 1 to 3 short quick-reply options for the current situation.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      gameName = 'this game',
      rules = '',
      recentMessages = [],
      gamePhase = '',
      preferredModel,
    } = body as {
      gameName?: string;
      rules?: string;
      recentMessages?: Array<{ senderName: string; content: string }>;
      gamePhase?: string;
      preferredModel?: string;
    };

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-10)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');
    const rulesSnippet = (rules || '').slice(0, 1200);

    const systemPrompt = `You are a game room assistant. Given the game rules and the recent conversation in the room, suggest 1 to 3 short "quick reply" options that the human player could tap to send. 
- Decide how many options make sense (1, 2, or 3). Fewer is fine when one obvious reply is enough.
- Each option must be one short sentence, natural and relevant to the current situation (e.g. "Continue.", "I'm ready.", "I vote for Maya.", "I have a night action.").
- Match the tone of the game. Output only the suggestions, one per line. No numbering, no quotes, no extra text. Use English.`;

    const userPrompt = `Game: ${gameName}${gamePhase ? `\nPhase: ${gamePhase}` : ''}

Recent messages in this room:
${recentText || '(No messages yet)'}

${rulesSnippet ? `Rules (excerpt):\n${rulesSnippet}\n` : ''}
Generate 1 to 3 quick-reply options (one per line), or fewer if only one makes sense:`;

    const completion = await openai.chat.completions.create({
      model: preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 150,
      temperature: 0.6,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || '';
    const suggestions = text
      .split('\n')
      .map((s) => s.replace(/^[\d.)\-\s]+/, '').replace(/^["']|["']$/g, '').trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('[suggest-quick-replies]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate quick replies' },
      { status: 500 }
    );
  }
}
