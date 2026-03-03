import { describe, it, expect } from 'vitest';
import { OutStatus, resolveYouBadge, isPlayerEliminated } from '../player-badges';

// ─── YOU badge visibility logic (player-panel-with-board.tsx) ─────────────────
// Tests for the bug where guests saw "YOU" on the owner's character card.
//
// Root cause: the badge condition was `!player.isAI` only — no check against
// currentUserId. For unauthenticated guests, userId = "" (empty string), and
// the human player slot was also created with id: "" (via `id: userId`).
// So `player.id === currentUserId` → `"" === ""` → true, showing YOU even
// to guests.
//
// Fix: `!player.isAI && !!currentUserId && player.id === currentUserId`
//   • `!!currentUserId` gates out empty strings (guest sessions)
//   • `player.id === currentUserId` ensures only the viewer's own slot gets YOU
//
// All helpers are pure functions extracted from production code.

// ─────────────────────────────────────────────────────────────────────────────
// Core predicate — delegates to shared helpers from player-badges.ts
// ─────────────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  isAI: boolean;
  isGameMaster?: boolean;
  stats?: Record<string, string | number>;
  status?: string;
}

// Alias shared helpers for concise test code
const isEliminated = isPlayerEliminated;
const shouldShowYou = resolveYouBadge;

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 – Owner (authenticated) sees YOU on their own slot
// ─────────────────────────────────────────────────────────────────────────────

