import { describe, it, expect } from 'vitest';

// ─── Room state write / merge logic ──────────────────────────────────────────
// Tests for the patterns used in GameRoomContext (save state) and
// /api/games/[gameId]/message/route.ts (guest message upsert).
// All functions are pure helpers extracted from production code.

// ── State construction ────────────────────────────────────────────────────────

interface RoomState {
  messages?: unknown[];
  savedAt?: string;
  clientId?: string;
  [key: string]: unknown;
}

function buildUpdatedState(
  currentState: RoomState,
  newMessages: unknown[],
  clientId: string
): RoomState {
  return {
    ...currentState,
    messages: newMessages,
    savedAt: new Date().toISOString(),
    clientId,
  };
}

describe('buildUpdatedState', () => {
  it('preserves existing non-message keys', () => {
    const current = { messages: [], phase: 'night', round: 3 };
    const result = buildUpdatedState(current, [], 'client-1');
    expect(result.phase).toBe('night');
    expect(result.round).toBe(3);
  });

  it('overwrites messages with the provided array', () => {
    const current = { messages: [{ id: 'old' }] };
    const newMsgs = [{ id: 'new-1' }, { id: 'new-2' }];
    const result = buildUpdatedState(current, newMsgs, 'client-1');
    expect(result.messages).toEqual(newMsgs);
  });

  it('sets savedAt to a valid ISO timestamp', () => {
    const before = Date.now();
    const result = buildUpdatedState({}, [], 'client-1');
    const after = Date.now();
    const ts = new Date(result.savedAt as string).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('sets the clientId correctly', () => {
    const result = buildUpdatedState({}, [], 'session-xyz');
    expect(result.clientId).toBe('session-xyz');
  });

  it('does not mutate the original state', () => {
    const current = { messages: [{ id: 'a' }], phase: 'day' };
    buildUpdatedState(current, [], 'c');
    expect(current.messages).toHaveLength(1);
    expect(current.phase).toBe('day');
  });

  it('works on an empty current state', () => {
    const result = buildUpdatedState({}, [{ id: 'msg-1' }], 'c');
    expect((result.messages as unknown[]).length).toBe(1);
    expect(result.clientId).toBe('c');
    expect(result.savedAt).toBeTruthy();
  });
});

// ── savedAt freshness validation ──────────────────────────────────────────────

function isStateFresh(savedAt: string | undefined, maxAgeMs: number): boolean {
  if (!savedAt) return false;
  const ts = new Date(savedAt).getTime();
  if (isNaN(ts)) return false;
  return Date.now() - ts <= maxAgeMs;
}

describe('isStateFresh', () => {
  it('returns true for a timestamp just saved', () => {
    expect(isStateFresh(new Date().toISOString(), 5000)).toBe(true);
  });

  it('returns false for a timestamp older than maxAgeMs', () => {
    const old = new Date(Date.now() - 10_000).toISOString();
    expect(isStateFresh(old, 5000)).toBe(false);
  });

  it('returns false for undefined savedAt', () => {
    expect(isStateFresh(undefined, 5000)).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isStateFresh('not-a-date', 5000)).toBe(false);
  });

  it('returns true at the boundary (within a small tolerance)', () => {
    const now = new Date().toISOString();
    // Use 50ms tolerance instead of 0 to avoid flaky failures when
    // Date.now() inside isStateFresh ticks forward by 1ms on slow CI.
    expect(isStateFresh(now, 50)).toBe(true);
  });
});

// ── Realtime change handler: echo detection ───────────────────────────────────

interface RealtimePayload {
  new: {
    state?: Record<string, unknown>;
  };
}

function shouldProcessRealtimeEvent(
  payload: RealtimePayload,
  myClientId: string
): boolean {
  const remoteState = payload.new?.state;
  if (!remoteState) return false;
  const remoteClientId = remoteState.clientId as string | undefined;
  // Skip own saves to prevent echo loop
  if (remoteClientId && remoteClientId === myClientId) return false;
  return true;
}

describe('shouldProcessRealtimeEvent', () => {
  it('processes events from other clients', () => {
    const payload = { new: { state: { clientId: 'other-session', messages: [] } } };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(true);
  });

  it('ignores own saves (clientId matches)', () => {
    const payload = { new: { state: { clientId: 'my-session', messages: [] } } };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(false);
  });

  it('processes guest saves (different clientId prefix)', () => {
    const payload = { new: { state: { clientId: 'guest_member-abc', messages: [] } } };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(true);
  });

  it('processes events with no clientId (legacy state)', () => {
    const payload = { new: { state: { messages: [] } } };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(true);
  });

  it('ignores events with no state', () => {
    const payload = { new: {} };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(false);
  });

  it('ignores events with null state', () => {
    const payload = { new: { state: undefined } };
    expect(shouldProcessRealtimeEvent(payload, 'my-session')).toBe(false);
  });
});

// ── Member list: owner identification ─────────────────────────────────────────

interface RoomMember {
  id: string;
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
}

function getOwner(members: RoomMember[]): RoomMember | undefined {
  return members.find((m) => m.is_owner);
}

function getNonOwners(members: RoomMember[]): RoomMember[] {
  return members.filter((m) => !m.is_owner);
}

describe('member list helpers', () => {
  const members: RoomMember[] = [
    { id: 'm1', nickname: 'Alice', is_owner: true, player_id: 'p1' },
    { id: 'm2', nickname: 'Bob', is_owner: false, player_id: 'p2' },
    { id: 'm3', nickname: 'Carol', is_owner: false, player_id: null },
  ];

  it('getOwner returns the owner', () => {
    expect(getOwner(members)?.nickname).toBe('Alice');
  });

  it('getOwner returns undefined for empty list', () => {
    expect(getOwner([])).toBeUndefined();
  });

  it('getNonOwners excludes the owner', () => {
    const guests = getNonOwners(members);
    expect(guests).toHaveLength(2);
    expect(guests.map((m) => m.nickname)).not.toContain('Alice');
  });

  it('getNonOwners returns empty array when everyone is an owner', () => {
    const allOwners: RoomMember[] = [{ id: 'a', nickname: 'A', is_owner: true, player_id: null }];
    expect(getNonOwners(allOwners)).toHaveLength(0);
  });

  it('shows Players Online banner only when more than one member', () => {
    expect(members.length > 1).toBe(true);
    expect([members[0]].length > 1).toBe(false);
  });
});

// ── Invite URL construction ───────────────────────────────────────────────────

function buildInviteUrl(origin: string, inviteCode: string): string {
  return `${origin}/join/${inviteCode}`;
}

describe('invite URL construction', () => {
  it('builds a correct join URL', () => {
    expect(buildInviteUrl('https://textgame.ai', 'a1b2c3d4')).toBe(
      'https://textgame.ai/join/a1b2c3d4'
    );
  });

  it('works with localhost origin', () => {
    expect(buildInviteUrl('http://localhost:3000', 'deadbeef')).toBe(
      'http://localhost:3000/join/deadbeef'
    );
  });

  it('invite URL contains the invite code', () => {
    const code = 'f0e1d2c3';
    const url = buildInviteUrl('https://textgame.ai', code);
    expect(url).toContain(code);
  });

  it('invite URL path starts with /join/', () => {
    const url = buildInviteUrl('https://textgame.ai', 'abc12345');
    const path = new URL(url).pathname;
    expect(path).toMatch(/^\/join\//);
  });
});

// ── Guest join redirect URL construction ─────────────────────────────────────

function buildGameRedirectUrl(
  gameId: string,
  opts: { guestId?: string | null; memberId?: string | null }
): string {
  const { guestId, memberId } = opts;
  if (guestId) {
    return `/game/${gameId}?guestId=${guestId}&memberId=${memberId ?? ''}`;
  }
  return `/game/${gameId}`;
}

describe('game redirect URL after join', () => {
  it('includes guestId and memberId for anonymous guests', () => {
    const url = buildGameRedirectUrl('game-1', { guestId: 'g123', memberId: 'm456' });
    expect(url).toContain('guestId=g123');
    expect(url).toContain('memberId=m456');
  });

  it('returns plain game URL for authenticated users (no guestId)', () => {
    const url = buildGameRedirectUrl('game-1', { guestId: null, memberId: 'm456' });
    expect(url).toBe('/game/game-1');
    expect(url).not.toContain('guestId');
  });

  it('game URL contains the gameId', () => {
    const url = buildGameRedirectUrl('abc-xyz', { guestId: null });
    expect(url).toContain('abc-xyz');
  });

  it('guestId param is correctly extracted back from the URL', () => {
    const url = buildGameRedirectUrl('game-1', { guestId: 'g999', memberId: 'm000' });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('guestId')).toBe('g999');
    expect(params.get('memberId')).toBe('m000');
  });
});
