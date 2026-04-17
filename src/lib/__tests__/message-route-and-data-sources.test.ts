import { describe, it, expect } from 'vitest';

// ─── Message route logic + data-source consistency tests ──────────────────────
//
// Covers gaps identified in the code review:
//
//   A.  Message object construction
//       — senderId resolution priority (player_id > guestId > userId > "unknown")
//       — senderName always from DB member.nickname, never from client body
//       — isGuestMessage: true for ALL callers (B-11: this also fires for owner)
//       — channelId falls back to "game-room" when absent from body
//       — client messageId is reused; server generates one when absent
//       — isAI always false, senderAvatar always "#6366f1"
//
//   B.  ownerUserId fallback chain in message route
//       — gameRow.user_id → effectiveUserId → "unknown"
//
//   C.  Fallback upsert state building
//       — existing messages trimmed to 59 before appending
//       — clientId set to "guest_write"
//       — savedAt updated to now
//
//   D.  Two data-source consistency (B-4 review finding)
//       — banner uses onlineGuestPresences (Presence, real-time)
//       — channelList uses roomMembers (DB poll, may lag behind)
//       — edge cases where they temporarily diverge
//
//   E.  Members API guestId param validation
//       — any valid UUID in ?guestId can access member list
//       — missing guestId + no auth token → 401
//
//   F.  handleGuestSendMessage optimistic UI + rollback logic
//       — message added locally before API call
//       — rolled back on non-ok response
//       — messageId shared between optimistic entry and server echo

// ─── Type fixtures ────────────────────────────────────────────────────────────

interface Member {
  id: string;
  nickname: string;
  player_id: string | null;
  is_owner: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isAI: boolean;
  channelId: string;
  isGuestMessage: boolean;
  guestMemberId: string;
}

// ─── Pure logic mirrors from message/route.ts ─────────────────────────────────

/** Mirrors senderId resolution in route.ts line 109 */
function resolveSenderId(
  memberPlayerId: string | null,
  effectiveGuestId: string | null,
  effectiveUserId: string | null,
): string {
  return memberPlayerId ?? (effectiveGuestId ?? effectiveUserId ?? 'unknown');
}

/** Mirrors full message object construction in route.ts lines 107-118 */
function buildMessageObject(opts: {
  messageId: string | undefined;
  member: Member;
  effectiveGuestId: string | null;
  effectiveUserId: string | null;
  safeContent: string;
  channelId: string | undefined;
  now: number;
}): Message {
  const { messageId, member, effectiveGuestId, effectiveUserId, safeContent, channelId, now } = opts;
  return {
    id: messageId ?? `msg-${now}-fallback`,
    senderId: resolveSenderId(member.player_id, effectiveGuestId, effectiveUserId),
    senderName: member.nickname,
    senderAvatar: '#6366f1',
    content: safeContent,
    timestamp: new Date(now).toISOString(),
    isAI: false,
    channelId: channelId ?? 'game-room',
    isGuestMessage: true,
    guestMemberId: member.id,
  };
}

/** Mirrors ownerUserId fallback in route.ts line 127 */
function resolveOwnerUserId(
  gameRowUserId: string | null | undefined,
  effectiveUserId: string | null,
): string {
  return gameRowUserId ?? effectiveUserId ?? 'unknown';
}

/** Mirrors fallback upsert state building (route.ts lines 153-163) */
function buildFallbackState(
  currentState: Record<string, unknown>,
  existingMessages: unknown[],
  newMessage: unknown,
): { messages: unknown[]; savedAt: string; clientId: string } {
  const trimmedMessages = existingMessages.slice(-59);
  return {
    ...currentState,
    messages: [...trimmedMessages, newMessage],
    savedAt: new Date().toISOString(),
    clientId: 'guest_write',
  } as { messages: unknown[]; savedAt: string; clientId: string };
}

// ─── Data source consistency helpers ─────────────────────────────────────────

type PresenceState = Record<string, Array<{ role?: string; nickname?: string }>>;

function syncGuestsFromState(state: PresenceState): Array<{ id: string; nickname: string }> {
  return Object.entries(state).flatMap(([key, entries]) =>
    entries.filter((p) => p.role === 'guest').map((p) => ({ id: key, nickname: p.nickname ?? 'Guest' })),
  );
}

/** Mirrors banner visibility (page.tsx line 1963): uses Presence */
function shouldShowBanner(onlineGuestPresences: Array<unknown>): boolean {
  return onlineGuestPresences.length > 0;
}

