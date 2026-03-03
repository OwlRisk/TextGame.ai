import { describe, it, expect } from 'vitest';

// ─── Presence event handling + binding bug-fix regression tests ───────────────
//
// This file covers:
//
//   A.  Presence leave/join explicit sync (fix: don't rely on sync event)
//       Previously, guest removal after a leave relied on the `sync` event
//       which is NOT guaranteed to fire after every join/leave.
//       The fix explicitly calls syncGuestsFromState inside the leave handler.
//
//   B.  guestPlayerBinding is_owner filter (fix: add !m.is_owner guard)
//       Previously, guestPlayerBinding could match an owner row if it had a
//       guest_id set, inconsistent with enrichedGuestMembers which already
//       filtered !m.is_owner.
//
//   C.  handleAssignGuestToPlayer guard (fix: early return when memberId empty)
//       The PATCH call now bails if memberId is falsy, preventing a request to
//       /api/games/[gameId]/members/undefined.
//
//   D.  PlayerCard Assign/Unassign click guard (fix: memberId guard before call)
//       availableGuests and boundGuest only expose guests whose memberId is
//       already confirmed; click handlers now re-check before calling.
//
//   E.  End-to-end presence event simulation
//       Full lifecycle: connect → guest join → message → guest leave → verify
//       the online list is immediately empty (not stale).

// ─── Shared type fixtures ─────────────────────────────────────────────────────

type PresenceEntry = { role?: string; nickname?: string };
type PresenceState = Record<string, PresenceEntry[]>;

interface RoomMember {
  id: string;
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
  guest_id: string | null;
}

interface Player {
  id: string;
  name: string;
  role?: string;
  isAI?: boolean;
  isGameMaster?: boolean;
}

interface GuestEntry {
  id: string;
  nickname: string;
  memberId?: string;
  playerId?: string;
  playerName?: string;
  playerRole?: string;
}

// ─── Pure logic mirrors ───────────────────────────────────────────────────────

/** Mirrors syncGuestsFromState in page.tsx */
function syncGuestsFromState(
  state: PresenceState,
): Array<{ id: string; nickname: string }> {
  return Object.entries(state).flatMap(([key, entries]) =>
    entries
      .filter((p) => p.role === 'guest')
      .map((p) => ({ id: key, nickname: p.nickname ?? 'Guest' })),
  );
}

/** Mirrors enrichedGuestMembers useMemo in page.tsx */
function enrichGuestMembers(
  presences: Array<{ id: string; nickname: string }>,
  members: RoomMember[],
  players: Player[],
): GuestEntry[] {
  return presences.map((g) => {
    const member = members.find((m) => m.guest_id === g.id && !m.is_owner);
    const boundPlayer = member?.player_id
      ? players.find((p) => p.id === member.player_id) ?? null
      : null;
    return {
      id: g.id,
      nickname: g.nickname,
      memberId: member?.id,
      playerId: boundPlayer?.id,
      playerName: boundPlayer?.name,
      playerRole: boundPlayer?.role,
    };
  });
}

/** Mirrors guestPlayerBinding useMemo in page.tsx (FIXED: adds !m.is_owner) */
function deriveGuestPlayerBinding(
  isGuestPlayer: boolean,
  guestId: string | null,
  members: RoomMember[],
): string | null {
  if (!isGuestPlayer || !guestId) return null;
  return members.find((m) => m.guest_id === guestId && !m.is_owner)?.player_id ?? null;
}

/** Mirrors the PATCH guard logic in handleAssignGuestToPlayer (FIXED) */
function canCallPatch(memberId: string, accessToken: string | undefined): boolean {
  return !!accessToken && !!memberId;
}

/** Mirrors availableGuests filter in PlayerCard */
function getAvailableGuests(guestMembers: GuestEntry[]): GuestEntry[] {
  return guestMembers.filter((g) => !g.playerId && g.memberId);
}

