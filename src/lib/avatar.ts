'use client';

import { useState, useEffect, useCallback } from 'react';

type AvatarType = 'host' | 'player';

const cache = new Map<string, string>();

function cacheKey(
  name: string,
  type: AvatarType,
  gameId?: string,
  role?: string,
  background?: string,
  personality?: string,
  gender?: string
): string {
  return [name, type, gameId ?? '', role ?? '', background ?? '', personality ?? '', gender ?? ''].join('|');
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
  const key = cacheKey(name, type, gameId, role, background, personality, gender);
  const cached = cache.get(key);
  if (cached) return cached;

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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMessage = (err as { error?: string; details?: string }).error || 'Failed to generate avatar';
    const details = (err as { details?: string }).details;
    const fullError = details ? `${errorMessage} (${details})` : errorMessage;
    console.error('[Avatar] API error:', res.status, fullError);
    throw new Error(fullError);
  }

  const data = (await res.json()) as { image: string };
  cache.set(key, data.image);
  return data.image;
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
  const [src, setSrc] = useState<string | null>(() => {
    if (!name) return null;
    return cache.get(cacheKey(name, type, gameId, role, background, personality, gender)) ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvatar = useCallback(() => {
    if (!name || !enabled) {
      setSrc(null);
      setLoading(false);
      setError(null);
      return;
    }
    const key = cacheKey(name, type, gameId, role, background, personality, gender);
    if (cache.has(key)) {
      setSrc(cache.get(key)!);
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
  }, [name, type, gameId, role, background, personality, gender, enabled]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return { src, loading, error, refetch: fetchAvatar };
}
