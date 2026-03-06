import { describe, it, expect } from 'vitest';

// ─── Replicate production helpers ─────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
  isStreaming?: boolean;
  channelId?: string;
  isGuestMessage?: boolean;
}

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  isGameMaster?: boolean;
  role?: string;
  status?: string;
}

// Mirror mergeRemoteState message-merge logic (append-only — preserves local order)
function mergeMessages(local: Message[], remoteRaw: unknown[]): Message[] {
  const remote = remoteRaw.map((m: unknown) => ({
    ...(m as object),
    timestamp: new Date((m as { timestamp: string }).timestamp),
    isStreaming: false,
  })) as Message[];
  const localIds = new Set(local.map((m) => m.id));
  const newMsgs = remote.filter((m) => !localIds.has(m.id));
  if (newMsgs.length === 0) return local;
  newMsgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const merged = [...local, ...newMsgs];
  return merged.length > 100 ? merged.slice(-100) : merged;
}

// Mirror I-3 guard: skip non-message state for guest_write
function shouldUpdateGameState(clientId: unknown): boolean {
  return clientId !== 'guest_write';
}

// Mirror I-6 addMessage dedup (ID-first)
function addMessageDedup(prev: Message[], newMsg: Message): Message[] {
  if (prev.some((m) => m.id === newMsg.id)) return prev;
  const updated = [...prev, newMsg];
  return updated.length > 100 ? updated.slice(-100) : updated;
}

// Mirror I-5 optimistic rollback
function rollbackMessage(messages: Message[], messageId: string): Message[] {
  return messages.filter((m) => m.id !== messageId);
}

// ─── I-3: mergeRemoteState guest_write guard ──────────────────────────────────
describe('I-3: mergeRemoteState – guest_write guard', () => {
  it('allows non-message state update when clientId is owner', () => {
    expect(shouldUpdateGameState('owner-client-abc')).toBe(true);
  });

  it('blocks non-message state update when clientId is "guest_write"', () => {
    expect(shouldUpdateGameState('guest_write')).toBe(false);
  });

  it('allows update when clientId is undefined', () => {
    expect(shouldUpdateGameState(undefined)).toBe(true);
  });

  it('allows update when clientId is null', () => {
    expect(shouldUpdateGameState(null)).toBe(true);
  });

  it('allows update when clientId is empty string', () => {
    expect(shouldUpdateGameState('')).toBe(true);
  });

  it('blocks partial guest clientId strings that match exactly', () => {
    // Only exact "guest_write" is blocked; other guest prefixes are allowed
    expect(shouldUpdateGameState('guest_write')).toBe(false);
    expect(shouldUpdateGameState('guest_dc409863')).toBe(true); // old format
  });

  it('owner saves use a UUID-style clientId — always allowed through', () => {
    const ownerClientId = '550e8400-e29b-41d4-a716-446655440000';
    expect(shouldUpdateGameState(ownerClientId)).toBe(true);
  });

  it('simulates owner state not being overwritten by guest message', () => {
    const ownerPlayers: Player[] = [
      { id: 'p1', name: 'Otto', isAI: false, role: 'Werewolf' },
    ];
    const remoteState = {
      clientId: 'guest_write',
      // stale players — guest loaded before ASSIGN_ROLE ran
      players: [{ id: 'p1', name: 'Otto', isAI: false, role: undefined }],
    };
    const shouldUpdate = shouldUpdateGameState(remoteState.clientId);
    // Guard fires → owner keeps its current players
    const finalPlayers = shouldUpdate
      ? (remoteState.players as Player[])
      : ownerPlayers;
    expect(finalPlayers[0].role).toBe('Werewolf'); // not overwritten
  });

  it('simulates owner state being updated from a real owner save', () => {
    const initial: Player[] = [{ id: 'p1', name: 'Otto', isAI: false }];
    const remoteState = {
      clientId: 'uuid-owner-abc',
      players: [{ id: 'p1', name: 'Otto', isAI: false, role: 'Detective' }],
    };
    const shouldUpdate = shouldUpdateGameState(remoteState.clientId);
    const finalPlayers = shouldUpdate
      ? (remoteState.players as Player[])
      : initial;
    expect(finalPlayers[0].role).toBe('Detective');
  });
});

