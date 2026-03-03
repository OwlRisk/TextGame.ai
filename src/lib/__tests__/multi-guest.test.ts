import { describe, it, expect } from 'vitest';

// ─── Multi-Guest Scenarios ────────────────────────────────────────────────────
//
// Tests for situations involving two or more guests in the same game room.
// Scenarios covered:
//
//   A.  Presence: multiple guests joining, leaving, same nickname
//   B.  Auto-trigger: which guest message triggers AI, what gets skipped
//   C.  Message dedup: merging from multiple concurrent guest writes
//   D.  Rate limiting: guests are isolated; different guests don't block each other
//   E.  Join dedup: two guests with the same nickname
//   F.  isGuestWrite guard: multiple consecutive guest writes don't corrupt owner state
//   G.  Fallback upsert race: known data-loss scenario with concurrent fallback writes
//   H.  Message ordering: messages from multiple guests are sorted by timestamp

// ─── Helpers mirroring production code ───────────────────────────────────────

type PresenceEntry = { role?: string; nickname?: string };
type PresenceState = Record<string, PresenceEntry[]>;

function syncGuestsFromState(state: PresenceState): Array<{ id: string; nickname: string }> {
  return Object.entries(state).flatMap(([key, entries]) =>
    entries.filter((p) => p.role === 'guest').map((p) => ({ id: key, nickname: p.nickname ?? 'Guest' }))
  );
}

type Message = {
  id: string;
  timestamp: string | Date;
  isAI?: boolean;
  isGuestMessage?: boolean;
  channelId?: string;
  content?: string;
  senderId?: string;
};

