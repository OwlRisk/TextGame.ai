import { describe, it, expect } from 'vitest';

// ─── Guest presence: online-guest list derivation ─────────────────────────────
//
// These tests cover the `syncGuestsFromState` logic extracted from
// game/[gameId]/page.tsx.  The function converts a Supabase Presence snapshot
// into the `onlineGuestPresences` array used to render the player panel.
//
// Bug context: previously the player panel read from the `game_members` DB table
// (polling every 15 s), which never cleaned up rows for guests who closed their
// tabs.  The fix subscribes to the Presence channel so that the list auto-clears
// the moment a guest disconnects.

// ─── Pure logic extracted from page.tsx ───────────────────────────────────────

type PresenceEntry = { role?: string; nickname?: string };
type PresenceState = Record<string, PresenceEntry[]>;

/** Mirrors `syncGuestsFromState` in page.tsx */
function syncGuestsFromState(state: PresenceState): Array<{ id: string; nickname: string }> {
  return Object.entries(state).flatMap(([key, entries]) =>
    entries
      .filter((p) => p.role === 'guest')
      .map((p) => ({ id: key, nickname: p.nickname ?? 'Guest' }))
  );
}

/** Mirrors the presence key selection in page.tsx */
function resolvePresenceKey(
  userId: string | undefined,
  guestId: string | null,
): string {
  return userId ?? guestId ?? 'anon';
}

/** Mirrors the banner visibility condition in page.tsx */
function shouldShowRoomBanner(onlineGuestCount: number): boolean {
  return onlineGuestCount > 0;
}

/** Mirrors the banner participant count (online guests + 1 owner) */
function bannerPlayerCount(onlineGuestCount: number): number {
  return onlineGuestCount + 1;
}

// ─── syncGuestsFromState ──────────────────────────────────────────────────────

describe('syncGuestsFromState – empty states', () => {
  it('returns [] for an empty presence state', () => {
    expect(syncGuestsFromState({})).toEqual([]);
  });

  it('returns [] when only the owner is online', () => {
    const state: PresenceState = {
      'owner-uuid': [{ role: 'owner', nickname: 'Alice' }],
    };
    expect(syncGuestsFromState(state)).toEqual([]);
  });

  it('returns [] when presence entries have no role field', () => {
    const state: PresenceState = {
      'unknown-key': [{}],
    };
    expect(syncGuestsFromState(state)).toEqual([]);
  });
});

describe('syncGuestsFromState – single guest', () => {
  it('returns the guest when one guest is online', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
    };
    expect(syncGuestsFromState(state)).toEqual([
      { id: 'guest-uuid-1', nickname: 'Nikki' },
    ]);
  });

  it('falls back to "Guest" when nickname is missing', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest' }],
    };
    expect(syncGuestsFromState(state)).toEqual([
      { id: 'guest-uuid-1', nickname: 'Guest' },
    ]);
  });

  it('falls back to "Guest" when nickname is undefined', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest', nickname: undefined }],
    };
    expect(syncGuestsFromState(state)).toEqual([
      { id: 'guest-uuid-1', nickname: 'Guest' },
    ]);
  });
});

describe('syncGuestsFromState – multiple guests', () => {
  it('returns all guests when two guests are online', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest', nickname: 'Alice' }],
      'guest-uuid-2': [{ role: 'guest', nickname: 'Bob' }],
    };
    const result = syncGuestsFromState(state);
    expect(result).toHaveLength(2);
    expect(result.map((g) => g.nickname).sort()).toEqual(['Alice', 'Bob']);
  });

  it('uses the presence key (guestId) as the id field', () => {
    const state: PresenceState = {
      'guest-uuid-42': [{ role: 'guest', nickname: 'Zara' }],
    };
    const [guest] = syncGuestsFromState(state);
    expect(guest.id).toBe('guest-uuid-42');
  });

  it('two guests with the same nickname are both included', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
      'guest-uuid-2': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const result = syncGuestsFromState(state);
    expect(result).toHaveLength(2);
    expect(result.every((g) => g.nickname === 'Nikki')).toBe(true);
    expect(result.map((g) => g.id).sort()).toEqual(['guest-uuid-1', 'guest-uuid-2']);
  });
});

