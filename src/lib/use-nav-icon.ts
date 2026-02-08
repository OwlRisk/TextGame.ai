'use client';

import { useState, useEffect, useCallback } from 'react';

export type NavIconSlug = 'home' | 'my-games' | 'discover';

const CACHE_PREFIX = 'gm_nav_icon_';
const memoryCache = new Map<NavIconSlug, string>();

function loadCached(slug: NavIconSlug): string | null {
  if (typeof window === 'undefined') return null;
  const fromMemory = memoryCache.get(slug);
  if (fromMemory) return fromMemory;
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + slug);
    if (stored) {
      memoryCache.set(slug, stored);
      return stored;
    }
  } catch (_) {}
  return null;
}

function saveCached(slug: NavIconSlug, dataUrl: string): void {
  memoryCache.set(slug, dataUrl);
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + slug, dataUrl);
  } catch (_) {}
}

export function useNavIcon(slug: NavIconSlug | null): { src: string | null; loading: boolean; refetch: () => void } {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIcon = useCallback(() => {
    if (!slug) {
      setSrc(null);
      setLoading(false);
      return;
    }
    const cached = loadCached(slug);
    if (cached) {
      setSrc(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSrc(null);
    fetch('/api/generate-nav-icon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: { icon?: string }) => {
        const url = data?.icon ?? null;
        if (url) {
          saveCached(slug, url);
          setSrc(url);
        }
      })
      .catch(() => setSrc(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchIcon();
  }, [fetchIcon]);

  return { src, loading, refetch: fetchIcon };
}
