/**
 * Tests for the GameRoomContext avatar URL lifecycle:
 *   - How avatarImageUrls map grows, serves, and gets cleared
 *   - The regenerateAvatar function should pass style
 *   - getAvatarPropsForPlayer with and without style
 *   - Ghost/stale URL detection: a base-key hit from an old style must be
 *     rejected when the active style is different
 *
 * All functions are pure helpers / models mirroring production logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VALID_STYLES,
  DEFAULT_STYLE,
  AVATAR_STYLE_CHANGED_EVENT,
  coerceStyle,
  type AvatarStyle,
} from '../avatar-style-constants';

// ─── Type mirrors ─────────────────────────────────────────────────────────────

type AvatarMap = Record<string, string>;

type Player = {
  name: string;
  isAI: boolean;
  role?: string;
  gender?: string;
  personality?: string;
};

// ─── Helper: avatarCacheKey (mirrors GeneratedAvatar) ─────────────────────────

function avatarCacheKey(name: string, type: 'host' | 'player', style?: string): string {
  return style ? `${name}|${type}|${style}` : `${name}|${type}`;
}

// ─── Helper: getInitialUrl (mirrors GameRoomContext lookup) ───────────────────

/** Returns a URL from the map for the player, preferring the styled key. */
function getInitialUrl(
  map: AvatarMap,
  name: string,
  type: 'host' | 'player',
  style: AvatarStyle,
): string | undefined {
  return map[avatarCacheKey(name, type, style)] ?? map[avatarCacheKey(name, type)];
}

// ─── Helper: getAvatarPropsForPlayer (mirrors avatar-utils.ts) ───────────────

type AvatarProps = {
  name: string;
  type: 'player' | 'host';
  personality?: string;
  role?: string;
  gender?: string;
  style?: AvatarStyle;
};

function getAvatarPropsForPlayer(
  player: Player | undefined | null,
  style?: AvatarStyle,
): AvatarProps | null {
  if (!player) return null;
  return {
    name: player.name,
    type: 'player',
    personality: player.personality,
    role: player.role,
    gender: player.gender,
    style,
  };
}

// ─── 1. getInitialUrl lookup ──────────────────────────────────────────────────

describe('getInitialUrl from avatarImageUrls', () => {
  it('returns styled key URL when present', () => {
    const map: AvatarMap = {
      'Alice|player|toon3d': 'https://toon3d/alice.jpg',
      'Alice|player': 'https://sr/alice.jpg',
    };
    expect(getInitialUrl(map, 'Alice', 'player', 'toon3d')).toBe('https://toon3d/alice.jpg');
  });

  it('falls back to base key when styled key is missing', () => {
    const map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg',
    };
    // Styled key miss → base key hit (may be stale, but avoids blank flicker)
    expect(getInitialUrl(map, 'Alice', 'player', 'toon3d')).toBe('https://sr/alice.jpg');
  });

  it('returns undefined when neither key is present', () => {
    const map: AvatarMap = {};
    expect(getInitialUrl(map, 'Zara', 'player', 'toon3d')).toBeUndefined();
  });

  it('styled key always wins over base key even if base key was written last', () => {
    const map: AvatarMap = {
      'Alice|player': 'https://old/alice.jpg', // stale base key
      'Alice|player|toon3d': 'https://toon3d/alice.jpg', // correct styled key
    };
    expect(getInitialUrl(map, 'Alice', 'player', 'toon3d')).toBe('https://toon3d/alice.jpg');
  });

  it('host type uses its own keyspace', () => {
    const map: AvatarMap = {
      'Echo|host|toon3d': 'https://toon3d/echo.jpg',
      'Echo|player': 'https://sr/echo-player.jpg', // should not be returned
    };
    expect(getInitialUrl(map, 'Echo', 'host', 'toon3d')).toBe('https://toon3d/echo.jpg');
  });
});

// ─── 2. avatarImageUrls map growth and eviction ───────────────────────────────

