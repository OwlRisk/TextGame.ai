'use client';

import { useState, useEffect, useCallback } from 'react';

type AvatarType = 'host' | 'player';

const cache = new Map<string, string>();
/** Dedupe in-flight requests so sidebar and game room share the same avatar for the same key */
const inFlight = new Map<string, Promise<string>>();
/** Only log 503 once per session to avoid console spam */
let hasWarned503 = false;

const PERSIST_PREFIX = 'gm_avatar_';
const PERSIST_KEYS_LIST = 'gm_avatar_keys';
const PERSIST_MAX_KEYS = 200;
const PERSIST_EVICT_COUNT = 30;

/**
 * Identity-only cache key: same person = same avatar everywhere.
 * Cache lookup uses only name + type so avatars don't change when
 * gameId, role, background, or personality change.
 */
function identityCacheKey(name: string, type: AvatarType): string {
  return [name, type].join('|');
}

function loadFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PERSIST_PREFIX + key);
    if (stored) return stored;
  } catch (_) {}
  return null;
}

function saveToStorage(key: string, dataUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_PREFIX + key, dataUrl);
    const keysJson = localStorage.getItem(PERSIST_KEYS_LIST);
    const keys: string[] = keysJson ? JSON.parse(keysJson) : [];
    if (!keys.includes(key)) keys.push(key);
    if (keys.length > PERSIST_MAX_KEYS) {
      for (let i = 0; i < PERSIST_EVICT_COUNT && keys.length > 0; i++) {
        const old = keys.shift()!;
        localStorage.removeItem(PERSIST_PREFIX + old);
      }
      localStorage.setItem(PERSIST_KEYS_LIST, JSON.stringify(keys));
    } else {
      localStorage.setItem(PERSIST_KEYS_LIST, JSON.stringify(keys));
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      try {
        const keysJson = localStorage.getItem(PERSIST_KEYS_LIST);
        const keys: string[] = keysJson ? JSON.parse(keysJson) : [];
        for (let i = 0; i < PERSIST_EVICT_COUNT && keys.length > 0; i++) {
          const old = keys.shift()!;
          localStorage.removeItem(PERSIST_PREFIX + old);
        }
        localStorage.setItem(PERSIST_KEYS_LIST, JSON.stringify(keys));
        localStorage.setItem(PERSIST_PREFIX + key, dataUrl);
        if (!keys.includes(key)) keys.push(key);
        localStorage.setItem(PERSIST_KEYS_LIST, JSON.stringify(keys));
      } catch (_) {}
    }
  }
}

/**
 * Clear memory + localStorage cache for a specific avatar key so the next
 * fetch will hit the API again (e.g. after force-regeneration).
 */
export function invalidateAvatarCache(name: string, type: AvatarType): void {
  const key = identityCacheKey(name, type);
  cache.delete(key);
  inFlight.delete(key);
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(PERSIST_PREFIX + key); } catch (_) {}
  }
}

