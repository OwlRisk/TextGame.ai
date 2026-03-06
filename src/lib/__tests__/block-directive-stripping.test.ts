import { describe, it, expect } from "vitest";
import { getStreamingDisplay, stripDirectiveLines } from "@/lib/game-host-utils";

/**
 * Tests for block-level directive stripping ([SECTION], [BOARD], [ACCESS],
 * [GAME_OVER]) in both getStreamingDisplay (streaming phase) and
 * stripDirectiveLines (rendering safety net).
 */

// ═══════════════════════════════════════════════════════════════════════════
// getStreamingDisplay — block-level tag stripping
// ═══════════════════════════════════════════════════════════════════════════

describe("getStreamingDisplay — [SECTION] block stripping", () => {
  it("strips a complete [SECTION:Title]...[/SECTION] block", () => {
    const raw = "Hello!\n[SECTION:Board]\n5x5 grid here\n[/SECTION]\nEnjoy the game.";
    const result = getStreamingDisplay(raw);
    expect(result).not.toContain("[SECTION");
    expect(result).not.toContain("5x5 grid");
    expect(result).not.toContain("[/SECTION]");
    expect(result).toContain("Hello!");
    expect(result).toContain("Enjoy the game.");
  });

  it("strips [SECTION] when it is the only content", () => {
    const raw = "[SECTION:Round 1 — Board]\nALPS | CROWN | DRILL\n[/SECTION]";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips [SECTION] mixed with public text and a directive line", () => {
    const raw = "Welcome!\n[SECTION:Teams]\nRed vs Blue\n[/SECTION]\nNEXT_SPEAKER: Alice";
    const result = getStreamingDisplay(raw);
    expect(result).toBe("Welcome!");
  });

  it("strips unclosed [SECTION] block (mid-stream)", () => {
    const raw = "Hello!\n[SECTION:Board]\nPartial content still streaming";
    const result = getStreamingDisplay(raw);
    expect(result).not.toContain("[SECTION");
    expect(result).not.toContain("Partial content");
    expect(result).toContain("Hello!");
  });

  it("strips multiple [SECTION] blocks", () => {
    const raw = "[SECTION:A]\nContent A\n[/SECTION]\nVisible text\n[SECTION:B]\nContent B\n[/SECTION]";
    const result = getStreamingDisplay(raw);
    expect(result).toBe("Visible text");
  });
});

describe("getStreamingDisplay — [ACCESS] block stripping", () => {
  it("strips a complete [ACCESS:Room]...[/ACCESS] block", () => {
    const raw = "Phase change.\n[ACCESS:Werewolves]\nPlayer1, Player2\n[/ACCESS]";
    const result = getStreamingDisplay(raw);
    expect(result).toBe("Phase change.");
    expect(result).not.toContain("[ACCESS");
  });

  it("strips unclosed [ACCESS] block", () => {
    const raw = "Text here\n[ACCESS:Secret Room]\nStill streaming";
    const result = getStreamingDisplay(raw);
    expect(result).toBe("Text here");
  });
});

describe("getStreamingDisplay — [GAME_OVER] block stripping", () => {
  it("strips a complete [GAME_OVER]...[/GAME_OVER] block", () => {
    const raw = "Final message.\n[GAME_OVER]\nVillagers win!\n[/GAME_OVER]";
    const result = getStreamingDisplay(raw);
    expect(result).toBe("Final message.");
  });

  it("strips [GAME_OVER] as sole content", () => {
    const raw = "[GAME_OVER]\nThe werewolves have been defeated.\n[/GAME_OVER]";
    expect(getStreamingDisplay(raw)).toBe("");
  });
});