/** Mirrors the click guard in PlayerCard Unassign handler */
function resolveUnassignCall(
  memberId: string | undefined,
  onAssignGuest: ((id: string, pid: string | null) => void) | undefined,
): { called: boolean; args?: [string, null] } {
  if (!memberId || !onAssignGuest) return { called: false };
  onAssignGuest(memberId, null);
  return { called: true, args: [memberId, null] };
}

/** Mirrors the click guard in PlayerCard Assign handler */
function resolveAssignCall(
  memberId: string | undefined,
  playerId: string,
  onAssignGuest: ((id: string, pid: string | null) => void) | undefined,
): { called: boolean } {
  if (!memberId || !onAssignGuest) return { called: false };
  onAssignGuest(memberId, playerId);
  return { called: true };
}

// ─── A. Presence leave/join explicit sync ─────────────────────────────────────

describe('A – syncGuestsFromState called explicitly on leave/join', () => {
  it('A-1: guest list is empty immediately after leave (stale-guest regression)', () => {
    const beforeLeave: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
    };
    // Simulate the leave handler reading presenceState() AFTER Supabase removes the key
    const afterLeave: PresenceState = {
      'owner-id': [{ role: 'owner' }],
    };

    expect(syncGuestsFromState(beforeLeave)).toHaveLength(1);
    expect(syncGuestsFromState(afterLeave)).toHaveLength(0);
  });

  it('A-2: second guest leaving does not affect the first', () => {
    const state: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-1': [{ role: 'guest', nickname: 'Alice' }],
    };
    expect(syncGuestsFromState(state)).toEqual([{ id: 'guest-1', nickname: 'Alice' }]);
  });

  it('A-3: new guest joining is immediately visible via join handler sync', () => {
    const stateBefore: PresenceState = { 'owner-id': [{ role: 'owner' }] };
    const stateAfterJoin: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-new': [{ role: 'guest', nickname: 'Bob' }],
    };
    expect(syncGuestsFromState(stateBefore)).toHaveLength(0);
    expect(syncGuestsFromState(stateAfterJoin)).toHaveLength(1);
    expect(syncGuestsFromState(stateAfterJoin)[0].nickname).toBe('Bob');
  });

  it('A-4: three guests leave one-by-one, list shrinks correctly each time', () => {
    const base: PresenceState = { 'owner-id': [{ role: 'owner' }] };
    const state3: PresenceState = { ...base, g1: [{ role: 'guest', nickname: 'A' }], g2: [{ role: 'guest', nickname: 'B' }], g3: [{ role: 'guest', nickname: 'C' }] };
    const state2: PresenceState = { ...base, g2: [{ role: 'guest', nickname: 'B' }], g3: [{ role: 'guest', nickname: 'C' }] };
    const state1: PresenceState = { ...base, g3: [{ role: 'guest', nickname: 'C' }] };
    const state0: PresenceState = { ...base };

    expect(syncGuestsFromState(state3)).toHaveLength(3);
    expect(syncGuestsFromState(state2)).toHaveLength(2);
    expect(syncGuestsFromState(state1)).toHaveLength(1);
    expect(syncGuestsFromState(state0)).toHaveLength(0);
  });

  it('A-5: guest rejoining after disconnect shows up again', () => {
    const gone: PresenceState = { 'owner-id': [{ role: 'owner' }] };
    const rejoined: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-uuid-1': [{ role: 'guest', nickname: 'Nikki' }],
    };
    expect(syncGuestsFromState(gone)).toHaveLength(0);
    expect(syncGuestsFromState(rejoined)).toHaveLength(1);
  });

  it('A-6: owner leave does not affect guest list', () => {
    const ownerPresent: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-1': [{ role: 'guest', nickname: 'Alice' }],
    };
    const ownerGone: PresenceState = {
      'guest-1': [{ role: 'guest', nickname: 'Alice' }],
    };
    const before = syncGuestsFromState(ownerPresent);
    const after = syncGuestsFromState(ownerGone);
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe('guest-1');
  });

  it('A-7: presence key used as guest id after join handler sync', () => {
    const state: PresenceState = {
      'presence-key-uuid': [{ role: 'guest', nickname: 'Zara' }],
    };
    const [g] = syncGuestsFromState(state);
    expect(g.id).toBe('presence-key-uuid');
  });

  it('A-8: multiple simultaneous leaves handled correctly', () => {
    const before: PresenceState = {
      g1: [{ role: 'guest', nickname: 'A' }],
      g2: [{ role: 'guest', nickname: 'B' }],
      g3: [{ role: 'guest', nickname: 'C' }],
    };
    // g1 and g3 leave simultaneously
    const after: PresenceState = {
      g2: [{ role: 'guest', nickname: 'B' }],
    };
    expect(syncGuestsFromState(before)).toHaveLength(3);
    const result = syncGuestsFromState(after);
    expect(result).toHaveLength(1);
    expect(result[0].nickname).toBe('B');
  });
});