export async function fetchGeneratedAvatar(
  name: string,
  type: AvatarType = 'player',
  gameId?: string,
  role?: string,
  background?: string,
  personality?: string,
  gender?: string,
  forceRegenerate?: boolean,
  style?: string,
): Promise<string> {
  const key = identityCacheKey(name, type);

  if (!forceRegenerate) {
    const cached = cache.get(key);
    if (cached) return cached;

    const stored = loadFromStorage(key);
    if (stored) {
      cache.set(key, stored);
      return stored;
    }

    const existing = inFlight.get(key);
    if (existing) return existing;
  } else {
    invalidateAvatarCache(name, type);
  }

  const promise = (async () => {
    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          type,
          gameId: gameId || undefined,
          role: role || undefined,
          background: background || undefined,
          personality: personality || undefined,
          gender: gender || undefined,
          style: style || undefined,
          forceRegenerate: forceRegenerate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMessage = (err as { error?: string; details?: string }).error || 'Failed to generate avatar';
        const details = (err as { details?: string }).details;
        const fullError = details ? `${errorMessage} (${details})` : errorMessage;
        const is5xx = res.status >= 500 && res.status < 600;
        const is401 = res.status === 401;
        if (is5xx) {
          if (!hasWarned503) {
            hasWarned503 = true;
            console.warn('[Avatar] Service temporarily unavailable (', res.status, '). Showing initials. You can retry later.');
          }
          throw new Error('Avatar service temporarily unavailable. Showing initials—you can retry later.');
        }
        if (is401) {
          throw new Error('Sign in to generate avatars. Showing initials.');
        }
        console.warn('[Avatar] API error:', res.status, fullError);
        throw new Error(fullError);
      }

      const data = (await res.json()) as { image: string };
      cache.set(key, data.image);
      saveToStorage(key, data.image);
      return data.image;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export interface RoomPlayerInfo {
  name: string;
  type?: AvatarType;
  gender?: string;
  personality?: string;
  background?: string;
  role?: string;
  /** Mark as true for human players — they get pool avatars but are never chosen for generateAndPool. */
  isHuman?: boolean;
}

/**
 * Fetch avatars for an entire room in one batch.
 * Randomly picks 1 AI player to get a freshly generated DALL-E 3 avatar
 * (generateAndPool — costs coins, avatar saved to pool + ai_characters DB).
 * All others get free pool avatars.
 * After initial fetch, detects duplicate pool URLs and re-fetches colliding
 * players with an offset so every player gets a unique avatar.
 * Returns a map of "name|type" -> avatar URL.
 */
export async function fetchAvatarsForRoom(
  players: RoomPlayerInfo[],
  gameId?: string,
  style?: string,
): Promise<Record<string, string>> {
  if (players.length === 0) return {};

  const results: Record<string, string> = {};

  const fetchOne = async (player: RoomPlayerInfo, extraBody?: Record<string, unknown>) => {
    const pType: AvatarType = (player.type ?? 'player') as AvatarType;
    // Result key (name|type) is used by the room to look up avatars in avatarImageUrls.
    const resultKey = identityCacheKey(player.name, pType);
    // Cache key includes style so switching style packs always fetches fresh avatars.
    const cacheKey = style ? `${resultKey}|${style}` : resultKey;

    if (!extraBody) {
      const cached = cache.get(cacheKey);
      if (cached) { results[resultKey] = cached; return; }
      const stored = loadFromStorage(cacheKey);
      if (stored) { cache.set(cacheKey, stored); results[resultKey] = stored; return; }
    }

    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: player.name,
          type: pType,
          gameId: gameId || undefined,
          role: player.role || undefined,
          background: player.background || undefined,
          personality: player.personality || undefined,
          gender: player.gender || undefined,
          style: style || undefined,
          ...(extraBody ?? {}),
        }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as { image: string };
      cache.set(cacheKey, data.image);
      saveToStorage(cacheKey, data.image);
      results[resultKey] = data.image;
    } catch {
      // Silently skip failed avatars
    }
  };

  // Pass 1: fetch all avatars in parallel
  await Promise.allSettled(players.map(p => fetchOne(p)));

  // Pass 2: resolve collisions — if two players got the same pool URL, re-fetch with offset
  const urlToKeys = new Map<string, string[]>();
  for (const [resultKey, url] of Object.entries(results)) {
    if (!url) continue;
    const existing = urlToKeys.get(url) ?? [];
    existing.push(resultKey);
    urlToKeys.set(url, existing);
  }

  const collisionFixes: Promise<void>[] = [];
  for (const [, keys] of urlToKeys) {
    if (keys.length <= 1) continue;
    // Keep the first player's avatar, re-fetch the rest with increasing offsets
    for (let i = 1; i < keys.length; i++) {
      const collidingResultKey = keys[i];
      const player = players.find(p => identityCacheKey(p.name, (p.type ?? 'player') as AvatarType) === collidingResultKey);
      if (!player) continue;
      // Clear both cache key formats so the re-fetch hits the API
      cache.delete(collidingResultKey);
      if (style) cache.delete(`${collidingResultKey}|${style}`);
      collisionFixes.push(fetchOne(player, { avatarOffset: i }));
    }
  }
  if (collisionFixes.length > 0) {
    await Promise.allSettled(collisionFixes);
  }

  return results;
}

export interface UseGeneratedAvatarOptions {
  type?: AvatarType;
  gameId?: string;
  role?: string;
  background?: string;
  personality?: string;
  /** male / female / other - ensures avatar appearance matches name gender */
  gender?: string;
  /** Avatar style pack: semi-realistic | anime | painted | pixel | cyberpunk */
  style?: string;
  enabled?: boolean;
}

export function useGeneratedAvatar(
  name: string | null | undefined,
  options: UseGeneratedAvatarOptions = {}
): { src: string | null; loading: boolean; error: Error | null; refetch: () => void } {
  const {
    type = 'player',
    gameId,
    role,
    background,
    personality,
    gender,
    style,
    enabled = true,
  } = options;
  const key = (name && enabled) ? identityCacheKey(name, type) : '';
  // Always start with null so server and client first paint match (no localStorage on server).
  // Cache/storage is read in fetchAvatar() inside useEffect (client-only).
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvatar = useCallback(() => {
    if (!name || !enabled) {
      setSrc(null);
      setLoading(false);
      setError(null);
      return;
    }
    // Restore from cache or localStorage (client-only); avoids hydration mismatch from reading storage in useState.
    const fromMemory = cache.get(key);
    if (fromMemory) {
      setSrc(fromMemory);
      setLoading(false);
      setError(null);
      return;
    }
    const fromStorage = loadFromStorage(key);
    if (fromStorage) {
      cache.set(key, fromStorage);
      setSrc(fromStorage);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchGeneratedAvatar(name, type, gameId, role, background, personality, gender, undefined, style)
      .then((image) => {
        setSrc(image);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
        setSrc(null);
      })
      .finally(() => setLoading(false));
  }, [name, type, enabled, key, gameId, role, background, personality, gender, style]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return { src, loading, error, refetch: fetchAvatar };
}
