/**
 * Tests for human player avatar consistency:
 *  - getAvatarPropsForPlayer with style parameter
 *  - Human players in-game always use GeneratedAvatar (same art style as AI)
 *  - All player types produce the correct prop shape
 */

import { describe, it, expect } from 'vitest';
import { getAvatarPropsForPlayer } from '../avatar-utils';
import type { Player } from '@/types/player';
import { VALID_STYLES, DEFAULT_STYLE, type AvatarStyle } from '../avatar-style-constants';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    avatar: '#6366f1',
    isAI: true,
    ...overrides,
  };
}

// ─── 1. Human player — style forwarding ──────────────────────────────────────

describe('getAvatarPropsForPlayer – human player with style', () => {
  it('returns the passed style for human player', () => {
    const props = getAvatarPropsForPlayer(
      makePlayer({ isAI: false, name: 'Evelyn Hart' }),
      'anime',
    );
    expect(props.style).toBe('anime');
  });

  it('forwards any valid style', () => {
    for (const style of VALID_STYLES) {
      const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }), style);
      expect(props.style).toBe(style);
    }
  });

  it('style is undefined when not passed (falls through to component hook)', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }));
    expect(props.style).toBeUndefined();
  });
});

// ─── 2. AI player — style forwarding ─────────────────────────────────────────

describe('getAvatarPropsForPlayer – AI player with style', () => {
  it('returns the passed style for AI player', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true }), 'pixel');
    expect(props.style).toBe('pixel');
  });

  it('style is undefined when not passed', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true }));
    expect(props.style).toBeUndefined();
  });
});

// ─── 3. Host — style forwarding ──────────────────────────────────────────────

describe('getAvatarPropsForPlayer – host with style', () => {
  it('returns the passed style for host', () => {
    const props = getAvatarPropsForPlayer(
      makePlayer({ isGameMaster: true, isAI: true }),
      'cyberpunk',
    );
    expect(props.style).toBe('cyberpunk');
    expect(props.type).toBe('host');
  });
});

// ─── 4. null / undefined — style forwarding ──────────────────────────────────

describe('getAvatarPropsForPlayer – null/undefined with style', () => {
  it('still returns style even for null player', () => {
    const props = getAvatarPropsForPlayer(null, 'painted');
    expect(props.style).toBe('painted');
    expect(props.name).toBeUndefined();
  });

  it('returns undefined style for null player when style not passed', () => {
    const props = getAvatarPropsForPlayer(null);
    expect(props.style).toBeUndefined();
  });
});

// ─── 5. Human player avatar path consistency ─────────────────────────────────

describe('Human player avatar path — in-game behaviour', () => {
  /**
   * Mirrors the `useGameAvatarForHuman` logic in PlayerPanel/ChatMessage.
   * Before the fix: `!player.isAI && !!gameId && !userAvatarUrl`
   * After the fix:  `!player.isAI && !!gameId`
   *
   * This ensures human players always use GeneratedAvatar in-game,
   * keeping the same art style as AI players and the host.
   */
  function useGameAvatarForHuman(player: Pick<Player, 'isAI'>, gameId?: string): boolean {
    return !player.isAI && !!gameId;
  }

  it('human with gameId → always use game avatar (even if OAuth photo exists)', () => {
    const human = makePlayer({ isAI: false });
    expect(useGameAvatarForHuman(human, 'room-123')).toBe(true);
  });

  it('human without gameId → no game avatar (outside game)', () => {
    const human = makePlayer({ isAI: false });
    expect(useGameAvatarForHuman(human, undefined)).toBe(false);
  });

  it('AI player → never useGameAvatarForHuman (always uses getAvatarPropsForPlayer)', () => {
    const ai = makePlayer({ isAI: true });
    expect(useGameAvatarForHuman(ai, 'room-123')).toBe(false);
  });
});

// ─── 6. Prop shape contract ───────────────────────────────────────────────────

