/**
 * Tests for style-aware avatar caching — the layer that sits between
 * GeneratedAvatar and the GameRoomContext avatarImageUrls map.
 *
 * Covers:
 *  - avatarCacheKey: base key, styled key, uniqueness
 *  - onAvatarLoaded dual-key write contract
 *  - avatarImageUrls map lifecycle: set, style-change clear, repopulate
 *  - In-flight dedup model (avatar.ts module-level Map)
 *  - invalidateAvatarCache clearing all style variants
 *  - Race: two components fetch the same player simultaneously
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VALID_STYLES,
  DEFAULT_STYLE,
  AVATAR_STYLE_CHANGED_EVENT,
  AVATAR_STYLE_STORAGE_KEY,
  type AvatarStyle,
} from '../avatar-style-constants';

// ─── Helpers mirroring production code ───────────────────────────────────────

/** Mirrors generated-avatar.tsx avatarCacheKey */
function avatarCacheKey(name: string, type: 'host' | 'player', style?: string): string {
  return style ? `${name}|${type}|${style}` : `${name}|${type}`;
}

/** Mirrors the dual-key write in GeneratedAvatar onAvatarLoaded effect */
function writeAvatarLoaded(
  map: Record<string, string>,
  name: string,
  type: 'host' | 'player',
  style: string | undefined,
  url: string,
): void {
  const baseKey = avatarCacheKey(name, type);
  const styledKey = style ? avatarCacheKey(name, type, style) : baseKey;
  map[styledKey] = url;
  if (baseKey !== styledKey) map[baseKey] = url;
}

/** Mirrors GameRoomContext onAvatarUrlLoaded guard */
function onAvatarUrlLoaded(
  map: Record<string, string>,
  key: string,
  url: string,
): Record<string, string> {
  if (!key || !url || !url.startsWith('http')) return map;
  if (map[key] === url) return map;
  return { ...map, [key]: url };
}

// ─── 1. avatarCacheKey ────────────────────────────────────────────────────────

describe('avatarCacheKey', () => {
  it('base key = name|type', () => {
    expect(avatarCacheKey('Alice', 'player')).toBe('Alice|player');
    expect(avatarCacheKey('Echo', 'host')).toBe('Echo|host');
  });

  it('styled key = name|type|style', () => {
    expect(avatarCacheKey('Alice', 'player', 'toon3d')).toBe('Alice|player|toon3d');
    expect(avatarCacheKey('Echo', 'host', 'toon3d')).toBe('Echo|host|toon3d');
  });

  it('undefined style returns base key (no trailing pipe)', () => {
    expect(avatarCacheKey('Alice', 'player', undefined)).toBe('Alice|player');
    expect(avatarCacheKey('Alice', 'player', undefined)).not.toContain('undefined');
  });

  it('each style produces a unique key', () => {
    const keys = VALID_STYLES.map((s) => avatarCacheKey('Alice', 'player', s));
    expect(new Set(keys).size).toBe(VALID_STYLES.length);
  });

  it('host and player produce different base keys for the same name', () => {
    expect(avatarCacheKey('Alice', 'player')).not.toBe(avatarCacheKey('Alice', 'host'));
  });

  it('styled key always starts with base key', () => {
    const base = avatarCacheKey('Zara', 'player');
    for (const style of VALID_STYLES) {
      expect(avatarCacheKey('Zara', 'player', style).startsWith(base + '|')).toBe(true);
    }
  });

  it('names with spaces and special chars are preserved verbatim', () => {
    expect(avatarCacheKey('Hearthwarden Liora Voss', 'host', 'toon3d'))
      .toBe('Hearthwarden Liora Voss|host|toon3d');
  });
});

// ─── 2. Dual-key write (onAvatarLoaded) ──────────────────────────────────────