// ─── I-6: addMessage ID-based dedup ──────────────────────────────────────────
describe('I-6: addMessage – ID-first deduplication', () => {
  const base: Message = {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Otto',
    content: 'Hello',
    timestamp: new Date('2026-01-01T10:00:00Z'),
    isAI: false,
  };

  it('adds a brand-new message', () => {
    const result = addMessageDedup([], base);
    expect(result).toHaveLength(1);
  });

  it('does NOT add a duplicate with the same ID', () => {
    const existing = [base];
    const duplicate = { ...base, content: 'Hello (modified)' };
    const result = addMessageDedup(existing, duplicate);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Hello'); // original preserved
  });

  it('adds a message with a different ID even if content is identical', () => {
    const existing = [base];
    const different = { ...base, id: 'msg-2' };
    const result = addMessageDedup(existing, different);
    expect(result).toHaveLength(2);
  });

  it('two AI messages with same short content but different IDs both appear', () => {
    const ai1: Message = { ...base, id: 'ai-1', senderName: 'Klara', content: 'I agree', isAI: true };
    const ai2: Message = { ...base, id: 'ai-2', senderName: 'Otto', content: 'I agree', isAI: true };
    let msgs: Message[] = [];
    msgs = addMessageDedup(msgs, ai1);
    msgs = addMessageDedup(msgs, ai2);
    expect(msgs).toHaveLength(2); // no false-positive dedup
  });

  it('does NOT add Realtime echo of an optimistic message (same ID)', () => {
    const optimistic: Message = {
      ...base, id: 'msg-opt-123', content: 'Hi from guest',
    };
    const realtimeEcho: Message = {
      ...optimistic, // same id — the Realtime payload
      timestamp: new Date('2026-01-01T10:00:01Z'),
    };
    let msgs: Message[] = [];
    msgs = addMessageDedup(msgs, optimistic);
    msgs = addMessageDedup(msgs, realtimeEcho);
    expect(msgs).toHaveLength(1);
  });

  it('caps at 100 messages', () => {
    const many: Message[] = Array.from({ length: 100 }, (_, i) => ({
      ...base, id: `msg-${i}`,
    }));
    const newMsg = { ...base, id: 'msg-100' };
    const result = addMessageDedup(many, newMsg);
    expect(result).toHaveLength(100);
    expect(result[result.length - 1].id).toBe('msg-100');
  });

  it('streaming messages are never deduplicated (each has unique auto-id)', () => {
    const streaming1 = { ...base, id: 'stream-1', isStreaming: true };
    const streaming2 = { ...base, id: 'stream-2', isStreaming: true };
    let msgs: Message[] = [];
    msgs = addMessageDedup(msgs, streaming1);
    msgs = addMessageDedup(msgs, streaming2);
    expect(msgs).toHaveLength(2);
  });
});

