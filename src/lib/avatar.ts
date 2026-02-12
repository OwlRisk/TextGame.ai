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
const PERSIST_MAX_KEYS = 50;
const PERSIST_EVICT_COUNT = 10;

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

export async function fetchGeneratedAvatar(
  name: string,
  type: AvatarType = 'player',
  gameId?: string,
  role?: string,
  background?: string,
  personality?: string,
  gender?: string
): Promise<string> {
  const key = identityCacheKey(name, type);
  const cached = cache.get(key);
  if (cached) return cached;

  const stored = loadFromStorage(key);
  if (stored) {
    cache.set(key, stored);
    return stored;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      console.log('[Avatar] fetch start', key);
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          gameId: gameId || undefined,
          role: role || undefined,
          background: background || undefined,
          personality: personality || undefined,
          gender: gender || undefined,
        }),
      });

      console.log('[Avatar] response', res.status, res.statusText);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMessage = (err as { error?: string; details?: string }).error || 'Failed to generate avatar';
        const details = (err as { details?: string }).details;
        const fullError = details ? `${errorMessage} (${details})` : errorMessage;
        console.warn('[Avatar] error body', err);
        const is5xx = res.status >= 500 && res.status < 600;
        if (is5xx) {
          if (!hasWarned503) {
            hasWarned503 = true;
            console.warn('[Avatar] Service temporarily unavailable (', res.status, '). Showing initials. You can retry later.');
          }
          throw new Error('Avatar service temporarily unavailable. Showing initials—you can retry later.');
        }
        console.error('[Avatar] API error:', res.status, fullError);
        throw new Error(fullError);
      }

      const data = (await res.json()) as { image: string };
      console.log('[Avatar] success', key);
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

export interface UseGeneratedAvatarOptions {
  type?: AvatarType;
  gameId?: string;
  role?: string;
  background?: string;
  personality?: string;
  /** male / female / other - ensures avatar appearance matches name gender */
  gender?: string;
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
    fetchGeneratedAvatar(name, type, gameId, role, background, personality, gender)
      .then((image) => {
        setSrc(image);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
        setSrc(null);
      })
      .finally(() => setLoading(false));
  }, [name, type, enabled, key, gameId, role, background, personality, gender]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return { src, loading, error, refetch: fetchAvatar };
}