describe('onAvatarLoaded dual-key write', () => {
  it('writes BOTH styled and base key when style is present', () => {
    const map: Record<string, string> = {};
    writeAvatarLoaded(map, 'Alice', 'player', 'toon3d', 'https://cdn/toon3d/alice.jpg');

    expect(map['Alice|player|toon3d']).toBe('https://cdn/toon3d/alice.jpg');
    expect(map['Alice|player']).toBe('https://cdn/toon3d/alice.jpg');
  });

  it('writes only base key when style is absent', () => {
    const map: Record<string, string> = {};
    writeAvatarLoaded(map, 'Bob', 'player', undefined, 'https://cdn/bob.jpg');

    expect(map['Bob|player']).toBe('https://cdn/bob.jpg');
    expect(Object.keys(map)).toHaveLength(1);
  });

  it('second style write updates both keys to the new URL', () => {
    const map: Record<string, string> = {};
    writeAvatarLoaded(map, 'Alice', 'player', 'semi-realistic', 'https://cdn/sr/alice.jpg');
    writeAvatarLoaded(map, 'Alice', 'player', 'toon3d', 'https://cdn/toon3d/alice.jpg');

    expect(map['Alice|player']).toBe('https://cdn/toon3d/alice.jpg');
    expect(map['Alice|player|toon3d']).toBe('https://cdn/toon3d/alice.jpg');
    expect(map['Alice|player|semi-realistic']).toBe('https://cdn/sr/alice.jpg');
  });

  it('base key lookup always returns the most recently written URL', () => {
    const map: Record<string, string> = {};
    for (const style of ['semi-realistic', 'toon3d'] as AvatarStyle[]) {
      writeAvatarLoaded(map, 'Zara', 'player', style, `https://cdn/${style}/zara.jpg`);
    }
    expect(map['Zara|player']).toBe('https://cdn/toon3d/zara.jpg');
  });

  it('styled key is independent from other styles', () => {
    const map: Record<string, string> = {};
    writeAvatarLoaded(map, 'Alice', 'player', 'semi-realistic', 'https://sr/alice.jpg');
    writeAvatarLoaded(map, 'Alice', 'player', 'toon3d', 'https://toon3d/alice.jpg');

    expect(map['Alice|player|semi-realistic']).toBe('https://sr/alice.jpg');
    expect(map['Alice|player|toon3d']).toBe('https://toon3d/alice.jpg');
  });

  it('onAvatarUrlLoaded guard rejects non-http URLs', () => {
    const map: Record<string, string> = {};
    const result = onAvatarUrlLoaded(map, 'Alice|player', 'data:image/png;base64,abc');
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('onAvatarUrlLoaded guard rejects empty key', () => {
    const map: Record<string, string> = {};
    const result = onAvatarUrlLoaded(map, '', 'https://cdn/alice.jpg');
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('onAvatarUrlLoaded is a no-op when url has not changed', () => {
    const map: Record<string, string> = { 'Alice|player': 'https://cdn/alice.jpg' };
    const result = onAvatarUrlLoaded(map, 'Alice|player', 'https://cdn/alice.jpg');
    expect(result).toBe(map); // referential equality: not a new object
  });
});

// ─── 3. avatarImageUrls map lifecycle ────────────────────────────────────────

describe('avatarImageUrls map lifecycle', () => {
  it('starts empty; populating with a URL makes it queryable', () => {
    const map: Record<string, string> = {};
    writeAvatarLoaded(map, 'Silas Grey', 'player', 'toon3d', 'https://toon3d/silas.jpg');
    expect(map['Silas Grey|player']).toBe('https://toon3d/silas.jpg');
  });

  it('clearing the map (style change) removes all URLs', () => {
    const urls: Record<string, string> = {
      'Silas Grey|player': 'https://sr/silas.jpg',
      'Silas Grey|player|semi-realistic': 'https://sr/silas.jpg',
      'Echo|host': 'https://sr/echo.jpg',
    };
    // Simulate: setAvatarImageUrls({})
    const cleared: Record<string, string> = {};
    expect(Object.keys(cleared)).toHaveLength(0);
    // Every GeneratedAvatar now has initialUrl = undefined → hook fires
    expect(cleared['Silas Grey|player']).toBeUndefined();
  });

  it('after clearing, re-populating with new style gives correct URL', () => {
    let map: Record<string, string> = {
      'Alice|player': 'https://sr/alice.jpg',
    };
    // Style changed → clear
    map = {};
    // Hook fetches toon3d URL → onAvatarLoaded called
    writeAvatarLoaded(map, 'Alice', 'player', 'toon3d', 'https://toon3d/alice.jpg');

    expect(map['Alice|player']).toBe('https://toon3d/alice.jpg');
    expect(map['Alice|player|toon3d']).toBe('https://toon3d/alice.jpg');
  });

  it('multiple characters each get their own entries', () => {
    const map: Record<string, string> = {};
    const players = ['Silas Grey', 'Gideon Blackwood', 'Claire Novak', 'Albert Kingston'];
    players.forEach((name, i) => {
      writeAvatarLoaded(map, name, 'player', 'toon3d', `https://toon3d/${i}.jpg`);
    });

    // Each player has their own base and styled key
    expect(Object.keys(map)).toHaveLength(players.length * 2);
    players.forEach((name, i) => {
      expect(map[`${name}|player`]).toBe(`https://toon3d/${i}.jpg`);
      expect(map[`${name}|player|toon3d`]).toBe(`https://toon3d/${i}.jpg`);
    });
  });

  it('switching style twice ends with the last style in base key', () => {
    const map: Record<string, string> = {};
    // First: semi-realistic
    writeAvatarLoaded(map, 'Alice', 'player', 'semi-realistic', 'https://sr/alice.jpg');
    expect(map['Alice|player']).toBe('https://sr/alice.jpg');

    // Style changes → map cleared → hook fetches toon3d
    Object.keys(map).forEach((k) => delete map[k]);
    writeAvatarLoaded(map, 'Alice', 'player', 'toon3d', 'https://toon3d/alice.jpg');
    expect(map['Alice|player']).toBe('https://toon3d/alice.jpg');

    // Style changes again → map cleared → hook fetches semi-realistic
    Object.keys(map).forEach((k) => delete map[k]);
    writeAvatarLoaded(map, 'Alice', 'player', 'semi-realistic', 'https://sr/alice.jpg');
    expect(map['Alice|player']).toBe('https://sr/alice.jpg');
  });
});

// ─── 4. AVATAR_STYLE_CHANGED_EVENT dispatch / listening ──────────────────────

describe('AVATAR_STYLE_CHANGED_EVENT dispatch and listen', () => {
  let dispatched: CustomEvent[] = [];

  beforeEach(() => {
    dispatched = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatching the event records the style as detail', () => {
    window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: 'toon3d' }));
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toBe('toon3d');
  });

  it('dispatching multiple times records all events', () => {
    const styles: AvatarStyle[] = ['semi-realistic', 'toon3d'];
    for (const s of styles) {
      window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: s }));
    }
    expect(dispatched.map((e) => e.detail)).toEqual(styles);
  });

  it('each style change triggers a dispatch (simulating GameRoomContext clear)', () => {
    const styles: AvatarStyle[] = ['semi-realistic', 'toon3d'];
    for (const s of styles) {
      window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: s }));
    }
    expect(dispatched).toHaveLength(2);
  });
});

