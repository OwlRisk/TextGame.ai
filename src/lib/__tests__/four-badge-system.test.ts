import { describe, it, expect } from 'vitest';
import {
  OnlineBadge,
  OutStatus,
  resolveOnlineBadge,
  resolveYouBadge,
  isPlayerEliminated,
  OUT_STATUS_VALUES,
  type RoomMember,
} from '../player-badges';

// ─── Four-badge system tests ──────────────────────────────────────────────────
// Covers the complete badge taxonomy across both panels:
//
//   Player panel (right side – player-panel-with-board.tsx)
//     GM   – amber Crown badge on the AI game master section header
//     YOU  – blue badge on the human (non-AI) player card (resolveYouBadge)
//
//   Players Online (left sidebar – channel-list.tsx)
//     Host  – violet badge on the human room owner   (OnlineBadge.Host)
//     Guest – emerald badge on invited human guests  (OnlineBadge.Guest)
//     You   – grey badge on the current viewer's row (OnlineBadge.You)

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers (mirroring pure logic in production components)
// ─────────────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  isGameMaster?: boolean;
  isAI: boolean;
  role?: string;
  roleRevealed?: boolean;
  stats?: Record<string, string | number>;
  status?: string;
}

function getGMPlayers(players: Player[]): Player[] {
  return players.filter((p) => p.isGameMaster);
}
function getRegularPlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.isGameMaster);
}

function resolveSubtitle(player: Player, isOwnerView: boolean): string | null {
  if (player.isGameMaster) return 'Game Master';
  if (player.role && player.isAI && (isOwnerView || player.roleRevealed)) return player.role;
  return null;
}

function showMuteControls(isOwnerView: boolean, player: Player): boolean {
  return isOwnerView && !player.isGameMaster;
}

