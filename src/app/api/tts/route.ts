import { NextRequest, NextResponse } from 'next/server';

/** Cartesia Sonic 3 model — https://docs.cartesia.ai/api-reference/tts/bytes */
const CARTESIA_MODEL = 'sonic-3';
const CARTESIA_VERSION = '2025-04-16';

/**
 * Cartesia voice UUIDs — 一局多人需要不同声音，每个“声音名”对应一个 ID。
 * 来自 GET /api/cartesia-voices（Cartesia List Voices）。
 */
const MALE_CARTESIA_IDS = [
  '5ee9feff-1265-424a-9d7f-8e4d431a12c7', // Ronald
  'a167e0f3-df7e-4d52-a9c3-f949145efdab', // Blake
  '79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e', // Theo
  '15d0c2e2-8d29-44c3-be23-d585d5f154a1', // Pedro
  'a5136bf9-224c-4d76-b823-52bd5efcffcc', // Jameson
  '86e30c1d-714b-4074-a1f2-1cb6b552fb49', // Carson
  '87286a8d-7ea7-4235-a41a-dd9fa6630feb', // Henry
] as const;
const FEMALE_CARTESIA_IDS = [
  'e07c00bc-4134-4eae-9ea4-1a55fb45746b', // Brooke
  'f786b574-daa5-4673-aa0c-cbe3e8534c02', // Katie
  '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc', // Jacqueline
  'f9836c6e-a0bd-460e-9d3c-f7299fa60f94', // Caroline
  'faf0731e-dfb9-4cfc-8119-259a79b27e12', // Riya
  'e8e5fffb-252c-436d-b842-8879b84445b6', // Cathy
] as const;

const VOICE_NAME_TO_CARTESIA_ID: Record<string, string> = {
  alloy: MALE_CARTESIA_IDS[0],
  ash: MALE_CARTESIA_IDS[1],
  ballad: FEMALE_CARTESIA_IDS[0],
  coral: FEMALE_CARTESIA_IDS[1],
  echo: MALE_CARTESIA_IDS[2],
  fable: FEMALE_CARTESIA_IDS[2],
  onyx: MALE_CARTESIA_IDS[3],
  nova: FEMALE_CARTESIA_IDS[3],
  sage: MALE_CARTESIA_IDS[4],
  shimmer: FEMALE_CARTESIA_IDS[4],
  verse: MALE_CARTESIA_IDS[5],
  marin: FEMALE_CARTESIA_IDS[5],
  cedar: MALE_CARTESIA_IDS[6],
};

function getCartesiaVoiceId(voice: string): string {
  const id = VOICE_NAME_TO_CARTESIA_ID[voice?.toLowerCase()];
  return id ?? VOICE_NAME_TO_CARTESIA_ID.alloy;
}

/** Cartesia rejects "empty or only punctuation" — return true if transcript has no speakable content */
function isEmptyOrOnlyPunctuation(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  const withoutPunctuation = t.replace(/[\s.,!?…\-—:;'"()[\]{}\u2014\u2013\u2026]+/g, '');
  return withoutPunctuation.length === 0;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Cartesia API key not configured. Set CARTESIA_API_KEY in .env' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, voice = 'alloy', speed = 1 } = body as {
      text?: string;
      voice?: string;
      speed?: number;
    };

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text (string) is required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 4096);
    if (!trimmed) {
      return NextResponse.json({ error: 'text is empty' }, { status: 400 });
    }
    if (isEmptyOrOnlyPunctuation(trimmed)) {
      return new NextResponse(new Uint8Array(0), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
      });
    }

    const voiceId = getCartesiaVoiceId(voice);
    // Sonic-3: speed 0.6–1.5 per API
    const speedNum = Math.max(0.6, Math.min(1.5, Number(speed) || 1));

    const res = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Cartesia-Version': CARTESIA_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: CARTESIA_MODEL,
        transcript: trimmed,
        voice: { mode: 'id', id: voiceId },
        output_format: {
          container: 'mp3',
          sample_rate: 44100,
          bit_rate: 128000,
        },
        language: 'en',
        generation_config: {
          speed: speedNum,
          volume: 1,
          emotion: 'neutral',
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[TTS Cartesia]', res.status, errText);
      return NextResponse.json(
        { error: errText || `Cartesia TTS failed (${res.status})` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: unknown) {
    console.error('[TTS] Error:', e);
    const msg = e instanceof Error ? e.message : 'TTS failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
