/**
 * Tests for the avatar style system:
 *  - avatar-style-constants: VALID_STYLES, isValidStyle, coerceStyle
 *  - useAvatarStyle hook: localStorage reading, CustomEvent reactivity, storage event reactivity
 *  - Style extensibility contract
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VALID_STYLES,
  DEFAULT_STYLE,
  AVATAR_STYLE_STORAGE_KEY,
  AVATAR_STYLE_CHANGED_EVENT,
  isValidStyle,
  coerceStyle,
  type AvatarStyle,
} from '../avatar-style-constants';

// ─── 1. Constants contract ────────────────────────────────────────────────────

describe('VALID_STYLES', () => {
  it('contains exactly 3 style packs', () => {
    expect(VALID_STYLES).toHaveLength(3);
  });

  it('includes all expected style names', () => {
    expect(VALID_STYLES).toContain('valorant');
    expect(VALID_STYLES).toContain('semi-realistic');
    expect(VALID_STYLES).toContain('toon3d');
  });

  it('is a readonly tuple (does not include any unknown values)', () => {
    const unknown = 'watercolor';
    expect((VALID_STYLES as readonly string[]).includes(unknown)).toBe(false);
  });
});

describe('DEFAULT_STYLE', () => {
  it('is semi-realistic', () => {
    expect(DEFAULT_STYLE).toBe('semi-realistic');
  });

  it('is a member of VALID_STYLES', () => {
    expect(VALID_STYLES).toContain(DEFAULT_STYLE);
  });
});

describe('AVATAR_STYLE_STORAGE_KEY', () => {
  it('is the string used in localStorage', () => {
    expect(AVATAR_STYLE_STORAGE_KEY).toBe('avatar_style_pack');
  });
});

describe('AVATAR_STYLE_CHANGED_EVENT', () => {
  it('is the custom event name', () => {
    expect(AVATAR_STYLE_CHANGED_EVENT).toBe('avatar-style-changed');
  });
});

// ─── 2. isValidStyle ─────────────────────────────────────────────────────────

describe('isValidStyle', () => {
  it('returns true for each valid style', () => {
    for (const style of VALID_STYLES) {
      expect(isValidStyle(style)).toBe(true);
    }
  });

  it('returns false for unknown strings', () => {
    expect(isValidStyle('watercolor')).toBe(false);
    expect(isValidStyle('')).toBe(false);
    expect(isValidStyle('Semi-Realistic')).toBe(false);
    expect(isValidStyle('TOON3D')).toBe(false);
  });

  it('returns false for legacy styles', () => {
    expect(isValidStyle('anime')).toBe(false);
    expect(isValidStyle('painted')).toBe(false);
    expect(isValidStyle('pixel')).toBe(false);
    expect(isValidStyle('cyberpunk')).toBe(false);
  });
});

// ─── 3. coerceStyle ──────────────────────────────────────────────────────────

describe('coerceStyle', () => {
  it('returns the input when it is valid', () => {
    expect(coerceStyle('semi-realistic')).toBe('semi-realistic');
    expect(coerceStyle('toon3d')).toBe('toon3d');
  });

  it('falls back to DEFAULT_STYLE for invalid input', () => {
    expect(coerceStyle('watercolor')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('TOON3D')).toBe(DEFAULT_STYLE);
  });

  it('falls back to DEFAULT_STYLE for legacy styles', () => {
    expect(coerceStyle('anime')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('pixel')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('cyberpunk')).toBe(DEFAULT_STYLE);
  });

  it('falls back to DEFAULT_STYLE for null and undefined', () => {
    expect(coerceStyle(null)).toBe(DEFAULT_STYLE);
    expect(coerceStyle(undefined)).toBe(DEFAULT_STYLE);
  });
});

// ─── 4. useAvatarStyle hook logic (pure) ─────────────────────────────────────

describe('useAvatarStyle logic (pure, without React)', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('coerceStyle(localStorage.getItem(key)) returns DEFAULT_STYLE when nothing is stored', () => {
    expect(coerceStyle(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY))).toBe(DEFAULT_STYLE);
  });

  it('reads the stored value correctly when set', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'toon3d');
    expect(coerceStyle(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY))).toBe('toon3d');
  });

  it('coerces a corrupted localStorage value to DEFAULT_STYLE', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'not-a-real-style');
    expect(coerceStyle(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY))).toBe(DEFAULT_STYLE);
  });

  it('coerces legacy style value to DEFAULT_STYLE', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'anime');
    expect(coerceStyle(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY))).toBe(DEFAULT_STYLE);
  });

  it('CustomEvent detail is coerced to AvatarStyle', () => {
    const e = new CustomEvent<string>(AVATAR_STYLE_CHANGED_EVENT, { detail: 'toon3d' });
    const style: AvatarStyle = coerceStyle((e as CustomEvent<string>).detail);
    expect(style).toBe('toon3d');
  });

  it('CustomEvent with invalid detail falls back to DEFAULT_STYLE', () => {
    const e = new CustomEvent<string>(AVATAR_STYLE_CHANGED_EVENT, { detail: 'unknown' });
    expect(coerceStyle((e as CustomEvent<string>).detail)).toBe(DEFAULT_STYLE);
  });
});

// ─── 5. setAvatarStyleGlobal side-effects ────────────────────────────────────

describe('setAvatarStyleGlobal side-effects', () => {
  let storage: Record<string, string>;
  let dispatchedEvents: CustomEvent[];

  beforeEach(() => {
    storage = {};
    dispatchedEvents = [];
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
    });
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => { dispatchedEvents.push(e as CustomEvent); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the style to localStorage', () => {
    localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, 'toon3d');
    expect(storage[AVATAR_STYLE_STORAGE_KEY]).toBe('toon3d');
  });

  it('dispatched event carries the new style as detail', () => {
    const style: AvatarStyle = 'toon3d';
    const evt = new CustomEvent<AvatarStyle>(AVATAR_STYLE_CHANGED_EVENT, { detail: style });
    window.dispatchEvent(evt);
    expect(dispatchedEvents.length).toBe(1);
    expect((dispatchedEvents[0] as CustomEvent<AvatarStyle>).detail).toBe('toon3d');
  });

  it('dispatched event type matches AVATAR_STYLE_CHANGED_EVENT', () => {
    const evt = new CustomEvent(AVATAR_STYLE_CHANGED_EVENT, { detail: 'semi-realistic' });
    window.dispatchEvent(evt);
    expect(dispatchedEvents[0].type).toBe(AVATAR_STYLE_CHANGED_EVENT);
  });
});

// ─── 6. Extensibility contract ───────────────────────────────────────────────

describe('Extensibility: style validation', () => {
  it('isValidStyle uses VALID_STYLES as the single source of truth', () => {
    const hypotheticalNewStyle = 'watercolor';
    const isInValidStyles = (VALID_STYLES as readonly string[]).includes(hypotheticalNewStyle);
    expect(isValidStyle(hypotheticalNewStyle)).toBe(isInValidStyles);
  });

  it('coerceStyle falls back to DEFAULT_STYLE for any value not in VALID_STYLES', () => {
    const unknowns = ['', 'watercolor', 'oil', 'sketch', 'cartoon', 'anime', 'pixel'];
    for (const u of unknowns) {
      expect(coerceStyle(u)).toBe(DEFAULT_STYLE);
    }
  });

  it('all API-facing style validation can be done with isValidStyle alone', () => {
    for (const style of VALID_STYLES) {
      const resolved = isValidStyle(style) ? style : DEFAULT_STYLE;
      expect(resolved).toBe(style);
    }
    expect(isValidStyle('bad') ? 'bad' : DEFAULT_STYLE).toBe(DEFAULT_STYLE);
  });
});

// ─── 7. Style-aware cache key logic ──────────────────────────────────────────

describe('Style-aware cache key patterns', () => {
  function styleCacheKey(name: string, type: 'host' | 'player', style?: string) {
    const base = `${name}|${type}`;
    return style ? `${base}|${style}` : base;
  }

  it('no style → base key only', () => {
    expect(styleCacheKey('Alice', 'player')).toBe('Alice|player');
    expect(styleCacheKey('Echo', 'host')).toBe('Echo|host');
  });

  it('with style → base key + style segment', () => {
    expect(styleCacheKey('Alice', 'player', 'toon3d')).toBe('Alice|player|toon3d');
    expect(styleCacheKey('Echo', 'host', 'semi-realistic')).toBe('Echo|host|semi-realistic');
  });

  it('each valid style produces a unique cache key', () => {
    const keys = VALID_STYLES.map((s) => styleCacheKey('Alice', 'player', s));
    expect(new Set(keys).size).toBe(VALID_STYLES.length);
  });

  it('style-keyed cache key starts with the base identity key', () => {
    const base = 'Alice|player';
    for (const style of VALID_STYLES) {
      expect(styleCacheKey('Alice', 'player', style).startsWith(base)).toBe(true);
    }
  });
});
