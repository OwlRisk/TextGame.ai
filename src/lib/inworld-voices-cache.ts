/**
 * Inworld voices: read from DB cache, refresh from API when stale or forced.
 * Cache key: "inworld_voices". TTL: 24 hours (configurable).
 */
import { pool } from '@/lib/pg-pool';
import { env } from '@/lib/env';

const CACHE_KEY = 'inworld_voices';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedVoice {
  voiceId: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  langCode?: string;
}

export async function getCachedInworldVoices(forceRefresh = false): Promise<{
  voices: CachedVoice[];
  fromCache: boolean;
  updatedAt?: string;
}> {
  if (!forceRefresh) {
    const row = await pool.query<{ value: unknown; updated_at: Date }>(
      'SELECT value, updated_at FROM app_cache WHERE key = $1',
      [CACHE_KEY]
    );
    if (row.rows.length > 0) {
      const updatedAt = row.rows[0].updated_at;
      const age = Date.now() - new Date(updatedAt).getTime();
      if (age < TTL_MS) {
        const value = row.rows[0].value as { voices?: CachedVoice[] };
        const voices = Array.isArray(value?.voices) ? value.voices : [];
        return {
          voices,
          fromCache: true,
          updatedAt: updatedAt.toISOString(),
        };
      }
    }
  }

  const basic = env.INWORLD_BASIC_BASE64;
  if (!basic) {
    return { voices: [], fromCache: false };
  }

  const res = await fetch('https://api.inworld.ai/voices/v1/voices', {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn('[inworld-voices-cache] fetch failed', res.status, err.slice(0, 200));
    return { voices: [], fromCache: false };
  }

  const data = (await res.json()) as { voices?: Array<{ voiceId?: string; displayName?: string; description?: string; tags?: string[]; langCode?: string }> };
  const voices: CachedVoice[] = (data.voices || []).map((v) => ({
    voiceId: v.voiceId || '',
    displayName: v.displayName,
    description: v.description,
    tags: v.tags,
    langCode: v.langCode,
  }));

  await pool.query(
    `INSERT INTO app_cache (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [CACHE_KEY, JSON.stringify({ voices })]
  );

  return { voices, fromCache: false, updatedAt: new Date().toISOString() };
}
