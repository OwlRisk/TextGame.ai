import { describe, it, expect } from 'vitest';
import {
  OutStatus,
  resolveYouBadge,
  isPlayerEliminated,
  OUT_STATUS_VALUES,
} from '../player-badges';

// ─── Badge system tests ──────────────────────────────────────────────────────
// Covers the badge taxonomy for the player panel (right side):
//   GM   – amber Crown badge on the AI game master section header
//   YOU  – blue badge on the human (non-AI) player card (resolveYouBadge)

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
// Section 4 – OutStatus enum: all values present and correct
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
// Section 5 – Mute controls visibility
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

// ─── Player-panel right-side badge rules (PlayerCard) ─────────────────────────
// Covers:
//   GM    badge: amber — only on isGameMaster players
//   GM    badge: renamed from HOST (legacy label must not appear)
//   YOU   badge: blue   — shown on non-AI human player ONLY when currentUserId matches
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

  function resolveGmBadge(p: Player): string | null {
    return p.isGameMaster ? 'GM' : null;
  }
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

  it('YOU badge shown on human player when currentUserId matches', () => {
    expect(resolveYouBadge(humanPlayer, 'human-1')).toBe(true);
  });

  it('YOU badge NOT shown when currentUserId is empty string', () => {
    expect(resolveYouBadge(humanPlayer, '')).toBe(false);
  });

  it('YOU badge NOT shown when currentUserId is undefined', () => {
    expect(resolveYouBadge(humanPlayer, undefined)).toBe(false);
  });

  it('YOU badge NOT shown on GM player (isAI=true)', () => {
    expect(resolveYouBadge(gameMaster, 'gm-1')).toBe(false);
  });

  it('owner sees YOU on own character', () => {
    const you = resolveYouBadge(humanPlayer, 'human-1');
    expect(you).toBe(true);
  });
});