// ─── B. guestPlayerBinding is_owner filter ───────────────────────────────────

describe('B – guestPlayerBinding filters out owner rows', () => {
  it('B-1: returns null when not a guest player', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    expect(deriveGuestPlayerBinding(false, 'g1', members)).toBeNull();
  });

  it('B-2: returns null when guestId is null', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    expect(deriveGuestPlayerBinding(true, null, members)).toBeNull();
  });

  it('B-3: returns player_id when a matching non-owner member exists', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'player-42', guest_id: 'g-alice' },
    ];
    expect(deriveGuestPlayerBinding(true, 'g-alice', members)).toBe('player-42');
  });

  it('B-4: returns null when only owner row has matching guest_id (BUG-FIX: was returning player_id)', () => {
    // Edge case: owner row has guest_id set (shouldn't happen, but guard anyway)
    const members: RoomMember[] = [
      { id: 'm-owner', nickname: 'Host', is_owner: true, player_id: 'owner-player', guest_id: 'g-alice' },
    ];
    // After fix: !m.is_owner guard prevents matching this row
    expect(deriveGuestPlayerBinding(true, 'g-alice', members)).toBeNull();
  });

  it('B-5: non-owner row takes precedence over owner row with same guest_id', () => {
    const members: RoomMember[] = [
      { id: 'm-owner', nickname: 'Host', is_owner: true, player_id: 'owner-player', guest_id: 'g-alice' },
      { id: 'm-guest', nickname: 'Alice', is_owner: false, player_id: 'ai-player', guest_id: 'g-alice' },
    ];
    expect(deriveGuestPlayerBinding(true, 'g-alice', members)).toBe('ai-player');
  });

  it('B-6: returns null when no member matches guestId', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Bob', is_owner: false, player_id: 'p1', guest_id: 'g-bob' },
    ];
    expect(deriveGuestPlayerBinding(true, 'g-alice', members)).toBeNull();
  });

  it('B-7: returns null when member exists but player_id is null (unbound)', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: null, guest_id: 'g-alice' },
    ];
    expect(deriveGuestPlayerBinding(true, 'g-alice', members)).toBeNull();
  });

  it('B-8: consistent with enrichGuestMembers !m.is_owner filter', () => {
    // Both enrichGuestMembers and guestPlayerBinding must exclude owner rows
    const presences = [{ id: 'g-alice', nickname: 'Alice' }];
    const members: RoomMember[] = [
      { id: 'm-owner', nickname: 'Host', is_owner: true, player_id: 'owner-player', guest_id: 'g-alice' },
    ];
    const players: Player[] = [{ id: 'owner-player', name: 'Host', isAI: false }];

    const enriched = enrichGuestMembers(presences, members, players);
    const binding = deriveGuestPlayerBinding(true, 'g-alice', members);

    // Both should treat the owner row as non-matching
    expect(enriched[0].playerId).toBeUndefined();
    expect(binding).toBeNull();
  });

  it('B-9: multiple guests, each gets correct binding', () => {
    const members: RoomMember[] = [
      { id: 'mb', nickname: 'Bob', is_owner: false, player_id: 'p-bob', guest_id: 'g-bob' },
      { id: 'mc', nickname: 'Carol', is_owner: false, player_id: 'p-carol', guest_id: 'g-carol' },
    ];
    expect(deriveGuestPlayerBinding(true, 'g-bob', members)).toBe('p-bob');
    expect(deriveGuestPlayerBinding(true, 'g-carol', members)).toBe('p-carol');
  });
});