function deriveViewerMemberId(
  isGuestPlayer: boolean,
  guestMemberId: string | null | undefined
): string | undefined {
  return isGuestPlayer ? (guestMemberId ?? undefined) : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 – Player panel: section routing (isGameMaster split)
// ─────────────────────────────────────────────────────────────────────────────

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
    for (const id of gmIds) expect(regularIds.has(id)).toBe(false);
  });

  it('all players appear in exactly one section', () => {
    const all = [gm, aiPlayer, humanPlayer];
    expect(getGMPlayers(all).length + getRegularPlayers(all).length).toBe(all.length);
  });

  it('empty player list produces empty sections', () => {
    expect(getGMPlayers([])).toHaveLength(0);
    expect(getRegularPlayers([])).toHaveLength(0);
  });

  it('game without a GM has empty GM section', () => {
    const noGm = [aiPlayer, humanPlayer];
    expect(getGMPlayers(noGm)).toHaveLength(0);
    expect(getRegularPlayers(noGm)).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 – YOU badge (resolveYouBadge from player-badges.ts)
// ─────────────────────────────────────────────────────────────────────────────

describe('player panel — YOU badge (resolveYouBadge)', () => {
  const ownerUserId = 'user-owner';

  it('human player matching currentUserId gets YOU', () => {
    const p: Player = { id: ownerUserId, name: 'Alex', isAI: false };
    expect(resolveYouBadge(p, ownerUserId)).toBe(true);
  });

  it('AI player does NOT get YOU', () => {
    const p: Player = { id: 'ai-1', name: 'Mara', isAI: true };
    expect(resolveYouBadge(p, ownerUserId)).toBe(false);
  });

  it('GM (isAI=true) does NOT get YOU', () => {
    const gm: Player = { id: 'gm-1', name: 'Oracle', isGameMaster: true, isAI: true };
    expect(resolveYouBadge(gm, ownerUserId)).toBe(false);
  });

  it('guest (currentUserId="" empty string) never gets YOU', () => {
    const human: Player = { id: '', name: 'Slot', isAI: false };
    expect(resolveYouBadge(human, '')).toBe(false);
    expect(resolveYouBadge(human, undefined)).toBe(false);
  });

  it('exactly 1 YOU in a standard 10-player game', () => {
    const players: Player[] = [
      { id: 'gm', name: 'GM', isGameMaster: true, isAI: true },
      { id: ownerUserId, name: 'Alex', isAI: false },
      ...Array.from({ length: 8 }, (_, i) => ({ id: `ai-${i}`, name: `AI ${i}`, isAI: true })),
    ];
    expect(players.filter((p) => resolveYouBadge(p, ownerUserId))).toHaveLength(1);
  });

  it('0 YOU badges for guests (empty userId)', () => {
    const players: Player[] = [
      { id: 'gm', name: 'GM', isGameMaster: true, isAI: true },
      { id: '', name: 'Human Slot', isAI: false },
      { id: 'ai-1', name: 'Bot', isAI: true },
    ];
    expect(players.filter((p) => resolveYouBadge(p, ''))).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 – Player panel: subtitle text rules
// ─────────────────────────────────────────────────────────────────────────────

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

  it('AI player with unrevealed role is hidden from guests', () => {
    const p: Player = { id: 'ai', name: 'Mara', isAI: true, role: 'Mafia' };
    expect(resolveSubtitle(p, false)).toBeNull();
  });

  it('human player has no subtitle', () => {
    const p: Player = { id: 'human', name: 'Alex', isAI: false, role: 'Villager' };
    expect(resolveSubtitle(p, true)).toBeNull();
    expect(resolveSubtitle(p, false)).toBeNull();
  });

  it('AI player with no role has no subtitle', () => {
    const p: Player = { id: 'ai', name: 'Bot', isAI: true };
    expect(resolveSubtitle(p, true)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 – Players Online: badge taxonomy (uses shared enum + helper)
// ─────────────────────────────────────────────────────────────────────────────

describe('Players Online — badge taxonomy', () => {
  const owner: RoomMember = { id: 'o', nickname: 'Alice', is_owner: true, player_id: null };
  const g1: RoomMember = { id: 'g1', nickname: 'Bob', is_owner: false, player_id: null };
  const g2: RoomMember = { id: 'g2', nickname: 'Carol', is_owner: false, player_id: null };
  const all = [owner, g1, g2];

  describe('owner view (viewerMemberId=undefined)', () => {
    const badges = all.map((m) => resolveOnlineBadge(m, undefined));

    it('contains You',   () => expect(badges).toContain(OnlineBadge.You));
    it('no Host (owner sees themselves as You)', () => expect(badges).not.toContain(OnlineBadge.Host));
    it('contains Guest', () => expect(badges).toContain(OnlineBadge.Guest));
    it('exactly 1 You',  () => expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1));
    it('exactly 2 Guest',() => expect(badges.filter((b) => b === OnlineBadge.Guest)).toHaveLength(2));
  });

  describe('guest-1 view (viewerMemberId=g1)', () => {
    const badges = all.map((m) => resolveOnlineBadge(m, 'g1'));

    it('contains You',   () => expect(badges).toContain(OnlineBadge.You));
    it('contains Host',  () => expect(badges).toContain(OnlineBadge.Host));
    it('contains Guest', () => expect(badges).toContain(OnlineBadge.Guest));
    it('exactly 1 You',  () => expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1));
    it('exactly 1 Host', () => expect(badges.filter((b) => b === OnlineBadge.Host)).toHaveLength(1));
    it('exactly 1 Guest',() => expect(badges.filter((b) => b === OnlineBadge.Guest)).toHaveLength(1));
  });

  describe('guest-2 view (viewerMemberId=g2)', () => {
    it('g2 row is You',   () => expect(resolveOnlineBadge(g2, 'g2')).toBe(OnlineBadge.You));
    it('owner row is Host',() => expect(resolveOnlineBadge(owner, 'g2')).toBe(OnlineBadge.Host));
    it('g1 row is Guest', () => expect(resolveOnlineBadge(g1, 'g2')).toBe(OnlineBadge.Guest));
    it('exactly 1 You in full list', () => {
      const badges = all.map((m) => resolveOnlineBadge(m, 'g2'));
      expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 – OutStatus enum: all values present and correct
// ─────────────────────────────────────────────────────────────────────────────

describe('OutStatus enum', () => {
  it('contains all expected status strings', () => {
    expect(OUT_STATUS_VALUES).toContain(OutStatus.Eliminated);
    expect(OUT_STATUS_VALUES).toContain(OutStatus.Dead);
    expect(OUT_STATUS_VALUES).toContain(OutStatus.VotedOut);
    expect(OUT_STATUS_VALUES).toContain(OutStatus.Spectating);
  });

  it('isPlayerEliminated uses enum values (case-insensitive)', () => {
    for (const status of OUT_STATUS_VALUES) {
      const player = { stats: { Status: status.toUpperCase() } };
      expect(isPlayerEliminated(player)).toBe(true);
    }
  });

  it('alive player is not eliminated', () => {
    expect(isPlayerEliminated({ stats: { Status: 'Alive' } })).toBe(false);
  });

  it('no status → not eliminated', () => {
    expect(isPlayerEliminated({})).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 – Cross-panel: all badge values are distinct strings
// ─────────────────────────────────────────────────────────────────────────────

describe('cross-panel badge uniqueness', () => {
  it('all five badge labels are distinct', () => {
    const labels = ['GM', 'YOU', OnlineBadge.You, OnlineBadge.Host, OnlineBadge.Guest];
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('GM is not in the OnlineBadge enum', () => {
    expect(Object.values(OnlineBadge)).not.toContain('GM');
  });

  it('YOU (upper) differs from You (title-case)', () => {
    expect('YOU').not.toBe(OnlineBadge.You);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 – Mute controls visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('mute controls visibility', () => {
  const gm: Player = { id: 'gm', name: 'Oracle', isGameMaster: true, isAI: true };
  const ai: Player = { id: 'ai', name: 'Mara', isAI: true };
  const human: Player = { id: 'h', name: 'Alex', isAI: false };

  it('owner sees mute on AI players', () => expect(showMuteControls(true, ai)).toBe(true));
  it('owner sees mute on human players', () => expect(showMuteControls(true, human)).toBe(true));
  it('owner does NOT see mute on GM', () => expect(showMuteControls(true, gm)).toBe(false));
  it('guests never see mute controls', () => {
    expect(showMuteControls(false, ai)).toBe(false);
    expect(showMuteControls(false, human)).toBe(false);
    expect(showMuteControls(false, gm)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 – Full room matrix (owner / guest-1 / guest-2) via shared helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('full room matrix', () => {
  const owner: RoomMember = { id: 'owner-1', nickname: 'Host', is_owner: true, player_id: null };
  const g1: RoomMember = { id: 'guest-1', nickname: 'G1', is_owner: false, player_id: null };
  const g2: RoomMember = { id: 'guest-2', nickname: 'G2', is_owner: false, player_id: null };

  it('owner view: [You, Guest, Guest]', () => {
    const vId = deriveViewerMemberId(false, null);
    expect([owner, g1, g2].map((m) => resolveOnlineBadge(m, vId)))
      .toEqual([OnlineBadge.You, OnlineBadge.Guest, OnlineBadge.Guest]);
  });

  it('guest-1 view: [Host, You, Guest]', () => {
    const vId = deriveViewerMemberId(true, 'guest-1');
    expect([owner, g1, g2].map((m) => resolveOnlineBadge(m, vId)))
      .toEqual([OnlineBadge.Host, OnlineBadge.You, OnlineBadge.Guest]);
  });

  it('guest-2 view: [Host, Guest, You]', () => {
    const vId = deriveViewerMemberId(true, 'guest-2');
    expect([owner, g1, g2].map((m) => resolveOnlineBadge(m, vId)))
      .toEqual([OnlineBadge.Host, OnlineBadge.Guest, OnlineBadge.You]);
  });

  it('every view has exactly one You', () => {
    const views = [
      deriveViewerMemberId(false, null),
      deriveViewerMemberId(true, 'guest-1'),
      deriveViewerMemberId(true, 'guest-2'),
    ];
    for (const vId of views) {
      const badges = [owner, g1, g2].map((m) => resolveOnlineBadge(m, vId));
      expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1);
    }
  });
});

// ─── Player-panel right-side badge rules (PlayerCard + GuestCard) ─────────────
// Covers:
//   GM    badge: amber — only on isGameMaster players
//   GM    badge: renamed from HOST (legacy label must not appear)
//   Host  badge: violet — shown on non-AI human player ONLY when viewerIsGuest=true
//   YOU   badge: blue   — shown on non-AI human player ONLY when currentUserId matches
//   GuestCard: emerald initial avatar + "Guest" badge
// ─────────────────────────────────────────────────────────────────────────────
describe('PlayerCard badge rules', () => {
  interface Player {
    id: string;
    name: string;
    isAI: boolean;
    isGameMaster?: boolean;
    status?: string;
  }

  const gameMaster: Player = { id: 'gm-1', name: 'Reichstag Moderator', isAI: true, isGameMaster: true };
  const aiPlayer: Player    = { id: 'ai-1', name: 'Klara Vogt',          isAI: true };
  const humanPlayer: Player = { id: 'human-1', name: 'Otto Weiss',       isAI: false };

  // resolveGmBadge mirrors production: show GM iff isGameMaster
  function resolveGmBadge(p: Player): string | null {
    return p.isGameMaster ? 'GM' : null;
  }

  // resolveHostBadgeForGuest mirrors production: show Host when viewerIsGuest AND !isAI AND !isGameMaster
  function resolveHostBadgeForGuest(p: Player, viewerIsGuest: boolean): string | null {
    return !p.isAI && !p.isGameMaster && viewerIsGuest ? 'Host' : null;
  }

  // resolveYouBadge imported above handles YOU badge
  it('GM badge appears on isGameMaster player', () => {
    expect(resolveGmBadge(gameMaster)).toBe('GM');
  });

  it('GM badge does NOT appear on regular AI player', () => {
    expect(resolveGmBadge(aiPlayer)).toBeNull();
  });

  it('GM badge does NOT appear on human player', () => {
    expect(resolveGmBadge(humanPlayer)).toBeNull();
  });

  it('GM badge is "GM", not the legacy "HOST" label', () => {
    expect(resolveGmBadge(gameMaster)).not.toBe('HOST');
    expect(resolveGmBadge(gameMaster)).toBe('GM');
  });

  it('Host badge shown on human player when viewer is guest', () => {
    expect(resolveHostBadgeForGuest(humanPlayer, true)).toBe('Host');
  });

  it('Host badge NOT shown on human player when viewer is the owner', () => {
    expect(resolveHostBadgeForGuest(humanPlayer, false)).toBeNull();
  });

  it('Host badge NOT shown on AI player even if viewer is guest', () => {
    expect(resolveHostBadgeForGuest(aiPlayer, true)).toBeNull();
  });

  it('Host badge NOT shown on GM even if viewer is guest', () => {
    expect(resolveHostBadgeForGuest(gameMaster, true)).toBeNull();
  });

  it('YOU badge shown on human player when currentUserId matches', () => {
    expect(resolveYouBadge(humanPlayer, 'human-1')).toBe(true);
  });

  it('YOU badge NOT shown when currentUserId is empty string (guest fallback)', () => {
    expect(resolveYouBadge(humanPlayer, '')).toBe(false);
  });

  it('YOU badge NOT shown when currentUserId is undefined', () => {
    expect(resolveYouBadge(humanPlayer, undefined)).toBe(false);
  });

  it('YOU badge NOT shown on GM player (isAI=true)', () => {
    expect(resolveYouBadge(gameMaster, 'gm-1')).toBe(false);
  });

  it('guest-viewer sees Host on human player and no YOU (userId undefined)', () => {
    const host = resolveHostBadgeForGuest(humanPlayer, true);
    const you  = resolveYouBadge(humanPlayer, undefined);
    expect(host).toBe('Host');
    expect(you).toBe(false);
  });

  it('owner-viewer sees YOU on own character and no Host badge', () => {
    const host = resolveHostBadgeForGuest(humanPlayer, false);
    const you  = resolveYouBadge(humanPlayer, 'human-1');
    expect(host).toBeNull();
    expect(you).toBe(true);
  });
});

// ─── GuestCard rendering helpers ─────────────────────────────────────────────
describe('GuestCard entry logic', () => {
  interface GuestEntry { id: string; nickname: string }

  function getInitial(g: GuestEntry): string {
    return g.nickname?.charAt(0)?.toUpperCase() || '?';
  }

  function guestBadgeLabel(): string {
    return OnlineBadge.Guest;
  }

  it('initial is uppercased first character of nickname', () => {
    expect(getInitial({ id: 'g-1', nickname: 'nikki' })).toBe('N');
    expect(getInitial({ id: 'g-2', nickname: 'Bob' })).toBe('B');
  });

  it('initial falls back to "?" for empty nickname', () => {
    expect(getInitial({ id: 'g-3', nickname: '' })).toBe('?');
  });

  it('guest card badge label equals OnlineBadge.Guest', () => {
    expect(guestBadgeLabel()).toBe('Guest');
  });

  it('guestMembers filtering: excludes owner, includes guests', () => {
    const members = [
      { id: 'm-1', nickname: 'Otto', is_owner: true },
      { id: 'm-2', nickname: 'Nikki', is_owner: false },
      { id: 'm-3', nickname: 'Alice', is_owner: false },
    ];
    const guestEntries = members.filter((m) => !m.is_owner);
    expect(guestEntries).toHaveLength(2);
    expect(guestEntries.map((g) => g.nickname)).toEqual(['Nikki', 'Alice']);
  });

  it('guestMembers is empty when only the owner is in the room', () => {
    const members = [{ id: 'm-1', nickname: 'Otto', is_owner: true }];
    expect(members.filter((m) => !m.is_owner)).toHaveLength(0);
  });

  it('player count includes guest entries', () => {
    const gamePlayers = [
      { id: 'p1' }, { id: 'p2' }, { id: 'p3' },
    ];
    const guests = [{ id: 'g1', nickname: 'Nikki' }];
    expect(gamePlayers.length + guests.length).toBe(4);
  });
});
