import { describe, it, expect } from "vitest";

/**
 * Tests for the prompt construction and response parsing logic
 * used by suggest-quick-replies and suggest-gm-replies API routes.
 *
 * We extract and test the pure functions: prompt assembly and response parsing.
 */

// --- Quick reply suggestion parsing (from suggest-quick-replies/route.ts) ---
function parseQuickReplySuggestions(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.replace(/^[\d.)\-\s]+/, "").replace(/^["']|["']$/g, "").trim())
    .filter((s) => s.length > 0 && s.length <= 120)
    .slice(0, 3);
}

describe("parseQuickReplySuggestions", () => {
  it("parses clean lines", () => {
    expect(parseQuickReplySuggestions("I agree\nLet's vote\nI'm suspicious of Juno"))
      .toEqual(["I agree", "Let's vote", "I'm suspicious of Juno"]);
  });

  it("strips numbered prefixes", () => {
    expect(parseQuickReplySuggestions("1. First option\n2) Second option\n3 - Third"))
      .toEqual(["First option", "Second option", "Third"]);
  });

  it("strips surrounding quotes", () => {
    expect(parseQuickReplySuggestions('"I agree"\n\'Let\'s investigate\''))
      .toEqual(["I agree", "Let's investigate"]);
  });

  it("filters out empty lines", () => {
    expect(parseQuickReplySuggestions("Option A\n\n\nOption B"))
      .toEqual(["Option A", "Option B"]);
  });

  it("limits to 3 suggestions", () => {
    expect(parseQuickReplySuggestions("A\nB\nC\nD\nE").length).toBe(3);
  });

  it("filters lines exceeding 120 chars", () => {
    const long = "x".repeat(121);
    expect(parseQuickReplySuggestions(`Short\n${long}\nOK`))
      .toEqual(["Short", "OK"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseQuickReplySuggestions("")).toEqual([]);
    expect(parseQuickReplySuggestions("  \n  ")).toEqual([]);
  });
});

// --- GM reply suggestion parsing (from suggest-gm-replies/route.ts) ---
const MAX_SUGGESTIONS = 8;

function parseGMReplySuggestions(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.replace(/^[\d.)\-\s]+/, "").replace(/^["']|["']$/g, "").trim())
    .filter((s) => s.length > 0 && s.length <= 120)
    .slice(0, MAX_SUGGESTIONS);
}

describe("parseGMReplySuggestions", () => {
  it("parses up to 8 suggestions", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`).join("\n");
    expect(parseGMReplySuggestions(lines).length).toBe(8);
  });

  it("returns empty for empty content (0 suggestions is valid)", () => {
    expect(parseGMReplySuggestions("")).toEqual([]);
  });
});

// --- Player context prompt construction ---
function buildPlayerContext(playerName: string, playerRole?: string): string {
  return playerRole
    ? `The human player is "${playerName}" (role: ${playerRole}).`
    : `The human player is "${playerName}".`;
}

describe("buildPlayerContext", () => {
  it("includes role when provided", () => {
    const ctx = buildPlayerContext("Alice", "Seer");
    expect(ctx).toContain("Alice");
    expect(ctx).toContain("Seer");
    expect(ctx).toContain("role:");
  });

  it("omits role when not provided", () => {
    const ctx = buildPlayerContext("Bob");
    expect(ctx).toContain("Bob");
    expect(ctx).not.toContain("role:");
  });
});

// --- Language detection (used in GM chat to pick lang) ---
function detectLanguage(content: string): "zh" | "en" {
  return /[\u4e00-\u9fff]/.test(content) ? "zh" : "en";
}

describe("detectLanguage", () => {
  it("detects Chinese", () => {
    expect(detectLanguage("你好世界")).toBe("zh");
    expect(detectLanguage("hello 你好")).toBe("zh");
  });

  it("detects English", () => {
    expect(detectLanguage("Hello world")).toBe("en");
    expect(detectLanguage("")).toBe("en");
  });
});

// --- Recent message text builder ---
function buildRecentText(messages: Array<{ senderName: string; content: string }>): string {
  return messages
    .slice(-10)
    .map((m) => `${m.senderName}: ${m.content}`)
    .join("\n");
}

describe("buildRecentText", () => {
  it("formats messages correctly", () => {
    const msgs = [
      { senderName: "GM", content: "Welcome!" },
      { senderName: "Alice", content: "Thanks" },
    ];
    expect(buildRecentText(msgs)).toBe("GM: Welcome!\nAlice: Thanks");
  });

  it("limits to last 10 messages", () => {
    const msgs = Array.from({ length: 15 }, (_, i) => ({
      senderName: `P${i}`,
      content: `msg${i}`,
    }));
    const lines = buildRecentText(msgs).split("\n");
    expect(lines.length).toBe(10);
    expect(lines[0]).toContain("P5"); // first 5 trimmed
  });

  it("returns empty for no messages", () => {
    expect(buildRecentText([])).toBe("");
  });
});