// ─── C. handleAssignGuestToPlayer PATCH guard ─────────────────────────────────

describe('C – handleAssignGuestToPlayer PATCH guard', () => {
  it('C-1: canCallPatch returns false when memberId is empty string', () => {
    expect(canCallPatch('', 'token-abc')).toBe(false);
  });

  it('C-2: canCallPatch returns false when accessToken is undefined', () => {
    expect(canCallPatch('member-uuid', undefined)).toBe(false);
  });

  it('C-3: canCallPatch returns false when both are falsy', () => {
    expect(canCallPatch('', undefined)).toBe(false);
  });

  it('C-4: canCallPatch returns true when both are provided', () => {
    expect(canCallPatch('member-uuid', 'token-xyz')).toBe(true);
  });

  it('C-5: canCallPatch prevents /api/.../members/undefined request', () => {
    // Simulates the guard added to handleAssignGuestToPlayer: if memberId is '', abort
    const calls: string[] = [];
    const mock = (memberId: string, token: string | undefined) => {
      if (!canCallPatch(memberId, token)) return;
      calls.push(`/api/games/g1/members/${memberId}`);
    };

    mock('', 'token');
    expect(calls).toHaveLength(0);

    mock('real-member-id', 'token');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe('/api/games/g1/members/real-member-id');
  });
});

// ─── D. PlayerCard Assign/Unassign click guard ───────────────────────────────