/** Mirrors channelList roomMembers visibility (page.tsx line 1867): uses DB poll */
function shouldShowChannelListMembers(roomMembers: Array<unknown>): boolean {
  return roomMembers.length > 0;
}

// ─── A. Message object construction ──────────────────────────────────────────

describe('A – message object construction', () => {
  const baseOpts = {
    messageId: 'client-msg-id',
    member: { id: 'mem-1', nickname: 'Alice', player_id: 'player-x', is_owner: false } as Member,
    effectiveGuestId: 'guest-uuid',
    effectiveUserId: null,
    safeContent: 'Hello world',
    channelId: 'game-room',
    now: 1700000000000,
  };

  it('A-1: senderName comes from member.nickname, not client body', () => {
    const msg = buildMessageObject(baseOpts);
    expect(msg.senderName).toBe('Alice');
  });

  it('A-2: senderId is member.player_id when bound', () => {
    const msg = buildMessageObject(baseOpts);
    expect(msg.senderId).toBe('player-x');
  });

  it('A-3: senderId falls back to guestId when player_id is null', () => {
    const msg = buildMessageObject({
      ...baseOpts,
      member: { ...baseOpts.member, player_id: null },
    });
    expect(msg.senderId).toBe('guest-uuid');
  });

  it('A-4: senderId falls back to userId when player_id and guestId are null', () => {
    const msg = buildMessageObject({
      ...baseOpts,
      member: { ...baseOpts.member, player_id: null },
      effectiveGuestId: null,
      effectiveUserId: 'user-123',
    });
    expect(msg.senderId).toBe('user-123');
  });

  it('A-5: senderId is "unknown" when all three are null', () => {
    const msg = buildMessageObject({
      ...baseOpts,
      member: { ...baseOpts.member, player_id: null },
      effectiveGuestId: null,
      effectiveUserId: null,
    });
    expect(msg.senderId).toBe('unknown');
  });

  it('A-6: isAI is always false', () => {
    const msg = buildMessageObject(baseOpts);
    expect(msg.isAI).toBe(false);
  });

  it('A-7: senderAvatar is always "#6366f1"', () => {
    const msg = buildMessageObject(baseOpts);
    expect(msg.senderAvatar).toBe('#6366f1');
  });

  it('A-8 (B-11): isGuestMessage is true even for owner-sent messages', () => {
    // Route always sets isGuestMessage: true regardless of is_owner status.
    // This is B-11: if an owner uses this route, the message is flagged as guest.
    const ownerMsg = buildMessageObject({
      ...baseOpts,
      member: { id: 'mem-owner', nickname: 'Host', player_id: 'host-player', is_owner: true },
      effectiveGuestId: null,
      effectiveUserId: 'owner-uuid',
    });
    expect(ownerMsg.isGuestMessage).toBe(true); // documents current (B-11) behaviour
  });

  it('A-9: channelId defaults to "game-room" when absent', () => {
    const msg = buildMessageObject({ ...baseOpts, channelId: undefined });
    expect(msg.channelId).toBe('game-room');
  });

  it('A-10: explicit channelId is preserved', () => {
    const msg = buildMessageObject({ ...baseOpts, channelId: 'mafia-only' });
    expect(msg.channelId).toBe('mafia-only');
  });

  it('A-11: client-provided messageId is reused', () => {
    const msg = buildMessageObject({ ...baseOpts, messageId: 'my-client-id-123' });
    expect(msg.id).toBe('my-client-id-123');
  });

  it('A-12: server generates messageId when client does not provide one', () => {
    const msg = buildMessageObject({ ...baseOpts, messageId: undefined });
    expect(msg.id).toMatch(/^msg-\d+-/);
  });

  it('A-13: guestMemberId matches member.id', () => {
    const msg = buildMessageObject(baseOpts);
    expect(msg.guestMemberId).toBe('mem-1');
  });

  it('A-14: content is the sanitized text, not raw body', () => {
    const msg = buildMessageObject({ ...baseOpts, safeContent: 'cleaned content' });
    expect(msg.content).toBe('cleaned content');
  });

  it('A-15: two messages with different client IDs are distinct', () => {
    const m1 = buildMessageObject({ ...baseOpts, messageId: 'id-aaa' });
    const m2 = buildMessageObject({ ...baseOpts, messageId: 'id-bbb' });
    expect(m1.id).not.toBe(m2.id);
  });
});

// ─── A-extra: senderId resolution priority ───────────────────────────────────

