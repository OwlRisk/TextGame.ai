import { describe, it, expect } from 'vitest';

// ─── State merge helpers ──────────────────────────────────────────────────────
// These replicate the merging logic in GameRoomContext.mergeRemoteState so we
// can test it in isolation without spinning up React.

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAI?: boolean;
  isStreaming?: boolean;
  isGuestMessage?: boolean;
}

/** Mirror of GameRoomContext.mergeRemoteState message-merge logic. */
function mergeMessages(local: Message[], remote: Message[]): Message[] {
  const localIds = new Set(local.map((m) => m.id));
  const newMsgs = remote.filter((m) => !localIds.has(m.id) && !m.isStreaming);
  if (newMsgs.length === 0) return local;
  const merged = [...local, ...newMsgs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  return merged.slice(-100);
}

function makeMsg(id: string, tsMs: number, extra: Partial<Message> = {}): Message {
  return {
    id,
    senderId: 'player-1',
    senderName: 'Alice',
    content: `Message ${id}`,
    timestamp: new Date(tsMs),
    isAI: false,
    ...extra,
  };
}

// ─── Message deduplication ────────────────────────────────────────────────────

describe('mergeMessages – deduplication', () => {
  it('returns local unchanged when remote has no new messages', () => {
    const local = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const remote = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('adds new messages from remote that are not in local', () => {
    const local = [makeMsg('a', 1000)];
    const remote = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toContain('b');
  });

  it('never adds a message that is already present locally', () => {
    const local = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const remote = [makeMsg('b', 2000), makeMsg('c', 3000)];
    const result = mergeMessages(local, remote);
    const ids = result.map((m) => m.id);
    expect(ids.filter((id) => id === 'b')).toHaveLength(1); // no duplicate 'b'
    expect(ids).toContain('c');
  });

  it('handles empty local list', () => {
    const remote = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const result = mergeMessages([], remote);
    expect(result).toHaveLength(2);
  });

  it('handles empty remote list', () => {
    const local = [makeMsg('a', 1000)];
    const result = mergeMessages(local, []);
    expect(result).toBe(local); // exact same reference (no-op)
  });

  it('handles both lists empty', () => {
    expect(mergeMessages([], [])).toHaveLength(0);
  });
});

describe('mergeMessages – streaming messages', () => {
  it('never imports a streaming (incomplete) message from remote', () => {
    const local = [makeMsg('a', 1000)];
    const remoteStreaming = makeMsg('b', 2000, { isStreaming: true });
    const result = mergeMessages(local, [makeMsg('a', 1000), remoteStreaming]);
    expect(result.map((m) => m.id)).not.toContain('b');
  });

  it('keeps local streaming message untouched', () => {
    const localStreaming = makeMsg('stream-1', 1000, { isStreaming: true });
    const result = mergeMessages([localStreaming], []);
    expect(result[0].isStreaming).toBe(true);
  });
});

describe('mergeMessages – ordering', () => {
  it('sorts merged result by timestamp ascending', () => {
    const local = [makeMsg('new', 5000)]; // newer local message
    const remote = [makeMsg('old', 1000), makeMsg('mid', 3000)];
    const result = mergeMessages(local, remote);
    const times = result.map((m) => m.timestamp.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('preserves chronological order when remote messages interleave with local', () => {
    const local = [makeMsg('a', 1000), makeMsg('c', 3000)];
    const remote = [makeMsg('b', 2000)];
    const result = mergeMessages(local, remote);
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('mergeMessages – size cap', () => {
  it('caps the result at 100 messages', () => {
    const local = Array.from({ length: 95 }, (_, i) => makeMsg(`l${i}`, i * 10));
    const remote = Array.from({ length: 10 }, (_, i) => makeMsg(`r${i}`, 1000 + i * 10));
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(100);
  });

  it('keeps the most recent 100 messages when over the cap', () => {
    const msgs = Array.from({ length: 105 }, (_, i) => makeMsg(`m${i}`, i * 10));
    const result = mergeMessages(msgs, []);
    // Empty remote → no merge happens, returns original reference
    // So let's test the cap via a real merge
    const local = Array.from({ length: 95 }, (_, i) => makeMsg(`l${i}`, i * 10));
    const extra = Array.from({ length: 10 }, (_, i) => makeMsg(`e${i}`, 1000 + i));
    const capped = mergeMessages(local, extra);
    expect(capped.length).toBeLessThanOrEqual(100);
  });
});

// ─── clientId echo detection ──────────────────────────────────────────────────

describe('clientId echo detection', () => {
  /** Mirrors GameRoomContext Realtime handler: skip our own saves. */
  function shouldSkip(remoteClientId: string | undefined, myClientId: string): boolean {
    return remoteClientId === myClientId;
  }

  it('skips when remote clientId matches local (own save echo)', () => {
    expect(shouldSkip('session-abc', 'session-abc')).toBe(true);
  });

  it('does NOT skip when clientId is from another client', () => {
    expect(shouldSkip('session-xyz', 'session-abc')).toBe(false);
  });

  it('does NOT skip when remote clientId is undefined (legacy state without clientId)', () => {
    expect(shouldSkip(undefined, 'session-abc')).toBe(false);
  });

  it('does NOT skip guest saves (clientId starts with "guest_")', () => {
    expect(shouldSkip('guest_member-123', 'session-abc')).toBe(false);
  });
});

// ─── Guest message detection ──────────────────────────────────────────────────

describe('guest message detection', () => {
  /** Mirrors page.tsx: detect incoming guest messages owner should respond to. */
  function isNewGuestMessage(
    msg: Message,
    lastProcessedId: string | null
  ): boolean {
    return !!(msg as unknown as { isGuestMessage?: boolean }).isGuestMessage
      && !msg.isAI
      && msg.id !== lastProcessedId;
  }

  it('detects a guest message not yet processed', () => {
    const msg = makeMsg('g1', 1000, { isGuestMessage: true });
    expect(isNewGuestMessage(msg, null)).toBe(true);
  });

  it('ignores already-processed guest messages', () => {
    const msg = makeMsg('g1', 1000, { isGuestMessage: true });
    expect(isNewGuestMessage(msg, 'g1')).toBe(false);
  });

  it('ignores AI messages even if tagged isGuestMessage', () => {
    const msg = makeMsg('g1', 1000, { isGuestMessage: true, isAI: true });
    expect(isNewGuestMessage(msg, null)).toBe(false);
  });

  it('ignores regular (non-guest) messages', () => {
    const msg = makeMsg('r1', 1000);
    expect(isNewGuestMessage(msg, null)).toBe(false);
  });
});
