import { describe, it, expect } from 'vitest';

// ─── Pure logic extracted from ProtectedRoute + GameRoomPage ─────────────────
// These tests cover the guest-bypass rules added to ProtectedRoute, the
// guestId/memberId extraction from URL search params, and the access-control
// flag derivations used in game/[gameId]/page.tsx.
// No React or browser APIs are required — we test the pure decision logic.

// ── ProtectedRoute: isGuestSession ───────────────────────────────────────────

/** Mirrors the check in protected-route.tsx */
function isGuestSession(searchParamsEntries: [string, string][]): boolean {
  const params = new URLSearchParams(searchParamsEntries);
  return !!params.get('guestId');
}

/** Mirrors the redirect decision */
function shouldRedirectToSignIn(opts: {
  user: unknown;
  loading: boolean;
  isGuestSession: boolean;
}): boolean {
  return !opts.loading && !opts.user && !opts.isGuestSession;
}

describe('ProtectedRoute – isGuestSession detection', () => {
  it('returns true when guestId is present in URL', () => {
    expect(isGuestSession([['guestId', 'some-uuid']])).toBe(true);
  });

  it('returns false when guestId is absent', () => {
    expect(isGuestSession([])).toBe(false);
  });

  it('returns false when unrelated params are present', () => {
    expect(isGuestSession([['memberId', 'abc'], ['foo', 'bar']])).toBe(false);
  });

  it('returns false when guestId is empty string', () => {
    // URLSearchParams.get('guestId') → '' → falsy
    expect(isGuestSession([['guestId', '']])).toBe(false);
  });

  it('returns true even when memberId is also present', () => {
    expect(isGuestSession([['guestId', 'g123'], ['memberId', 'm456']])).toBe(true);
  });
});

describe('ProtectedRoute – redirect decision', () => {
  it('redirects unauthenticated non-guest user', () => {
    expect(shouldRedirectToSignIn({ user: null, loading: false, isGuestSession: false })).toBe(true);
  });

  it('does NOT redirect authenticated user', () => {
    expect(shouldRedirectToSignIn({ user: { id: 'u1' }, loading: false, isGuestSession: false })).toBe(false);
  });

  it('does NOT redirect a guest player (isGuestSession=true)', () => {
    expect(shouldRedirectToSignIn({ user: null, loading: false, isGuestSession: true })).toBe(false);
  });

  it('does NOT redirect while still loading (prevents flash)', () => {
    expect(shouldRedirectToSignIn({ user: null, loading: true, isGuestSession: false })).toBe(false);
  });

  it('does NOT redirect authenticated guest (has both user + guestId — edge case)', () => {
    expect(shouldRedirectToSignIn({ user: { id: 'u1' }, loading: false, isGuestSession: true })).toBe(false);
  });
});

// ── GameRoomPage: URL param extraction ────────────────────────────────────────

interface GuestParams {
  guestId: string | null;
  memberId: string | null;
}

function extractGuestParams(search: string): GuestParams {
  const params = new URLSearchParams(search);
  return {
    guestId: params.get('guestId'),
    memberId: params.get('memberId'),
  };
}

describe('URL guest param extraction', () => {
  it('extracts both guestId and memberId from the join redirect URL', () => {
    const result = extractGuestParams('?guestId=g-uuid-123&memberId=m-uuid-456');
    expect(result.guestId).toBe('g-uuid-123');
    expect(result.memberId).toBe('m-uuid-456');
  });

  it('returns null when params are absent', () => {
    const result = extractGuestParams('');
    expect(result.guestId).toBeNull();
    expect(result.memberId).toBeNull();
  });

  it('returns only guestId when memberId is not present', () => {
    const result = extractGuestParams('?guestId=g1');
    expect(result.guestId).toBe('g1');
    expect(result.memberId).toBeNull();
  });

  it('returns only memberId when guestId is not present', () => {
    const result = extractGuestParams('?memberId=m1');
    expect(result.guestId).toBeNull();
    expect(result.memberId).toBe('m1');
  });
});

