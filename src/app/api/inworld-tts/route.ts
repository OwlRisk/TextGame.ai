/**
 * POST /api/inworld-tts
 * Synthesize speech via Inworld TTS. Body: { text, voiceId }.
 * Returns { audioBase64, contentType } for playback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { env } from '@/lib/env';
import { addTokens, deductTokens, ttsCostToCoins, getUserBalance } from '@/lib/tokens';

const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice';
const MAX_TEXT_LENGTH = 2000;
const TTS_REQUEST_TIMEOUT_MS = 15000;

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

    let body: { text?: string; voiceId?: string; modelId?: string; source?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';
    const isPreview = body.source === 'lobby_preview';

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'text and voiceId are required' },
        { status: 400 }
      );
    }

    const previewMaxLen = 120;
    const effectiveMax = isPreview ? previewMaxLen : MAX_TEXT_LENGTH;
    const clampedText = isPreview ? text.slice(0, previewMaxLen) : text;

    if (clampedText.length > effectiveMax) {
      return NextResponse.json(
        { error: `text must be at most ${effectiveMax} characters` },
        { status: 400 }
      );
    }

    const VALID_MODELS = ['inworld-tts-1.5-max', 'inworld-tts-1.5-mini', 'inworld-tts-1-max', 'inworld-tts-1'];
    const previewModel = 'inworld-tts-1.5-mini';
    const modelId = isPreview ? previewModel : (VALID_MODELS.includes(body.modelId ?? '') ? body.modelId! : 'inworld-tts-1.5-max');

    let preDeductedCoins = 0;
    if (!isPreview) {
      const coinsRequired = ttsCostToCoins(clampedText.length, modelId);
      const balance = await getUserBalance(user.id);
      if (balance.tokens < coinsRequired) {
        return NextResponse.json(
          {
            error: 'Insufficient tokens',
            message: 'You need more tokens to continue. Please purchase tokens or upgrade to Pro.',
            code: 'INSUFFICIENT_TOKENS',
          },
          { status: 402 }
        );
      }
      await deductTokens(user.id, coinsRequired, 'tts', `Inworld TTS ${modelId} — ${clampedText.length} chars`);
      preDeductedCoins = coinsRequired;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_REQUEST_TIMEOUT_MS);
    const res = await fetch(INWORLD_TTS_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        text: clampedText,
        voiceId,
        modelId,
        audioConfig: {
          audioEncoding: 'MP3',
          sampleRateHertz: 22050,
        },
        applyTextNormalization: 'ON',
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[inworld-tts] upstream error', res.status, errText);
      if (preDeductedCoins > 0) {
        await addTokens(user.id, preDeductedCoins, 'refund', 'Refund: TTS upstream failed').catch(() => {});
      }
      return NextResponse.json(
        { error: 'TTS synthesis failed' },
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
    const status = e instanceof Error && e.name === 'AbortError' ? 504 : 500;
    return NextResponse.json(
      { error: status === 504 ? 'TTS request timed out' : 'TTS failed' },
      { status }
    );
  }
}
