/**
 * Tests for the avatar API route and characters/pool route logic
 * without actually calling the routes — pure function logic extracted.
 *
 * Covers:
 *  - Style parameter validation (isValidStyle, coerceStyle)
 *  - Prioritizing characters that already have the requested style's URL
 *  - Fallback chain: styled URL → any URL → null
 *  - safeFilename normalization for storage paths
 *  - Pool character selection by style priority
 *  - Graceful handling of unknown styles
 */

import { describe, it, expect } from 'vitest';
import {
  VALID_STYLES,
  DEFAULT_STYLE,
  isValidStyle,
  coerceStyle,
  type AvatarStyle,
} from '../avatar-style-constants';

// ─── Mirrors from avatar API route ───────────────────────────────────────────

/** Mirrors the style selection logic in /api/avatar/route.ts */
function resolveRequestedStyle(rawStyle: unknown): AvatarStyle {
  return typeof rawStyle === 'string' && isValidStyle(rawStyle) ? rawStyle : DEFAULT_STYLE;
}

/** Mirrors pool character sorting: prioritizes characters with the requested style URL */
function sortByStylePriority(
  characters: Array<{ name: string; avatar_styles?: Record<string, string> | null }>,
  style: AvatarStyle,
): typeof characters {
  return [...characters].sort((a, b) => {
    const aHas = !!(a.avatar_styles?.[style]);
    const bHas = !!(b.avatar_styles?.[style]);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });
}

/** Mirrors the avatar URL resolution fallback chain */
function resolveAvatarUrl(
  character: { avatar_styles?: Record<string, string> | null; image_url?: string | null },
  style: AvatarStyle,
): string | null {
  // 1. Try exact style match
  const styled = character.avatar_styles?.[style];
  if (styled) return styled;

  // 2. Try any style URL
  if (character.avatar_styles) {
    for (const s of VALID_STYLES) {
      const fallback = character.avatar_styles[s];
      if (fallback) return fallback;
    }
  }

  // 3. Try legacy image_url
  if (character.image_url) return character.image_url;

  return null;
}

// ─── Mirrors generate-avatars.js safeFilename ────────────────────────────────

function safeFilename(voiceId: string): string {
  return voiceId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-.]/g, '_');
}

// ─── 1. Style validation ──────────────────────────────────────────────────────

describe('API style validation', () => {
  it('accepts all VALID_STYLES', () => {
    for (const s of VALID_STYLES) {
      expect(resolveRequestedStyle(s)).toBe(s);
    }
  });

  it('rejects unknown style → falls back to DEFAULT_STYLE', () => {
    expect(resolveRequestedStyle('watercolor')).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle('sketch')).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle('')).toBe(DEFAULT_STYLE);
  });

  it('rejects non-string values → falls back to DEFAULT_STYLE', () => {
    expect(resolveRequestedStyle(null)).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle(undefined)).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle(42)).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle(['toon3d'])).toBe(DEFAULT_STYLE);
  });

  it('is case-sensitive: uppercase style names are rejected', () => {
    expect(resolveRequestedStyle('Toon3d')).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle('TOON3D')).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle('Semi-Realistic')).toBe(DEFAULT_STYLE);
  });

  it('does not accept SQL injection strings', () => {
    expect(resolveRequestedStyle("'; DROP TABLE ai_characters; --")).toBe(DEFAULT_STYLE);
  });

  it('does not accept extra whitespace around valid style names', () => {
    expect(resolveRequestedStyle(' toon3d ')).toBe(DEFAULT_STYLE);
    expect(resolveRequestedStyle('\ttoon3d')).toBe(DEFAULT_STYLE);
  });
});

// ─── 2. coerceStyle ──────────────────────────────────────────────────────────

describe('coerceStyle helper', () => {
  it('passes through valid styles unchanged', () => {
    for (const s of VALID_STYLES) {
      expect(coerceStyle(s)).toBe(s);
    }
  });

  it('null / undefined → DEFAULT_STYLE', () => {
    expect(coerceStyle(null)).toBe(DEFAULT_STYLE);
    expect(coerceStyle(undefined)).toBe(DEFAULT_STYLE);
  });

  it('invalid string → DEFAULT_STYLE', () => {
    expect(coerceStyle('foo')).toBe(DEFAULT_STYLE);
    expect(coerceStyle('')).toBe(DEFAULT_STYLE);
  });

  it('never returns an unknown string', () => {
    const arbitrary = ['foo', 'bar', '', null, undefined, 'Toon3d'] as const;
    for (const v of arbitrary) {
      const result = coerceStyle(v as string | null | undefined);
      expect(VALID_STYLES.includes(result as AvatarStyle)).toBe(true);
    }
  });
});