function mergeMessages(local: Message[], remote: Message[]): Message[] {
  const localIds = new Set(local.map((m) => m.id));
  const newMsgs = remote.filter((m) => !localIds.has(m.id));
  if (newMsgs.length === 0) return local;
  const merged = [...local, ...newMsgs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return merged.slice(-100);
}

function isGuestWriteUpdate(clientId: string | undefined): boolean {
  return clientId === 'guest_write';
}

type GuestMsg = { id: string; content: string; channelId?: string };

function shouldTriggerAI(params: {
  isOwner: boolean;
  isRoundInProgress: boolean;
  guestMessages: GuestMsg[];
  lastProcessedId: string | null;
  initialized: boolean;
}): { trigger: false } | { trigger: true; message: GuestMsg; newLastId: string } {
  if (!params.isOwner || params.isRoundInProgress) return { trigger: false };
  if (params.guestMessages.length === 0) return { trigger: false };
  const latest = params.guestMessages[params.guestMessages.length - 1];
  if (!params.initialized) { return { trigger: false }; }
  if (latest.id === params.lastProcessedId) return { trigger: false };
  return { trigger: true, message: latest, newLastId: latest.id };
}

const RATE_LIMIT_MS = 1_000;
function isRateLimited(key: string, now: number, map: Map<string, number>): boolean {
  const last = map.get(key) ?? 0;
  return now - last < RATE_LIMIT_MS;
}

interface MemberRow {
  id: string;
  game_id: string;
  nickname: string;
  is_owner: boolean;
  user_id: string | null;
}

function shouldDeduplicateRow(
  row: MemberRow,
  opts: { gameId: string; normalizedNickname: string; newMemberId: string; effectiveGuestId: string | null },
): boolean {
  if (!opts.effectiveGuestId) return false;
  return (
    row.game_id === opts.gameId &&
    row.nickname === opts.normalizedNickname &&
    !row.is_owner &&
    row.id !== opts.newMemberId &&
    row.user_id === null
  );
}

// Mirrors the fallback upsert logic in message/route.ts
function applyFallbackUpsert(
  currentMessages: unknown[],
  newMessage: unknown,
  maxMsgs = 60,
): unknown[] {
  const trimmed = currentMessages.slice(-(maxMsgs - 1));
  return [...trimmed, newMessage];
}

// ─── A. Presence: multiple guests ────────────────────────────────────────────

describe('A — Presence: multiple guests in the room', () => {
  it('tracks two guests independently by their distinct guestIds (presence keys)', () => {
    const state: PresenceState = {
      'guest-uuid-1': [{ role: 'guest', nickname: 'Alice' }],
      'guest-uuid-2': [{ role: 'guest', nickname: 'Bob' }],
    };
    const guests = syncGuestsFromState(state);
    expect(guests).toHaveLength(2);
    expect(guests.map((g) => g.nickname).sort()).toEqual(['Alice', 'Bob']);
  });

  it('assigns each guest its own presence key (no collision between guests)', () => {
    const state: PresenceState = {
      'uuid-a': [{ role: 'guest', nickname: 'Alice' }],
      'uuid-b': [{ role: 'guest', nickname: 'Bob' }],
    };
    const guests = syncGuestsFromState(state);
    const ids = new Set(guests.map((g) => g.id));
    expect(ids.size).toBe(2); // each guest has a unique id
  });

  it('two guests with the SAME nickname both appear (no merging by name)', () => {
    const state: PresenceState = {
      'uuid-nikki-1': [{ role: 'guest', nickname: 'Nikki' }],
      'uuid-nikki-2': [{ role: 'guest', nickname: 'Nikki' }],
    };
    const guests = syncGuestsFromState(state);
    expect(guests).toHaveLength(2);
    expect(guests.every((g) => g.nickname === 'Nikki')).toBe(true);
    expect(guests.map((g) => g.id).sort()).toEqual(['uuid-nikki-1', 'uuid-nikki-2']);
  });

  it('removing one guest does not affect the other', () => {
    const stateBefore: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-1':  [{ role: 'guest', nickname: 'Alice' }],
      'guest-2':  [{ role: 'guest', nickname: 'Bob' }],
    };
    const stateAfter: PresenceState = {
      'owner-id': [{ role: 'owner' }],
      'guest-2':  [{ role: 'guest', nickname: 'Bob' }],
      // guest-1 left
    };
    expect(syncGuestsFromState(stateBefore)).toHaveLength(2);
    const remaining = syncGuestsFromState(stateAfter);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('guest-2');
    expect(remaining[0].nickname).toBe('Bob');
  });

  it('all guests leave — list becomes empty', () => {
    const state: PresenceState = {
      'owner-id': [{ role: 'owner' }],
    };
    expect(syncGuestsFromState(state)).toHaveLength(0);
  });

  it('five guests in the room — all tracked correctly', () => {
    const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
    const state: PresenceState = Object.fromEntries(
      names.map((n, i) => [`guest-${i}`, [{ role: 'guest', nickname: n }]])
    );
    const guests = syncGuestsFromState(state);
    expect(guests).toHaveLength(5);
    expect(guests.map((g) => g.nickname).sort()).toEqual(names.sort());
  });

  it('owner is never included in the guest list regardless of how many guests exist', () => {
    const state: PresenceState = {
      'owner-uid':  [{ role: 'owner', nickname: 'Host' }],
      'guest-uuid': [{ role: 'guest', nickname: 'Alice' }],
    };
    const guests = syncGuestsFromState(state);
    expect(guests.every((g) => g.id !== 'owner-uid')).toBe(true);
    expect(guests.every((g) => g.nickname !== 'Host')).toBe(true);
  });

  it('guests with no nickname each fall back to "Guest" independently', () => {
    const state: PresenceState = {
      'guest-1': [{ role: 'guest' }],
      'guest-2': [{ role: 'guest' }],
    };
    const guests = syncGuestsFromState(state);
    expect(guests).toHaveLength(2);
    expect(guests.every((g) => g.nickname === 'Guest')).toBe(true);
    // But they still have distinct IDs
    expect(new Set(guests.map((g) => g.id)).size).toBe(2);
  });

  it('mixed: two guests with names + two without — all four appear', () => {
    const state: PresenceState = {
      'g1': [{ role: 'guest', nickname: 'Alice' }],
      'g2': [{ role: 'guest', nickname: 'Bob' }],
      'g3': [{ role: 'guest' }],
      'g4': [{ role: 'guest' }],
    };
    const guests = syncGuestsFromState(state);
    expect(guests).toHaveLength(4);
    expect(guests.filter((g) => g.nickname === 'Guest')).toHaveLength(2);
    expect(guests.filter((g) => g.nickname !== 'Guest')).toHaveLength(2);
  });
});

// ─── B. Auto-trigger: which guest message triggers AI ────────────────────────

