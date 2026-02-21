import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/suggest-prompts
 * Body: { gameName: string, lastHostMessage: string, rulesSnippet?: string }
 * Returns: { suggestions: string[] } — 3–5 short prompts the player could send (e.g. theme ideas, round length, ready).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      gameName = 'this game',
      lastHostMessage = '',
      rulesSnippet = '',
    } = body as {
      gameName?: string;
      lastHostMessage?: string;
      rulesSnippet?: string;
    };

    const openai = getOpenAI();

    const systemPrompt = `You are a game room assistant. Based on what the host just said, generate 3–5 short "suggestion prompts" that a player could tap to send as their reply.
Rules: Each suggestion is one short sentence, natural and relevant (e.g. theme ideas, round length, scoring vs casual, or "I'm ready").
Output only the suggestions, one per line. No numbering, no quotes, no extra text. Use English.`;

    const userPrompt = `Game: ${gameName}\nHost's last message:\n${lastHostMessage}\n${rulesSnippet ? `Rules snippet:\n${rulesSnippet.slice(0, 400)}\n` : ''}\nGenerate 3–5 short suggestion replies (one per line):`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 200,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || '';
    const suggestions = text
      .split('\n')
      .map((s) => s.replace(/^[\d.)\-\s]+/, '').trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('[suggest-prompts]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