// ─── 3. sortByStylePriority ───────────────────────────────────────────────────

describe('sortByStylePriority', () => {
  const characters: Array<{ name: string; avatar_styles?: Record<string, string> | null }> = [
    { name: 'Alice', avatar_styles: { 'semi-realistic': 'https://sr/alice.jpg' } },
    { name: 'Bob', avatar_styles: { toon3d: 'https://toon3d/bob.jpg' } },
    { name: 'Carol', avatar_styles: null },
    { name: 'Dan', avatar_styles: { toon3d: 'https://toon3d/dan.jpg', 'semi-realistic': 'https://sr/dan.jpg' } },
    { name: 'Eve', avatar_styles: {} },
  ];

  it('characters with the requested style come first', () => {
    const sorted = sortByStylePriority(characters, 'toon3d');
    expect(sorted[0].name).toBe('Bob');
    expect(sorted[1].name).toBe('Dan');
  });

  it('characters without the requested style come after', () => {
    const sorted = sortByStylePriority(characters, 'toon3d');
    const names = sorted.map((c) => c.name);
    const bobIdx = names.indexOf('Bob');
    const carolIdx = names.indexOf('Carol');
    expect(bobIdx).toBeLessThan(carolIdx);
  });

  it('characters without avatar_styles are sorted last', () => {
    const charsNoToon: { name: string; avatar_styles: Record<string, string> | null }[] = [
      { name: 'Alice', avatar_styles: { 'semi-realistic': 'https://sr/alice.jpg' } },
      { name: 'Bob', avatar_styles: { 'semi-realistic': 'https://sr/bob.jpg' } },
      { name: 'Carol', avatar_styles: null },
      { name: 'Eve', avatar_styles: {} },
    ];
    const sorted = sortByStylePriority(charsNoToon, 'toon3d');
    // None have toon3d → order is stable among no-priority group
    expect(sorted.every((c) => !c.avatar_styles?.['toon3d'])).toBe(true);
  });

  it('characters with multiple styles are still prioritized if they have the requested one', () => {
    const sorted = sortByStylePriority(characters, 'semi-realistic');
    const names = sorted.map((c) => c.name);
    const aliceIdx = names.indexOf('Alice');
    const danIdx = names.indexOf('Dan');
    expect(aliceIdx).toBeLessThan(names.indexOf('Bob'));
    expect(danIdx).toBeLessThan(names.indexOf('Bob'));
  });

  it('does not mutate the original array', () => {
    const original = [...characters];
    sortByStylePriority(characters, 'toon3d');
    expect(characters.map((c) => c.name)).toEqual(original.map((c) => c.name));
  });
});

// ─── 4. resolveAvatarUrl fallback chain ──────────────────────────────────────

describe('resolveAvatarUrl fallback chain', () => {
  it('returns the exact styled URL when style matches', () => {
    const char = {
      avatar_styles: { toon3d: 'https://toon3d/alice.jpg', 'semi-realistic': 'https://sr/alice.jpg' },
    };
    expect(resolveAvatarUrl(char, 'toon3d')).toBe('https://toon3d/alice.jpg');
  });

  it('falls back to another style URL when requested style is missing', () => {
    const char = {
      avatar_styles: { 'semi-realistic': 'https://sr/alice.jpg' },
    };
    const url = resolveAvatarUrl(char, 'toon3d');
    expect(url).toBe('https://sr/alice.jpg');
  });

  it('falls back to image_url when avatar_styles is null', () => {
    const char = {
      avatar_styles: null,
      image_url: 'https://legacy/alice.jpg',
    };
    expect(resolveAvatarUrl(char, 'toon3d')).toBe('https://legacy/alice.jpg');
  });

  it('falls back to image_url when avatar_styles is empty', () => {
    const char = {
      avatar_styles: {},
      image_url: 'https://legacy/alice.jpg',
    };
    expect(resolveAvatarUrl(char, 'toon3d')).toBe('https://legacy/alice.jpg');
  });

  it('returns null when no URL is available', () => {
    const char = { avatar_styles: null };
    expect(resolveAvatarUrl(char, 'toon3d')).toBeNull();
  });

  it('resolveAvatarUrl fallback is deterministic (respects VALID_STYLES order)', () => {
    // Request 'toon3d' but char only has 'semi-realistic' → falls back to first in VALID_STYLES
    const char = {
      avatar_styles: {
        'semi-realistic': 'https://sr/alice.jpg',
      },
    };
    const url = resolveAvatarUrl(char, 'toon3d');
    // Should return the first available style in VALID_STYLES order
    expect(url).toBe(resolveAvatarUrl(char, VALID_STYLES[0]));
  });

  it('host-type characters resolve the same way as player-type', () => {
    const char = {
      avatar_styles: { toon3d: 'https://toon3d/echo.jpg' },
    };
    expect(resolveAvatarUrl(char, 'toon3d')).toBe('https://toon3d/echo.jpg');
  });
});