describe('syncGuestsFromState – mixed owner + guests', () => {
  it('excludes the owner from the guest list', () => {
    const state: PresenceState = {
      'owner-user-id': [{ role: 'owner', nickname: 'Host' }],
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const result = syncGuestsFromState(state);
    expect(result).toHaveLength(1);
    expect(result[0].nickname).toBe('Nikki');
  });

  it('returns [] when owner is present but all guests have left', () => {
    const state: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
    };
    expect(syncGuestsFromState(state)).toEqual([]);
  });

  it('handles three guests + owner correctly', () => {
    const state: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
      'guest-1': [{ role: 'guest', nickname: 'A' }],
      'guest-2': [{ role: 'guest', nickname: 'B' }],
      'guest-3': [{ role: 'guest', nickname: 'C' }],
    };
    const result = syncGuestsFromState(state);
    expect(result).toHaveLength(3);
    expect(result.map((g) => g.nickname).sort()).toEqual(['A', 'B', 'C']);
  });
});

describe('syncGuestsFromState – guest leaves (simulating tab close)', () => {
  it('guest disappears after leaving', () => {
    const stateBefore: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const stateAfter: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
      // guest-uuid-1 has left
    };

    expect(syncGuestsFromState(stateBefore)).toHaveLength(1);
    expect(syncGuestsFromState(stateAfter)).toHaveLength(0);
  });

  it('one guest leaves, other remains', () => {
    const stateBefore: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
      'guest-uuid-2': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const stateAfter: PresenceState = {
      'owner-user-id': [{ role: 'owner' }],
      'guest-uuid-2': [{ role: 'guest', nickname: 'Nikki' }],
    };

    expect(syncGuestsFromState(stateBefore)).toHaveLength(2);
    const remaining = syncGuestsFromState(stateAfter);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('guest-uuid-2');
  });
});

// ─── resolvePresenceKey ───────────────────────────────────────────────────────

describe('resolvePresenceKey', () => {
  it('prefers authenticated userId over guestId', () => {
    expect(resolvePresenceKey('user-abc', 'guest-xyz')).toBe('user-abc');
  });

  it('falls back to guestId when userId is undefined', () => {
    expect(resolvePresenceKey(undefined, 'guest-xyz')).toBe('guest-xyz');
  });

  it('falls back to "anon" when both are absent', () => {
    expect(resolvePresenceKey(undefined, null)).toBe('anon');
  });

  it('uses userId even if guestId is null', () => {
    expect(resolvePresenceKey('user-abc', null)).toBe('user-abc');
  });
});

// ─── Room presence banner (presence-based) ───────────────────────────────────
//
// The banner now fires on `onlineGuestPresences.length > 0` (i.e. at least one
// guest is currently connected), replacing the old `roomMembers.length > 1`
// condition that included stale DB rows for disconnected guests.

describe('shouldShowRoomBanner – presence-based', () => {
  it('does not show banner when no guests are online', () => {
    expect(shouldShowRoomBanner(0)).toBe(false);
  });

  it('shows banner once the first guest connects', () => {
    expect(shouldShowRoomBanner(1)).toBe(true);
  });

  it('shows banner with multiple guests online', () => {
    expect(shouldShowRoomBanner(3)).toBe(true);
  });
});

describe('bannerPlayerCount', () => {
  it('counts owner + 1 guest as 2', () => {
    expect(bannerPlayerCount(1)).toBe(2);
  });

  it('counts owner + 3 guests as 4', () => {
    expect(bannerPlayerCount(3)).toBe(4);
  });

  it('counts owner alone as 1 (but banner would not show)', () => {
    expect(bannerPlayerCount(0)).toBe(1);
  });
});

// ─── End-to-end scenario: two Nikki Guests showing stale ─────────────────────
//
// Regression test for the original bug:
//   Two "Guest" rows (both named "Nikki") remained in the player panel after the
//   guests closed their tabs, because the list was read from `game_members` DB
//   rows that were never deleted.
//
//   With the presence-based fix, once both guests disconnect the presence state
//   becomes empty and `syncGuestsFromState` returns [], so no stale rows are shown.

describe('regression – stale Guest rows after disconnect', () => {
  it('two Nikki guests visible while connected', () => {
    const connectedState: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'nikki-guest-id-1': [{ role: 'guest', nickname: 'Nikki' }],
      'nikki-guest-id-2': [{ role: 'guest', nickname: 'Nikki' }],
    };
    expect(syncGuestsFromState(connectedState)).toHaveLength(2);
  });

  it('both Nikki guests disappear after closing their tabs', () => {
    const afterDisconnect: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      // nikki-guest-id-1 and nikki-guest-id-2 have both left
    };
    expect(syncGuestsFromState(afterDisconnect)).toHaveLength(0);
  });

  it('only the remaining Nikki is shown if one disconnects', () => {
    const oneLeft: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'nikki-guest-id-2': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const result = syncGuestsFromState(oneLeft);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('nikki-guest-id-2');
  });
});