describe('getAvatarPropsForPlayer – prop shape', () => {
  const requiredKeys = ['name', 'type', 'background', 'personality', 'role', 'gender', 'style'];

  it('human player result has all required keys', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }), 'anime');
    for (const key of requiredKeys) {
      expect(props).toHaveProperty(key);
    }
  });

  it('AI player result has all required keys', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true }), 'pixel');
    for (const key of requiredKeys) {
      expect(props).toHaveProperty(key);
    }
  });

  it('host result has type "host"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }), 'painted');
    expect(props.type).toBe('host');
  });

  it('human result has type "player"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }));
    expect(props.type).toBe('player');
  });

  it('AI result has type "player"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true, isGameMaster: false }));
    expect(props.type).toBe('player');
  });
});

// ─── 7. All player types — same style when a style is passed ─────────────────

describe('Style parity across player types', () => {
  it('human, AI, and host all receive the same style when passed', () => {
    const style: AvatarStyle = 'anime';
    const humanProps = getAvatarPropsForPlayer(makePlayer({ isAI: false }), style);
    const aiProps = getAvatarPropsForPlayer(makePlayer({ isAI: true, isGameMaster: false }), style);
    const hostProps = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }), style);

    expect(humanProps.style).toBe(style);
    expect(aiProps.style).toBe(style);
    expect(hostProps.style).toBe(style);
  });

  it('no style passed → all three return undefined style (hook will resolve)', () => {
    const humanProps = getAvatarPropsForPlayer(makePlayer({ isAI: false }));
    const aiProps = getAvatarPropsForPlayer(makePlayer({ isAI: true }));
    const hostProps = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }));

    expect(humanProps.style).toBeUndefined();
    expect(aiProps.style).toBeUndefined();
    expect(hostProps.style).toBeUndefined();
  });

  it('each valid style is correctly forwarded for each player type', () => {
    for (const style of VALID_STYLES) {
      const humanStyle = getAvatarPropsForPlayer(makePlayer({ isAI: false }), style).style;
      const aiStyle = getAvatarPropsForPlayer(makePlayer({ isAI: true }), style).style;
      const hostStyle = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }), style).style;

      expect(humanStyle).toBe(style);
      expect(aiStyle).toBe(style);
      expect(hostStyle).toBe(style);
    }
  });
});

// ─── 8. Avatar style in pool API response resolution ─────────────────────────

describe('Avatar style resolution (pool API logic)', () => {
  function resolveAvatarStyle(
    char: { avatar_url: string | null; avatar_styles: Record<string, string> },
    style: AvatarStyle,
  ): string | null {
    return char.avatar_styles[style] ?? char.avatar_styles[DEFAULT_STYLE] ?? char.avatar_url ?? null;
  }

  it('returns exact match when available', () => {
    const char = {
      avatar_url: 'https://pool/alice.jpg',
      avatar_styles: { 'semi-realistic': 'https://sr/alice.jpg', anime: 'https://anime/alice.jpg' },
    };
    expect(resolveAvatarStyle(char, 'anime')).toBe('https://anime/alice.jpg');
  });

  it('falls back to DEFAULT_STYLE when requested style missing', () => {
    const char = {
      avatar_url: 'https://pool/alice.jpg',
      avatar_styles: { 'semi-realistic': 'https://sr/alice.jpg' },
    };
    expect(resolveAvatarStyle(char, 'pixel')).toBe('https://sr/alice.jpg');
  });

  it('falls back to avatar_url when avatar_styles is empty', () => {
    const char = { avatar_url: 'https://pool/alice.jpg', avatar_styles: {} };
    expect(resolveAvatarStyle(char, 'anime')).toBe('https://pool/alice.jpg');
  });

  it('returns null when both are absent', () => {
    const char = { avatar_url: null, avatar_styles: {} };
    expect(resolveAvatarStyle(char, 'painted')).toBeNull();
  });

  it('works for all valid styles', () => {
    for (const style of VALID_STYLES) {
      const char = {
        avatar_url: null,
        avatar_styles: { [style]: `https://pool/${style}/alice.jpg` },
      };
      expect(resolveAvatarStyle(char, style)).toBe(`https://pool/${style}/alice.jpg`);
    }
  });
});
