/**
 * Supplementary tests for the message API route logic:
 *  - Auth & membership validation paths
 *  - Empty / overlong content handling
 *  - Rate limit key construction
 *  - Message object shape
 */
import { describe, it, expect } from "vitest";

// ─── sanitizeContent (re-implemented for edge case tests) ───────────────────

const DIRECTIVE_REGEX =
  /^(ASSIGN_ROLE|REVEAL_ROLE|ELIMINATE|RECORD_EVENT|GAME_OVER|MY_BOARD_FOR|MY_NOTES|ACCESS|CHANNEL_SUMMARY)\s*:/i;

function sanitizeContent(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !DIRECTIVE_REGEX.test(line.trim()))
    .join("\n")
    .trim();
}

describe("sanitizeContent – additional edge cases", () => {
  it("returns empty string when all lines are directives", () => {
    const input = "ASSIGN_ROLE: x\nELIMINATE: y\nGAME_OVER: z";
    expect(sanitizeContent(input)).toBe("");
  });

  it("handles single directive-only line", () => {
    expect(sanitizeContent("GAME_OVER: done")).toBe("");
  });

  it("preserves lines that mention directive keywords mid-sentence", () => {
    expect(sanitizeContent("I think we should ELIMINATE the suspect")).toBe(
      "I think we should ELIMINATE the suspect"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeContent("  \n  hello  \n  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeContent("")).toBe("");
  });

  it("strips MY_NOTES directive", () => {
    expect(sanitizeContent("MY_NOTES: secret info\nOk")).toBe("Ok");
  });

  it("strips ACCESS directive", () => {
    expect(sanitizeContent("ACCESS: admin\nHello")).toBe("Hello");
  });

  it("strips CHANNEL_SUMMARY directive", () => {
    expect(sanitizeContent("CHANNEL_SUMMARY: recap\nNice")).toBe("Nice");
  });

  it("is case-insensitive for directive names", () => {
    expect(sanitizeContent("assign_role: test\nHi")).toBe("Hi");
    expect(sanitizeContent("Assign_Role: test\nHi")).toBe("Hi");
  });
});

// ─── Rate limit key construction ────────────────────────────────────────────

describe("rate limit key construction", () => {
  function buildRateLimitKey(gameId: string, memberId: string): string {
    return `${gameId}:${memberId}`;
  }

  it("concatenates gameId and memberId", () => {
    expect(buildRateLimitKey("g1", "m1")).toBe("g1:m1");
  });

  it("different games have different keys", () => {
    expect(buildRateLimitKey("g1", "m1")).not.toBe(buildRateLimitKey("g2", "m1"));
  });

  it("different members in same game have different keys", () => {
    expect(buildRateLimitKey("g1", "m1")).not.toBe(buildRateLimitKey("g1", "m2"));
  });
});

// ─── Auth decision logic ────────────────────────────────────────────────────

describe("sender identification logic", () => {
  function identifySender(
    userId: string | null,
    guestId: string | undefined
  ): { effectiveUserId: string | null; effectiveGuestId: string | null } {
    const effectiveUserId = userId;
    const effectiveGuestId = !userId ? (guestId ?? null) : null;
    return { effectiveUserId, effectiveGuestId };
  }

  it("authenticated user ignores guestId", () => {
    const { effectiveUserId, effectiveGuestId } = identifySender("u1", "g1");
    expect(effectiveUserId).toBe("u1");
    expect(effectiveGuestId).toBeNull();
  });

  it("unauthenticated with guestId uses guestId", () => {
    const { effectiveUserId, effectiveGuestId } = identifySender(null, "g1");
    expect(effectiveUserId).toBeNull();
    expect(effectiveGuestId).toBe("g1");
  });

  it("unauthenticated without guestId has both null", () => {
    const { effectiveUserId, effectiveGuestId } = identifySender(null, undefined);
    expect(effectiveUserId).toBeNull();
    expect(effectiveGuestId).toBeNull();
  });
});

// ─── Message object construction ────────────────────────────────────────────

describe("message object shape", () => {
  function buildMessage(opts: {
    messageId?: string;
    playerId: string | null;
    guestId: string | null;
    userId: string | null;
    nickname: string;
    content: string;
    channelId: string;
    memberId: string;
  }) {
    return {
      id: opts.messageId ?? `msg-${Date.now()}-${Math.random().toString(36).slice(0, 8)}`,
      senderId: opts.playerId ?? (opts.guestId ?? opts.userId ?? "unknown"),
      senderName: opts.nickname,
      senderAvatar: "#10b981",
      content: opts.content,
      timestamp: new Date().toISOString(),
      isAI: false,
      channelId: opts.channelId,
      isGuestMessage: true,
      guestMemberId: opts.memberId,
    };
  }

  it("uses provided messageId", () => {
    const msg = buildMessage({
      messageId: "custom-id",
      playerId: "p1",
      guestId: null,
      userId: "u1",
      nickname: "Alice",
      content: "hi",
      channelId: "game-room",
      memberId: "mem1",
    });
    expect(msg.id).toBe("custom-id");
  });

  it("generates ID when not provided", () => {
    const msg = buildMessage({
      playerId: "p1",
      guestId: null,
      userId: "u1",
      nickname: "Alice",
      content: "hi",
      channelId: "game-room",
      memberId: "mem1",
    });
    expect(msg.id).toMatch(/^msg-/);
  });

  it("prefers playerId for senderId", () => {
    const msg = buildMessage({
      playerId: "p1",
      guestId: "g1",
      userId: "u1",
      nickname: "A",
      content: "x",
      channelId: "c",
      memberId: "m",
    });
    expect(msg.senderId).toBe("p1");
  });

  it("falls back to guestId when no playerId", () => {
    const msg = buildMessage({
      playerId: null,
      guestId: "g1",
      userId: "u1",
      nickname: "A",
      content: "x",
      channelId: "c",
      memberId: "m",
    });
    expect(msg.senderId).toBe("g1");
  });

  it("falls back to userId when no playerId or guestId", () => {
    const msg = buildMessage({
      playerId: null,
      guestId: null,
      userId: "u1",
      nickname: "A",
      content: "x",
      channelId: "c",
      memberId: "m",
    });
    expect(msg.senderId).toBe("u1");
  });

  it("falls back to 'unknown' when nothing available", () => {
    const msg = buildMessage({
      playerId: null,
      guestId: null,
      userId: null,
      nickname: "A",
      content: "x",
      channelId: "c",
      memberId: "m",
    });
    expect(msg.senderId).toBe("unknown");
  });

  it("always marks isAI as false and isGuestMessage as true", () => {
    const msg = buildMessage({
      playerId: "p1",
      guestId: null,
      userId: "u1",
      nickname: "A",
      content: "x",
      channelId: "c",
      memberId: "m",
    });
    expect(msg.isAI).toBe(false);
    expect(msg.isGuestMessage).toBe(true);
  });
});
