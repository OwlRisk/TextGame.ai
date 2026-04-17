import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildSceneCharacterPrompt,
  getPlayerTokenLimit,
  getPlayerSentenceLimit,
  getPlayerCharLimit,
  PLAYER_SPEAK_HARD_LIMIT_TOKENS,
  EMOTION_TAGS_SECTION,
} from "@/lib/player-speak-prompt";

describe("buildSystemPrompt — all templates", () => {
  const templates = [
    "custom", "rpg-dungeon", "roleplay", "adventure",
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

  it("EMOTION_TAGS_SECTION mentions emotion and sound tags", () => {
    expect(EMOTION_TAGS_SECTION).toMatch(/EMOTION/);
    expect(EMOTION_TAGS_SECTION).toContain("[sigh]");
  });
});

describe("scene mode limits", () => {
  it("getPlayerTokenLimit returns 500 for scene", () => {
    expect(getPlayerTokenLimit("scene")).toBe(500);
  });

  it("getPlayerTokenLimit returns hard limit for undefined", () => {
    expect(getPlayerTokenLimit(undefined)).toBe(PLAYER_SPEAK_HARD_LIMIT_TOKENS);
  });

  it("getPlayerSentenceLimit returns max:5 preferred:3 for scene", () => {
    const limit = getPlayerSentenceLimit("scene");
    expect(limit.max).toBe(5);
    expect(limit.preferred).toBe(3);
  });

  it("getPlayerCharLimit returns 500 for scene", () => {
    expect(getPlayerCharLimit("scene")).toBe(500);
  });

  it("getPlayerCharLimit returns 400 for undefined", () => {
    expect(getPlayerCharLimit(undefined)).toBe(400);
  });
});

describe("buildSceneCharacterPrompt", () => {
  it("produces a prompt containing player and human names", () => {
    const prompt = buildSceneCharacterPrompt("Max", "the-lighthouse", "Alex", "tough and direct", "ex-soldier", "clipped sentences", "cracks knuckles");
    expect(prompt).toContain("Max");
    expect(prompt).toContain("Alex");
  });

  it("contains RULES section", () => {
    const prompt = buildSceneCharacterPrompt("Max", "the-lighthouse", "Alex");
    expect(prompt).toContain("RULES");
  });

  it("includes asterisk action format instruction", () => {
    const prompt = buildSceneCharacterPrompt("Max", "the-lighthouse", "Alex");
    expect(prompt).toMatch(/asterisk/i);
  });

  it("does not crash with invalid sceneId", () => {
    const prompt = buildSceneCharacterPrompt("Max", "nonexistent", "Alex");
    expect(prompt).toContain("Max");
    expect(prompt).toContain("Alex");
  });
});