describe('B — Auto-trigger: multiple guest messages', () => {
  const make = (id: string, content = 'Hi', channelId = 'general'): GuestMsg => ({ id, content, channelId });
  const base = { isOwner: true, isRoundInProgress: false, initialized: true };

  it('when two guests send messages, only the LATEST triggers AI', () => {
    const result = shouldTriggerAI({ ...base, guestMessages: [make('m1', 'Hello'), make('m2', 'Hi')], lastProcessedId: null });
    expect(result.trigger).toBe(true);
    if (result.trigger) expect(result.message.id).toBe('m2');
  });

  it('the earlier message (m1) is skipped — it never becomes the trigger', () => {
    // m1 arrives, triggers AI → lastProcessedId = m1
    // m2 arrives from another guest → triggers AI for m2
    // Now m1 is forever skipped
    const step1 = shouldTriggerAI({ ...base, guestMessages: [make('m1')], lastProcessedId: null });
    expect(step1.trigger).toBe(true);

    if (step1.trigger) {
      const step2 = shouldTriggerAI({
        ...base,
        guestMessages: [make('m1'), make('m2')],
        lastProcessedId: step1.newLastId, // m1 is now processed
      });
      expect(step2.trigger).toBe(true);
      if (step2.trigger) expect(step2.message.id).toBe('m2');
    }
  });

  it('three guests rapid-fire: trigger only fires once per new latest message', () => {
    // m1 → triggers (initialized)
    const r1 = shouldTriggerAI({ ...base, guestMessages: [make('m1')], lastProcessedId: null });
    expect(r1.trigger).toBe(true);

    // m1 again (same state) → no trigger
    const r2 = shouldTriggerAI({ ...base, guestMessages: [make('m1')], lastProcessedId: 'm1' });
    expect(r2.trigger).toBe(false);

    // m2 arrives → triggers
    const r3 = shouldTriggerAI({ ...base, guestMessages: [make('m1'), make('m2')], lastProcessedId: 'm1' });
    expect(r3.trigger).toBe(true);
    if (r3.trigger) expect(r3.message.id).toBe('m2');

    // m3 arrives → triggers
    const r4 = shouldTriggerAI({ ...base, guestMessages: [make('m1'), make('m2'), make('m3')], lastProcessedId: 'm2' });
    expect(r4.trigger).toBe(true);
    if (r4.trigger) expect(r4.message.id).toBe('m3');
  });

  it('AI round in progress blocks ALL guest messages (regardless of count)', () => {
    const result = shouldTriggerAI({
      isOwner: true, isRoundInProgress: true, initialized: true,
      guestMessages: [make('m1'), make('m2'), make('m3')],
      lastProcessedId: null,
    });
    expect(result.trigger).toBe(false);
  });

  it('on page refresh all pre-existing messages from multiple guests are marked as seen', () => {
    // Simulates: page reloads with 3 guest messages from 2 different guests
    const r = shouldTriggerAI({
      isOwner: true, isRoundInProgress: false,
      guestMessages: [make('old-g1-m1'), make('old-g1-m2'), make('old-g2-m1')],
      lastProcessedId: null,
      initialized: false, // first run after reload
    });
    expect(r.trigger).toBe(false);
  });

  it('after refresh, a new guest message triggers AI even if from a different guest', () => {
    // After the initialization run, lastProcessedId = 'old-g2-m1'
    const r = shouldTriggerAI({
      ...base,
      guestMessages: [make('old-g1-m1'), make('old-g1-m2'), make('old-g2-m1'), make('new-g3-m1')],
      lastProcessedId: 'old-g2-m1',
    });
    expect(r.trigger).toBe(true);
    if (r.trigger) expect(r.message.id).toBe('new-g3-m1');
  });

  it('passes the correct channelId from the triggering guest message', () => {
    const r = shouldTriggerAI({
      ...base,
      guestMessages: [make('m1', 'Hello', 'night-room'), make('m2', 'Hi', 'day-room')],
      lastProcessedId: 'm1',
    });
    expect(r.trigger).toBe(true);
    if (r.trigger) expect(r.message.channelId).toBe('day-room');
  });

  it('two guests sending in different channels: trigger picks the channel of the latest message', () => {
    const msgs = [
      make('m1', 'Hello', 'general'),
      make('m2', 'Secret', 'night-room'), // latest
    ];
    const r = shouldTriggerAI({ ...base, guestMessages: msgs, lastProcessedId: 'm1' });
    expect(r.trigger).toBe(true);
    if (r.trigger) expect(r.message.channelId).toBe('night-room');
  });
});

