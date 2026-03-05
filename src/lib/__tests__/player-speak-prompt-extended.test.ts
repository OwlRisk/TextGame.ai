import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  PLAYER_SPEAK_HARD_LIMIT_TOKENS,
  PACING_RULE,
  MY_NOTES_SECTION,
  EMOTION_TAGS_SECTION,
} from "@/lib/player-speak-prompt";

/**
 * Extended tests for player-speak-prompt.ts covering all game templates
 * and prompt structure requirements.
 */

describe("buildSystemPrompt — all templates", () => {
  const templates = [
    "werewolf", "mafia", "undercover", "tarot",
    "trivia", "quiz", "roleplay", "adventure",
    undefined, "custom-game",
  ] as const;

  for (const tmpl of templates) {
    it(`produces valid prompt for template="${tmpl ?? "default"}"`, () => {
      const prompt = buildSystemPrompt("TestPlayer", tmpl as string | undefined, "TestGame");

      expect(prompt).toContain("TestPlayer");
      expect(prompt).toContain("TestGame");
      expect(prompt).toContain(PACING_RULE);
      expect(prompt).toContain(MY_NOTES_SECTION);
      expect(prompt).toContain(EMOTION_TAGS_SECTION);
      expect(prompt).not.toContain("undefined");
    });
  }

  it("werewolf prompt contains social deduction guidance", () => {
    const prompt = buildSystemPrompt("Alice", "werewolf", "Blood Moon");
    expect(prompt).toContain("social deduction");
    expect(prompt).toContain("accusations");
  });

  it("mafia prompt is identical to werewolf (same case branch)", () => {
    const ww = buildSystemPrompt("Alice", "werewolf", "Game");
    const mf = buildSystemPrompt("Alice", "mafia", "Game");
    expect(ww).toBe(mf);
  });

  it("undercover prompt mentions word-guessing", () => {
    const prompt = buildSystemPrompt("Bob", "undercover", "UC Game");
    expect(prompt).toContain("word-guessing");
  });

  it("tarot prompt is reflective, not accusatory", () => {
    const prompt = buildSystemPrompt("Iris", "tarot", "Mystic");
    expect(prompt).toContain("reflective");
    expect(prompt).toContain("No game-theory");
  });

  it("trivia/quiz prompts mention pub quiz energy", () => {
    const t = buildSystemPrompt("Sam", "trivia", "Quiz Night");
    const q = buildSystemPrompt("Sam", "quiz", "Quiz Night");
    expect(t).toContain("pub quiz");
    expect(q).toContain("pub quiz");
  });

  it("roleplay/adventure prompts emphasize staying in character", () => {
    const r = buildSystemPrompt("Hero", "roleplay", "Epic");
    const a = buildSystemPrompt("Hero", "adventure", "Epic");
    expect(r).toContain("Stay in character");
    expect(a).toContain("Stay in character");
  });

  it("default prompt is generic and flexible", () => {
    const prompt = buildSystemPrompt("Player", undefined, "Custom");
    expect(prompt).toContain("game table");
    expect(prompt).toContain("No monologues");
  });
});

describe("player-speak constants", () => {
  it("hard limit is a reasonable token count", () => {
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBeGreaterThan(50);
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBeLessThan(500);
  });

  it("PACING_RULE mentions sentence limits", () => {
    expect(PACING_RULE).toContain("3 sentences");
  });

  it("MY_NOTES_SECTION explains [MY_NOTES] format", () => {
    expect(MY_NOTES_SECTION).toContain("[MY_NOTES]");
    expect(MY_NOTES_SECTION).toContain("[/MY_NOTES]");
  });

  it("EMOTION_TAGS_SECTION lists available tags", () => {
    expect(EMOTION_TAGS_SECTION).toContain("[angry]");
    expect(EMOTION_TAGS_SECTION).toContain("[happy]");
    expect(EMOTION_TAGS_SECTION).toContain("[sigh]");
  });
});
