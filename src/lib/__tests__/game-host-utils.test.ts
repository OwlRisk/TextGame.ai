import { describe, it, expect } from "vitest";
import {
  resolveChannelByName,
  getStreamingDisplay,
  splitHostOutput,
  sectionId,
} from "../game-host-utils";

// ═══════════════════════════════════════════════════════════════════════════════
// resolveChannelByName
// ═══════════════════════════════════════════════════════════════════════════════

const channels = [
  { id: "ch-1", name: "General" },
  { id: "ch-2", name: "Werewolves Only" },
  { id: "ch-3", name: "Seer Room" },
  { id: "ch-4", name: "Town Square" },
];

describe("resolveChannelByName — exact match", () => {
  it("matches exact name (case-insensitive)", () => {
    expect(resolveChannelByName("General", channels)).toBe("ch-1");
    expect(resolveChannelByName("general", channels)).toBe("ch-1");
    expect(resolveChannelByName("GENERAL", channels)).toBe("ch-1");
  });

  it("trims leading/trailing whitespace", () => {
    expect(resolveChannelByName("  General  ", channels)).toBe("ch-1");
  });

  it("prefers exact match over partial", () => {
    const ch = [
      { id: "a", name: "Town" },
      { id: "b", name: "Town Square" },
    ];
    expect(resolveChannelByName("Town", ch)).toBe("a");
  });
});

describe("resolveChannelByName — partial match", () => {
  it("matches when query contains channel name", () => {
    expect(resolveChannelByName("werewolves only room", channels)).toBe("ch-2");
  });

  it("matches when channel name contains query", () => {
    expect(resolveChannelByName("Seer", channels)).toBe("ch-3");
  });

  it("returns null when no match", () => {
    expect(resolveChannelByName("Nonexistent Room", channels)).toBeNull();
  });

  it("matches any channel for empty input (empty string is substring of everything)", () => {
    // Empty string `.includes("")` is always true, so partial match fires
    expect(resolveChannelByName("", channels)).toBe("ch-1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getStreamingDisplay
// ═══════════════════════════════════════════════════════════════════════════════

describe("getStreamingDisplay", () => {
  it("returns text before --- separator", () => {
    const raw = "Hello everyone!\n---\nPHASE: Night\nBOARD stuff";
    expect(getStreamingDisplay(raw)).toBe("Hello everyone!");
  });

  it("trims whitespace from the public portion", () => {
    const raw = "  Hello!  \n---\nstuff";
    expect(getStreamingDisplay(raw)).toBe("Hello!");
  });

  it("strips complete [BOARD:...][/BOARD] blocks when no separator", () => {
    const raw = "Hello!\n[BOARD:You]\nYou are the Seer.\n[/BOARD]\nEnjoy.";
    const result = getStreamingDisplay(raw);
    expect(result).not.toContain("[BOARD");
    expect(result).not.toContain("You are the Seer.");
    expect(result).toContain("Hello!");
    expect(result).toContain("Enjoy.");
  });

  it("strips unclosed [BOARD:...] blocks (mid-stream)", () => {
    const raw = "Hello!\n[BOARD:Alice]\nSome secret info still streaming";
    const result = getStreamingDisplay(raw);
    expect(result).not.toContain("[BOARD");
    expect(result).not.toContain("Some secret info");
    expect(result).toContain("Hello!");
  });

  it("collapses multiple newlines left by removal", () => {
    const raw = "Line 1\n\n\n\n\n[BOARD:You]\nSecret\n[/BOARD]\n\n\n\nLine 2";
    const result = getStreamingDisplay(raw);
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("returns empty string for empty input", () => {
    expect(getStreamingDisplay("")).toBe("");
  });

  it("handles separator with trailing spaces", () => {
    const raw = "Public text\n---   \nDirectives";
    expect(getStreamingDisplay(raw)).toBe("Public text");
  });

  it("handles text with no separator and no BOARD blocks", () => {
    const raw = "Just a simple message";
    expect(getStreamingDisplay(raw)).toBe("Just a simple message");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// splitHostOutput
// ═══════════════════════════════════════════════════════════════════════════════

describe("splitHostOutput", () => {
  it("splits at --- separator", () => {
    const raw = "Public message\n---\nPHASE: Night\nNEXT_SPEAKER: Alice";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("Public message");
    expect(directives).toContain("PHASE: Night");
    expect(directives).toContain("NEXT_SPEAKER: Alice");
  });

  it("trims both parts", () => {
    const raw = "  Hello world  \n---\n  PHASE: Day  ";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("Hello world");
    expect(directives).toBe("PHASE: Day");
  });

  it("returns empty message and full directives when no separator (fallback)", () => {
    const raw = "PHASE: Night\nNEXT_SPEAKER: You";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toBe(raw);
  });

  it("handles multi-line public message", () => {
    const raw = "Line 1\nLine 2\nLine 3\n---\nPHASE: Round 1";
    const { message } = splitHostOutput(raw);
    expect(message).toBe("Line 1\nLine 2\nLine 3");
  });

  it("handles empty public part before ---", () => {
    const raw = "\n---\nPHASE: Night";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toContain("PHASE: Night");
  });

  it("handles --- with trailing whitespace", () => {
    const raw = "Hello\n---   \nPHASE: X";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("Hello");
    expect(directives).toContain("PHASE: X");
  });

  it("does not split on --- in the middle of a line", () => {
    const raw = "score is 5---3 more to go";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toBe(raw);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sectionId
// ═══════════════════════════════════════════════════════════════════════════════

describe("sectionId", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(sectionId("Vote Log")).toBe("section-vote-log");
  });

  it("strips special characters", () => {
    expect(sectionId("Player's Notes!")).toBe("section-players-notes");
  });

  it("collapses multiple spaces into single hyphen", () => {
    expect(sectionId("Round   Summary")).toBe("section-round-summary");
  });

  it("handles unicode characters (strips them)", () => {
    expect(sectionId("投票日志")).toBe("section-");
  });

  it("handles numbers", () => {
    expect(sectionId("Round 3 Results")).toBe("section-round-3-results");
  });

  it("handles already-lowercase input", () => {
    expect(sectionId("game over")).toBe("section-game-over");
  });

  it("handles empty string", () => {
    expect(sectionId("")).toBe("section-");
  });

  it("handles leading/trailing spaces (spaces become hyphens, then trailing non-alnum stripped)", () => {
    // Spaces → hyphens first, then non-alnum strip doesn't remove hyphens
    expect(sectionId("  Clue Board  ")).toBe("section--clue-board-");
  });
});