// ─── C. Message dedup: concurrent writes from multiple guests ─────────────────

describe('C — Message dedup: merging concurrent guest messages', () => {
  const msg = (id: string, ts: string, extra?: Partial<Message>): Message => ({
    id, timestamp: ts, isGuestMessage: true, ...extra,
  });

  it('two guests send simultaneously — both messages are present after merge', () => {
    const local: Message[] = [];
    const remote: Message[] = [msg('m-alice', '2024-01-01T00:00:01Z'), msg('m-bob', '2024-01-01T00:00:02Z')];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toContain('m-alice');
    expect(result.map((m) => m.id)).toContain('m-bob');
  });

  it('messages from two guests are sorted by timestamp (not insertion order)', () => {
    const local: Message[] = [msg('m-bob', '2024-01-01T00:00:02Z')];
    const remote: Message[] = [msg('m-alice', '2024-01-01T00:00:01Z')];
    const result = mergeMessages(local, remote);
    expect(result[0].id).toBe('m-alice'); // earlier
    expect(result[1].id).toBe('m-bob');   // later
  });

  it('same message from two concurrent Realtime pushes is deduplicated (ID-based)', () => {
    const existing: Message[] = [msg('m-alice', '2024-01-01T00:00:01Z')];
    const remote: Message[] = [msg('m-alice', '2024-01-01T00:00:01Z')]; // same ID again
    const result = mergeMessages(existing, remote);
    expect(result).toHaveLength(1);
  });

  it('local has m1 from GuestA, remote has both m1 (echo) and m2 from GuestB — result has both, no dup', () => {
    const local: Message[] = [msg('m1', '2024-01-01T00:00:01Z')];
    const remote: Message[] = [
      msg('m1', '2024-01-01T00:00:01Z'), // echo of already-known m1
      msg('m2', '2024-01-01T00:00:02Z'), // new from GuestB
    ];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(2);
    expect(result.filter((m) => m.id === 'm1')).toHaveLength(1);
  });

  it('owner already has 5 guest messages; 3 more arrive from 3 different guests — total 8', () => {
    const local = Array.from({ length: 5 }, (_, i) => msg(`m${i}`, `2024-01-01T00:00:0${i}Z`));
    const remote = [
      msg('m5', '2024-01-01T00:00:05Z'),
      msg('m6', '2024-01-01T00:00:06Z'),
      msg('m7', '2024-01-01T00:00:07Z'),
    ];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(8);
  });

  it('100-message cap: when 3 guests flood messages, only newest 100 are kept', () => {
    const local = Array.from({ length: 98 }, (_, i) =>
      msg(`old-${i}`, `2024-01-01T00:00:${String(i).padStart(2, '0')}Z`)
    );
    const remote = [
      msg('new-a', '2024-01-01T00:01:39Z'),
      msg('new-b', '2024-01-01T00:01:40Z'),
      msg('new-c', '2024-01-01T00:01:41Z'),
    ];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(100);
    expect(result.map((m) => m.id)).toContain('new-a');
    expect(result.map((m) => m.id)).toContain('new-b');
    expect(result.map((m) => m.id)).toContain('new-c');
  });

  it('merge is idempotent: calling it twice with the same remote state produces the same result', () => {
    const local: Message[] = [msg('m1', '2024-01-01T00:00:01Z')];
    const remote: Message[] = [msg('m1', '2024-01-01T00:00:01Z'), msg('m2', '2024-01-01T00:00:02Z')];
    const r1 = mergeMessages(local, remote);
    const r2 = mergeMessages(r1, remote); // call again with same remote
    expect(r2).toHaveLength(r1.length);
    expect(r2.map((m) => m.id)).toEqual(r1.map((m) => m.id));
  });
});

// ─── D. Rate limiting: guests are independent ────────────────────────────────

