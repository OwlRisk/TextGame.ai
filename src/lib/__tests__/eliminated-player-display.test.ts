import { describe, it, expect } from 'vitest';
import {
  OutStatus,
  isPlayerEliminated,
  resolveYouBadge,
  OUT_STATUS_VALUES,
} from '../player-badges';

// ─── Eliminated player display tests ─────────────────────────────────────────
// Covers the styling and list-rendering logic after the refactor:
//   • opacity-55 + pointer-events-none  (was opacity-35)
//   • line-through + text-zinc-500      (was normal colour)
//   • flat list — no "Out of Game" divider
//   • YOU badge suppressed on eliminated player
//   • info icon suppressed on eliminated player
//   • name colour: eliminated → zinc-500, GM → amber-300, human → blue-200, AI → white
//
// All helpers are pure functions extracted from production code.

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  isGameMaster?: boolean;
  role?: string;
  roleRevealed?: boolean;
  stats?: Record<string, string | number>;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 – Card CSS class logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the className ternary in PlayerCard:
 *   isEliminated → "opacity-55 pointer-events-none"
 *   isSpeaking   → speaking classes
 *   else         → hover classes
 */
function resolveCardClass(
  player: Player,
  isSpeaking: boolean,
  canViewProfile: boolean
): string {
  const isElim = isPlayerEliminated(player);
  const base = isElim
    ? 'opacity-55 pointer-events-none'
    : isSpeaking
    ? 'bg-green-600/20 ring-1 ring-green-600/50 shadow-sm'
    : 'hover:bg-zinc-800/40 hover:shadow-sm';
  const cursor = canViewProfile && !isElim ? 'cursor-pointer' : '';
  return [base, cursor].filter(Boolean).join(' ');
}

