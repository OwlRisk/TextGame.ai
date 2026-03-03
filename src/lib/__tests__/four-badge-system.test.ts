import { describe, it, expect } from 'vitest';

// ─── Four-badge system tests ──────────────────────────────────────────────────
// Covers the complete badge taxonomy across both panels:
//
//   Player panel (right side – player-panel.tsx)
//     GM   – amber Crown badge on the AI game master character section header
//     YOU  – blue badge on the human (non-AI) player card
//
//   Players Online (left sidebar – channel-list.tsx)
//     Host  – violet badge on the human room owner
//     Guest – emerald badge on invited human guests
//     You   – grey badge on the current viewer's own row
//
// All helpers are pure functions extracted from production code.

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 – Player panel: section routing (isGameMaster split)
// ─────────────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  isGameMaster?: boolean;
  isAI: boolean;
  role?: string;
  roleRevealed?: boolean;
}

function getGMPlayers(players: Player[]): Player[] {
  return players.filter((p) => p.isGameMaster);
}

function getRegularPlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.isGameMaster);
}

describe('player panel — section routing', () => {
  const gm: Player = { id: 'gm-1', name: 'Warden Lunaris', isGameMaster: true, isAI: true };
  const aiPlayer: Player = { id: 'ai-1', name: 'Mara Voss', isGameMaster: false, isAI: true };
  const humanPlayer: Player = { id: 'human-1', name: 'Alex', isGameMaster: false, isAI: false };

  it('GM section contains only isGameMaster players', () => {
    const gms = getGMPlayers([gm, aiPlayer, humanPlayer]);
    expect(gms).toHaveLength(1);
    expect(gms[0].id).toBe('gm-1');
  });

  it('regular section excludes GM', () => {
    const regulars = getRegularPlayers([gm, aiPlayer, humanPlayer]);
    expect(regulars).toHaveLength(2);
    expect(regulars.map((p) => p.id)).not.toContain('gm-1');
  });

  it('no player appears in both sections', () => {
    const all = [gm, aiPlayer, humanPlayer];
    const gmIds = new Set(getGMPlayers(all).map((p) => p.id));
    const regularIds = new Set(getRegularPlayers(all).map((p) => p.id));
    for (const id of gmIds) {
      expect(regularIds.has(id)).toBe(false);
    }
  });

  it('all players appear in exactly one section', () => {
    const all = [gm, aiPlayer, humanPlayer];
    expect(getGMPlayers(all).length + getRegularPlayers(all).length).toBe(all.length);
  });

  it('empty player list produces empty sections', () => {
    expect(getGMPlayers([])).toHaveLength(0);
    expect(getRegularPlayers([])).toHaveLength(0);
  });

  it('a game without a GM character has empty GM section', () => {
    const noGm = [aiPlayer, humanPlayer];
    expect(getGMPlayers(noGm)).toHaveLength(0);
    expect(getRegularPlayers(noGm)).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 – Player panel: PlayerCard badge rules
// ─────────────────────────────────────────────────────────────────────────────

type PlayerCardBadge = 'YOU' | null;

/** Mirrors the YOU badge condition: shown when !player.isAI */
function resolvePlayerCardBadge(player: Player): PlayerCardBadge {
  return player.isAI ? null : 'YOU';
}

describe('player panel — YOU badge', () => {
  it('human player (isAI=false) gets YOU badge', () => {
    expect(resolvePlayerCardBadge({ id: '1', name: 'Alex', isAI: false })).toBe('YOU');
  });

  it('AI player does NOT get YOU badge', () => {
    expect(resolvePlayerCardBadge({ id: '2', name: 'Mara', isAI: true })).toBeNull();
  });

  it('GM character (isAI=true) does NOT get YOU badge', () => {
    const gm: Player = { id: 'gm-1', name: 'Oracle', isGameMaster: true, isAI: true };
    expect(resolvePlayerCardBadge(gm)).toBeNull();
  });

  it('exactly one YOU badge in a standard 10-player game', () => {
    const players: Player[] = [
      { id: 'gm', name: 'GM', isGameMaster: true, isAI: true },
      { id: 'h', name: 'Alex', isAI: false },
      ...Array.from({ length: 8 }, (_, i) => ({ id: `ai-${i}`, name: `AI ${i}`, isAI: true })),
    ];
    const badges = players.map(resolvePlayerCardBadge);
    expect(badges.filter((b) => b === 'YOU')).toHaveLength(1);
  });

  it('zero YOU badges in an all-AI game', () => {
    const players: Player[] = [
      { id: 'gm', name: 'GM', isGameMaster: true, isAI: true },
      { id: 'ai-1', name: 'Bot 1', isAI: true },
      { id: 'ai-2', name: 'Bot 2', isAI: true },
    ];
    expect(players.map(resolvePlayerCardBadge).filter((b) => b === 'YOU')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 – Player panel: subtitle text rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors subtitle visibility and text in PlayerCard:
 *   player.isGameMaster → "Game Master"
 *   !isGameMaster + has role + isAI + (ownerView OR roleRevealed) → role string
 *   otherwise → null
 */
function resolveSubtitle(
  player: Player,
  isOwnerView: boolean
): string | null {
  if (player.isGameMaster) return 'Game Master';
  if (player.role && player.isAI && (isOwnerView || player.roleRevealed)) return player.role;
  return null;
}

describe('player panel — subtitle text', () => {
  it('GM card subtitle is "Game Master"', () => {
    const gm: Player = { id: 'gm', name: 'Oracle', isGameMaster: true, isAI: true };
    expect(resolveSubtitle(gm, false)).toBe('Game Master');
    expect(resolveSubtitle(gm, true)).toBe('Game Master');
  });

  it('AI player with role shows role when owner is viewing', () => {
    const p: Player = { id: 'ai', name: 'Mara', isAI: true, role: 'Werewolf' };
    expect(resolveSubtitle(p, true)).toBe('Werewolf');
  });

  it('AI player with revealed role shows role even to guests', () => {
    const p: Player = { id: 'ai', name: 'Mara', isAI: true, role: 'Seer', roleRevealed: true };
    expect(resolveSubtitle(p, false)).toBe('Seer');
  });

  it('AI player with role is hidden from guests unless revealed', () => {
    const p: Player = { id: 'ai', name: 'Mara', isAI: true, role: 'Mafia' };
    expect(resolveSubtitle(p, false)).toBeNull();
  });

  it('human player has no subtitle', () => {
    const p: Player = { id: 'human', name: 'Alex', isAI: false, role: 'Villager' };
    expect(resolveSubtitle(p, true)).toBeNull();
    expect(resolveSubtitle(p, false)).toBeNull();
  });

  it('AI player with no role assigned has no subtitle', () => {
    const p: Player = { id: 'ai', name: 'Bot', isAI: true };
    expect(resolveSubtitle(p, true)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 – Players Online: badge taxonomy completeness
// ─────────────────────────────────────────────────────────────────────────────

type OnlineBadge = 'You' | 'Host' | 'Guest';

interface RoomMember {
  id: string;
  nickname: string;
  is_owner: boolean;
}

function resolveOnlineBadge(m: RoomMember, viewerMemberId: string | undefined): OnlineBadge {
  const isViewer = viewerMemberId ? m.id === viewerMemberId : m.is_owner;
  if (isViewer) return 'You';
  if (m.is_owner) return 'Host';
  return 'Guest';
}

describe('Players Online — badge taxonomy', () => {
  const owner: RoomMember = { id: 'o', nickname: 'Alice', is_owner: true };
  const g1: RoomMember = { id: 'g1', nickname: 'Bob', is_owner: false };
  const g2: RoomMember = { id: 'g2', nickname: 'Carol', is_owner: false };
  const all = [owner, g1, g2];

  describe('owner view (viewerMemberId=undefined)', () => {
    const badges = all.map((m) => resolveOnlineBadge(m, undefined));

    it('contains You', () => expect(badges).toContain('You'));
    it('does not contain Host (owner sees themselves as You)', () => expect(badges).not.toContain('Host'));
    it('contains Guest', () => expect(badges).toContain('Guest'));
    it('exactly 1 You', () => expect(badges.filter((b) => b === 'You')).toHaveLength(1));
    it('exactly 2 Guest', () => expect(badges.filter((b) => b === 'Guest')).toHaveLength(2));
  });

  describe('guest-1 view (viewerMemberId=g1)', () => {
    const badges = all.map((m) => resolveOnlineBadge(m, 'g1'));

    it('contains You', () => expect(badges).toContain('You'));
    it('contains Host', () => expect(badges).toContain('Host'));
    it('contains Guest', () => expect(badges).toContain('Guest'));
    it('exactly 1 You', () => expect(badges.filter((b) => b === 'You')).toHaveLength(1));
    it('exactly 1 Host', () => expect(badges.filter((b) => b === 'Host')).toHaveLength(1));
    it('exactly 1 Guest (only other guests)', () => expect(badges.filter((b) => b === 'Guest')).toHaveLength(1));
  });

  describe('guest-2 view (viewerMemberId=g2)', () => {
    const badges = all.map((m) => resolveOnlineBadge(m, 'g2'));

    it('g2 row is You', () => expect(resolveOnlineBadge(g2, 'g2')).toBe('You'));
    it('owner row is Host', () => expect(resolveOnlineBadge(owner, 'g2')).toBe('Host'));
    it('g1 row is Guest', () => expect(resolveOnlineBadge(g1, 'g2')).toBe('Guest'));
    it('exactly 1 You', () => expect(badges.filter((b) => b === 'You')).toHaveLength(1));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 – Cross-panel: GM badge is distinct from Players Online badges
// ─────────────────────────────────────────────────────────────────────────────

describe('cross-panel badge non-overlap', () => {
  it('GM badge value ("GM") is not in the Players Online badge set', () => {
    const playerPanelBadge = 'GM';
    const onlineBadges: OnlineBadge[] = ['You', 'Host', 'Guest'];
    expect(onlineBadges).not.toContain(playerPanelBadge);
  });

  it('YOU badge value ("YOU") is not in the Players Online badge set', () => {
    const playerCardBadge = 'YOU'; // uppercase in player-panel
    const onlineBadges: OnlineBadge[] = ['You', 'Host', 'Guest'];
    // They look similar but are different strings (case-sensitive)
    expect(onlineBadges).not.toContain(playerCardBadge);
  });

  it('all four labels are distinct strings', () => {
    const labels = ['GM', 'YOU', 'You', 'Host', 'Guest'];
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 – mute/controls visibility (owner only, not for GM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the mute button visibility rule in PlayerCard:
 *   shown when isUserGameMaster && !player.isGameMaster
 */
function showMuteControls(isOwnerView: boolean, player: Player): boolean {
  return isOwnerView && !player.isGameMaster;
}

describe('mute controls visibility', () => {
  const gm: Player = { id: 'gm', name: 'Oracle', isGameMaster: true, isAI: true };
  const aiPlayer: Player = { id: 'ai', name: 'Mara', isAI: true };
  const human: Player = { id: 'h', name: 'Alex', isAI: false };

  it('owner sees mute button on AI players', () => {
    expect(showMuteControls(true, aiPlayer)).toBe(true);
  });

  it('owner sees mute button on human players', () => {
    expect(showMuteControls(true, human)).toBe(true);
  });

  it('owner does NOT see mute button on GM (isGameMaster=true)', () => {
    expect(showMuteControls(true, gm)).toBe(false);
  });

  it('guests never see mute controls', () => {
    expect(showMuteControls(false, aiPlayer)).toBe(false);
    expect(showMuteControls(false, human)).toBe(false);
    expect(showMuteControls(false, gm)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 – Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('a guest with no memberId yet sees no You in Players Online', () => {
    const members: RoomMember[] = [
      { id: 'o', nickname: 'Alice', is_owner: true },
      { id: 'g1', nickname: 'Bob', is_owner: false },
    ];
    // viewerMemberId=undefined AND viewer is not owner → viewerMemberId falls back to is_owner
    // but if the guest has not yet received their memberId, they pass undefined
    // In that case: owner row = You (fallback), guest row = Guest — viewer cannot identify self
    const badges = members.map((m) => resolveOnlineBadge(m, undefined));
    expect(badges).toEqual(['You', 'Guest']);
  });

  it('two GMs in player list both appear in GM section', () => {
    const players: Player[] = [
      { id: 'gm-1', name: 'Oracle', isGameMaster: true, isAI: true },
      { id: 'gm-2', name: 'Shadow', isGameMaster: true, isAI: true },
      { id: 'ai-1', name: 'Mara', isAI: true },
    ];
    expect(getGMPlayers(players)).toHaveLength(2);
    expect(getRegularPlayers(players)).toHaveLength(1);
  });

  it('GM character isAI=true so never gets YOU badge', () => {
    const gm: Player = { id: 'gm', name: 'Oracle', isGameMaster: true, isAI: true };
    expect(resolvePlayerCardBadge(gm)).toBeNull();
  });

  it('Players Online with only one member (solo owner) still shows the section', () => {
    const solo: RoomMember[] = [{ id: 'o', nickname: 'Alice', is_owner: true }];
    expect(solo.length > 0).toBe(true);
    expect(resolveOnlineBadge(solo[0], undefined)).toBe('You');
  });

  it('subtitle for GM is always "Game Master" regardless of isOwnerView', () => {
    const gm: Player = { id: 'gm', name: 'Oracle', isGameMaster: true, isAI: true, role: 'Narrator' };
    expect(resolveSubtitle(gm, true)).toBe('Game Master');
    expect(resolveSubtitle(gm, false)).toBe('Game Master');
  });
});
