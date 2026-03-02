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

// ─── parseHostActions: ACCESS blocks ─────────────────────────────────────

describe('parseHostActions – ACCESS blocks', () => {
  it('strips an ACCESS block from the message', () => {
    const raw = 'Night begins.\n[ACCESS:Werewolf Den]Alice, Bob[/ACCESS]\nSleep well.';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain('[ACCESS');
    expect(cleanContent).not.toContain('[/ACCESS]');
    expect(cleanContent).toContain('Night begins.');
    expect(cleanContent).toContain('Sleep well.');
  });

  it('extracts channelRef and playerRefs from ACCESS block', () => {
    const raw = '[ACCESS:Werewolf Den]Alice, Bob[/ACCESS]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0];
    if (a.type !== 'access') throw new Error('Expected access');
    expect(a.channelRef).toBe('Werewolf Den');
    expect(a.playerRefs).toEqual(['Alice', 'Bob']);
  });

  it('trims whitespace around player names in ACCESS block', () => {
    const raw = '[ACCESS:Room]  Alice ,  Bob  [/ACCESS]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'access') throw new Error('Expected access');
    expect(a.playerRefs).toEqual(['Alice', 'Bob']);
  });

  it('treats "*" content as public (playerRefs = ["*"])', () => {
    const raw = '[ACCESS:Town Square]*[/ACCESS]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'access') throw new Error('Expected access');
    expect(a.playerRefs).toEqual(['*']);
  });

  it('treats empty content as locked (playerRefs = [])', () => {
    const raw = '[ACCESS:Secret Room][/ACCESS]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'access') throw new Error('Expected access');
    expect(a.playerRefs).toEqual([]);
  });

  it('handles multiple ACCESS blocks in one reply', () => {
    const raw = '[ACCESS:Room A]Alice[/ACCESS]\n[ACCESS:Room B]Bob[/ACCESS]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(2);
    const a0 = actions[0]; if (a0.type !== 'access') throw new Error('Expected access');
    const a1 = actions[1]; if (a1.type !== 'access') throw new Error('Expected access');
    expect(a0.channelRef).toBe('Room A');
    expect(a1.channelRef).toBe('Room B');
  });

  it('is case-insensitive for ACCESS tag', () => {
    const raw = '[access:Room]Alice[/access]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0];
    if (a.type !== 'access') throw new Error('Expected access');
    expect(a.channelRef).toBe('Room');
  });
});

// ─── parseHostActions: SECTION blocks ────────────────────────────────────

describe('parseHostActions – SECTION blocks', () => {
  it('strips a SECTION block from the message', () => {
    const raw = 'Day 1 begins.\n[SECTION:Vote Log]\nNo votes yet.\n[/SECTION]\nSpeak up!';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain('[SECTION');
    expect(cleanContent).not.toContain('[/SECTION]');
    expect(cleanContent).toContain('Day 1 begins.');
    expect(cleanContent).toContain('Speak up!');
  });

  it('extracts title and content from SECTION block', () => {
    const raw = '[SECTION:Vote Log]\nAlice: 3 votes\nBob: 2 votes\n[/SECTION]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0];
    if (a.type !== 'section') throw new Error('Expected section');
    expect(a.title).toBe('Vote Log');
    expect(a.content).toContain('Alice: 3 votes');
    expect(a.content).toContain('Bob: 2 votes');
  });

  it('handles multi-line markdown content in SECTION', () => {
    const raw = '[SECTION:Night Log]\n**Night 1**: Werewolves killed Alice.\n- Seer investigated Bob.\n[/SECTION]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'section') throw new Error('Expected section');
    expect(a.content).toContain('**Night 1**');
    expect(a.content).toContain('- Seer investigated Bob.');
  });

  it('handles multiple SECTION blocks in one reply', () => {
    const raw = '[SECTION:Votes]\nVote data\n[/SECTION]\n[SECTION:Clues]\nClue data\n[/SECTION]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(2);
    const a0 = actions[0]; if (a0.type !== 'section') throw new Error('Expected section');
    const a1 = actions[1]; if (a1.type !== 'section') throw new Error('Expected section');
    expect(a0.title).toBe('Votes');
    expect(a1.title).toBe('Clues');
  });

  it('trims whitespace around SECTION title', () => {
    const raw = '[SECTION:  Player Status  ]\nContent\n[/SECTION]';
    const { actions } = parseHostActions(raw);
    const a = actions[0];
    if (a.type !== 'section') throw new Error('Expected section');
    expect(a.title).toBe('Player Status');
  });

  it('is case-insensitive for SECTION tag', () => {
    const raw = '[section:Log]\nEntry\n[/section]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0];
    if (a.type !== 'section') throw new Error('Expected section');
    expect(a.title).toBe('Log');
  });
});

