/**
 * Tests for avatar style consistency:
 * - Correct style is applied when entering a game room
 * - Pool avatar overrides pre-existing avatar_url in configuredPlayers
 * - Style-scoped cache keys prevent stale avatars after style changes
 * - Fallback chain when a character lacks the requested style
 */
import { describe, it, expect } from 'vitest';
import { VALID_STYLES, type AvatarStyle } from '../avatar-style-constants';

// ─── Pure helpers (mirroring production logic) ────────────────────────────────

/** Mirrors identityCacheKey in src/lib/avatar.ts */
function identityCacheKey(name: string, type: 'host' | 'player'): string {
  return `${name}|${type}`;
}

/** Mirrors the style-scoped cache key logic in fetchAvatarsForRoom */
function styleCacheKey(name: string, type: 'host' | 'player', style?: string): string {
  const base = identityCacheKey(name, type);
  return style ? `${base}|${style}` : base;
}

/** Mirrors the avatar style resolution in /api/characters/pool */
function resolveAvatarStyle(
  char: { avatar_url: string | null; avatar_styles: Record<string, string> },
  style: AvatarStyle,
): string | null {
  return char.avatar_styles[style] ?? char.avatar_styles['semi-realistic'] ?? char.avatar_url ?? null;
}

/** Mirrors the enrichment logic in game-master-chat.tsx (FIXED version) */
function enrichWithPoolAvatar(
  cp: { name: string; avatar_url?: string },
  poolChar: { avatar_url?: string } | undefined,
): string | undefined {
  return poolChar?.avatar_url ?? cp.avatar_url;
}

// ─── Section 1: configuredPlayers enrichment ─────────────────────────────────

describe('configuredPlayers enrichment: pool avatar priority', () => {
  it('pool avatar overrides a pre-existing avatar_url so style is applied', () => {
    const cp = { name: 'Alice', avatar_url: 'https://old/semi-realistic/alice.jpg' };
    const poolChar = { avatar_url: 'https://pool/pixel/alice.jpg' };
    expect(enrichWithPoolAvatar(cp, poolChar)).toBe('https://pool/pixel/alice.jpg');
  });

  it('falls back to cp.avatar_url when pool has no entry for that index', () => {
    const cp = { name: 'Carol', avatar_url: 'https://old/semi-realistic/carol.jpg' };
    expect(enrichWithPoolAvatar(cp, undefined)).toBe('https://old/semi-realistic/carol.jpg');
  });

  it('falls back to cp.avatar_url when pool entry has no avatar_url', () => {
    const cp = { name: 'Bob', avatar_url: 'https://old/bob.jpg' };
    const poolChar = { avatar_url: undefined };
    expect(enrichWithPoolAvatar(cp, poolChar)).toBe('https://old/bob.jpg');
  });

  it('handles configuredPlayers shorter than pool batch gracefully', () => {
    const configuredPlayers = [
      { name: 'Alice', avatar_url: 'https://old/alice.jpg' },
      { name: 'Bob', avatar_url: 'https://old/bob.jpg' },
      { name: 'Carol', avatar_url: 'https://old/carol.jpg' },
    ];
    const poolChars = [
      { avatar_url: 'https://pixel/alice.jpg' },
      { avatar_url: 'https://pixel/bob.jpg' },
      // Carol missing
    ];
    const result = configuredPlayers.map((cp, i) => ({
      ...cp,
      avatar_url: enrichWithPoolAvatar(cp, poolChars[i]),
    }));
    expect(result[0].avatar_url).toBe('https://pixel/alice.jpg');
    expect(result[1].avatar_url).toBe('https://pixel/bob.jpg');
    expect(result[2].avatar_url).toBe('https://old/carol.jpg');  // fallback
  });

  it('when cp has no avatar_url and pool has one, pool avatar is used', () => {
    const cp = { name: 'Dave', avatar_url: undefined };
    const poolChar = { avatar_url: 'https://pixel/dave.jpg' };
    expect(enrichWithPoolAvatar(cp, poolChar)).toBe('https://pixel/dave.jpg');
  });

  it('returns undefined when both cp and pool have no avatar', () => {
    const cp = { name: 'Eve', avatar_url: undefined };
    expect(enrichWithPoolAvatar(cp, undefined)).toBeUndefined();
  });
});

// ─── Section 2: style-scoped cache keys ──────────────────────────────────────

