/**
 * Tests for pure helper logic from GameRoomContext.tsx:
 *  - Message deduplication in addMessage
 *  - Private message "you" mapping in addPrivateMessage
 *  - mergeRemoteState message dedup + guest_write skip
 */
import { describe, it, expect } from "vitest";

// ─── Message dedup logic (from addMessage's setMessages callback) ───────────

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isAI: boolean;
  isStreaming?: boolean;
  channelId?: string;
}

function addMessageDedup(
  prev: Message[],
  newMessage: Message,
  maxMessages = 100
): Message[] {
  if (prev.some((m) => m.id === newMessage.id)) return prev;
  const updated = [...prev, newMessage];
  return updated.length > maxMessages ? updated.slice(-maxMessages) : updated;
}

describe("addMessage deduplication", () => {
  const msg = (id: string, content: string): Message => ({
    id,
    content,
    timestamp: new Date(),
    senderId: "u1",
    senderName: "Alice",
    senderAvatar: "#fff",
    isAI: false,
  });

  it("adds a new message to the list", () => {
    const prev = [msg("m1", "hello")];
    const result = addMessageDedup(prev, msg("m2", "world"));
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("m2");
  });

  it("deduplicates by ID — returns same array ref", () => {
    const prev = [msg("m1", "hello")];
    const result = addMessageDedup(prev, msg("m1", "hello again"));
    expect(result).toBe(prev); // same reference = no change
    expect(result).toHaveLength(1);
  });

  it("trims to maxMessages", () => {
    const prev = Array.from({ length: 100 }, (_, i) => msg(`m${i}`, `msg ${i}`));
    const result = addMessageDedup(prev, msg("m100", "overflow"));
    expect(result).toHaveLength(100);
    expect(result[0].id).toBe("m1"); // m0 dropped
    expect(result[99].id).toBe("m100");
  });

  it("does not trim when under limit", () => {
    const prev = [msg("m1", "a"), msg("m2", "b")];
    const result = addMessageDedup(prev, msg("m3", "c"));
    expect(result).toHaveLength(3);
  });
});

// ─── Private message "you" mapping ──────────────────────────────────────────

interface Player {
  id: string;
  name: string;
}

function resolvePrivatePlayerId(
  playerNameOrId: string,
  userId: string,
  players: Player[]
): string {
  const isYou = playerNameOrId.trim().toLowerCase() === "you";
  if (isYou) return userId;
  const found = players.find((p) => p.id === playerNameOrId || p.name === playerNameOrId);
  return found?.id ?? playerNameOrId;
}

describe("addPrivateMessage - 'you' mapping", () => {
  const players: Player[] = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ];

  it("maps 'you' to the current userId", () => {
    expect(resolvePrivatePlayerId("you", "owner-123", players)).toBe("owner-123");
    expect(resolvePrivatePlayerId("You", "owner-123", players)).toBe("owner-123");
    expect(resolvePrivatePlayerId("  YOU  ", "owner-123", players)).toBe("owner-123");
  });

  it("resolves player by exact name", () => {
    expect(resolvePrivatePlayerId("Alice", "owner-123", players)).toBe("p1");
    expect(resolvePrivatePlayerId("Bob", "owner-123", players)).toBe("p2");
  });

  it("resolves player by ID", () => {
    expect(resolvePrivatePlayerId("p1", "owner-123", players)).toBe("p1");
  });

  it("falls back to raw value when not found", () => {
    expect(resolvePrivatePlayerId("unknown", "owner-123", players)).toBe("unknown");
  });
});

// ─── mergeRemoteState ───────────────────────────────────────────────────────

interface RemoteState {
  messages?: Array<{ id: string; timestamp: string; [key: string]: unknown }>;
  players?: unknown[];
  gamePhase?: string;
  clientId?: string;
}

function mergeRemoteMessages(
  local: Message[],
  remote: Array<{ id: string; timestamp: string; [key: string]: unknown }>
): Message[] {
  const remoteMessages = remote.map((m) => ({
    ...m,
    timestamp: new Date(m.timestamp),
    isStreaming: false,
  })) as unknown as Message[];
  const localIds = new Set(local.map((m) => m.id));
  const newMsgs = remoteMessages.filter((m) => !localIds.has(m.id));
  if (newMsgs.length === 0) return local;
  const merged = [...local, ...newMsgs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  return merged.slice(-100);
}

describe("mergeRemoteState - message dedup", () => {
  const localMsg = (id: string, ts: string): Message => ({
    id,
    content: "local",
    timestamp: new Date(ts),
    senderId: "u1",
    senderName: "A",
    senderAvatar: "#000",
    isAI: false,
  });

  it("adds new remote messages not in local", () => {
    const local = [localMsg("m1", "2026-01-01T00:00:00Z")];
    const remote = [
      { id: "m1", timestamp: "2026-01-01T00:00:00Z" },
      { id: "m2", timestamp: "2026-01-01T00:01:00Z", content: "new" },
    ];
    const result = mergeRemoteMessages(local, remote);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("m2");
  });

  it("returns same array when no new messages", () => {
    const local = [localMsg("m1", "2026-01-01T00:00:00Z")];
    const remote = [{ id: "m1", timestamp: "2026-01-01T00:00:00Z" }];
    const result = mergeRemoteMessages(local, remote);
    expect(result).toBe(local);
  });

  it("sorts merged messages by timestamp", () => {
    const local = [localMsg("m3", "2026-01-01T00:03:00Z")];
    const remote = [
      { id: "m1", timestamp: "2026-01-01T00:01:00Z" },
      { id: "m2", timestamp: "2026-01-01T00:02:00Z" },
    ];
    const result = mergeRemoteMessages(local, remote);
    expect(result.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("trims to 100 messages after merge", () => {
    const local = Array.from({ length: 99 }, (_, i) =>
      localMsg(`local-${i}`, `2026-01-01T00:${String(i).padStart(2, "0")}:00Z`)
    );
    const remote = [
      { id: "r1", timestamp: "2026-01-01T01:40:00Z" },
      { id: "r2", timestamp: "2026-01-01T01:41:00Z" },
    ];
    const result = mergeRemoteMessages(local, remote);
    expect(result).toHaveLength(100);
  });
});

describe("mergeRemoteState - guest_write skip", () => {
  function shouldMergeNonMessageState(remoteState: RemoteState): boolean {
    return remoteState.clientId !== "guest_write";
  }

  it("allows merging when clientId is not guest_write", () => {
    expect(shouldMergeNonMessageState({ clientId: "abc-123" })).toBe(true);
    expect(shouldMergeNonMessageState({})).toBe(true);
  });

  it("blocks non-message state when clientId is guest_write", () => {
    expect(shouldMergeNonMessageState({ clientId: "guest_write" })).toBe(false);
  });
});