// ── GameRoomPage: isOwner / isGuestPlayer flags ────────────────────────────────

interface GameSummary {
  id: string;
  name: string;
}

function deriveAccessFlags(opts: {
  gameId: string;
  games: GameSummary[];
  sessionUserId: string | null;
  guestId: string | null;
}): { isOwner: boolean; isGuestPlayer: boolean } {
  const { gameId, games, sessionUserId, guestId } = opts;
  const isOwner = !!games.find((g) => g.id === gameId) && !!sessionUserId;
  const isGuestPlayer = !isOwner && !!guestId;
  return { isOwner, isGuestPlayer };
}

describe('isOwner / isGuestPlayer flags', () => {
  const GAME_ID = 'game-abc';
  const MY_GAMES: GameSummary[] = [{ id: GAME_ID, name: 'My Game' }];

  it('isOwner=true when game is in user list and user is logged in', () => {
    const { isOwner, isGuestPlayer } = deriveAccessFlags({
      gameId: GAME_ID,
      games: MY_GAMES,
      sessionUserId: 'user-1',
      guestId: null,
    });
    expect(isOwner).toBe(true);
    expect(isGuestPlayer).toBe(false);
  });

  it('isGuestPlayer=true for anonymous user with guestId', () => {
    const { isOwner, isGuestPlayer } = deriveAccessFlags({
      gameId: GAME_ID,
      games: [], // not in owner's game list
      sessionUserId: null,
      guestId: 'guest-uuid',
    });
    expect(isOwner).toBe(false);
    expect(isGuestPlayer).toBe(true);
  });

  it('isGuestPlayer=true for authenticated non-owner player with guestId', () => {
    const { isOwner, isGuestPlayer } = deriveAccessFlags({
      gameId: GAME_ID,
      games: [], // not owner
      sessionUserId: 'other-user',
      guestId: 'guest-uuid',
    });
    expect(isOwner).toBe(false);
    expect(isGuestPlayer).toBe(true);
  });

  it('neither flag when game is not found and user has no guestId', () => {
    const { isOwner, isGuestPlayer } = deriveAccessFlags({
      gameId: GAME_ID,
      games: [],
      sessionUserId: null,
      guestId: null,
    });
    expect(isOwner).toBe(false);
    expect(isGuestPlayer).toBe(false);
  });

  it('isOwner wins over isGuestPlayer even if guestId is present', () => {
    const { isOwner, isGuestPlayer } = deriveAccessFlags({
      gameId: GAME_ID,
      games: MY_GAMES,
      sessionUserId: 'user-1',
      guestId: 'guest-uuid', // guestId present but user owns the game
    });
    expect(isOwner).toBe(true);
    expect(isGuestPlayer).toBe(false);
  });

  it('isOwner=false when game is in list but user is not logged in', () => {
    const { isOwner } = deriveAccessFlags({
      gameId: GAME_ID,
      games: MY_GAMES,
      sessionUserId: null,
      guestId: null,
    });
    expect(isOwner).toBe(false);
  });

  it('isOwner=false for a different gameId not in list', () => {
    const { isOwner } = deriveAccessFlags({
      gameId: 'other-game',
      games: MY_GAMES,
      sessionUserId: 'user-1',
      guestId: null,
    });
    expect(isOwner).toBe(false);
  });
});

// ── localStorage key conventions ──────────────────────────────────────────────

function localStorageKey(type: 'member' | 'nickname', gameId: string): string {
  return `${type}_${gameId}`;
}

describe('localStorage key conventions', () => {
  it('member key format is "member_{gameId}"', () => {
    expect(localStorageKey('member', 'game-123')).toBe('member_game-123');
  });

  it('nickname key format is "nickname_{gameId}"', () => {
    expect(localStorageKey('nickname', 'game-456')).toBe('nickname_game-456');
  });

  it('different gameIds produce different keys', () => {
    expect(localStorageKey('member', 'game-1')).not.toBe(localStorageKey('member', 'game-2'));
  });
});
