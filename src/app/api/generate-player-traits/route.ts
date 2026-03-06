import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/lib/env';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = (await request.json()) as { prompt?: string };
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      max_completion_tokens: 300,
      temperature: 1.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a creative game writer who invents vivid, realistic characters for any game genre. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '{}';
    const data = JSON.parse(text) as { personality?: string; background?: string };

    if (!data.personality || !data.background) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[generate-player-traits]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate traits' },
      { status: 500 }
    );
  }
}
