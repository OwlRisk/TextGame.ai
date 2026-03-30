/**
 * GET /api/inworld-voices
 * List Inworld TTS voices. Uses DB cache (24h TTL); ?refresh=1 forces refresh from Inworld.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { env } from '@/lib/env';
import { getCachedInworldVoices } from '@/lib/inworld-voices-cache';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!env.INWORLD_BASIC_BASE64) {
      return NextResponse.json(
        { error: 'Voice service unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';

    const { voices, fromCache, updatedAt } = await getCachedInworldVoices(forceRefresh);

    return NextResponse.json({
      total: voices.length,
      fromCache,
      updatedAt,
      voices: voices.map((v) => ({
        voiceId: v.voiceId,
        displayName: v.displayName,
        description: v.description,
        tags: v.tags,
        langCode: v.langCode,
      })),
    });
  } catch (e) {
    console.error('[inworld-voices]', e);
    return NextResponse.json(
      { error: 'Voice service unavailable' },
      { status: 500 }
    );
  }
}
