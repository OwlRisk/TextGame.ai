import { NextResponse } from 'next/server';

const CARTESIA_VERSION = '2025-04-16';

/**
 * GET /api/cartesia-voices
 * Fetch available voices from Cartesia for TTS; use different voice ids per player in a game.
 * Requires CARTESIA_API_KEY.
 */
export async function GET() {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'CARTESIA_API_KEY not set' },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Cartesia-Version': CARTESIA_VERSION,
  };

  try {
    const [maleRes, femaleRes] = await Promise.all([
      fetch(`https://api.cartesia.ai/voices?gender=masculine&limit=20`, { headers }),
      fetch(`https://api.cartesia.ai/voices?gender=feminine&limit=20`, { headers }),
    ]);

    if (!maleRes.ok || !femaleRes.ok) {
      const err = !maleRes.ok ? await maleRes.text() : await femaleRes.text();
      return NextResponse.json(
        { error: err || 'Failed to fetch voices' },
        { status: maleRes.ok ? femaleRes.status : maleRes.status }
      );
    }

    const maleJson = (await maleRes.json()) as { data?: Array<{ id: string; name?: string }> };
    const femaleJson = (await femaleRes.json()) as { data?: Array<{ id: string; name?: string }> };

    const masculine = (maleJson.data || []).map((v) => ({ id: v.id, name: v.name || v.id }));
    const feminine = (femaleJson.data || []).map((v) => ({ id: v.id, name: v.name || v.id }));

    return NextResponse.json({
      masculine,
      feminine,
      hint: 'Copy id into src/app/api/tts/route.ts MALE_CARTESIA_IDS or FEMALE_CARTESIA_IDS to add more distinct voices per game.',
    });
  } catch (e) {
    console.error('[cartesia-voices]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