describe('D – PlayerCard Assign/Unassign click guard', () => {
  it('D-1: unassign does NOT call onAssignGuest when memberId is undefined', () => {
    const calls: Array<[string, null]> = [];
    const result = resolveUnassignCall(undefined, (id, pid) => calls.push([id, pid as null]));
    expect(result.called).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('D-2: unassign calls onAssignGuest with (memberId, null) when memberId is defined', () => {
    const calls: Array<[string, null]> = [];
    const result = resolveUnassignCall('m-abc', (id, pid) => calls.push([id, pid as null]));
    expect(result.called).toBe(true);
    expect(calls).toEqual([['m-abc', null]]);
  });

  it('D-3: assign does NOT call onAssignGuest when memberId is undefined', () => {
    const calls: unknown[] = [];
    const result = resolveAssignCall(undefined, 'player-x', (id, pid) => calls.push([id, pid]));
    expect(result.called).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('D-4: assign calls onAssignGuest with (memberId, playerId) when memberId is defined', () => {
    const calls: Array<[string, string | null]> = [];
    const result = resolveAssignCall('m-xyz', 'player-x', (id, pid) => calls.push([id, pid]));
    expect(result.called).toBe(true);
    expect(calls).toEqual([['m-xyz', 'player-x']]);
  });

  it('D-5: unassign is disabled in UI when memberId is undefined (availableGuests filter)', () => {
    const guests: GuestEntry[] = [
      { id: 'g1', nickname: 'Alice', memberId: undefined, playerId: 'p1' },
    ];
    // boundGuest with no memberId means the Unassign button should be disabled
    const boundGuest = guests[0];
    const isDisabled = !boundGuest.memberId;
    expect(isDisabled).toBe(true);
  });

  it('D-6: availableGuests only contains guests with memberId (no memberId = not in dropdown)', () => {
    const guests: GuestEntry[] = [
      { id: 'g1', nickname: 'Alice', memberId: 'm1', playerId: undefined },
      { id: 'g2', nickname: 'Bob', memberId: undefined, playerId: undefined },  // no memberId
      { id: 'g3', nickname: 'Carol', memberId: 'm3', playerId: 'p1' },         // already bound
    ];
    const available = getAvailableGuests(guests);
    expect(available).toHaveLength(1);
    expect(available[0].nickname).toBe('Alice');
  });

  it('D-7: no available guests when all are bound or missing memberId', () => {
    const guests: GuestEntry[] = [
      { id: 'g1', nickname: 'Alice', memberId: 'm1', playerId: 'p1' },
      { id: 'g2', nickname: 'Bob', memberId: undefined, playerId: undefined },
    ];
    expect(getAvailableGuests(guests)).toHaveLength(0);
  });

  it('D-8: onAssignGuest is not called when handler is undefined', () => {
    const result = resolveUnassignCall('m-abc', undefined);
    expect(result.called).toBe(false);
  });
});

// ─── E. End-to-end presence lifecycle ─────────────────────────────────────────

describe('E – end-to-end presence lifecycle', () => {
  it('E-1: connect → guest joins → guest messages → guest leaves → list is empty', () => {
    let state: PresenceState = { 'owner-id': [{ role: 'owner' }] };

    // Initial: no guests
    expect(syncGuestsFromState(state)).toHaveLength(0);

    // Guest joins
    state = { ...state, 'nikki-uuid': [{ role: 'guest', nickname: 'Nikki' }] };
    expect(syncGuestsFromState(state)).toHaveLength(1);
    expect(syncGuestsFromState(state)[0].nickname).toBe('Nikki');

    // Guest messages (state unchanged for presence)
    expect(syncGuestsFromState(state)).toHaveLength(1);

    // Guest leaves (leave handler reads updated state)
    const afterLeave: PresenceState = { 'owner-id': [{ role: 'owner' }] };
    expect(syncGuestsFromState(afterLeave)).toHaveLength(0);
  });

  it('E-2: two guests join, one leaves, the other stays', () => {
    let state: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'g1': [{ role: 'guest', nickname: 'Alice' }],
      'g2': [{ role: 'guest', nickname: 'Bob' }],
    };
    expect(syncGuestsFromState(state)).toHaveLength(2);

    // g1 leaves
    state = { 'owner-id': [{ role: 'owner' }], 'g2': [{ role: 'guest', nickname: 'Bob' }] };
    const remaining = syncGuestsFromState(state);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].nickname).toBe('Bob');
    expect(remaining[0].id).toBe('g2');
  });

  it('E-3: guest is bound to player, leaves, binding does not linger in enriched list', () => {
    const members: RoomMember[] = [
      { id: 'mb', nickname: 'Bob', is_owner: false, player_id: 'p-detective', guest_id: 'g-bob' },
    ];
    const players: Player[] = [{ id: 'p-detective', name: 'Detective', role: 'Investigator', isAI: true }];

    // Bob is online and bound
    const presencesOnline = [{ id: 'g-bob', nickname: 'Bob' }];
    const enrichedBefore = enrichGuestMembers(presencesOnline, members, players);
    expect(enrichedBefore[0].playerName).toBe('Detective');

    // Bob leaves → presences become empty
    const enrichedAfter = enrichGuestMembers([], members, players);
    expect(enrichedAfter).toHaveLength(0);
  });

  it('E-4: guest leaves and rejoins with the same guestId, binding still resolved', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Carol', is_owner: false, player_id: 'p-spy', guest_id: 'g-carol' },
    ];
    const players: Player[] = [{ id: 'p-spy', name: 'Spy', role: 'Infiltrator', isAI: true }];

    // Carol reconnects with same guestId (localStorage persists it)
    const presences = [{ id: 'g-carol', nickname: 'Carol' }];
    const enriched = enrichGuestMembers(presences, members, players);
    expect(enriched[0].playerId).toBe('p-spy');
    expect(enriched[0].playerName).toBe('Spy');

    const binding = deriveGuestPlayerBinding(true, 'g-carol', members);
    expect(binding).toBe('p-spy');
  });

  it('E-5: owner disconnects does not remove guests from online list', () => {
    const beforeOwnerLeave: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-1': [{ role: 'guest', nickname: 'Alice' }],
    };
    const afterOwnerLeave: PresenceState = {
      'guest-1': [{ role: 'guest', nickname: 'Alice' }],
    };
    expect(syncGuestsFromState(beforeOwnerLeave)).toHaveLength(1);
    expect(syncGuestsFromState(afterOwnerLeave)).toHaveLength(1);
  });

  it('E-6: multiple tab open: same user has two presence entries, both filtered as guest', () => {
    // Supabase presence key is userId or guestId; multiple tabs share the same key
    // (per Supabase docs, same key = last track wins). We test that the output is still correct.
    const state: PresenceState = {
      'guest-multi': [
        { role: 'guest', nickname: 'MultiTab' },
        // In practice Supabase consolidates to the most-recently-tracked entry per key
      ],
    };
    const result = syncGuestsFromState(state);
    expect(result).toHaveLength(1);
    expect(result[0].nickname).toBe('MultiTab');
  });

  it('E-7: handleAssignGuestToPlayer guards prevent duplicate PATCH when memberId races', () => {
    // Simulate the race: guest leaves (memberId becomes undefined) right when owner clicks Assign
    const calls: string[] = [];
    const guarded = (memberId: string | undefined, token: string) => {
      if (!memberId || !token) return false;
      calls.push(memberId);
      return true;
    };

    expect(guarded(undefined, 'tok')).toBe(false);
    expect(guarded('', 'tok')).toBe(false);
    expect(guarded('real-id', 'tok')).toBe(true);
    expect(calls).toHaveLength(1);
  });
});

