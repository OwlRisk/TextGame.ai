import { describe, it, expect } from 'vitest';
import { getAvatarPropsForPlayer } from '../avatar-utils';
import type { Player } from '@/types/player';
import { VALID_STYLES, type AvatarStyle } from '../avatar-style-constants';

// Minimal player factory to reduce repetition
function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    avatar: '#6366f1',
    isAI: true,
    ...overrides,
  };
}

// ─── null / undefined input ───────────────────────────────────────────────

describe('getAvatarPropsForPlayer – null/undefined', () => {
  it('returns safe defaults for null', () => {
    const props = getAvatarPropsForPlayer(null);
    expect(props.name).toBeUndefined();
    expect(props.type).toBe('player');
  });

  it('returns safe defaults for undefined', () => {
    const props = getAvatarPropsForPlayer(undefined);
    expect(props.type).toBe('player');
  });
});

// ─── human player (!isAI) ─────────────────────────────────────────────────

describe('getAvatarPropsForPlayer – human player', () => {
  it('type is always "player"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false, name: 'Evelyn Hart' }));
    expect(props.type).toBe('player');
  });

  it('uses the player name when it is not "You"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false, name: 'Evelyn Hart' }));
    expect(props.name).toBe('Evelyn Hart');
  });

  it('falls back to "You" when name is "You"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false, name: 'You' }));
    expect(props.name).toBe('You');
  });

  it('falls back to "You" when name is empty or whitespace', () => {
    expect(getAvatarPropsForPlayer(makePlayer({ isAI: false, name: '' })).name).toBe('You');
    expect(getAvatarPropsForPlayer(makePlayer({ isAI: false, name: '   ' })).name).toBe('You');
  });

  it('has no personality, background, role, or gender for human player', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }));
    expect(props.personality).toBeUndefined();
    expect(props.background).toBeUndefined();
    expect(props.role).toBeUndefined();
    expect(props.gender).toBeUndefined();
  });
});

// ─── Host (isAI + isGameMaster) ──────────────────────────────────────────

describe('getAvatarPropsForPlayer – host', () => {
  it('type is "host"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }));
    expect(props.type).toBe('host');
  });

  it('uses background when provided', () => {
    const props = getAvatarPropsForPlayer(
      makePlayer({ isGameMaster: true, background: 'Mysterious storyteller.' })
    );
    expect(props.background).toBe('Mysterious storyteller.');
  });

  it('falls back to default background when none provided', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true, background: undefined }));
    expect(props.background).toContain('host');
  });

  it('trims whitespace-only background', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true, background: '   ' }));
    // whitespace-only background is treated as undefined → use default
    expect(props.background).toContain('host');
  });
});

// ─── AI player (isAI + !isGameMaster) ────────────────────────────────────

describe('getAvatarPropsForPlayer – AI player', () => {
  it('type is "player"', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true, isGameMaster: false }));
    expect(props.type).toBe('player');
  });

  it('passes through role', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ role: 'Werewolf' }));
    expect(props.role).toBe('Werewolf');
  });

  it('passes through personality', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ personality: 'Cunning and secretive' }));
    expect(props.personality).toBe('Cunning and secretive');
  });

  it('normalises gender to lowercase', () => {
    expect(
      getAvatarPropsForPlayer(makePlayer({ gender: 'Male' })).gender
    ).toBe('male');
    expect(
      getAvatarPropsForPlayer(makePlayer({ gender: 'FEMALE' })).gender
    ).toBe('female');
  });

  it('rejects unknown gender values', () => {
    expect(
      getAvatarPropsForPlayer(makePlayer({ gender: 'robot' })).gender
    ).toBeUndefined();
  });

  it('accepts "other" gender', () => {
    expect(
      getAvatarPropsForPlayer(makePlayer({ gender: 'other' })).gender
    ).toBe('other');
  });

  it('uses default background containing role when no background set', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ role: 'Detective', background: undefined }));
    expect(props.background).toContain('Detective');
  });

  it('uses custom background when provided', () => {
    const props = getAvatarPropsForPlayer(
      makePlayer({ background: 'A retired spy living in shadows.' })
    );
    expect(props.background).toBe('A retired spy living in shadows.');
  });

  it('trims role and personality', () => {
    const props = getAvatarPropsForPlayer(
      makePlayer({ role: '  Spy  ', personality: '  Bold  ' })
    );
    expect(props.role).toBe('Spy');
    expect(props.personality).toBe('Bold');
  });

  it('keeps name as-is', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ name: 'Boris' }));
    expect(props.name).toBe('Boris');
  });
});

// ─── style parameter ──────────────────────────────────────────────────────────

describe('getAvatarPropsForPlayer – style parameter', () => {
  it('returns undefined style when not passed (hook resolves it later)', () => {
    expect(getAvatarPropsForPlayer(makePlayer({ isAI: false })).style).toBeUndefined();
    expect(getAvatarPropsForPlayer(makePlayer({ isAI: true })).style).toBeUndefined();
    expect(getAvatarPropsForPlayer(null).style).toBeUndefined();
  });

  it('forwards style for human player', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: false }), 'anime');
    expect(props.style).toBe('anime');
  });

  it('forwards style for AI player', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isAI: true }), 'pixel');
    expect(props.style).toBe('pixel');
  });

  it('forwards style for host (isGameMaster)', () => {
    const props = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }), 'cyberpunk');
    expect(props.style).toBe('cyberpunk');
  });

  it('forwards style for null player', () => {
    const props = getAvatarPropsForPlayer(null, 'painted');
    expect(props.style).toBe('painted');
  });

  it('all valid styles are forwarded correctly', () => {
    for (const style of VALID_STYLES) {
      const aiProps = getAvatarPropsForPlayer(makePlayer({ isAI: true }), style as AvatarStyle);
      expect(aiProps.style).toBe(style);
    }
  });

  it('human, AI, and host all return the same style value', () => {
    const style: AvatarStyle = 'painted';
    const human = getAvatarPropsForPlayer(makePlayer({ isAI: false }), style).style;
    const ai = getAvatarPropsForPlayer(makePlayer({ isAI: true }), style).style;
    const host = getAvatarPropsForPlayer(makePlayer({ isGameMaster: true }), style).style;
    expect(human).toBe(style);
    expect(ai).toBe(style);
    expect(host).toBe(style);
  });
});