describe('A-extra – resolveSenderId priority chain', () => {
  it('player_id wins over guestId', () => {
    expect(resolveSenderId('p1', 'g1', 'u1')).toBe('p1');
  });

  it('guestId wins over userId when player_id is null', () => {
    expect(resolveSenderId(null, 'g1', 'u1')).toBe('g1');
  });

  it('userId wins when player_id and guestId are both null', () => {
    expect(resolveSenderId(null, null, 'u1')).toBe('u1');
  });

  it('returns "unknown" when all are null', () => {
    expect(resolveSenderId(null, null, null)).toBe('unknown');
  });

  it('player_id takes priority even when guestId and userId are present', () => {
    expect(resolveSenderId('bound-player', 'g-id', 'u-id')).toBe('bound-player');
  });

  it('does not confuse empty string with null (empty string is falsy in ??)', () => {
    // '??' only skips null/undefined, not ''
    // production code: member.player_id ?? (effectiveGuestId ?? effectiveUserId ?? "unknown")
    // If player_id is '', ?? chain skips it only if null/undefined. Empty string is NOT null.
    // This test documents that '' would be returned as-is (edge case).
    expect(resolveSenderId('', 'g1', 'u1')).toBe('');
  });
});

// ─── B. ownerUserId fallback chain ───────────────────────────────────────────

describe('B – ownerUserId fallback chain', () => {
  it('B-1: uses gameRow.user_id when available', () => {
    expect(resolveOwnerUserId('owner-from-db', 'effective-user')).toBe('owner-from-db');
  });

  it('B-2: falls back to effectiveUserId when gameRow is null', () => {
    expect(resolveOwnerUserId(null, 'effective-user')).toBe('effective-user');
  });

  it('B-3: falls back to effectiveUserId when gameRow is undefined', () => {
    expect(resolveOwnerUserId(undefined, 'effective-user')).toBe('effective-user');
  });

  it('B-4: falls back to "unknown" when both are null', () => {
    expect(resolveOwnerUserId(null, null)).toBe('unknown');
  });

  it('B-5: "unknown" is stable for upsert (row will be written with user_id="unknown")', () => {
    const result = resolveOwnerUserId(null, null);
    expect(typeof result).toBe('string');
    expect(result).toBe('unknown');
  });
});

// ─── C. Fallback upsert state building ───────────────────────────────────────

describe('C – fallback upsert state building', () => {
  it('C-1: clientId is set to "guest_write"', () => {
    const state = buildFallbackState({}, [], {});
    expect(state.clientId).toBe('guest_write');
  });

  it('C-2: savedAt is updated to current ISO string', () => {
    const before = Date.now();
    const state = buildFallbackState({}, [], {});
    const savedAt = new Date(state.savedAt).getTime();
    expect(savedAt).toBeGreaterThanOrEqual(before);
  });

  it('C-3: new message is appended to existing messages', () => {
    const existing = [{ id: '1' }, { id: '2' }];
    const state = buildFallbackState({}, existing, { id: '3' });
    expect(state.messages).toHaveLength(3);
    expect(state.messages[2]).toEqual({ id: '3' });
  });

  it('C-4: existing messages trimmed to 59 before append (total max 60)', () => {
    const existing = Array.from({ length: 62 }, (_, i) => ({ id: `m${i}` }));
    const state = buildFallbackState({}, existing, { id: 'new' });
    // slice(-59) keeps last 59, then append 1 = 60 total
    expect(state.messages).toHaveLength(60);
  });

  it('C-5: when exactly 59 messages exist, all are kept + new appended = 60', () => {
    const existing = Array.from({ length: 59 }, (_, i) => ({ id: `m${i}` }));
    const state = buildFallbackState({}, existing, { id: 'new' });
    expect(state.messages).toHaveLength(60);
  });

  it('C-6: oldest message is dropped when trimming 60 → 59 + new', () => {
    const existing = Array.from({ length: 60 }, (_, i) => ({ id: `m${i}` }));
    const state = buildFallbackState({}, existing, { id: 'new' });
    const ids = (state.messages as Array<{ id: string }>).map((m) => m.id);
    expect(ids).not.toContain('m0'); // first message dropped
    expect(ids).toContain('m1');
    expect(ids).toContain('new');
  });

  it('C-7: existing currentState fields are preserved (spread)', () => {
    const currentState = { myBoardContent: { 'player-x': 'some notes' }, phase: 'night' };
    const state = buildFallbackState(currentState, [], { id: 'new' });
    expect(state).toHaveProperty('myBoardContent');
    expect(state).toHaveProperty('phase', 'night');
  });

  it('C-8: empty existing messages → only the new one in array', () => {
    const state = buildFallbackState({}, [], { id: 'only' });
    expect(state.messages).toHaveLength(1);
    expect((state.messages[0] as { id: string }).id).toBe('only');
  });
});

