import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/** OpenAI TTS voices supported by tts-1 / tts-1-hd (used by this route) */
const TTS_1_VOICES = ['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer'] as const;
type TTS1Voice = (typeof TTS_1_VOICES)[number];

/** Map voices only available in gpt-4o-mini-tts to tts-1-compatible voices */
const VOICE_FALLBACK: Record<string, TTS1Voice> = {
  ballad: 'coral',   // female
  verse: 'echo',     // male
  marin: 'nova',     // female
  cedar: 'onyx',     // male
};

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, voice = 'alloy', model = 'tts-1', speed = 1 } = body as {
      text?: string;
      voice?: string;
      model?: string;
      speed?: number;
    };

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text (string) is required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 4096);
    if (!trimmed) {
      return NextResponse.json({ error: 'text is empty' }, { status: 400 });
    }

    const voiceId: TTS1Voice = VOICE_FALLBACK[voice] ?? (TTS_1_VOICES.includes(voice as TTS1Voice) ? (voice as TTS1Voice) : 'alloy');
    const openai = getOpenAI();
    const ttsModel = model === 'tts-1-hd' ? 'tts-1-hd' : 'tts-1';
    const speedNum = Math.max(0.25, Math.min(4, Number(speed) || 1));

    // Always use streaming: lower time-to-first-byte, better perceived latency
    const response = await openai.audio.speech.create({
      model: ttsModel,
      input: trimmed,
      voice: voiceId,
      response_format: 'mp3',
      speed: speedNum,
      stream_format: 'audio',
    });
    const streamBody = response.body;
    if (!streamBody) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
      });
    }
    return new NextResponse(streamBody as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (e: unknown) {
    console.error('[TTS] Error:', e);
    const msg = e instanceof Error ? e.message : 'TTS failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
