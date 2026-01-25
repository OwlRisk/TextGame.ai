'use client';

import { useState, useEffect, useCallback } from 'react';

type AvatarType = 'host' | 'player';

const cache = new Map<string, string>();

function cacheKey(
  name: string,
  type: AvatarType,
  role?: string,
  background?: string,
  personality?: string
): string {
  return [name, type, role ?? '', background ?? '', personality ?? ''].join('|');
}

export async function fetchGeneratedAvatar(
  name: string,
  type: AvatarType = 'player',
  role?: string,
  background?: string,
  personality?: string
): Promise<string> {
  const key = cacheKey(name, type, role, background, personality);
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch('/api/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      type,
      role: role || undefined,
      background: background || undefined,
      personality: personality || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to generate avatar');
  }

  const data = (await res.json()) as { image: string };
  cache.set(key, data.image);
  return data.image;
}

export interface UseGeneratedAvatarOptions {
  type?: AvatarType;
  role?: string;
  background?: string;
  personality?: string;
  enabled?: boolean;
}

export function useGeneratedAvatar(
  name: string | null | undefined,
  options: UseGeneratedAvatarOptions = {}
): { src: string | null; loading: boolean; error: Error | null; refetch: () => void } {
  const {
    type = 'player',
    role,
    background,
    personality,
    enabled = true,
  } = options;
  const [src, setSrc] = useState<string | null>(() => {
    if (!name) return null;
    return cache.get(cacheKey(name, type, role, background, personality)) ?? null;
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
    const key = cacheKey(name, type, role, background, personality);
    if (cache.has(key)) {
      setSrc(cache.get(key)!);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchGeneratedAvatar(name, type, role, background, personality)
      .then((image) => {
        setSrc(image);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
        setSrc(null);
      })
      .finally(() => setLoading(false));
  }, [name, type, role, background, personality, enabled]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return { src, loading, error, refetch: fetchAvatar };
}
