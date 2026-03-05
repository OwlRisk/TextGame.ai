import { describe, it, expect } from "vitest";
import { getStreamingDisplay, splitHostOutput } from "@/lib/game-host-utils";

/**
 * Tests for directive stripping in getStreamingDisplay — ensuring that
 * NEXT_SPEAKER, ASSIGN_ROLE, and other GM directives never leak into
 * the player-visible chat during streaming.
 */

describe("getStreamingDisplay — directive line stripping", () => {
  it("strips NEXT_SPEAKER when no --- separator present", () => {
    const raw = "NEXT_SPEAKER: Alice, Bob";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips ASSIGN_ROLE when no --- separator present", () => {
    const raw = "ASSIGN_ROLE: Alice -> Seer";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips AUTO_CHANNEL directive", () => {
    const raw = "AUTO_CHANNEL: secret-room";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips CHANNEL_GOAL directive", () => {
    const raw = "CHANNEL_GOAL: Discuss the evidence";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips IMAGE_PROMPT directive", () => {
    const raw = "IMAGE_PROMPT: A dark forest at night";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips GAME_PHASE directive", () => {
    const raw = "GAME_PHASE: Night Phase — Round 2";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips START_VOTE directive", () => {
    const raw = "START_VOTE: Who to eliminate? | Alice | Bob | Carol";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips END_VOTE directive", () => {
    const raw = "END_VOTE: complete";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips SECTION directive", () => {
    const raw = "SECTION: Teams";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips MY_NOTES directive", () => {
    const raw = "MY_NOTES: Remember to check Alice's alibi";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("strips multiple directives from mixed content", () => {
    const raw = "Welcome to the game!\nNEXT_SPEAKER: Alice, Bob\nASSIGN_ROLE: Alice -> Seer";
    const display = getStreamingDisplay(raw);
    expect(display).toBe("Welcome to the game!");
    expect(display).not.toContain("NEXT_SPEAKER");
    expect(display).not.toContain("ASSIGN_ROLE");
  });

  it("preserves public message when directives are on separate lines", () => {
    const raw = "The night begins. Everyone close your eyes.\nNEXT_SPEAKER: Juno";
    expect(getStreamingDisplay(raw)).toBe("The night begins. Everyone close your eyes.");
  });

  it("preserves content that happens to contain directive keywords in prose", () => {
    const raw = "Alice assigned a role to the team and spoke next.";
    expect(getStreamingDisplay(raw)).toBe("Alice assigned a role to the team and spoke next.");
  });

  it("does not strip partial directive names mid-word", () => {
    const raw = "The NEXT_SPEAKER_QUEUE was full.";
    // This line starts with "The" not a directive prefix, so it should be kept
    expect(getStreamingDisplay(raw)).toContain("NEXT_SPEAKER_QUEUE");
  });

  it("still respects --- separator over directive stripping", () => {
    const raw = "Hello!\n---\nNEXT_SPEAKER: Alice";
    expect(getStreamingDisplay(raw)).toBe("Hello!");
  });

  it("handles empty string", () => {
    expect(getStreamingDisplay("")).toBe("");
  });

  it("handles only whitespace", () => {
    expect(getStreamingDisplay("   \n  ")).toBe("");
  });
});

describe("splitHostOutput — with directive-only content (no ---)", () => {
  it("treats directive-only as empty message", () => {
    const { message, directives } = splitHostOutput("NEXT_SPEAKER: Alice");
    expect(message).toBe("");
    expect(directives).toBe("NEXT_SPEAKER: Alice");
  });

  it("handles multiple directives without separator", () => {
    const raw = "ASSIGN_ROLE: Bob -> Wolf\nNEXT_SPEAKER: Alice";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toContain("ASSIGN_ROLE");
    expect(directives).toContain("NEXT_SPEAKER");
  });

  it("correctly splits when --- is present with directives", () => {
    const raw = "The vote is in.\n---\nNEXT_SPEAKER: Alice\nGAME_PHASE: Day Phase";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("The vote is in.");
    expect(directives).toContain("NEXT_SPEAKER");
    expect(directives).toContain("GAME_PHASE");
  });
});