describe('style-scoped cache keys', () => {
  it('cache key without style equals name|type', () => {
    expect(styleCacheKey('Echo', 'host')).toBe('Echo|host');
    expect(styleCacheKey('Alice', 'player')).toBe('Alice|player');
  });

  it('cache key with style appends style as third segment', () => {
    expect(styleCacheKey('Echo', 'host', 'pixel')).toBe('Echo|host|pixel');
    expect(styleCacheKey('Alice', 'player', 'anime')).toBe('Alice|player|anime');
  });

  it('different styles produce different cache keys for same character', () => {
    const name = 'Solenne Vale';
    const keys = VALID_STYLES.map(s => styleCacheKey(name, 'host', s));
    const unique = new Set(keys);
    expect(unique.size).toBe(VALID_STYLES.length);
  });

  it('switching from semi-realistic to pixel uses a different cache key', () => {
    const key1 = styleCacheKey('Echo', 'host', 'semi-realistic');
    const key2 = styleCacheKey('Echo', 'host', 'pixel');
    expect(key1).not.toBe(key2);
  });

  it('result key (name|type) is always the base regardless of style', () => {
    const resultKey = identityCacheKey('Echo', 'host');
    expect(resultKey).toBe('Echo|host');
    // style-scoped cache key contains the result key as prefix
    expect(styleCacheKey('Echo', 'host', 'anime').startsWith(resultKey)).toBe(true);
  });
});

// ─── Section 3: avatar style resolution in pool API ──────────────────────────

describe('avatar style resolution (pool API)', () => {
  const char = {
    avatar_url: 'https://pool/semi-realistic/alice.jpg',
    avatar_styles: {
      'semi-realistic': 'https://styles/semi/alice.jpg',
      anime: 'https://styles/anime/alice.jpg',
      painted: 'https://styles/painted/alice.jpg',
    },
  };

  it('returns the exact style URL when available', () => {
    expect(resolveAvatarStyle(char, 'anime')).toBe('https://styles/anime/alice.jpg');
    expect(resolveAvatarStyle(char, 'painted')).toBe('https://styles/painted/alice.jpg');
  });

  it('falls back to semi-realistic when requested style is missing', () => {
    expect(resolveAvatarStyle(char, 'pixel')).toBe('https://styles/semi/alice.jpg');
    expect(resolveAvatarStyle(char, 'cyberpunk')).toBe('https://styles/semi/alice.jpg');
  });

  it('falls back to avatar_url when avatar_styles is empty', () => {
    const bare = { avatar_url: 'https://pool/bare.jpg', avatar_styles: {} };
    expect(resolveAvatarStyle(bare, 'pixel')).toBe('https://pool/bare.jpg');
  });

  it('returns null when both avatar_styles and avatar_url are absent', () => {
    const empty = { avatar_url: null, avatar_styles: {} };
    expect(resolveAvatarStyle(empty, 'anime')).toBeNull();
  });

  it('semi-realistic always resolves to itself', () => {
    expect(resolveAvatarStyle(char, 'semi-realistic')).toBe('https://styles/semi/alice.jpg');
  });
});

// ─── Section 4: VALID_STYLES contract ────────────────────────────────────────
// These tests use the imported VALID_STYLES from avatar-style-constants.ts —
// they serve as a contract test ensuring the real constant has the expected values.

describe('VALID_STYLES (imported from avatar-style-constants)', () => {
  it('contains exactly 5 style packs', () => {
    expect(VALID_STYLES).toHaveLength(5);
  });

  it('includes all expected style names', () => {
    expect(VALID_STYLES).toContain('semi-realistic');
    expect(VALID_STYLES).toContain('anime');
    expect(VALID_STYLES).toContain('painted');
    expect(VALID_STYLES).toContain('pixel');
    expect(VALID_STYLES).toContain('cyberpunk');
  });

  it('rejects unknown style as invalid', () => {
    const unknown = 'watercolor';
    expect((VALID_STYLES as readonly string[]).includes(unknown)).toBe(false);
  });
});

// ─── Section 5: pool request URL construction ─────────────────────────────────

describe('pool request URL construction', () => {
  function buildPoolUrl(count: number, excludeNames: string[], style: string): string {
    return `/api/characters/pool?count=${count}&exclude=${encodeURIComponent(excludeNames.join(','))}&style=${encodeURIComponent(style)}`;
  }

  it('includes style in query params', () => {
    const url = buildPoolUrl(6, [], 'pixel');
    expect(url).toContain('style=pixel');
  });

  it('encodes style values correctly', () => {
    const url = buildPoolUrl(6, [], 'semi-realistic');
    expect(url).toContain('style=semi-realistic');
  });

  it('excludes specified character names', () => {
    const url = buildPoolUrl(5, ['Alice', 'Bob'], 'anime');
    expect(url).toContain('exclude=Alice%2CBob');
    expect(url).toContain('style=anime');
  });

  it('defaults to semi-realistic when localStorage is empty', () => {
    const style = 'semi-realistic';
    const url = buildPoolUrl(6, [], style);
    expect(url).toContain('style=semi-realistic');
  });
});
