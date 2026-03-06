import { describe, it, expect } from 'vitest';

/**
 * Tests for the append-only message merge strategy.
 *
 * Previously mergeRemoteState sorted ALL messages (local + remote) by timestamp,
 * which caused late-arriving AI messages to "jump" ahead of already-displayed
 * human messages. The new behavior preserves local order and only appends.
 */

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
  isStreaming?: boolean;
}

/** Production-equivalent merge logic from GameRoomContext.mergeRemoteState */
function mergeMessages(local: Message[], remote: Message[]): Message[] {
  const localIds = new Set(local.map((m) => m.id));
  const newMsgs = remote.filter((m) => !localIds.has(m.id));
  if (newMsgs.length === 0) return local;
  newMsgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const merged = [...local, ...newMsgs];
  return merged.length > 100 ? merged.slice(-100) : merged;
}

function makeMsg(id: string, tsMs: number, extra: Partial<Message> = {}): Message {
  return {
    id,
    senderId: extra.senderId ?? 'player-1',
    senderName: extra.senderName ?? 'Alice',
    content: extra.content ?? `Message ${id}`,
    timestamp: new Date(tsMs),
    isAI: extra.isAI ?? false,
    ...extra,
  };
}

// ─── Core: late AI messages no longer jump ahead ─────────────────────────────

describe('message order preservation – late AI messages', () => {
  it('AI message with earlier timestamp does NOT jump ahead of human message', () => {
    // Scenario: Human sent "Ready" at t=3000, AI response generated at t=2000
    // but arrives via Realtime after the human message is already displayed.
    const local = [
      makeMsg('gm-greeting', 1000, { senderName: 'GM', isAI: true }),
      makeMsg('ai-jonah', 2000, { senderName: 'Jonah', isAI: true }),
      makeMsg('human-ready', 3000, { senderName: 'Alex', isAI: false }),
    ];
    const lateAI = makeMsg('ai-samir', 2500, { senderName: 'Samir', isAI: true });
    const result = mergeMessages(local, [...local, lateAI]);

    const ids = result.map((m) => m.id);
    // Samir should appear AFTER human "Ready", not before it
    expect(ids.indexOf('human-ready')).toBeLessThan(ids.indexOf('ai-samir'));
    expect(ids).toEqual(['gm-greeting', 'ai-jonah', 'human-ready', 'ai-samir']);
  });

  it('multiple late AI messages append after existing messages in timestamp order', () => {
    const local = [
      makeMsg('human-1', 5000, { senderName: 'Alex', isAI: false }),
    ];
    const lateAIs = [
      makeMsg('ai-c', 3000, { senderName: 'Charlie', isAI: true }),
      makeMsg('ai-a', 1000, { senderName: 'Alice', isAI: true }),
      makeMsg('ai-b', 2000, { senderName: 'Bob', isAI: true }),
    ];
    const result = mergeMessages(local, [...local, ...lateAIs]);

    expect(result.map((m) => m.id)).toEqual([
      'human-1',  // local preserved first
      'ai-a',     // then new msgs sorted among themselves
      'ai-b',
      'ai-c',
    ]);
  });

  it('preserves exact local order even when timestamps are out of order', () => {
    // Local messages might have been added in a non-chronological order
    // (e.g. optimistic update, typewriter reveal timing)
    const local = [
      makeMsg('b', 2000),
      makeMsg('a', 1000),  // added later locally, despite earlier timestamp
      makeMsg('c', 3000),
    ];
    const remote = [makeMsg('d', 1500)];
    const result = mergeMessages(local, [...local, ...remote]);

    // Local order (b, a, c) must be preserved exactly
    expect(result.map((m) => m.id)).toEqual(['b', 'a', 'c', 'd']);
  });
});

// ─── Real-world scenario simulation ─────────────────────────────────────────

