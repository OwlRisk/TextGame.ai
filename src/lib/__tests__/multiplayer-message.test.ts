import { describe, it, expect } from 'vitest';

// ─── Pure logic extracted from /api/games/[gameId]/message/route.ts ──────────
// We test the business rules without spinning up Next.js / Supabase.

// ── Message ID ────────────────────────────────────────────────────────────────

function makeMessageId(timestamp: number, suffix: string): string {
  return `msg-${timestamp}-${suffix}`;
}

describe('message ID format', () => {
  it('starts with "msg-"', () => {
    const id = makeMessageId(Date.now(), crypto.randomUUID().slice(0, 8));
    expect(id).toMatch(/^msg-/);
  });

  it('contains a numeric timestamp', () => {
    const ts = 1700000000000;
    const id = makeMessageId(ts, 'abc12345');
    expect(id).toContain('1700000000000');
  });

  it('contains the suffix after the timestamp', () => {
    const id = makeMessageId(1000, 'deadbeef');
    expect(id).toBe('msg-1000-deadbeef');
  });

  it('two IDs generated 1 ms apart are distinct', () => {
    const id1 = makeMessageId(Date.now(), crypto.randomUUID().slice(0, 8));
    const id2 = makeMessageId(Date.now() + 1, crypto.randomUUID().slice(0, 8));
    expect(id1).not.toBe(id2);
  });
});

// ── Message content sanitisation ──────────────────────────────────────────────

