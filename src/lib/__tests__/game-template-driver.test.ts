import { describe, expect, it } from "vitest";
import {
  buildRuntimeProgressionGuard,
  buildTemplatePromptPolicy,
  getTemplateControlMode,
} from "../game-template-driver";

describe("game-template-driver", () => {
  describe("getTemplateControlMode", () => {
    it("classifies deduction templates", () => {
      expect(getTemplateControlMode("werewolf")).toBe("deduction");
      expect(getTemplateControlMode("secret-hitler")).toBe("deduction");
    });

    it("classifies quiz templates", () => {
      expect(getTemplateControlMode("trivia")).toBe("quiz");
      expect(getTemplateControlMode("20-questions")).toBe("quiz");
    });

    it("classifies open templates", () => {
      expect(getTemplateControlMode("tarot")).toBe("open");
      expect(getTemplateControlMode("custom")).toBe("open");
    });

    it("codenames is a deduction template", () => {
      expect(getTemplateControlMode("codenames")).toBe("deduction");
    });

    it("falls back to open for unknown templates", () => {
      expect(getTemplateControlMode("nonexistent-game-xyz")).toBe("open");
      expect(getTemplateControlMode("")).toBe("open");
    });
  });

  describe("buildTemplatePromptPolicy", () => {
    it("returns deduction-specific policy", () => {
      const policy = buildTemplatePromptPolicy("mafia");
      expect(policy).toContain("HARD RULE FOR DEDUCTION GAMES");
      expect(policy).toContain("start vote");
    });

    it("returns quiz-specific policy", () => {
      const policy = buildTemplatePromptPolicy("trivia");
      expect(policy).toContain("QUIZ / Q&A GAMES");
      expect(policy).toContain("next question");
    });
  });

  describe("buildRuntimeProgressionGuard", () => {
    it("triggers deduction guard after threshold", () => {
      const guard = buildRuntimeProgressionGuard("werewolf", 6);
      expect(guard).toContain("deduction game pacing is lagging");
    });

    it("triggers quiz guard after threshold", () => {
      const guard = buildRuntimeProgressionGuard("trivia", 3);
      expect(guard).toContain("quiz pacing is lagging");
    });

    it("does not trigger early", () => {
      expect(buildRuntimeProgressionGuard("werewolf", 3)).toBe("");
      expect(buildRuntimeProgressionGuard("trivia", 2)).toBe("");
    });
  });
});