describe('message order preservation – game scenarios', () => {
  it('simulates Codenames game start: seedInitialPlayerReplies + human message', () => {
    // GM greeting → AI Jonah replies → Human says "Ready" → AI Samir arrives late
    const local = [
      makeMsg('gm-1', 1000, { senderName: 'Kade', isAI: true, content: 'Game is on!' }),
      makeMsg('ai-jonah', 2000, { senderName: 'Jonah', isAI: true, content: "Let's run it!" }),
      makeMsg('human-alex', 3500, { senderName: 'Alex', isAI: false, content: 'Ready' }),
    ];
    // Samir was generating at t=2500 but Realtime delivers after human message
    const remoteAll = [
      ...local,
      makeMsg('ai-samir', 2500, { senderName: 'Samir', isAI: true, content: "Let's keep it clean" }),
    ];
    const result = mergeMessages(local, remoteAll);

    const names = result.map((m) => m.senderName);
    expect(names).toEqual(['Kade', 'Jonah', 'Alex', 'Samir']);
  });

  it('simulates guest message arriving while AI is speaking', () => {
    const local = [
      makeMsg('ai-turn', 1000, { senderName: 'AI Player', isAI: true }),
    ];
    const guestMsg = makeMsg('guest-1', 500, {
      senderName: 'Guest',
      isAI: false,
      content: 'Hello from guest!',
    });
    const result = mergeMessages(local, [guestMsg]);

    // Guest message appends after AI, despite earlier timestamp
    expect(result.map((m) => m.id)).toEqual(['ai-turn', 'guest-1']);
  });

  it('simulates multiple rounds of merge without reordering', () => {
    let messages = [
      makeMsg('m1', 1000, { senderName: 'GM', isAI: true }),
      makeMsg('m2', 2000, { senderName: 'Human', isAI: false }),
    ];

    // Round 1: AI response arrives
    messages = mergeMessages(messages, [
      ...messages,
      makeMsg('m3', 1500, { senderName: 'AI-1', isAI: true }),
    ]);
    expect(messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);

    // Round 2: Another AI response arrives
    messages = mergeMessages(messages, [
      ...messages,
      makeMsg('m4', 1800, { senderName: 'AI-2', isAI: true }),
    ]);
    expect(messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);

    // Order is always stable — no jumping
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('message order preservation – edge cases', () => {
  it('empty local: remote messages are sorted by timestamp', () => {
    const remote = [
      makeMsg('c', 3000),
      makeMsg('a', 1000),
      makeMsg('b', 2000),
    ];
    const result = mergeMessages([], remote);
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('empty remote: returns local unchanged (same reference)', () => {
    const local = [makeMsg('a', 1000)];
    const result = mergeMessages(local, []);
    expect(result).toBe(local);
  });

  it('all remote messages are duplicates: returns local unchanged', () => {
    const local = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const remote = [makeMsg('a', 1000), makeMsg('b', 2000)];
    const result = mergeMessages(local, remote);
    expect(result).toBe(local);
  });

  it('same timestamp across multiple messages: stable order preserved', () => {
    const sameTs = 5000;
    const local = [
      makeMsg('first', sameTs, { senderName: 'First' }),
      makeMsg('second', sameTs, { senderName: 'Second' }),
    ];
    const remote = [makeMsg('third', sameTs, { senderName: 'Third' })];
    const result = mergeMessages(local, [...local, ...remote]);
    expect(result.map((m) => m.id)).toEqual(['first', 'second', 'third']);
  });

  it('caps at 100 messages with append-only strategy', () => {
    const local = Array.from({ length: 95 }, (_, i) =>
      makeMsg(`l${i}`, i * 100)
    );
    const remote = Array.from({ length: 10 }, (_, i) =>
      makeMsg(`r${i}`, 50 + i * 100)
    );
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(100);
    // Last message should be from remote batch (appended at end, then sliced)
    expect(result[result.length - 1].id).toBe('r9');
  });

  it('streaming messages in local are kept intact during merge', () => {
    const local = [
      makeMsg('stream-1', 1000, { isStreaming: true } as Partial<Message>),
      makeMsg('normal', 2000),
    ];
    const remote = [makeMsg('new', 3000)];
    const result = mergeMessages(local, remote);
    expect(result).toHaveLength(3);
    expect(result[0].isStreaming).toBe(true);
    expect(result.map((m) => m.id)).toEqual(['stream-1', 'normal', 'new']);
  });
});
