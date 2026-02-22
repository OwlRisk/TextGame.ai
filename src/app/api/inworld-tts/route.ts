/**
 * POST /api/inworld-tts
 * Synthesize speech via Inworld TTS. Body: { text, voiceId }.
 * Returns { audioBase64, contentType } for playback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { env } from '@/lib/env';

const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice';
const MAX_TEXT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const basic = env.INWORLD_BASIC_BASE64;
    if (!basic) {
      return NextResponse.json(
        { error: 'INWORLD_BASIC_BASE64 not configured' },
        { status: 503 }
      );
    }

    let body: { text?: string; voiceId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'text and voiceId are required' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `text must be at most ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const res = await fetch(INWORLD_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        text,
        voiceId,
        modelId: 'inworld-tts-1.5-mini',
        audioConfig: {
          audioEncoding: 'MP3',
          sampleRateHertz: 22050,
        },
        applyTextNormalization: 'ON',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[inworld-tts] upstream error', res.status, errText);
      return NextResponse.json(
        { error: 'TTS synthesis failed', details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { audioContent?: string };
    const audioBase64 = data?.audioContent;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json(
        { error: 'No audio in response' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      audioBase64,
      contentType: 'audio/mpeg',
    });
  } catch (e) {
    console.error('[inworld-tts]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