describe('D — Rate limiting: multiple guests do not block each other', () => {
  it('GuestA rate-limited does NOT block GuestB', () => {
    const map = new Map<string, number>();
    const now = 10_000;
    // GuestA just sent
    map.set('game1:member-A', now - 500); // 500ms ago → rate-limited

    expect(isRateLimited('game1:member-A', now, map)).toBe(true);   // A is blocked
    expect(isRateLimited('game1:member-B', now, map)).toBe(false);  // B is free
  });

  it('two guests in different rooms never share a rate limit key', () => {
    const map = new Map<string, number>();
    const now = 10_000;
    map.set('game1:member-A', now - 500);

    // Same memberId but different gameId → different key
    expect(isRateLimited('game2:member-A', now, map)).toBe(false);
  });

  it('three guests all send within 100ms of each other — all pass rate limit', () => {
    const map = new Map<string, number>();
    const now = 10_000;
    ['member-A', 'member-B', 'member-C'].forEach((id) => {
      expect(isRateLimited(`game1:${id}`, now, map)).toBe(false);
      map.set(`game1:${id}`, now);
    });
  });

  it('same guest blocked twice in a row, then allowed after 1 s', () => {
    const map = new Map<string, number>([['g:m', 1_000]]);

    expect(isRateLimited('g:m', 1_500, map)).toBe(true);  // 500ms later → blocked
    expect(isRateLimited('g:m', 2_000, map)).toBe(false); // 1000ms later → allowed
    map.set('g:m', 2_000);
    expect(isRateLimited('g:m', 2_500, map)).toBe(true);  // 500ms after that → blocked again
  });

  it('rate limit keys for N guests in same game are all distinct', () => {
    const n = 10;
    const keys = Array.from({ length: n }, (_, i) => `game1:member-${i}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(n);
  });
});

// ─── E. Join dedup: two guests with the same nickname ────────────────────────

describe('E — Join dedup: same nickname, different guestIds', () => {
  const game = 'game1';

  it('GuestA joins first → GuestB joins with same nickname → GuestA row is marked for deletion', () => {
    const guestARow: MemberRow = { id: 'member-A', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null };
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'member-B', effectiveGuestId: 'uuid-B' };
    expect(shouldDeduplicateRow(guestARow, opts)).toBe(true);
  });

  it('GuestB cannot delete its own newly created row', () => {
    const selfRow: MemberRow = { id: 'member-B', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null };
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'member-B', effectiveGuestId: 'uuid-B' };
    expect(shouldDeduplicateRow(selfRow, opts)).toBe(false);
  });

  it('two stale ghost rows with same nickname are both scheduled for deletion', () => {
    const rows: MemberRow[] = [
      { id: 'ghost-1', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
      { id: 'ghost-2', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
      { id: 'member-B', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
    ];
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'member-B', effectiveGuestId: 'uuid-B' };
    const toDelete = rows.filter((r) => shouldDeduplicateRow(r, opts));
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((r) => r.id).sort()).toEqual(['ghost-1', 'ghost-2']);
  });

  it('a guest with a different nickname is NOT deleted when the same-nickname dedup runs', () => {
    const ottoRow: MemberRow = { id: 'member-otto', game_id: game, nickname: 'Otto', is_owner: false, user_id: null };
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'member-B', effectiveGuestId: 'uuid-B' };
    expect(shouldDeduplicateRow(ottoRow, opts)).toBe(false);
  });

  it('after dedup, only the new member row remains in the list', () => {
    const rows: MemberRow[] = [
      { id: 'old-nikki', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
      { id: 'new-nikki', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
      { id: 'otto',      game_id: game, nickname: 'Otto',  is_owner: false, user_id: null },
      { id: 'owner',     game_id: game, nickname: 'Host',  is_owner: true,  user_id: null },
    ];
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'new-nikki', effectiveGuestId: 'uuid-new' };
    const surviving = rows.filter((r) => !shouldDeduplicateRow(r, opts));
    expect(surviving.map((r) => r.id).sort()).toEqual(['new-nikki', 'otto', 'owner'].sort());
  });

  it('dedup does not run for an authenticated user join (effectiveGuestId = null)', () => {
    const rows: MemberRow[] = [
      { id: 'ghost-1', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
      { id: 'auth-row', game_id: game, nickname: 'Nikki', is_owner: false, user_id: null },
    ];
    const opts = { gameId: game, normalizedNickname: 'Nikki', newMemberId: 'auth-row', effectiveGuestId: null };
    const toDelete = rows.filter((r) => shouldDeduplicateRow(r, opts));
    expect(toDelete).toHaveLength(0);
  });
});

// ─── F. isGuestWrite guard: consecutive guest writes ─────────────────────────

describe('F — isGuestWrite guard: multiple consecutive guest writes', () => {
  // When any guest sends a message the Realtime push carries clientId = "guest_write".
  // The owner's mergeRemoteState must skip players/gamePhase/etc. on EVERY such event.

  it('first guest write → guard activates', () => {
    expect(isGuestWriteUpdate('guest_write')).toBe(true);
  });

  it('second guest write from a different guest → guard still activates', () => {
    expect(isGuestWriteUpdate('guest_write')).toBe(true);
  });

  it('owner write (has a real clientId) → guard does NOT activate', () => {
    expect(isGuestWriteUpdate('client-abc123')).toBe(false);
  });

  it('undefined clientId (old DB rows with no clientId) → guard does NOT activate', () => {
    expect(isGuestWriteUpdate(undefined)).toBe(false);
  });

  it('guard is consistent across N sequential guest writes', () => {
    const writes = Array.from({ length: 20 }, () => 'guest_write');
    writes.forEach((clientId) => expect(isGuestWriteUpdate(clientId)).toBe(true));
  });

  it('guard correctly separates 10 guest writes from 5 owner writes', () => {
    const events = [
      ...Array(10).fill('guest_write'),
      ...['c1', 'c2', 'c3', 'c4', 'c5'],
    ];
    const guestCount = events.filter(isGuestWriteUpdate).length;
    const ownerCount = events.filter((e) => !isGuestWriteUpdate(e)).length;
    expect(guestCount).toBe(10);
    expect(ownerCount).toBe(5);
  });
});

// ─── G. Fallback upsert race condition ───────────────────────────────────────
// When the RPC is unavailable, the fallback does read-modify-write.
// Two concurrent fallback writes can overwrite each other — this is a known bug.

describe('G — Fallback upsert race condition (known data-loss scenario)', () => {
  it('sequential fallback writes both survive', () => {
    const initial: unknown[] = [];
    const afterAlice = applyFallbackUpsert(initial, { id: 'm1', content: 'Hello from Alice' });
    const afterBob   = applyFallbackUpsert(afterAlice, { id: 'm2', content: 'Hello from Bob' });
    expect(afterBob).toHaveLength(2);
  });

  it('CONCURRENT writes: last writer wins, first write is LOST (known bug)', () => {
    // Both read the same initial state [] at time T
    const initial: unknown[] = [];

    // Alice reads [] → appends her message → writes [m-alice]
    const aliceResult = applyFallbackUpsert(initial, { id: 'm-alice' });

    // Bob reads [] (stale!) → appends his message → writes [m-bob]
    const bobResult = applyFallbackUpsert(initial, { id: 'm-bob' });

    // Bob's write lands last and overwrites Alice's
    // Whoever lands last in the DB wins — Alice's message is gone
    expect(aliceResult).toHaveLength(1); // Alice's version
    expect(bobResult).toHaveLength(1);   // Bob's version overwrites Alice's
    // The final DB state is bobResult — m-alice is LOST
    expect(bobResult.map((m: unknown) => (m as {id:string}).id)).not.toContain('m-alice');
  });

  it('RPC atomic path prevents data loss: sequential appends both survive', () => {
    // This documents the CORRECT behavior that the RPC provides.
    // In the RPC, the FOR UPDATE lock prevents concurrent overwrites.
    // Here we simulate sequential (serialized) appends as the RPC would do:
    const db: unknown[] = [];
    db.push({ id: 'm-alice' }); // "locked" append
    db.push({ id: 'm-bob' });   // "locked" append after alice
    expect(db).toHaveLength(2);
    expect(db.map((m: unknown) => (m as {id:string}).id)).toContain('m-alice');
    expect(db.map((m: unknown) => (m as {id:string}).id)).toContain('m-bob');
  });

  it('fallback trimming: 60 messages from many guests keeps only latest 59 + new', () => {
    const initial = Array.from({ length: 60 }, (_, i) => ({ id: `old-${i}` }));
    const result = applyFallbackUpsert(initial, { id: 'new-from-carol' }, 60);
    expect(result).toHaveLength(60); // maxMsgs = 60
    expect(result[result.length - 1]).toEqual({ id: 'new-from-carol' });
    expect(result.map((m: unknown) => (m as {id:string}).id)).not.toContain('old-0');
  });

  it('fallback upsert always places the new message at the end', () => {
    const existing = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
    const result = applyFallbackUpsert(existing, { id: 'm4' });
    expect(result[result.length - 1]).toEqual({ id: 'm4' });
  });
});

// ─── H. Message ordering from multiple guests ────────────────────────────────

describe('H — Message ordering: concurrent messages from multiple guests', () => {
  const msg = (id: string, ts: string): Message => ({ id, timestamp: ts, isGuestMessage: true });

  it('messages arrive out of order — sorted by timestamp after merge', () => {
    const local: Message[]  = [msg('m-bob',   '2024-01-01T10:00:02Z')];
    const remote: Message[] = [msg('m-alice', '2024-01-01T10:00:01Z')]; // earlier, arrived late
    const result = mergeMessages(local, remote);
    expect(result[0].id).toBe('m-alice');
    expect(result[1].id).toBe('m-bob');
  });

  it('five guests send within the same second — all preserved and sorted', () => {
    const guests = ['alice', 'bob', 'carol', 'dave', 'eve'];
    const remote: Message[] = guests.map((name, i) =>
      msg(`m-${name}`, `2024-01-01T10:00:00.${String(i * 100).padStart(3, '0')}Z`)
    );
    const result = mergeMessages([], remote);
    expect(result).toHaveLength(5);
    // Sorted ascending: alice (earliest) → eve (latest)
    expect(result.map((m) => m.id)).toEqual(guests.map((n) => `m-${n}`));
  });

  it('AI messages interleaved with guest messages are included and sorted correctly', () => {
    const all: Message[] = [
      { id: 'ai-1',     timestamp: '2024-01-01T10:00:03Z', isAI: true,          isGuestMessage: false },
      { id: 'm-alice',  timestamp: '2024-01-01T10:00:01Z', isAI: false,         isGuestMessage: true  },
      { id: 'm-bob',    timestamp: '2024-01-01T10:00:05Z', isAI: false,         isGuestMessage: true  },
      { id: 'ai-2',     timestamp: '2024-01-01T10:00:07Z', isAI: true,          isGuestMessage: false },
      { id: 'm-carol',  timestamp: '2024-01-01T10:00:09Z', isAI: false,         isGuestMessage: true  },
    ];
    const result = mergeMessages([], all);
    const ids = result.map((m) => m.id);
    expect(ids).toEqual(['m-alice', 'ai-1', 'm-bob', 'ai-2', 'm-carol']);
  });

  it('guest messages in different channels are all included in the merged list', () => {
    const local: Message[] = [
      { id: 'm1', timestamp: '2024-01-01T10:00:01Z', channelId: 'general',    isGuestMessage: true },
      { id: 'm2', timestamp: '2024-01-01T10:00:02Z', channelId: 'night-room', isGuestMessage: true },
    ];
    const remote: Message[] = [
      { id: 'm3', timestamp: '2024-01-01T10:00:03Z', channelId: 'general',    isGuestMessage: true },
      { id: 'm4', timestamp: '2024-01-01T10:00:04Z', channelId: 'night-room', isGuestMessage: true },
    ];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(4);
    const channels = new Set(result.map((m) => m.channelId));
    expect(channels).toContain('general');
    expect(channels).toContain('night-room');
  });

  it('100-message cap preserves messages from ALL guests (not just one)', () => {
    // 30 messages each from 3 guests = 90, plus 15 more from each of 2 guests = 30, total 120
    const messages: Message[] = [];
    for (let i = 0; i < 40; i++) {
      messages.push(msg(`alice-${i}`, `2024-01-01T10:00:${String(i).padStart(2,'0')}Z`));
      messages.push(msg(`bob-${i}`,   `2024-01-01T10:01:${String(i).padStart(2,'0')}Z`));
      messages.push(msg(`carol-${i}`, `2024-01-01T10:02:${String(i).padStart(2,'0')}Z`));
    }
    const result = mergeMessages([], messages);
    expect(result).toHaveLength(100);
    // The newest 100 should include messages from all three guests
    const senders = new Set(result.map((m) => m.id.split('-')[0]));
    expect(senders).toContain('alice');
    expect(senders).toContain('bob');
    expect(senders).toContain('carol');
  });
});