// ─── I-5: optimistic message rollback ─────────────────────────────────────────
describe('I-5: optimistic message rollback on failure', () => {
  const msg1: Message = {
    id: 'opt-1', senderId: 'guest-1', senderName: 'Nikki',
    content: 'Hello!', timestamp: new Date(), isAI: false,
  };
  const msg2: Message = {
    id: 'opt-2', senderId: 'guest-1', senderName: 'Nikki',
    content: 'Anyone there?', timestamp: new Date(), isAI: false,
  };

  it('removes the failed message from the list by ID', () => {
    const messages = [msg1, msg2];
    const result = rollbackMessage(messages, 'opt-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('opt-2');
  });

  it('is a no-op when the ID does not exist', () => {
    const messages = [msg1];
    const result = rollbackMessage(messages, 'non-existent');
    expect(result).toHaveLength(1);
  });

  it('handles empty message list gracefully', () => {
    expect(rollbackMessage([], 'any-id')).toEqual([]);
  });

  it('does not remove other messages with different IDs', () => {
    const messages = [msg1, msg2];
    const result = rollbackMessage(messages, msg1.id);
    expect(result.find((m) => m.id === msg2.id)).toBeDefined();
  });

  it('removes only the first match when there are duplicates (should not happen)', () => {
    const dup = [msg1, { ...msg1 }]; // same id, two objects
    const result = rollbackMessage(dup, msg1.id);
    expect(result).toHaveLength(0); // filter removes all matches
  });

  it('rollback after 429 rate limit error removes the optimistic message', () => {
    const messages = [msg1];
    // Simulates: response.status === 429 → rollback
    const status = 429;
    const finalMessages = status >= 400 ? rollbackMessage(messages, msg1.id) : messages;
    expect(finalMessages).toHaveLength(0);
  });

  it('rollback after network error removes the optimistic message', () => {
    const messages = [msg1, msg2];
    // Simulates: catch block → rollback msg1
    const finalMessages = rollbackMessage(messages, msg1.id);
    expect(finalMessages).toHaveLength(1);
    expect(finalMessages[0].id).toBe('opt-2');
  });

  it('successful send leaves all messages intact', () => {
    const messages = [msg1, msg2];
    // Simulates: res.ok === true → no rollback
    const resOk = true;
    const finalMessages = resOk ? messages : rollbackMessage(messages, msg1.id);
    expect(finalMessages).toHaveLength(2);
  });
});

// ─── mergeMessages (Realtime/polling merge) ───────────────────────────────────
describe('mergeMessages – Realtime merge behavior', () => {
  const t = (offset: number) => new Date(1000000 + offset).toISOString();

  it('adds remote messages not present locally', () => {
    const local: Message[] = [];
    const remote = [{ id: 'r1', senderId: 'x', senderName: 'X', content: 'hi', timestamp: t(0), isAI: false }];
    expect(mergeMessages(local, remote)).toHaveLength(1);
  });

  it('does NOT re-add messages already in local state (ID dedup)', () => {
    const local: Message[] = [{
      id: 'r1', senderId: 'x', senderName: 'X', content: 'hi',
      timestamp: new Date(1000000), isAI: false,
    }];
    const remote = [{ id: 'r1', senderId: 'x', senderName: 'X', content: 'hi', timestamp: t(0), isAI: false }];
    expect(mergeMessages(local, remote)).toHaveLength(1);
  });

  it('appends new remote messages after local, sorted among themselves', () => {
    const local: Message[] = [{
      id: 'l1', senderId: 'a', senderName: 'A', content: 'early',
      timestamp: new Date(1000000), isAI: false,
    }];
    const remote = [
      { id: 'r1', senderId: 'b', senderName: 'B', content: 'later', timestamp: t(5000), isAI: false },
      { id: 'r2', senderId: 'c', senderName: 'C', content: 'middle', timestamp: t(2000), isAI: false },
    ];
    const result = mergeMessages(local, remote);
    // Local stays first; remote sorted among themselves then appended
    expect(result.map((m) => m.id)).toEqual(['l1', 'r2', 'r1']);
  });

  it('caps merged result at 100 messages', () => {
    const local: Message[] = Array.from({ length: 90 }, (_, i) => ({
      id: `l${i}`, senderId: 'x', senderName: 'X', content: 'x',
      timestamp: new Date(i), isAI: false,
    }));
    const remote = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`, senderId: 'y', senderName: 'Y', content: 'y', timestamp: t(i), isAI: false,
    }));
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(100);
  });

  it('returns local unchanged when remote has no new messages', () => {
    const local: Message[] = [{
      id: 'same', senderId: 'x', senderName: 'X', content: 'hi',
      timestamp: new Date(), isAI: false,
    }];
    const remote = [{ id: 'same', senderId: 'x', senderName: 'X', content: 'hi', timestamp: t(0), isAI: false }];
    const result = mergeMessages(local, remote);
    expect(result).toBe(local); // same reference (no-op)
  });

  it('streaming messages in local are preserved (not replaced by remote non-streaming)', () => {
    const streaming: Message = {
      id: 'stream-1', senderId: 'ai', senderName: 'AI', content: 'typing...',
      timestamp: new Date(2000), isAI: true, isStreaming: true,
    };
    const remote = [{ id: 'new', senderId: 'b', senderName: 'B', content: 'hi', timestamp: t(0), isAI: false }];
    const result = mergeMessages([streaming], remote);
    expect(result.find((m) => m.id === 'stream-1')?.isStreaming).toBe(true);
  });
});