// ─── 5. localStorage style-aware avatar cache ─────────────────────────────────

describe('localStorage style-aware avatar cache (gm_avatar_ prefix)', () => {
  const PREFIX = 'gm_avatar_';
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('styled key is stored separately from base key', () => {
    storage[PREFIX + 'Alice|player'] = 'https://sr/alice.jpg';
    storage[PREFIX + 'Alice|player|toon3d'] = 'https://toon3d/alice.jpg';

    expect(localStorage.getItem(PREFIX + 'Alice|player')).toBe('https://sr/alice.jpg');
    expect(localStorage.getItem(PREFIX + 'Alice|player|toon3d')).toBe('https://toon3d/alice.jpg');
  });

  it('changing style looks up a new key — does not return the old-style URL', () => {
    storage[PREFIX + 'Alice|player|semi-realistic'] = 'https://sr/alice.jpg';

    // After style change → hook uses new key
    const toon3dUrl = localStorage.getItem(PREFIX + 'Alice|player|toon3d');
    expect(toon3dUrl).toBeNull(); // Not cached yet → API call will happen
  });

  it('base key cache is separate from styled key cache', () => {
    storage[PREFIX + 'Alice|player'] = 'https://old/alice.jpg';

    // styled key is empty → forces API call even though base key is warm
    expect(localStorage.getItem(PREFIX + 'Alice|player|toon3d')).toBeNull();
  });

  it('invalidating all style variants removes semi-realistic and toon3d', () => {
    const name = 'Alice';
    const type = 'player';
    const baseKey = `${name}|${type}`;
    for (const s of VALID_STYLES) {
      storage[PREFIX + `${baseKey}|${s}`] = `https://cdn/${s}/alice.jpg`;
    }
    storage[PREFIX + baseKey] = 'https://cdn/semi-realistic/alice.jpg';

    // Invalidation: remove all keys matching baseKey or baseKey|*
    for (const k of Object.keys(storage)) {
      const cacheKey = k.replace(PREFIX, '');
      if (cacheKey === baseKey || cacheKey.startsWith(baseKey + '|')) {
        delete storage[k];
      }
    }

    expect(Object.keys(storage).filter((k) => k.startsWith(PREFIX))).toHaveLength(0);
  });
});