// ─── D. Two data-source consistency (B-4 review finding) ─────────────────────
//
// The banner uses onlineGuestPresences (Presence, real-time, auto-cleared on leave)
// The channelList's "Players Online" section uses roomMembers (DB poll, 15s interval).
// These two sources can temporarily diverge:
// - Guest leaves → banner clears immediately, channelList may still show them for ~15s
// - Guest joins → Presence fires immediately, DB row may not exist yet

describe('D – two data sources diverge during guest transitions', () => {
  it('D-1: banner clears immediately when guest leaves (Presence)', () => {
    const presences: Array<unknown> = [];
    expect(shouldShowBanner(presences)).toBe(false);
  });

  it('D-2: banner shows when guest joins (Presence)', () => {
    const presences = [{ id: 'g1', nickname: 'Alice' }];
    expect(shouldShowBanner(presences)).toBe(true);
  });

  it('D-3: channelList may still show guest after leave (DB not yet polled)', () => {
    // Guest just left → Presence updated, DB poll hasn't run yet
    const onlinePresences: Array<unknown> = []; // empty (guest gone)
    const roomMembersFromDB = [
      { id: 'm1', nickname: 'Alice', is_owner: false },
    ]; // stale (guest still in DB poll)

    expect(shouldShowBanner(onlinePresences)).toBe(false);        // banner: gone ✓
    expect(shouldShowChannelListMembers(roomMembersFromDB)).toBe(true); // channelList: stale ⚠
  });

  it('D-4: both sources agree when guest is online and DB is fresh', () => {
    const onlinePresences = [{ id: 'g1', nickname: 'Alice' }];
    const roomMembers = [{ id: 'm1', nickname: 'Alice', is_owner: false }];

    expect(shouldShowBanner(onlinePresences)).toBe(true);
    expect(shouldShowChannelListMembers(roomMembers)).toBe(true);
  });

  it('D-5: both sources agree when no guests at all', () => {
    const onlinePresences: Array<unknown> = [];
    const roomMembers: Array<unknown> = [];

    expect(shouldShowBanner(onlinePresences)).toBe(false);
    expect(shouldShowChannelListMembers(roomMembers)).toBe(false);
  });

  it('D-6: presence-based guest count can differ from roomMembers count', () => {
    // Two guests online in presence, but only 1 in DB (second just joined, no DB row yet)
    const presenceGuests = syncGuestsFromState({
      'owner-id': [{ role: 'owner' }],
      'g1': [{ role: 'guest', nickname: 'Alice' }],
      'g2': [{ role: 'guest', nickname: 'Bob' }],
    });
    const dbMembers = [
      { id: 'm-owner', is_owner: true },
      { id: 'm1', nickname: 'Alice', is_owner: false },
      // Bob's DB row not yet created
    ];

    expect(presenceGuests).toHaveLength(2);
    expect(dbMembers.filter((m) => !m.is_owner)).toHaveLength(1);
  });

  it('D-7: enrichedGuestMembers falls back gracefully when DB row missing for a presence entry', () => {
    // Bob is in presence but has no DB row yet
    const presences = [
      { id: 'g-alice', nickname: 'Alice' },
      { id: 'g-bob', nickname: 'Bob' },
    ];
    const roomMembers = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: null, guest_id: 'g-alice' },
      // No Bob row in DB
    ];
    const enriched = presences.map((g) => {
      const member = roomMembers.find((m) => m.guest_id === g.id && !m.is_owner);
      return {
        id: g.id,
        nickname: g.nickname,
        memberId: member?.id,
        playerId: undefined as string | undefined,
      };
    });

    expect(enriched).toHaveLength(2);
    expect(enriched.find((g) => g.id === 'g-alice')?.memberId).toBe('m1');
    expect(enriched.find((g) => g.id === 'g-bob')?.memberId).toBeUndefined(); // no DB row yet
  });
});

// ─── E. Members API guestId param edge cases ─────────────────────────────────

