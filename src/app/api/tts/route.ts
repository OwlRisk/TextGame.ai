import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/** OpenAI TTS built-in voices (supported by createSpeech API) */
export const TTS_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar',
] as const;
export type TTSVoice = (typeof TTS_VOICES)[number];

const VOICES_SET = new Set<string>(TTS_VOICES);

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

    const voiceId = VOICES_SET.has(voice) ? voice : 'alloy';
    const openai = getOpenAI();
    const ttsModel = model === 'tts-1-hd' ? 'tts-1-hd' : 'tts-1';
    const speedNum = Math.max(0.25, Math.min(4, Number(speed) || 1));

    // Always use streaming: lower time-to-first-byte, better perceived latency
    const response = await openai.audio.speech.create({
      model: ttsModel,
      input: trimmed,
      voice: voiceId as TTSVoice,
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
