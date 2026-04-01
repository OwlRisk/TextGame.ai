import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  PLAYER_SPEAK_HARD_LIMIT_TOKENS,
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
      expect(prompt).toContain("PACING");
      expect(prompt).toContain(EMOTION_TAGS_SECTION);
      expect(prompt).not.toContain("undefined");
    });
  }

  it("werewolf prompt contains accusation-focused deduction pacing", () => {
    const prompt = buildSystemPrompt("Alice", "werewolf", "Werewolf");
    expect(prompt).toContain("Werewolf");
    expect(prompt).toContain("accusation");
    expect(prompt).toMatch(/Strategy discussion and accusations ARE the game/i);
  });

  it("mafia and werewolf share the same HOW TO PLAY bullets (distinct template text)", () => {
    const ww = buildSystemPrompt("Alice", "werewolf", "Game");
    const mf = buildSystemPrompt("Alice", "mafia", "Game");
    const sharedHowTo =
      "One concrete accusation, defense, or observation per turn. NAME who and WHY.";
    expect(ww).toContain(sharedHowTo);
    expect(mf).toContain(sharedHowTo);
    expect(ww).toContain("playing Werewolf");
    expect(mf).toContain("playing Mafia");
    expect(ww).not.toBe(mf);
  });

  it("undercover prompt mentions word description / secret word", () => {
    const prompt = buildSystemPrompt("Bob", "undercover", "UC Game");
    expect(prompt).toContain("word description game");
    expect(prompt).toContain("secret word");
  });

  it("tarot prompt is reflective, not accusatory", () => {
    const prompt = buildSystemPrompt("Iris", "tarot", "Mystic");
    expect(prompt).toContain("reflective");
    expect(prompt).toContain("No meta-commentary about game procedure");
    expect(prompt).not.toMatch(/concrete accusation/i);
  });

  it("trivia/quiz prompts mention pub quiz energy", () => {
    const t = buildSystemPrompt("Sam", "trivia", "Quiz Night");
    const q = buildSystemPrompt("Sam", "quiz", "Quiz Night");
    expect(t).toContain("pub quiz");
    expect(q).not.toContain("pub quiz");
    expect(q).toMatch(/game table with opinions and stakes/i);
  });

  it("roleplay/adventure prompts emphasize staying in character", () => {
    const r = buildSystemPrompt("Hero", "roleplay", "Epic");
    const a = buildSystemPrompt("Hero", "adventure", "Epic");
    expect(r).toMatch(/never break character/i);
    expect(a).toMatch(/never break character/i);
  });

  it("default prompt is generic and flexible", () => {
    const prompt = buildSystemPrompt("Player", undefined, "Custom");
    expect(prompt).toContain("game table");
    expect(prompt).toContain("No speeches");
  });
});

describe("player-speak constants", () => {
  it("hard limit is a reasonable token count", () => {
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBeGreaterThan(50);
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBeLessThan(500);
  });

  it("prompts contain sentence limits", () => {
    const prompt = buildSystemPrompt("Test", "werewolf", "G");
    expect(prompt).toContain("3 sentences max");
  });

  it("deduction prompts contain [MY_NOTES] section", () => {
    const prompt = buildSystemPrompt("Test", "werewolf", "G");
    expect(prompt).toContain("[MY_NOTES]");
    expect(prompt).toContain("[/MY_NOTES]");
  });

  it("EMOTION_TAGS_SECTION mentions emotion and sound tags", () => {
    expect(EMOTION_TAGS_SECTION).toContain("[angry]");
    expect(EMOTION_TAGS_SECTION).toContain("[sigh]");
  });
});
