import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  PACING_RULE,
  MY_NOTES_SECTION,
  EMOTION_TAGS_SECTION,
} from "@/lib/player-speak-prompt";

/**
 * Tests for buildSystemPrompt with the new personality and background parameters.
 */

describe("buildSystemPrompt — personality & background integration", () => {
  it("includes personality when provided", () => {
    const prompt = buildSystemPrompt("Alice", "werewolf", "Werewolf", "Calm and analytical");
    expect(prompt).toContain("Your personality: Calm and analytical.");
  });

  it("includes background when provided", () => {
    const prompt = buildSystemPrompt("Bob", "adventure", "Quest", undefined, "A retired knight from the northern kingdom");
    expect(prompt).toContain("A retired knight from the northern kingdom");
  });

  it("includes both personality and background", () => {
    const prompt = buildSystemPrompt(
      "Carol",
      "roleplay",
      "Realm",
      "Mysterious and cunning",
      "Former spy turned merchant"
    );
    expect(prompt).toContain("Your personality: Mysterious and cunning.");
    expect(prompt).toContain("Former spy turned merchant");
  });

  it("works without personality or background (backward compatible)", () => {
    const prompt = buildSystemPrompt("Dave", "mafia", "Town");
    expect(prompt).toContain("Dave");
    expect(prompt).toContain("Town");
    expect(prompt).not.toContain("Your personality:");
    // Should still have all standard sections
    expect(prompt).toContain(PACING_RULE);
    expect(prompt).toContain(MY_NOTES_SECTION);
    expect(prompt).toContain(EMOTION_TAGS_SECTION);
  });

  it("personality and background are in the base section before template text", () => {
    const prompt = buildSystemPrompt("Eve", "werewolf", "Game", "Nervous", "Newcomer to town");
    const personalityIdx = prompt.indexOf("Your personality: Nervous.");
    const backgroundIdx = prompt.indexOf("Newcomer to town");
    const pacingIdx = prompt.indexOf(PACING_RULE);
    // Both should appear before the pacing rule
    expect(personalityIdx).toBeLessThan(pacingIdx);
    expect(backgroundIdx).toBeLessThan(pacingIdx);
  });

  it("empty string personality is not included", () => {
    const prompt = buildSystemPrompt("Faye", "trivia", "Quiz", "");
    expect(prompt).not.toContain("Your personality:");
  });

  it("empty string background is not included", () => {
    const withEmpty = buildSystemPrompt("Gus", "tarot", "Reading", undefined, "");
    const without = buildSystemPrompt("Gus", "tarot", "Reading");
    expect(withEmpty).toBe(without);
  });

  it("personality with special characters is included verbatim", () => {
    const weird = "Calm (but secretly anxious); loves cats & dogs!";
    const prompt = buildSystemPrompt("Hank", undefined, "Game", weird);
    expect(prompt).toContain(`Your personality: ${weird}.`);
  });
});

describe("buildSystemPrompt — personality does not break template matching", () => {
  const templates = ["werewolf", "mafia", "undercover", "tarot", "trivia", "quiz", "roleplay", "adventure"];

  for (const tmpl of templates) {
    it(`template "${tmpl}" still produces correct prompt with personality`, () => {
      const withoutP = buildSystemPrompt("Test", tmpl, "Game");
      const withP = buildSystemPrompt("Test", tmpl, "Game", "Bold leader", "War veteran");

      // The personality version should be longer (has extra text)
      expect(withP.length).toBeGreaterThan(withoutP.length);
      // Both should contain standard sections
      expect(withP).toContain(PACING_RULE);
      expect(withP).toContain(MY_NOTES_SECTION);
    });
  }
});