function sanitiseContent(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function sanitiseNickname(raw: string, fallback: string): string {
  return (raw ?? '').trim().slice(0, 30) || fallback;
}

describe('message content sanitisation', () => {
  it('trims leading/trailing whitespace', () => {
    expect(sanitiseContent('  hello  ')).toBe('hello');
  });

  it('returns null for whitespace-only content', () => {
    expect(sanitiseContent('   ')).toBeNull();
    expect(sanitiseContent('')).toBeNull();
    expect(sanitiseContent('\t\n')).toBeNull();
  });

  it('preserves inner whitespace', () => {
    expect(sanitiseContent('hello   world')).toBe('hello   world');
  });

  it('preserves multi-line messages', () => {
    const msg = 'Line one.\nLine two.';
    expect(sanitiseContent(msg)).toBe(msg);
  });
});

describe('nickname sanitisation for guest messages', () => {
  it('uses provided nickname trimmed', () => {
    expect(sanitiseNickname('  Alice  ', 'Guest')).toBe('Alice');
  });

  it('falls back to member.nickname when body nickname is missing', () => {
    expect(sanitiseNickname('', 'MemberNick')).toBe('MemberNick');
  });

  it('truncates to 30 characters', () => {
    const result = sanitiseNickname('A'.repeat(50), 'G');
    expect(result).toHaveLength(30);
  });
});

// ── Message buffer (keep last N messages) ────────────────────────────────────

const MESSAGE_BUFFER_SIZE = 60;

function applyMessageBuffer<T>(existing: T[], newMsg: T): T[] {
  return [...existing.slice(-(MESSAGE_BUFFER_SIZE - 1)), newMsg];
}

describe('message buffer', () => {
  it('appends new message to existing array', () => {
    const existing = [{ id: 'a' }, { id: 'b' }];
    const result = applyMessageBuffer(existing, { id: 'c' });
    expect(result).toHaveLength(3);
    expect(result[2].id).toBe('c');
  });

  it(`keeps a maximum of ${MESSAGE_BUFFER_SIZE} messages`, () => {
    const existing = Array.from({ length: MESSAGE_BUFFER_SIZE }, (_, i) => ({ id: `m${i}` }));
    const result = applyMessageBuffer(existing, { id: 'new' });
    expect(result).toHaveLength(MESSAGE_BUFFER_SIZE);
  });

  it('drops the oldest message when buffer is full', () => {
    const existing = Array.from({ length: MESSAGE_BUFFER_SIZE }, (_, i) => ({ id: `m${i}` }));
    const result = applyMessageBuffer(existing, { id: 'newest' });
    expect(result[0].id).toBe('m1'); // 'm0' was dropped
    expect(result[result.length - 1].id).toBe('newest');
  });

  it('handles empty existing array', () => {
    const result = applyMessageBuffer([], { id: 'first' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('first');
  });

  it('preserves all messages when below buffer limit', () => {
    const existing = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}` }));
    const result = applyMessageBuffer(existing, { id: 'new' });
    expect(result).toHaveLength(11);
    expect(result.map((m) => m.id)).toContain('m0');
  });
});

// ── Guest message flags ───────────────────────────────────────────────────────

interface GuestMessageFields {
  isAI: boolean;
  isGuestMessage: boolean;
  channelId: string;
  clientId: string;
}

function buildGuestMessageFlags(memberId: string, channelId?: string): GuestMessageFields {
  return {
    isAI: false,
    isGuestMessage: true,
    channelId: channelId ?? 'game-room',
    clientId: `guest_${memberId}`,
  };
}

describe('guest message flags', () => {
  it('isAI is always false for guest messages', () => {
    expect(buildGuestMessageFlags('mem-1').isAI).toBe(false);
  });

  it('isGuestMessage is always true', () => {
    expect(buildGuestMessageFlags('mem-1').isGuestMessage).toBe(true);
  });

  it('defaults channelId to "game-room"', () => {
    expect(buildGuestMessageFlags('mem-1').channelId).toBe('game-room');
  });

  it('uses provided channelId when given', () => {
    expect(buildGuestMessageFlags('mem-1', 'mafia-night').channelId).toBe('mafia-night');
  });

  it('clientId is prefixed with "guest_"', () => {
    const { clientId } = buildGuestMessageFlags('member-abc');
    expect(clientId).toBe('guest_member-abc');
    expect(clientId).toMatch(/^guest_/);
  });

  it('clientId is distinct from owner clientId (no "guest_" prefix)', () => {
    const ownerClientId = 'session-xyz';
    const guestClientId = buildGuestMessageFlags('member-1').clientId;
    expect(guestClientId).not.toBe(ownerClientId);
    expect(guestClientId.startsWith('guest_')).toBe(true);
    expect(ownerClientId.startsWith('guest_')).toBe(false);
  });
});

// ── Guest identity resolution ─────────────────────────────────────────────────

interface Identity {
  effectiveUserId: string | null;
  effectiveGuestId: string | null;
  isOwner: boolean;
}

function resolveIdentity(opts: {
  authUserId: string | null;
  bodyGuestId: string | null;
  gameOwnerId: string;
}): Identity {
  const { authUserId, bodyGuestId, gameOwnerId } = opts;
  const effectiveUserId = authUserId ?? null;
  const effectiveGuestId = authUserId ? null : (bodyGuestId ?? null);
  const isOwner = !!(authUserId && authUserId === gameOwnerId);
  return { effectiveUserId, effectiveGuestId, isOwner };
}

describe('identity resolution', () => {
  const OWNER_ID = 'owner-111';

  it('authenticated owner: isOwner=true, guestId=null', () => {
    const r = resolveIdentity({ authUserId: OWNER_ID, bodyGuestId: null, gameOwnerId: OWNER_ID });
    expect(r.isOwner).toBe(true);
    expect(r.effectiveGuestId).toBeNull();
    expect(r.effectiveUserId).toBe(OWNER_ID);
  });

  it('authenticated non-owner: isOwner=false, guestId=null', () => {
    const r = resolveIdentity({ authUserId: 'user-222', bodyGuestId: null, gameOwnerId: OWNER_ID });
    expect(r.isOwner).toBe(false);
    expect(r.effectiveGuestId).toBeNull();
  });

  it('anonymous guest: effectiveUserId=null, guestId from body', () => {
    const r = resolveIdentity({ authUserId: null, bodyGuestId: 'guest-uuid', gameOwnerId: OWNER_ID });
    expect(r.effectiveUserId).toBeNull();
    expect(r.effectiveGuestId).toBe('guest-uuid');
    expect(r.isOwner).toBe(false);
  });

  it('authenticated user supersedes any bodyGuestId', () => {
    const r = resolveIdentity({ authUserId: 'user-333', bodyGuestId: 'guest-uuid', gameOwnerId: OWNER_ID });
    expect(r.effectiveUserId).toBe('user-333');
    expect(r.effectiveGuestId).toBeNull();
  });

  it('anonymous with no guestId: both ids are null', () => {
    const r = resolveIdentity({ authUserId: null, bodyGuestId: null, gameOwnerId: OWNER_ID });
    expect(r.effectiveUserId).toBeNull();
    expect(r.effectiveGuestId).toBeNull();
  });
});

// ── upsert conflict key selection ─────────────────────────────────────────────

function getUpsertConflictKey(effectiveUserId: string | null): string {
  return effectiveUserId ? 'game_id,user_id' : 'game_id,guest_id';
}

describe('upsert conflict key', () => {
  it('uses user_id key for authenticated users', () => {
    expect(getUpsertConflictKey('user-abc')).toBe('game_id,user_id');
  });

  it('uses guest_id key for anonymous users', () => {
    expect(getUpsertConflictKey(null)).toBe('game_id,guest_id');
  });
});
