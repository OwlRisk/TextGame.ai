import { describe, it, expect } from "vitest";
import { parseHostActions, resolvePlayerRefToId } from "../host-actions";

// ═══════════════════════════════════════════════════════════════════════════════
// GAME_OVER label / content fallback
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — GAME_OVER edge cases", () => {
  it("uses the first capture group (label) as summary via || fallback", () => {
    const raw = "[GAME_OVER]Heroes win the day![/GAME_OVER]";
    const { actions } = parseHostActions(raw);
    const go = actions.find((a) => a.type === "game_over") as { type: "game_over"; summary: string };
    expect(go).toBeDefined();
    expect(go.summary).toBe("Heroes win the day!");
  });

  it("returns empty summary for empty GAME_OVER block", () => {
    const raw = "[GAME_OVER][/GAME_OVER]";
    const { actions } = parseHostActions(raw);
    const go = actions.find((a) => a.type === "game_over") as { type: "game_over"; summary: string };
    expect(go).toBeDefined();
    expect(go.summary).toBe("");
  });

  it("trims whitespace from the summary", () => {
    const raw = "[GAME_OVER]   Villagers win!   [/GAME_OVER]";
    const { actions } = parseHostActions(raw);
    const go = actions.find((a) => a.type === "game_over") as { type: "game_over"; summary: string };
    expect(go.summary).toBe("Villagers win!");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MY_NOTES label / content fallback
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — MY_NOTES edge cases", () => {
  it("uses the first capture group as content via || fallback", () => {
    const raw = "[MY_NOTES]Alice looks suspicious[/MY_NOTES]";
    const { actions } = parseHostActions(raw);
    const notes = actions.find((a) => a.type === "player_notes") as { type: "player_notes"; content: string };
    expect(notes.content).toBe("Alice looks suspicious");
  });

  it("trims whitespace from notes content", () => {
    const raw = "[MY_NOTES]   Watch Bob   [/MY_NOTES]";
    const { actions } = parseHostActions(raw);
    const notes = actions.find((a) => a.type === "player_notes") as { type: "player_notes"; content: string };
    expect(notes.content).toBe("Watch Bob");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// resolvePlayerRefToId — whitespace and edge cases
// ═══════════════════════════════════════════════════════════════════════════════

const PLAYERS = [
  { id: "p-1", name: "Alice" },
  { id: "p-2", name: "Bob" },
  { id: "p-3", name: "  Charlie  " },
];
const USER_ID = "user-001";

describe("resolvePlayerRefToId — edge cases", () => {
  it('resolves "You" (case-insensitive) to userId', () => {
    expect(resolvePlayerRefToId("You", PLAYERS, USER_ID)).toBe(USER_ID);
    expect(resolvePlayerRefToId("you", PLAYERS, USER_ID)).toBe(USER_ID);
    expect(resolvePlayerRefToId("YOU", PLAYERS, USER_ID)).toBe(USER_ID);
  });

  it("resolves exact player name", () => {
    expect(resolvePlayerRefToId("Alice", PLAYERS, USER_ID)).toBe("p-1");
    expect(resolvePlayerRefToId("Bob", PLAYERS, USER_ID)).toBe("p-2");
  });

  it("resolves player name with trimmed matching", () => {
    expect(resolvePlayerRefToId("Charlie", PLAYERS, USER_ID)).toBe("p-3");
  });

  it("returns null for empty ref", () => {
    expect(resolvePlayerRefToId("", PLAYERS, USER_ID)).toBeNull();
    expect(resolvePlayerRefToId("  ", PLAYERS, USER_ID)).toBeNull();
  });

  it("returns null for unknown player name", () => {
    expect(resolvePlayerRefToId("Eve", PLAYERS, USER_ID)).toBeNull();
  });

  it("uses humanDisplayName as fallback", () => {
    expect(resolvePlayerRefToId("MyName", PLAYERS, USER_ID, "MyName")).toBe(USER_ID);
  });

  it("handles humanDisplayName with whitespace", () => {
    expect(resolvePlayerRefToId("MyName", PLAYERS, USER_ID, "  MyName  ")).toBe(USER_ID);
  });

  it("does not match humanDisplayName when null", () => {
    expect(resolvePlayerRefToId("SomeRandom", PLAYERS, USER_ID, null)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Block + inline directive parse order
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — block and inline directive ordering", () => {
  it("processes block parsers before inline directives", () => {
    const raw = [
      "[BOARD:You]",
      "You are the Seer.",
      "[/BOARD]",
      "PHASE: Night · Round 1",
      "MOOD: dark",
    ].join("\n");
    const { actions } = parseHostActions(raw);
    const types = actions.map((a) => a.type);
    const boardIdx = types.indexOf("my_board");
    const phaseIdx = types.indexOf("phase");
    const moodIdx = types.indexOf("mood");
    expect(boardIdx).toBeLessThan(phaseIdx);
    expect(phaseIdx).toBeLessThan(moodIdx);
  });

  it("BOARD blocks are removed before inline directives are processed", () => {
    const raw = [
      "[BOARD:Alice]",
      "PHASE: Inside Board",
      "[/BOARD]",
      "PHASE: Real Phase",
    ].join("\n");
    const { actions } = parseHostActions(raw);
    const phases = actions.filter((a) => a.type === "phase");
    expect(phases).toHaveLength(1);
    if (phases[0]?.type === "phase") {
      expect(phases[0].label).toBe("Real Phase");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// cleanContent newline collapsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — cleanContent formatting", () => {
  it("collapses 3+ consecutive newlines to max 2", () => {
    const raw = "Before\n\n\n\n[BOARD:You]\nSecret\n[/BOARD]\n\n\n\nAfter";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toMatch(/\n{3,}/);
    expect(cleanContent).toContain("Before");
    expect(cleanContent).toContain("After");
  });

  it("trims leading and trailing whitespace", () => {
    // PHASE directive is on its own line but has leading spaces, so ^PHASE regex (with m flag) matches
    const raw = "   \n  Hello  \nPHASE: X\n   ";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).toBe("Hello");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// START_VOTE options edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — START_VOTE option parsing edge cases", () => {
  it("trims whitespace from each option", () => {
    const raw = "START_VOTE: Choose | Option A ,  Option B ,  Option C ";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote" && Array.isArray(vote.options)) {
      expect(vote.options).toEqual(["Option A", "Option B", "Option C"]);
    }
  });

  it("filters out empty options from trailing commas", () => {
    const raw = "START_VOTE: Choose | A, B, , ,";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote" && Array.isArray(vote.options)) {
      expect(vote.options).toEqual(["A", "B"]);
    }
  });

  it("single option still returns array", () => {
    const raw = "START_VOTE: Confirm? | Yes";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote") {
      expect(vote.options).toEqual(["Yes"]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESS block parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — ACCESS block edge cases", () => {
  it("parses ACCESS with wildcard for public access", () => {
    const raw = "[ACCESS:General]\n*\n[/ACCESS]";
    const { actions } = parseHostActions(raw);
    const access = actions.find((a) => a.type === "access");
    if (access?.type === "access") {
      expect(access.channelRef).toBe("General");
      expect(access.playerRefs).toContain("*");
    }
  });

  it("parses ACCESS with comma-separated player list", () => {
    const raw = "[ACCESS:Secret Room]\nAlice, Bob, You\n[/ACCESS]";
    const { actions } = parseHostActions(raw);
    const access = actions.find((a) => a.type === "access");
    if (access?.type === "access") {
      expect(access.playerRefs).toEqual(["Alice", "Bob", "You"]);
    }
  });

  it("parses empty ACCESS (lock channel)", () => {
    const raw = "[ACCESS:Werewolves Only]\n[/ACCESS]";
    const { actions } = parseHostActions(raw);
    const access = actions.find((a) => a.type === "access");
    if (access?.type === "access") {
      expect(access.playerRefs).toEqual([]);
    }
  });
});