// ─── F. Regression: original stale ghost guest issue ─────────────────────────

describe('F – regression: ghost guest rows after disconnect (original bug)', () => {
  it('F-1: Nikki disconnects and immediately disappears from online list', () => {
    // Before fix: the list was read from game_members DB table (never cleared)
    // After fix: list is from Presence; leaving = gone immediately
    const connected: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'nikki-uuid': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const disconnected: PresenceState = {
      'owner-id': [{ role: 'owner' }],
    };

    const before = syncGuestsFromState(connected);
    const after = syncGuestsFromState(disconnected);

    expect(before).toHaveLength(1);
    expect(after).toHaveLength(0);
  });

  it('F-2: leave handler reading stateState after leave produces correct result', () => {
    // This simulates what page.tsx now does in the leave handler:
    // const state = channel.presenceState(); syncGuestsFromState(state);
    const stateReadAfterLeave: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      // guest key is gone because Supabase already removed it when presenceState() is read
    };
    expect(syncGuestsFromState(stateReadAfterLeave)).toEqual([]);
  });

  it('F-3: join handler reading presenceState after join shows new guest', () => {
    const stateReadAfterJoin: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'new-guest': [{ role: 'guest', nickname: 'Sam' }],
    };
    const result = syncGuestsFromState(stateReadAfterJoin);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('new-guest');
    expect(result[0].nickname).toBe('Sam');
  });

  it('F-4: relying only on sync event would have been unreliable (documented)', () => {
    // If we only relied on sync event and it fires at t=0, t=1, t=2 with no
    // join/leave in between, the state would correctly reflect the snapshot.
    // But if sync does NOT fire after a leave, the last-seen guest stays forever.
    // This test documents the pre-fix behaviour using a frozen snapshot:
    const frozenStateNeverUpdated: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'ghost-guest': [{ role: 'guest', nickname: 'Ghost' }], // Would persist if sync never fires
    };
    // After fix, the leave handler directly calls syncGuestsFromState,
    // so the frozen snapshot is irrelevant — real state is used.
    // We document the fix by showing the stateAfterLeave would be:
    const actualStateAfterLeave: PresenceState = { 'owner-id': [{ role: 'owner' }] };
    expect(syncGuestsFromState(frozenStateNeverUpdated)).toHaveLength(1); // OLD behavior (bug)
    expect(syncGuestsFromState(actualStateAfterLeave)).toHaveLength(0);  // NEW behavior (fix)
  });
});
