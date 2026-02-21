import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set.');
  return new OpenAI({ apiKey });
}

const NAV_PROMPTS: Record<string, string> = {
  home: 'A simple, clean icon for "Home" or main hub: cozy house shape, warm and inviting. Flat design, minimal, icon style, solid colors, no text. Dark background with violet/purple accent. App sidebar icon aesthetic.',
  'my-games': 'A simple, clean icon for "My Games" or game library: video game controller or collection of game pieces. Flat design, minimal, icon style, solid colors, no text. Dark background with blue accent. App sidebar icon aesthetic.',
  discover: 'A simple, clean icon for "Discover" or explore: compass or magnifying glass with sparkles. Flat design, minimal, icon style, solid colors, no text. Dark background with amber/orange accent. App sidebar icon aesthetic.',
};

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const slug = body.slug as string;
    if (!slug || !NAV_PROMPTS[slug]) {
      return NextResponse.json(
        { error: 'slug is required and must be one of: home, my-games, discover' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: NAV_PROMPTS[slug],
      size: '256x256',
      response_format: 'b64_json',
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data from DALL-E');

    const imageUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ icon: imageUrl });
  } catch (error: unknown) {
    console.error('Error generating nav icon:', error);
    const err = error as { status?: number };
    if (err.status === 401) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    if (err.status === 429) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate nav icon' },
      { status: 500 }
    );
  }
}