describe('owner view — YOU badge', () => {
  const ownerUserId = 'user-abc-123';
  const humanPlayer: Player = { id: ownerUserId, isAI: false };
  const aiPlayer: Player = { id: 'ai-1', isAI: true };
  const gmPlayer: Player = { id: 'gm-1', isAI: true, isGameMaster: true };

  it('shows YOU on the human player slot for the owner', () => {
    expect(shouldShowYou(humanPlayer, ownerUserId)).toBe(true);
  });

  it('does NOT show YOU on AI players', () => {
    expect(shouldShowYou(aiPlayer, ownerUserId)).toBe(false);
  });

  it('does NOT show YOU on the GM character', () => {
    expect(shouldShowYou(gmPlayer, ownerUserId)).toBe(false);
  });

  it('does NOT show YOU on a different human slot (different id)', () => {
    const otherHuman: Player = { id: 'other-user-id', isAI: false };
    expect(shouldShowYou(otherHuman, ownerUserId)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 – Guest (unauthenticated) sees NO YOU badge anywhere
// ─────────────────────────────────────────────────────────────────────────────

describe('guest view — YOU badge suppressed', () => {
  // For guests: userId = user?.id ?? "" → ""
  const guestUserId = '';
  const humanPlayerEmptyId: Player = { id: '', isAI: false }; // owner's slot with id:userId=""
  const aiPlayer: Player = { id: 'ai-1', isAI: true };

  it('does NOT show YOU for owner slot when currentUserId is empty string', () => {
    expect(shouldShowYou(humanPlayerEmptyId, guestUserId)).toBe(false);
  });

  it('does NOT show YOU for owner slot when currentUserId is undefined', () => {
    expect(shouldShowYou(humanPlayerEmptyId, undefined)).toBe(false);
  });

  it('does NOT show YOU for AI players regardless of currentUserId', () => {
    expect(shouldShowYou(aiPlayer, guestUserId)).toBe(false);
    expect(shouldShowYou(aiPlayer, undefined)).toBe(false);
  });

  it('empty string is falsy — !!currentUserId gates the badge', () => {
    // This is the core fix: !!'' === false
    expect(!!'').toBe(false);
    expect(!!undefined).toBe(false);
    expect(!!'user-real-id').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 – Before-fix vs after-fix comparison (demonstrates the bug)
// ─────────────────────────────────────────────────────────────────────────────

/** Pre-fix condition: !player.isAI only */
function shouldShowYouBuggy(player: Player): boolean {
  return !player.isAI && !isEliminated(player);
}

describe('before/after fix comparison', () => {
  const humanPlayerEmptyId: Player = { id: '', isAI: false };

  it('[BUG] pre-fix shows YOU to guest (no userId check)', () => {
    // This demonstrates the original bug
    expect(shouldShowYouBuggy(humanPlayerEmptyId)).toBe(true);
  });

  it('[FIX] post-fix does NOT show YOU to guest (empty userId)', () => {
    expect(shouldShowYou(humanPlayerEmptyId, '')).toBe(false);
    expect(shouldShowYou(humanPlayerEmptyId, undefined)).toBe(false);
  });

  it('[FIX] post-fix still shows YOU to the owner', () => {
    const ownerPlayer: Player = { id: 'owner-uuid', isAI: false };
    expect(shouldShowYou(ownerPlayer, 'owner-uuid')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 – Eliminated player never gets YOU badge
// ─────────────────────────────────────────────────────────────────────────────

describe('eliminated player — YOU always hidden', () => {
  const ownerUserId = 'user-owner';

  const cases: Array<{ label: string; status: string }> = [
    { label: 'eliminated', status: OutStatus.Eliminated },
    { label: 'dead',       status: OutStatus.Dead },
    { label: 'out',        status: OutStatus.Out },
    { label: 'voted out',  status: OutStatus.VotedOut },
    { label: 'exiled',     status: OutStatus.Exiled },
  ];

  for (const { label, status } of cases) {
    it(`no YOU badge when Status="${status}" (${label})`, () => {
      const p: Player = { id: ownerUserId, isAI: false, stats: { Status: status } };
      expect(shouldShowYou(p, ownerUserId)).toBe(false);
    });
  }

  it('alive player gets YOU when currentUserId matches', () => {
    const p: Player = { id: ownerUserId, isAI: false, stats: { Status: 'Alive' } };
    expect(shouldShowYou(p, ownerUserId)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 – isEliminated helper
// ─────────────────────────────────────────────────────────────────────────────

describe('isEliminated helper', () => {
  it('returns false for alive player', () => {
    expect(isEliminated({ id: '1', isAI: false, stats: { Status: 'Alive' } })).toBe(false);
  });

  it('returns false for no status', () => {
    expect(isEliminated({ id: '1', isAI: false })).toBe(false);
  });

  it('returns true for "Eliminated" (case-insensitive)', () => {
    expect(isEliminated({ id: '1', isAI: false, stats: { Status: 'ELIMINATED' } })).toBe(true);
    expect(isEliminated({ id: '1', isAI: false, stats: { Status: 'eliminated' } })).toBe(true);
  });

  it('returns true for "Voted Out"', () => {
    expect(isEliminated({ id: '1', isAI: false, stats: { Status: 'Voted Out' } })).toBe(true);
  });

  it('uses player.status as fallback when stats.Status is absent', () => {
    expect(isEliminated({ id: '1', isAI: false, status: 'dead' })).toBe(true);
    expect(isEliminated({ id: '1', isAI: false, status: 'online' })).toBe(false);
  });

  it('stats.Status takes precedence over player.status', () => {
    // stats.Status alive but player.status says dead — stats wins
    expect(isEliminated({ id: '1', isAI: false, stats: { Status: 'Alive' }, status: 'dead' })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 – Full 10-player room scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('full room — badge counts', () => {
  const ownerUserId = 'owner-uuid';

  const buildRoom = () => [
    { id: 'gm-1',      isAI: true,  isGameMaster: true },
    { id: ownerUserId, isAI: false },
    { id: 'ai-1',      isAI: true },
    { id: 'ai-2',      isAI: true },
    { id: 'ai-3',      isAI: true },
    { id: 'ai-4',      isAI: true },
    { id: 'ai-5',      isAI: true },
    { id: 'ai-6',      isAI: true },
    { id: 'ai-7',      isAI: true },
    { id: 'ai-8',      isAI: true },
  ] as Player[];

  it('owner view: exactly 1 YOU badge in 10 players', () => {
    const room = buildRoom();
    const yous = room.filter((p) => shouldShowYou(p, ownerUserId));
    expect(yous).toHaveLength(1);
    expect(yous[0].id).toBe(ownerUserId);
  });

  it('guest view: 0 YOU badges in 10 players', () => {
    const room = buildRoom();
    const yous = room.filter((p) => shouldShowYou(p, ''));
    expect(yous).toHaveLength(0);
  });

  it('guest view (undefined userId): 0 YOU badges', () => {
    const room = buildRoom();
    const yous = room.filter((p) => shouldShowYou(p, undefined));
    expect(yous).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 – userId derivation (GameRoomContext)
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors: const userId = user?.id ?? "" in GameRoomContext */
function deriveUserId(user: { id: string } | null | undefined): string {
  return user?.id ?? '';
}

describe('userId derivation from auth', () => {
  it('authenticated user → non-empty userId', () => {
    const uid = deriveUserId({ id: 'abc-123' });
    expect(uid).toBe('abc-123');
    expect(!!uid).toBe(true);
  });

  it('unauthenticated (null) → empty string userId', () => {
    const uid = deriveUserId(null);
    expect(uid).toBe('');
    expect(!!uid).toBe(false);
  });

  it('unauthenticated (undefined) → empty string userId', () => {
    const uid = deriveUserId(undefined);
    expect(uid).toBe('');
    expect(!!uid).toBe(false);
  });

  it('empty userId means skipAutoLoad should be false and YOU badge should be blocked', () => {
    const uid = deriveUserId(null);
    const player: Player = { id: uid, isAI: false };
    // Same empty string → !!uid gates the badge
    expect(shouldShowYou(player, uid)).toBe(false);
  });
});