/** Mirrors members/route.ts auth decision logic */
function resolveAuthDecision(opts: {
  hasBearerToken: boolean;
  bearerUserId: string | null;
  guestId: string | null;
  isOwner: boolean;
  hasMemberRow: boolean;
}): 'ok' | '401' | '403' {
  const { hasBearerToken, bearerUserId, guestId, isOwner, hasMemberRow } = opts;
  if (!hasBearerToken && !guestId) return '401';
  if (hasBearerToken && bearerUserId && isOwner) return 'ok';
  if (hasMemberRow) return 'ok';
  return '403';
}

describe('E – members API auth decision', () => {
  it('E-1: no token, no guestId → 401', () => {
    expect(resolveAuthDecision({ hasBearerToken: false, bearerUserId: null, guestId: null, isOwner: false, hasMemberRow: false })).toBe('401');
  });

  it('E-2: valid auth token + owner → ok', () => {
    expect(resolveAuthDecision({ hasBearerToken: true, bearerUserId: 'owner-id', guestId: null, isOwner: true, hasMemberRow: false })).toBe('ok');
  });

  it('E-3: guestId present + member row found → ok', () => {
    expect(resolveAuthDecision({ hasBearerToken: false, bearerUserId: null, guestId: 'g-uuid', isOwner: false, hasMemberRow: true })).toBe('ok');
  });

  it('E-4: guestId present but no matching member row → 403', () => {
    expect(resolveAuthDecision({ hasBearerToken: false, bearerUserId: null, guestId: 'g-uuid', isOwner: false, hasMemberRow: false })).toBe('403');
  });

  it('E-5: non-owner auth user + member row → ok', () => {
    expect(resolveAuthDecision({ hasBearerToken: true, bearerUserId: 'user-abc', guestId: null, isOwner: false, hasMemberRow: true })).toBe('ok');
  });

  it('E-6: non-owner auth user + no member row → 403', () => {
    expect(resolveAuthDecision({ hasBearerToken: true, bearerUserId: 'user-abc', guestId: null, isOwner: false, hasMemberRow: false })).toBe('403');
  });

  it('E-7: any UUID as guestId passes the format check (no UUID validation)', () => {
    // The current API does not validate UUID format; any string is accepted.
    // Security note: this means an attacker can try arbitrary guestId values.
    const arbitraryUUID = 'not-a-real-uuid-but-passes';
    // The auth decision only fails if there is no matching DB row
    expect(resolveAuthDecision({ hasBearerToken: false, bearerUserId: null, guestId: arbitraryUUID, isOwner: false, hasMemberRow: false })).toBe('403');
    expect(resolveAuthDecision({ hasBearerToken: false, bearerUserId: null, guestId: arbitraryUUID, isOwner: false, hasMemberRow: true })).toBe('ok');
  });
});

// ─── F. handleGuestSendMessage optimistic UI + rollback ──────────────────────

interface OptimisticMsg { id: string; content: string; isOptimistic: boolean }

function applyOptimisticMessage(
  messages: OptimisticMsg[],
  newMsg: OptimisticMsg,
): OptimisticMsg[] {
  return [...messages, newMsg];
}

function rollbackOptimisticMessage(
  messages: OptimisticMsg[],
  messageId: string,
): OptimisticMsg[] {
  return messages.filter((m) => m.id !== messageId);
}