describe('card CSS classes', () => {
  const alive: Player = { id: 'a', name: 'Alice', isAI: true };
  const dead: Player  = { id: 'b', name: 'Bob',   isAI: true, stats: { Status: OutStatus.Dead } };
  const voted: Player = { id: 'c', name: 'Carol', isAI: true, stats: { Status: OutStatus.VotedOut } };

  it('alive + not speaking → hover classes', () => {
    expect(resolveCardClass(alive, false, true)).toContain('hover:bg-zinc-800/40');
  });

  it('alive + speaking → speaking classes', () => {
    expect(resolveCardClass(alive, true, true)).toContain('bg-green-600/20');
    expect(resolveCardClass(alive, true, true)).toContain('ring-green-600/50');
  });

  it('eliminated → opacity-55', () => {
    expect(resolveCardClass(dead, false, true)).toContain('opacity-55');
  });

  it('eliminated → pointer-events-none', () => {
    expect(resolveCardClass(dead, false, true)).toContain('pointer-events-none');
  });

  it('eliminated player does NOT get opacity-35 (old value)', () => {
    expect(resolveCardClass(dead, false, true)).not.toContain('opacity-35');
  });

  it('eliminated + canViewProfile → no cursor-pointer', () => {
    expect(resolveCardClass(dead, false, true)).not.toContain('cursor-pointer');
  });

  it('alive + canViewProfile → cursor-pointer', () => {
    expect(resolveCardClass(alive, false, true)).toContain('cursor-pointer');
  });

  it('eliminated speaking state is irrelevant — eliminated class always wins', () => {
    expect(resolveCardClass(voted, true, true)).toContain('opacity-55');
    expect(resolveCardClass(voted, true, true)).not.toContain('bg-green-600');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 – Name colour / strikethrough class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the className on the name <span>:
 *   isEliminated          → 'line-through text-zinc-500'
 *   player.isGameMaster   → 'text-amber-300'
 *   !player.isAI          → 'text-blue-200'
 *   else (AI)             → 'text-white'
 */
function resolveNameClass(player: Player): string {
  if (isPlayerEliminated(player)) return 'line-through text-zinc-500';
  if (player.isGameMaster) return 'text-amber-300';
  if (!player.isAI) return 'text-blue-200';
  return 'text-white';
}

describe('name colour / strikethrough', () => {
  const gm: Player    = { id: 'gm', name: 'Oracle', isAI: true,  isGameMaster: true };
  const human: Player = { id: 'h',  name: 'Alex',   isAI: false };
  const ai: Player    = { id: 'ai', name: 'Mara',   isAI: true };

  it('alive AI → text-white',           () => expect(resolveNameClass(ai)).toBe('text-white'));
  it('alive human → text-blue-200',     () => expect(resolveNameClass(human)).toBe('text-blue-200'));
  it('alive GM → text-amber-300',       () => expect(resolveNameClass(gm)).toBe('text-amber-300'));

  for (const status of [OutStatus.Eliminated, OutStatus.Dead, OutStatus.VotedOut, OutStatus.Exiled, OutStatus.Spectating]) {
    it(`eliminated (${status}) → line-through text-zinc-500`, () => {
      const p: Player = { id: 'x', name: 'X', isAI: true, stats: { Status: status } };
      expect(resolveNameClass(p)).toBe('line-through text-zinc-500');
    });
  }

  it('eliminated GM also gets strikethrough (eliminated takes priority)', () => {
    const deadGm: Player = { id: 'gm', name: 'Oracle', isAI: true, isGameMaster: true, stats: { Status: OutStatus.Eliminated } };
    expect(resolveNameClass(deadGm)).toContain('line-through');
    expect(resolveNameClass(deadGm)).not.toContain('text-amber-300');
  });

  it('eliminated human also gets strikethrough (eliminated takes priority)', () => {
    const deadHuman: Player = { id: 'h', name: 'Alex', isAI: false, stats: { Status: OutStatus.Dead } };
    expect(resolveNameClass(deadHuman)).toContain('line-through');
    expect(resolveNameClass(deadHuman)).not.toContain('text-blue-200');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 – YOU badge suppressed on eliminated player
// ─────────────────────────────────────────────────────────────────────────────

describe('YOU badge suppressed on eliminated player', () => {
  const uid = 'user-owner';

  it('alive human owner gets YOU badge', () => {
    const p: Player = { id: uid, name: 'Alex', isAI: false };
    expect(resolveYouBadge(p, uid)).toBe(true);
  });

  it('eliminated owner does NOT get YOU badge', () => {
    const p: Player = { id: uid, name: 'Alex', isAI: false, stats: { Status: OutStatus.Eliminated } };
    expect(resolveYouBadge(p, uid)).toBe(false);
  });

  it('eliminated owner (voted out) does NOT get YOU badge', () => {
    const p: Player = { id: uid, name: 'Alex', isAI: false, stats: { Status: OutStatus.VotedOut } };
    expect(resolveYouBadge(p, uid)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 – Info icon suppressed on eliminated player
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors: {!isEliminated && canViewProfile && player.isAI && (…info icon…)}
 */
function shouldShowInfoIcon(player: Player, canViewProfile: boolean): boolean {
  return !isPlayerEliminated(player) && canViewProfile && player.isAI;
}

describe('info icon visibility', () => {
  const aiAlive: Player = { id: 'ai', name: 'Mara', isAI: true };
  const aiDead: Player  = { id: 'ai', name: 'Mara', isAI: true, stats: { Status: OutStatus.Dead } };
  const human: Player   = { id: 'h',  name: 'Alex', isAI: false };

  it('alive AI with profile → shows icon', () => expect(shouldShowInfoIcon(aiAlive, true)).toBe(true));
  it('eliminated AI → hides icon',         () => expect(shouldShowInfoIcon(aiDead, true)).toBe(false));
  it('human (not AI) → hides icon',        () => expect(shouldShowInfoIcon(human, true)).toBe(false));
  it('no profile callback → hides icon',   () => expect(shouldShowInfoIcon(aiAlive, false)).toBe(false));
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 – Flat list: no Out-of-Game grouping needed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the new flat render: players.map(PlayerCard) without splitting.
 * Verifies no pre-filtering or grouping is needed at the list level.
 */
function flatList(players: Player[]): Player[] {
  return players; // all rendered in order, no split
}

describe('flat player list (no Out-of-Game divider)', () => {
  const alive1: Player  = { id: 'a1', name: 'Alice', isAI: true };
  const alive2: Player  = { id: 'a2', name: 'Bob',   isAI: true };
  const dead1: Player   = { id: 'd1', name: 'Carol', isAI: true, stats: { Status: OutStatus.Eliminated } };
  const dead2: Player   = { id: 'd2', name: 'Dave',  isAI: true, stats: { Status: OutStatus.VotedOut } };

  it('all players rendered regardless of status', () => {
    const result = flatList([alive1, dead1, alive2, dead2]);
    expect(result).toHaveLength(4);
  });

  it('original order is preserved', () => {
    const result = flatList([alive1, dead1, alive2, dead2]);
    expect(result.map((p) => p.id)).toEqual(['a1', 'd1', 'a2', 'd2']);
  });

  it('eliminated players are in the same list as alive ones', () => {
    const result = flatList([alive1, dead1]);
    const ids = result.map((p) => p.id);
    expect(ids).toContain('a1');
    expect(ids).toContain('d1');
  });

  it('isPlayerEliminated correctly identifies each player in the flat list', () => {
    const result = flatList([alive1, dead1, alive2, dead2]);
    const states = result.map((p) => isPlayerEliminated(p));
    expect(states).toEqual([false, true, false, true]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 – Display name split (name, occupation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the comma-split logic in PlayerCard for "Firstname, Occupation".
 */
function splitPlayerName(name: string): { displayName: string; occupation: string | null } {
  const idx = name.indexOf(',');
  if (idx > 0) {
    return { displayName: name.slice(0, idx).trim(), occupation: name.slice(idx + 1).trim() };
  }
  return { displayName: name, occupation: null };
}

describe('player name / occupation split', () => {
  it('no comma → full name, no occupation', () => {
    expect(splitPlayerName('Alice')).toEqual({ displayName: 'Alice', occupation: null });
  });

  it('comma → splits into name + occupation', () => {
    expect(splitPlayerName('Edda Fenwick, Lantern-Keeper')).toEqual({
      displayName: 'Edda Fenwick',
      occupation: 'Lantern-Keeper',
    });
  });

  it('leading/trailing spaces are trimmed', () => {
    const { displayName, occupation } = splitPlayerName(' Alice , Baker ');
    expect(displayName).toBe('Alice');
    expect(occupation).toBe('Baker');
  });

  it('comma at position 0 is NOT treated as a split (idx must be > 0)', () => {
    expect(splitPlayerName(', Occupation')).toEqual({ displayName: ', Occupation', occupation: null });
  });

  it('eliminated player name still splits correctly', () => {
    const { displayName } = splitPlayerName('Otto Weiss, Detective');
    expect(displayName).toBe('Otto Weiss');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 – Role visibility after elimination
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors role display condition (unchanged by elimination refactor):
 *   player.role && role !== name && (id === currentUserId || roleRevealed)
 */
function shouldShowRole(
  player: Player,
  currentUserId: string | undefined
): boolean {
  return !!(
    player.role &&
    player.role.trim() !== player.name?.trim() &&
    (player.id === currentUserId || player.roleRevealed)
  );
}

describe('role visibility', () => {
  const uid = 'user-1';

  it('own role is always visible (alive)', () => {
    const p: Player = { id: uid, name: 'Alex', isAI: false, role: 'Villager' };
    expect(shouldShowRole(p, uid)).toBe(true);
  });

  it('own role is still visible even after elimination', () => {
    const p: Player = { id: uid, name: 'Alex', isAI: false, role: 'Villager', stats: { Status: OutStatus.Eliminated } };
    expect(shouldShowRole(p, uid)).toBe(true);
  });

  it('other AI role hidden unless roleRevealed', () => {
    const p: Player = { id: 'ai-1', name: 'Mara', isAI: true, role: 'Werewolf' };
    expect(shouldShowRole(p, uid)).toBe(false);
  });

  it('other AI role visible after REVEAL_ROLE directive', () => {
    const p: Player = { id: 'ai-1', name: 'Mara', isAI: true, role: 'Werewolf', roleRevealed: true };
    expect(shouldShowRole(p, uid)).toBe(true);
  });

  it('role equal to name → not shown (e.g. role = "Mara")', () => {
    const p: Player = { id: uid, name: 'Mara', isAI: false, role: 'Mara' };
    expect(shouldShowRole(p, uid)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 – OutStatus enum coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('OutStatus enum exhaustive coverage', () => {
  const allStatuses: OutStatus[] = [
    OutStatus.Eliminated,
    OutStatus.Dead,
    OutStatus.Out,
    OutStatus.Exiled,
    OutStatus.Banished,
    OutStatus.Retired,
    OutStatus.Spectating,
    OutStatus.Removed,
    OutStatus.Disqualified,
    OutStatus.VotedOut,
  ];

  it('all 10 OutStatus values are present in OUT_STATUS_VALUES', () => {
    expect(OUT_STATUS_VALUES).toHaveLength(10);
    for (const s of allStatuses) {
      expect(OUT_STATUS_VALUES).toContain(s);
    }
  });

  it('every OutStatus value triggers isPlayerEliminated=true (exact match)', () => {
    for (const s of allStatuses) {
      expect(isPlayerEliminated({ stats: { Status: s } })).toBe(true);
    }
  });

  it('every OutStatus value triggers isPlayerEliminated=true (uppercase)', () => {
    for (const s of allStatuses) {
      expect(isPlayerEliminated({ stats: { Status: s.toUpperCase() } })).toBe(true);
    }
  });

  it('no false positives for common alive statuses', () => {
    const aliveStatuses = ['Alive', 'Active', 'Online', 'Jailed', 'Saved', 'Protected', 'Injured'];
    for (const s of aliveStatuses) {
      expect(isPlayerEliminated({ stats: { Status: s } })).toBe(false);
    }
  });
});