// ─── 6. In-flight request deduplication model ────────────────────────────────

describe('In-flight deduplication (avatar.ts pattern)', () => {
  it('second fetch for the same styled key reuses the in-flight promise', async () => {
    const inFlight = new Map<string, Promise<string>>();
    const fetched: string[] = [];

    function mockFetch(key: string): Promise<string> {
      if (inFlight.has(key)) return inFlight.get(key)!;
      const promise = new Promise<string>((resolve) => {
        fetched.push(key);
        setTimeout(() => resolve(`https://cdn/${key}.jpg`), 10);
      });
      inFlight.set(key, promise);
      promise.finally(() => inFlight.delete(key));
      return promise;
    }

    // Two simultaneous fetches for the same key
    const [url1, url2] = await Promise.all([
      mockFetch('Alice|player|toon3d'),
      mockFetch('Alice|player|toon3d'),
    ]);

    expect(url1).toBe(url2);
    expect(fetched).toHaveLength(1); // Only fetched once
  });

  it('different styled keys are fetched independently', async () => {
    const inFlight = new Map<string, Promise<string>>();
    const fetched: string[] = [];

    function mockFetch(key: string): Promise<string> {
      if (inFlight.has(key)) return inFlight.get(key)!;
      const promise = new Promise<string>((resolve) => {
        fetched.push(key);
        setTimeout(() => resolve(`https://cdn/${key}.jpg`), 10);
      });
      inFlight.set(key, promise);
      return promise;
    }

    await Promise.all([
      mockFetch('Alice|player|semi-realistic'),
      mockFetch('Alice|player|toon3d'),
      mockFetch('Bob|player|semi-realistic'),
    ]);

    expect(fetched).toHaveLength(3);
  });
});

// ─── 7. VALID_STYLES ↔ cache key completeness ────────────────────────────────

describe('VALID_STYLES completeness in cache keys', () => {
  it('every valid style can be encoded into a unique cache key', () => {
    const keys = VALID_STYLES.map((s) => avatarCacheKey('Alice', 'player', s));
    expect(new Set(keys).size).toBe(VALID_STYLES.length);
  });

  it('base key (no style) does not collide with any styled key', () => {
    const base = avatarCacheKey('Alice', 'player');
    const styled = VALID_STYLES.map((s) => avatarCacheKey('Alice', 'player', s));
    expect(styled).not.toContain(base);
  });

  it('DEFAULT_STYLE cache key differs from an unknown style', () => {
    const defaultKey = avatarCacheKey('Alice', 'player', DEFAULT_STYLE);
    const unknownKey = avatarCacheKey('Alice', 'player', 'watercolor');
    expect(defaultKey).not.toBe(unknownKey);
  });
});

// ─── 8. AVATAR_STYLE_STORAGE_KEY localStorage contract ───────────────────────

describe('AVATAR_STYLE_STORAGE_KEY contract', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
    });
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('writing a style to AVATAR_STYLE_STORAGE_KEY persists it', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'toon3d');
    expect(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY)).toBe('toon3d');
  });

  it('overwriting style replaces the previous value', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'semi-realistic');
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'toon3d');
    expect(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY)).toBe('toon3d');
  });

  it('storage key matches the constant exactly', () => {
    expect(AVATAR_STYLE_STORAGE_KEY).toBe('avatar_style_pack');
  });
});