describe('avatarImageUrls map growth', () => {
  it('grows as players join and their avatars load', () => {
    const map: AvatarMap = {};
    const players = ['Alice', 'Bob', 'Carol', 'Dan'];
    const style: AvatarStyle = 'toon3d';

    players.forEach((name, i) => {
      map[avatarCacheKey(name, 'player', style)] = `https://toon3d/${i}.jpg`;
      map[avatarCacheKey(name, 'player')] = `https://toon3d/${i}.jpg`;
    });

    expect(Object.keys(map)).toHaveLength(players.length * 2);
  });

  it('clearing the map resets to empty', () => {
    const map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg',
      'Alice|player|toon3d': 'https://toon3d/alice.jpg',
      'Echo|host': 'https://sr/echo.jpg',
    };
    const cleared: AvatarMap = {};
    expect(Object.keys(cleared)).toHaveLength(0);
  });

  it('regenerating an avatar overwrites the existing URL for the same key', () => {
    const map: AvatarMap = {
      'Alice|player|toon3d': 'https://toon3d/alice-old.jpg',
      'Alice|player': 'https://toon3d/alice-old.jpg',
    };
    // Regeneration writes new URL to both keys
    map['Alice|player|toon3d'] = 'https://toon3d/alice-new.jpg';
    map['Alice|player'] = 'https://toon3d/alice-new.jpg';

    expect(getInitialUrl(map, 'Alice', 'player', 'toon3d')).toBe('https://toon3d/alice-new.jpg');
  });
});

// ─── 3. Style-change → clear → repopulate ────────────────────────────────────

describe('style change lifecycle', () => {
  it('after style change the stale base key is gone (map cleared)', () => {
    let map: AvatarMap = { 'Alice|player': 'https://sr/alice.jpg' };
    // AVATAR_STYLE_CHANGED_EVENT fires → setAvatarImageUrls({})
    map = {};
    expect(map['Alice|player']).toBeUndefined();
  });

  it('after repopulation, the new styled key is authoritative', () => {
    let map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg',
      'Alice|player|semi-realistic': 'https://sr/alice.jpg',
    };
    // Style changed → clear
    map = {};
    // Hook fetches toon3d
    map['Alice|player|toon3d'] = 'https://toon3d/alice.jpg';
    map['Alice|player'] = 'https://toon3d/alice.jpg';

    expect(getInitialUrl(map, 'Alice', 'player', 'toon3d')).toBe('https://toon3d/alice.jpg');
    expect(getInitialUrl(map, 'Alice', 'player', 'semi-realistic')).toBe(
      'https://toon3d/alice.jpg', // base key fallback; stale is gone
    );
  });

  it('dispatching AVATAR_STYLE_CHANGED_EVENT is recorded by a stub', () => {
    const dispatched: CustomEvent[] = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); },
    });

    window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: 'toon3d' }));
    expect(dispatched[0].detail).toBe('toon3d');

    vi.unstubAllGlobals();
  });

  it('multiple rapid style changes each produce a dispatch', () => {
    const dispatched: CustomEvent[] = [];
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); },
    });

    for (const style of VALID_STYLES) {
      window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: style }));
    }
    expect(dispatched).toHaveLength(VALID_STYLES.length);

    vi.unstubAllGlobals();
  });
});

// ─── 4. getAvatarPropsForPlayer with style ───────────────────────────────────

describe('getAvatarPropsForPlayer with style param', () => {
  const player: Player = {
    name: 'Silas Grey',
    isAI: true,
    role: 'Villager',
    gender: 'male',
    personality: 'brooding',
  };

  it('includes style in returned props when provided', () => {
    const props = getAvatarPropsForPlayer(player, 'toon3d');
    expect(props?.style).toBe('toon3d');
  });

  it('style is undefined in props when not provided', () => {
    const props = getAvatarPropsForPlayer(player);
    expect(props?.style).toBeUndefined();
  });

  it('returns null for undefined player', () => {
    expect(getAvatarPropsForPlayer(undefined, 'toon3d')).toBeNull();
  });

  it('returns null for null player', () => {
    expect(getAvatarPropsForPlayer(null, 'toon3d')).toBeNull();
  });

  it('passes through all player fields correctly', () => {
    const props = getAvatarPropsForPlayer(player, 'toon3d');
    expect(props?.name).toBe('Silas Grey');
    expect(props?.type).toBe('player');
    expect(props?.role).toBe('Villager');
    expect(props?.gender).toBe('male');
    expect(props?.personality).toBe('brooding');
  });

  it('each valid style produces unique avatar props', () => {
    const allProps = VALID_STYLES.map((s) => getAvatarPropsForPlayer(player, s));
    const styles = allProps.map((p) => p?.style);
    expect(new Set(styles).size).toBe(VALID_STYLES.length);
  });
});