describe("getStreamingDisplay — partial directive prefix (no colon)", () => {
  it("strips 'NEXT_SPEAKER' without colon (token still streaming)", () => {
    expect(getStreamingDisplay("Hello\nNEXT_SPEAKER")).toBe("Hello");
  });

  it("strips 'ELIMINATE' without colon", () => {
    expect(getStreamingDisplay("ELIMINATE")).toBe("");
  });

  it("strips 'GAME_OVER' line-level directive without colon", () => {
    expect(getStreamingDisplay("GAME_OVER")).toBe("");
  });

  it("strips 'ANNOUNCE' without colon", () => {
    expect(getStreamingDisplay("Visible text\nANNOUNCE")).toBe("Visible text");
  });

  it("strips 'MOOD' without colon", () => {
    expect(getStreamingDisplay("MOOD")).toBe("");
  });

  it("does not strip if prefix is part of a word", () => {
    const raw = "The MOOD_SETTING was eerie.";
    expect(getStreamingDisplay(raw)).toContain("MOOD_SETTING");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// stripDirectiveLines — rendering-layer safety net
// ═══════════════════════════════════════════════════════════════════════════

describe("stripDirectiveLines — block-level stripping", () => {
  it("strips [SECTION:Title]...[/SECTION] from persisted content", () => {
    const content = "[SECTION:Round 1 — Board]\n5x5 Grid: ALPS | CROWN\n[/SECTION] Give your clue.";
    const result = stripDirectiveLines(content);
    expect(result).not.toContain("[SECTION");
    expect(result).not.toContain("5x5 Grid");
    expect(result).toBe("Give your clue.");
  });

  it("strips [BOARD:Player]...[/BOARD] from persisted content", () => {
    const content = "[BOARD:You]\nYou are the Seer.\n[/BOARD]\nGood luck!";
    const result = stripDirectiveLines(content);
    expect(result).not.toContain("[BOARD");
    expect(result).toBe("Good luck!");
  });

  it("strips [ACCESS:Room]...[/ACCESS] from persisted content", () => {
    const content = "Night falls.\n[ACCESS:Wolves]\nAlice, Bob\n[/ACCESS]";
    const result = stripDirectiveLines(content);
    expect(result).toBe("Night falls.");
  });

  it("strips [GAME_OVER]...[/GAME_OVER]", () => {
    const content = "The end.\n[GAME_OVER]\nVillagers win!\n[/GAME_OVER]";
    const result = stripDirectiveLines(content);
    expect(result).toBe("The end.");
  });

  it("strips block tags AND line directives together", () => {
    const content = "[SECTION:Board]\nGrid data\n[/SECTION]\nNEXT_SPEAKER: Alice\nHave fun!";
    const result = stripDirectiveLines(content);
    expect(result).toBe("Have fun!");
  });

  it("is a no-op on already-clean content", () => {
    const content = "Hello, this is a normal message.";
    expect(stripDirectiveLines(content)).toBe(content);
  });

  it("returns empty string when content is only directives", () => {
    const content = "NEXT_SPEAKER: Alice\nASSIGN_ROLE: Bob -> Wolf";
    expect(stripDirectiveLines(content)).toBe("");
  });

  it("handles empty string", () => {
    expect(stripDirectiveLines("")).toBe("");
  });

  it("strips ELIMINATE directive", () => {
    expect(stripDirectiveLines("ELIMINATE: Alice")).toBe("");
  });

  it("strips REVEAL_ROLE directive", () => {
    expect(stripDirectiveLines("REVEAL_ROLE: all")).toBe("");
  });

  it("strips ANNOUNCE directive", () => {
    expect(stripDirectiveLines("ANNOUNCE: Round 2 begins!")).toBe("");
  });

  it("strips MOOD directive", () => {
    expect(stripDirectiveLines("MOOD: dark")).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge cases — mixed blocks and separators
// ═══════════════════════════════════════════════════════════════════════════

describe("getStreamingDisplay — separator takes priority over block stripping", () => {
  it("returns content before --- even if blocks exist after", () => {
    const raw = "Public message\n---\n[SECTION:Board]\nGrid\n[/SECTION]\nNEXT_SPEAKER: Alice";
    expect(getStreamingDisplay(raw)).toBe("Public message");
  });

  it("returns all content before --- (block stripping is caller's job after stream ends)", () => {
    const raw = "[SECTION:Info]\nSecret\n[/SECTION]\nVisible\n---\nNEXT_SPEAKER: Bob";
    const result = getStreamingDisplay(raw);
    expect(result).toContain("Visible");
    expect(result).not.toContain("NEXT_SPEAKER");
  });
});