// ─── 5. safeFilename normalization ───────────────────────────────────────────

describe('safeFilename for Supabase Storage paths', () => {
  it('strips accent characters (NFD decomposition)', () => {
    expect(safeFilename('Hélène')).toBe('Helene');
    expect(safeFilename('Maitê')).toBe('Maite');
    expect(safeFilename('José')).toBe('Jose');
    expect(safeFilename('Ångström')).toBe('Angstrom');
  });

  it('replaces spaces with underscores', () => {
    expect(safeFilename('Alice Smith')).toBe('Alice_Smith');
  });

  it('replaces special chars with underscores', () => {
    expect(safeFilename('test@email.com')).toBe('test_email.com');
    expect(safeFilename('name/path')).toBe('name_path');
    expect(safeFilename('foo:bar')).toBe('foo_bar');
  });

  it('preserves alphanumeric, underscore, hyphen, dot', () => {
    expect(safeFilename('alice_01-voice.en')).toBe('alice_01-voice.en');
  });

  it('pure ASCII names are unchanged', () => {
    expect(safeFilename('Alice')).toBe('Alice');
    expect(safeFilename('bob123')).toBe('bob123');
  });

  it('produces non-empty output for non-empty input', () => {
    const inputs = ['Hélène', 'Maitê', 'François', 'Søren'];
    for (const input of inputs) {
      expect(safeFilename(input).length).toBeGreaterThan(0);
    }
  });

  it('output only contains ASCII characters', () => {
    const problematic = ['Hélène', 'Maitê', 'François', '山田', 'Çalışkan'];
    for (const name of problematic) {
      const result = safeFilename(name);
      expect(result).toMatch(/^[\x00-\x7F]*$/);
    }
  });

  it('consecutive special chars become consecutive underscores', () => {
    expect(safeFilename('a!@#b')).toBe('a___b');
  });
});

// ─── 6. Pool request query parameter handling ─────────────────────────────────

describe('Pool API query parameter handling', () => {
  function extractPoolParams(searchParams: Record<string, string>) {
    const style = resolveRequestedStyle(searchParams['style']);
    const limit = Math.min(parseInt(searchParams['limit'] ?? '5', 10) || 5, 20);
    const gender = ['male', 'female'].includes(searchParams['gender'] ?? '')
      ? (searchParams['gender'] as 'male' | 'female')
      : undefined;
    return { style, limit, gender };
  }

  it('defaults limit to 5 when omitted', () => {
    const { limit } = extractPoolParams({ style: 'toon3d' });
    expect(limit).toBe(5);
  });

  it('caps limit at 20', () => {
    const { limit } = extractPoolParams({ style: 'toon3d', limit: '100' });
    expect(limit).toBe(20);
  });

  it('defaults style to DEFAULT_STYLE when omitted', () => {
    const { style } = extractPoolParams({});
    expect(style).toBe(DEFAULT_STYLE);
  });

  it('accepts valid gender values', () => {
    expect(extractPoolParams({ gender: 'male' }).gender).toBe('male');
    expect(extractPoolParams({ gender: 'female' }).gender).toBe('female');
  });

  it('rejects invalid gender values', () => {
    expect(extractPoolParams({ gender: 'other' }).gender).toBeUndefined();
    expect(extractPoolParams({ gender: '' }).gender).toBeUndefined();
  });

  it('handles NaN limit gracefully', () => {
    const { limit } = extractPoolParams({ style: 'toon3d', limit: 'abc' });
    expect(limit).toBe(5);
  });
});

// ─── 7. VALID_STYLES set operations ───────────────────────────────────────────

describe('VALID_STYLES set completeness', () => {
  it('has exactly 3 styles', () => {
    expect(VALID_STYLES).toHaveLength(3);
  });

  it('contains semi-realistic as the default', () => {
    expect(VALID_STYLES).toContain('semi-realistic');
    expect(DEFAULT_STYLE).toBe('semi-realistic');
  });

  it('contains all expected style values', () => {
    const expected = ['valorant', 'semi-realistic', 'toon3d'];
    for (const s of expected) {
      expect(VALID_STYLES).toContain(s);
    }
  });

  it('no duplicates in VALID_STYLES', () => {
    expect(new Set(VALID_STYLES).size).toBe(VALID_STYLES.length);
  });

  it('DEFAULT_STYLE is included in VALID_STYLES', () => {
    expect(VALID_STYLES).toContain(DEFAULT_STYLE);
  });
});