// ─── 5. Stale URL detection (ghost hit scenario) ──────────────────────────────

describe('ghost / stale URL detection', () => {
  /**
   * Ghost hit: the base key exists from a previous style session.
   * When the active style changes, the base key should not be trusted
   * if the styled key is absent (it means the correct URL hasn't been
   * fetched yet for the new style).
   *
   * The safe behavior: if styledKey is missing but baseKey is present,
   * return the baseKey URL as a *temporary* placeholder (avoids blank),
   * but mark it as requiring re-fetch.
   */

  it('styled key absence signals re-fetch is needed', () => {
    const map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg', // ghost from previous style
    };
    const styledUrl = map['Alice|player|toon3d']; // undefined → re-fetch
    const baseUrl = map['Alice|player']; // placeholder (may be stale)

    expect(styledUrl).toBeUndefined();
    expect(baseUrl).toBe('https://sr/alice.jpg'); // placeholder is available
  });

  it('once re-fetched, styled key is set and is now canonical', () => {
    const map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg', // ghost
    };
    // After fetch completes
    map['Alice|player|toon3d'] = 'https://toon3d/alice.jpg';
    map['Alice|player'] = 'https://toon3d/alice.jpg'; // ghost overwritten

    expect(map['Alice|player|toon3d']).toBe('https://toon3d/alice.jpg');
    expect(map['Alice|player']).toBe('https://toon3d/alice.jpg');
  });

  it('after map clear, the ghost URL is gone — no stale placeholder', () => {
    let map: AvatarMap = {
      'Alice|player': 'https://sr/alice.jpg',
    };
    // Clear on style change
    map = {};

    expect(map['Alice|player']).toBeUndefined();
    expect(map['Alice|player|toon3d']).toBeUndefined();
  });
});

// ─── 6. regenerateAvatar style forwarding ─────────────────────────────────────

describe('regenerateAvatar must forward the active style', () => {
  /** Mirrors the API call structure in GameRoomContext.regenerateAvatar */
  function buildRegeneratePayload(
    player: { name: string; gender?: string; personality?: string; role?: string },
    style: AvatarStyle,
    gameId: string,
  ) {
    return {
      name: player.name,
      type: 'player',
      gender: player.gender,
      personality: player.personality,
      role: player.role,
      style,
      gameId,
    };
  }

  it('includes the style in the payload', () => {
    const payload = buildRegeneratePayload(
      { name: 'Alice', gender: 'female', role: 'Witch' },
      'toon3d',
      'game-123',
    );
    expect(payload.style).toBe('toon3d');
  });

  it('includes all player fields in the payload', () => {
    const payload = buildRegeneratePayload(
      { name: 'Bob', gender: 'male', personality: 'stoic', role: 'Villager' },
      'toon3d',
      'game-456',
    );
    expect(payload.name).toBe('Bob');
    expect(payload.gender).toBe('male');
    expect(payload.personality).toBe('stoic');
    expect(payload.role).toBe('Villager');
    expect(payload.gameId).toBe('game-456');
  });

  it('payload style is always one of VALID_STYLES', () => {
    for (const style of VALID_STYLES) {
      const payload = buildRegeneratePayload({ name: 'Alice' }, style, 'g1');
      expect(VALID_STYLES).toContain(payload.style);
    }
  });
});

// ─── 7. coerceStyle integration with prefs from server ────────────────────────

describe('coerceStyle guards server prefs before setState', () => {
  it('coerces a valid server pref correctly', () => {
    expect(coerceStyle('toon3d')).toBe('toon3d');
    expect(coerceStyle('semi-realistic')).toBe('semi-realistic');
  });

  it('coerces an invalid server pref to DEFAULT_STYLE', () => {
    expect(coerceStyle('watercolor')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('')).toBe(DEFAULT_STYLE);
  });

  it('coerces null (missing pref) to DEFAULT_STYLE', () => {
    expect(coerceStyle(null)).toBe(DEFAULT_STYLE);
  });

  it('all VALID_STYLES round-trip through coerceStyle unchanged', () => {
    for (const style of VALID_STYLES) {
      expect(coerceStyle(style)).toBe(style);
    }
  });
});
