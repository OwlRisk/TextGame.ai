import { describe, it, expect } from 'vitest';
import { parseHostActions, resolvePlayerRefToId } from '../host-actions';

const USER_ID = 'user-001';

// ─── parseHostActions: clean content ─────────────────────────────────────

describe('parseHostActions – clean content', () => {
  it('returns unchanged text when no blocks present', () => {
    const { cleanContent, actions } = parseHostActions('Hello everyone!');
    expect(cleanContent).toBe('Hello everyone!');
    expect(actions).toHaveLength(0);
  });

  it('strips a single [BOARD:You] block from the message', () => {
    const raw = 'Good morning!\n[BOARD:You]\nYou are the Werewolf.\n[/BOARD]\nEnjoy the game.';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain('[BOARD');
    expect(cleanContent).not.toContain('[/BOARD]');
    expect(cleanContent).not.toContain('You are the Werewolf.');
    expect(cleanContent).toContain('Good morning!');
    expect(cleanContent).toContain('Enjoy the game.');
  });

  it('strips multiple [BOARD] blocks', () => {
    const raw =
      '[BOARD:Alice]\nAlice is the Seer.\n[/BOARD]\n[BOARD:Bob]\nBob is the Witch.\n[/BOARD]\nGame starts!';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain('[BOARD');
    expect(cleanContent).toContain('Game starts!');
  });

  it('collapses excess blank lines left by removed blocks', () => {
    const raw = 'Line one.\n\n\n[BOARD:You]\nSecret\n[/BOARD]\n\n\nLine two.';
    const { cleanContent } = parseHostActions(raw);
    // Should not have more than 2 consecutive newlines
    expect(cleanContent).not.toMatch(/\n{3,}/);
  });

  it('trims leading/trailing whitespace from cleanContent', () => {
    const raw = '[BOARD:You]\nSecret\n[/BOARD]';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).toBe('');
  });
});

// ─── parseHostActions: actions ────────────────────────────────────────────

describe('parseHostActions – actions', () => {
  it('extracts a my_board action for "You"', () => {
    const raw = '[BOARD:You]\nYou are the Werewolf.\n[/BOARD]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('my_board');
    const a = actions[0];
    if (a.type !== 'my_board') throw new Error('Expected my_board');
    expect(a.playerRef).toBe('You');
    expect(a.content).toBe('You are the Werewolf.');
  });

  it('extracts playerRef with player name', () => {
    const raw = '[BOARD:Alice]\nAlice is the Seer.\n[/BOARD]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'my_board') throw new Error('Expected my_board');
    expect(a.playerRef).toBe('Alice');
    expect(a.content).toBe('Alice is the Seer.');
  });

  it('handles spaces around player name in tag', () => {
    const raw = '[BOARD:  Bob  ]\nContent\n[/BOARD]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'my_board') throw new Error('Expected my_board');
    expect(a.playerRef).toBe('Bob');
  });

  it('extracts multiple actions in order', () => {
    const raw =
      '[BOARD:Alice]\nAlice content\n[/BOARD]\n[BOARD:Bob]\nBob content\n[/BOARD]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(2);
    const a0 = actions[0]; if (a0.type !== 'my_board') throw new Error('Expected my_board');
    const a1 = actions[1]; if (a1.type !== 'my_board') throw new Error('Expected my_board');
    expect(a0.playerRef).toBe('Alice');
    expect(a1.playerRef).toBe('Bob');
  });

  it('preserves multi-line content inside block', () => {
    const raw = '[BOARD:You]\nLine 1\nLine 2\nLine 3\n[/BOARD]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'my_board') throw new Error('Expected my_board');
    expect(a.content).toContain('Line 1');
    expect(a.content).toContain('Line 2');
    expect(a.content).toContain('Line 3');
  });

  it('returns empty actions for plain text', () => {
    const { actions } = parseHostActions('No special blocks here.');
    expect(actions).toHaveLength(0);
  });

  it('is case-insensitive for BOARD tag', () => {
    const raw = '[board:You]\nSecret role\n[/board]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0];
    if (a.type !== 'my_board') throw new Error('Expected my_board');
    expect(a.content).toBe('Secret role');
  });
});

// ─── resolvePlayerRefToId ─────────────────────────────────────────────────

describe('resolvePlayerRefToId', () => {
  const players = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
  ];

  it('"You" resolves to the human userId', () => {
    expect(resolvePlayerRefToId('You', players, USER_ID)).toBe(USER_ID);
  });

  it('"you" (lowercase) also resolves to the human userId', () => {
    expect(resolvePlayerRefToId('you', players, USER_ID)).toBe(USER_ID);
  });

  it('"YOU" (uppercase) also resolves to the human userId', () => {
    expect(resolvePlayerRefToId('YOU', players, USER_ID)).toBe(USER_ID);
  });

  it('exact player name resolves to that player id', () => {
    expect(resolvePlayerRefToId('Alice', players, USER_ID)).toBe('p1');
    expect(resolvePlayerRefToId('Bob', players, USER_ID)).toBe('p2');
    expect(resolvePlayerRefToId('Charlie', players, USER_ID)).toBe('p3');
  });

  it('player name with surrounding whitespace still resolves', () => {
    expect(resolvePlayerRefToId('  Alice  ', players, USER_ID)).toBe('p1');
  });

  it('returns null for unknown player name', () => {
    expect(resolvePlayerRefToId('Dave', players, USER_ID)).toBeNull();
  });

  it('returns null for empty ref', () => {
    expect(resolvePlayerRefToId('', players, USER_ID)).toBeNull();
    expect(resolvePlayerRefToId('  ', players, USER_ID)).toBeNull();
  });

  it('matches humanDisplayName to userId', () => {
    expect(resolvePlayerRefToId('Evelyn Hart', players, USER_ID, 'Evelyn Hart')).toBe(USER_ID);
  });

  it('returns null when humanDisplayName does not match and name is not a player', () => {
    expect(resolvePlayerRefToId('Unknown', players, USER_ID, 'Evelyn Hart')).toBeNull();
  });

  it('works with an empty players array', () => {
    expect(resolvePlayerRefToId('You', [], USER_ID)).toBe(USER_ID);
    expect(resolvePlayerRefToId('Alice', [], USER_ID)).toBeNull();
  });
});