// ─── parseHostActions: mixed block types ──────────────────────────────────

describe('parseHostActions – mixed block types', () => {
  it('extracts BOARD, ACCESS, and SECTION from the same reply in order', () => {
    const raw = [
      'Game continues.',
      '[BOARD:Alice]\nYou are the Seer.\n[/BOARD]',
      '[ACCESS:Werewolf Den]Bob[/ACCESS]',
      '[SECTION:Night Log]\nNight 1 complete.\n[/SECTION]',
      'Good luck.',
    ].join('\n');
    const { cleanContent, actions } = parseHostActions(raw);
    expect(cleanContent).toContain('Game continues.');
    expect(cleanContent).toContain('Good luck.');
    expect(cleanContent).not.toContain('[BOARD');
    expect(cleanContent).not.toContain('[ACCESS');
    expect(cleanContent).not.toContain('[SECTION');
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe('my_board');
    expect(actions[1].type).toBe('access');
    expect(actions[2].type).toBe('section');
  });

  it('returns empty cleanContent when reply contains only blocks', () => {
    const raw = '[BOARD:You]\nSecret\n[/BOARD][SECTION:Log]\nEntry\n[/SECTION]';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).toBe('');
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

// ─── parseHostActions: GAME_OVER ──────────────────────────────────────────

describe('parseHostActions – GAME_OVER', () => {
  it('extracts a game_over action with a summary', () => {
    const raw = 'The villagers have won!\n[GAME_OVER]Villagers win — all werewolves eliminated.[/GAME_OVER]';
    const { actions, cleanContent } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({ type: 'game_over', summary: 'Villagers win — all werewolves eliminated.' });
    expect(cleanContent).toContain('The villagers have won!');
    expect(cleanContent).not.toContain('[GAME_OVER]');
    expect(cleanContent).not.toContain('[/GAME_OVER]');
  });

  it('extracts a game_over action when summary is empty', () => {
    const raw = 'Game over.\n[GAME_OVER][/GAME_OVER]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('game_over');
    const a = actions[0] as { type: 'game_over'; summary: string };
    expect(a.summary).toBe('');
  });

  it('strips the [GAME_OVER] block from clean content', () => {
    const raw = 'Round ends.\n[GAME_OVER]Mafia wins.[/GAME_OVER]\nThanks for playing!';
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain('[GAME_OVER]');
    expect(cleanContent).not.toContain('Mafia wins.');
    expect(cleanContent).toContain('Round ends.');
    expect(cleanContent).toContain('Thanks for playing!');
  });

  it('handles multi-line summary inside [GAME_OVER]', () => {
    const raw = '[GAME_OVER]The detective found the killer.\nEvil loses.[/GAME_OVER]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    const a = actions[0] as { type: 'game_over'; summary: string };
    expect(a.summary).toContain('The detective found the killer.');
  });

  it('does not produce a game_over action when no block is present', () => {
    const { actions } = parseHostActions('The game continues. Night falls.');
    const gameOverActions = actions.filter((a) => a.type === 'game_over');
    expect(gameOverActions).toHaveLength(0);
  });

  it('handles [GAME_OVER] alongside other blocks', () => {
    const raw =
      '[BOARD:Alice]\nYou are the Seer.\n[/BOARD]\nNight ends.\n[GAME_OVER]Villagers win![/GAME_OVER]';
    const { actions, cleanContent } = parseHostActions(raw);
    const boardActions = actions.filter((a) => a.type === 'my_board');
    const gameOverActions = actions.filter((a) => a.type === 'game_over');
    expect(boardActions).toHaveLength(1);
    expect(gameOverActions).toHaveLength(1);
    expect(cleanContent).not.toContain('[BOARD');
    expect(cleanContent).not.toContain('[GAME_OVER]');
    expect(cleanContent).toContain('Night ends.');
  });

  it('is case-insensitive for [game_over] tag', () => {
    const raw = '[game_over]werewolves win[/game_over]';
    const { actions } = parseHostActions(raw);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('game_over');
  });
});