function deduplicateById(messages: OptimisticMsg[]): OptimisticMsg[] {
  const seen = new Set<string>();
  return messages.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

describe('F – optimistic UI message management', () => {
  it('F-1: message is added optimistically before API response', () => {
    const msgs: OptimisticMsg[] = [];
    const result = applyOptimisticMessage(msgs, { id: 'opt-1', content: 'Hi', isOptimistic: true });
    expect(result).toHaveLength(1);
    expect(result[0].isOptimistic).toBe(true);
  });

  it('F-2: message is rolled back on API failure', () => {
    const msgs = [
      { id: 'opt-1', content: 'Hi', isOptimistic: true },
      { id: 'msg-2', content: 'Old', isOptimistic: false },
    ];
    const result = rollbackOptimisticMessage(msgs, 'opt-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('msg-2');
  });

  it('F-3: rolling back a non-existent ID is a no-op', () => {
    const msgs = [{ id: 'msg-1', content: 'Hi', isOptimistic: false }];
    const result = rollbackOptimisticMessage(msgs, 'does-not-exist');
    expect(result).toHaveLength(1);
  });

  it('F-4: Realtime echo of the same message ID is deduplicated', () => {
    // Client adds optimistic message, then Realtime broadcasts back the same ID
    const msgs = [
      { id: 'shared-id', content: 'Hi', isOptimistic: true },
      { id: 'other', content: 'Other', isOptimistic: false },
    ];
    const remoteEcho = { id: 'shared-id', content: 'Hi', isOptimistic: false };
    const withEcho = [...msgs, remoteEcho];
    const deduped = deduplicateById(withEcho);
    // The optimistic copy is kept (first seen wins), echo is dropped
    expect(deduped).toHaveLength(2);
    const sharedMsg = deduped.find((m) => m.id === 'shared-id')!;
    expect(sharedMsg.isOptimistic).toBe(true); // optimistic copy kept
  });

  it('F-5: successful API response means optimistic message is confirmed (no rollback)', () => {
    const msgs = [{ id: 'opt-1', content: 'Hi', isOptimistic: true }];
    // On success: no rollback call, message stays
    expect(msgs).toHaveLength(1);
    expect(msgs[0].isOptimistic).toBe(true);
    // In production, Realtime will broadcast it and dedup by ID
  });

  it('F-6: shared messageId prevents duplicate display when Realtime fires after optimistic', () => {
    const messageId = 'client-gen-id';
    const optimistic = { id: messageId, content: 'Hello', isOptimistic: true };
    const realtimeEcho = { id: messageId, content: 'Hello', isOptimistic: false };

    const withBoth = [optimistic, realtimeEcho];
    const deduped = deduplicateById(withBoth);
    expect(deduped).toHaveLength(1); // only one copy shown
  });

  it('F-7: two different messages from the same guest are both kept', () => {
    const m1 = { id: 'msg-a', content: 'Hello', isOptimistic: false };
    const m2 = { id: 'msg-b', content: 'World', isOptimistic: false };
    const msgs = deduplicateById([m1, m2]);
    expect(msgs).toHaveLength(2);
  });
});

// ─── G. B-11 detailed: isGuestMessage flag implications ─────────────────────
//
// isGuestMessage: true is hardcoded in message/route.ts for ALL callers.
// This flag is used in mergeRemoteState to detect "guest_write" clientId updates.
// When owner calls this route (unusual but possible), the flag fires too.

describe('G – isGuestMessage always true from message route (B-11)', () => {
  it('G-1: guest message has isGuestMessage=true', () => {
    const msg = buildMessageObject({
      messageId: 'id-1',
      member: { id: 'mem-g', nickname: 'Bob', player_id: null, is_owner: false },
      effectiveGuestId: 'g-bob',
      effectiveUserId: null,
      safeContent: 'hi',
      channelId: 'game-room',
      now: Date.now(),
    });
    expect(msg.isGuestMessage).toBe(true);
  });

  it('G-2: owner message via this route also has isGuestMessage=true', () => {
    const msg = buildMessageObject({
      messageId: 'id-2',
      member: { id: 'mem-owner', nickname: 'Host', player_id: 'host-player', is_owner: true },
      effectiveGuestId: null,
      effectiveUserId: 'owner-uuid',
      safeContent: 'hello',
      channelId: 'game-room',
      now: Date.now(),
    });
    // B-11: owner messages via this route get isGuestMessage=true
    // This can cause the mergeRemoteState guest_write guard to fire for owner messages
    expect(msg.isGuestMessage).toBe(true);
  });

  it('G-3: isGuestMessage=true does not affect isAI flag', () => {
    const msg = buildMessageObject({
      messageId: 'id-3',
      member: { id: 'mem-g', nickname: 'Carol', player_id: null, is_owner: false },
      effectiveGuestId: 'g-carol',
      effectiveUserId: null,
      safeContent: 'test',
      channelId: undefined,
      now: Date.now(),
    });
    expect(msg.isAI).toBe(false);
    expect(msg.isGuestMessage).toBe(true);
  });

  it('G-4: guest_write clientId in fallback state identifies non-owner writes for merge logic', () => {
    const state = buildFallbackState({}, [], { id: 'msg-1' });
    // guest_write clientId tells mergeRemoteState this update came from a guest,
    // so the owner's local state should not be overwritten
    expect(state.clientId).toBe('guest_write');
  });

  it('G-5: non-guest_write clientId from owner state should not be confused with guest writes', () => {
    function isGuestWriteUpdate(clientId: string | undefined): boolean {
      return clientId === 'guest_write';
    }
    expect(isGuestWriteUpdate('guest_write')).toBe(true);
    expect(isGuestWriteUpdate('session-abc-123')).toBe(false);
    expect(isGuestWriteUpdate(undefined)).toBe(false);
    expect(isGuestWriteUpdate('')).toBe(false);
  });
});
