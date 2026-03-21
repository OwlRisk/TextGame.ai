import { describe, expect, it } from "vitest";
import {
  buildTemplateMechanics,
  buildProgressionPolicy,
  getTemplateControlMode,
} from "../game-template-driver";

describe("game-template-driver", () => {
  describe("getTemplateControlMode", () => {
    it("classifies deduction templates", () => {
      expect(getTemplateControlMode("werewolf")).toBe("deduction");
      expect(getTemplateControlMode("mafia")).toBe("deduction");
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

  describe("buildTemplateMechanics", () => {
    it("returns 20-questions mechanics without pacing", () => {
      const m = buildTemplateMechanics("20-questions");
      expect(m).toContain("YOU ARE THE THINKER");
      expect(m).toContain("ANSWERING QUESTIONS");
      expect(m).not.toContain("### PACING");
    });

    it("returns codenames mechanics", () => {
      const m = buildTemplateMechanics("codenames");
      expect(m).toContain("GRID & TURN MANAGEMENT");
    });

    it("returns spyfall mechanics without pacing", () => {
      const m = buildTemplateMechanics("spyfall");
      expect(m).toContain("LOCATION & SPY MANAGEMENT");
      expect(m).not.toContain("### PACING");
    });

    it("returns detective-mystery mechanics without pacing", () => {
      const m = buildTemplateMechanics("detective-mystery");
      expect(m).toContain("CASE MANAGEMENT");
      expect(m).not.toContain("### PACING");
    });

    it("werewolf/mafia have dedicated mechanics", () => {
      expect(buildTemplateMechanics("werewolf").length).toBeGreaterThan(50);
      expect(buildTemplateMechanics("mafia").length).toBeGreaterThan(50);
    });

    it("trivia has dedicated mechanics", () => {
      expect(buildTemplateMechanics("trivia").length).toBeGreaterThan(50);
    });

    it("returns empty for custom/unknown templates", () => {
      expect(buildTemplateMechanics("custom")).toBe("");
      expect(buildTemplateMechanics(undefined)).toBe("");
    });
  });

  describe("buildProgressionPolicy", () => {
    it("includes base pacing rules for any template", () => {
      const p = buildProgressionPolicy("werewolf");
      expect(p).toContain("Never dwell on the same beat twice");
      expect(p).toContain("Never re-explain rules");
    });

    it("includes deduction-specific rules for deduction games", () => {
      const p = buildProgressionPolicy("werewolf");
      expect(p).toContain("Force state changes");
      expect(p).toContain("START_VOTE");
    });

    it("includes quiz-specific rules for quiz games", () => {
      const p = buildProgressionPolicy("trivia");
      expect(p).toContain("Adjudicate quickly");
    });

    it("includes open-specific rules for open games", () => {
      const p = buildProgressionPolicy("custom");
      expect(p).toContain("Creative freedom");
    });

    it("adds template-specific hints for 20-questions", () => {
      const p = buildProgressionPolicy("20-questions");
      expect(p).toContain("one sentence per answer");
    });

    it("adds template-specific hints for spyfall", () => {
      const p = buildProgressionPolicy("spyfall");
      expect(p).toContain("nudge toward accusations");
    });

    it("adds template-specific hints for detective-mystery", () => {
      const p = buildProgressionPolicy("detective-mystery");
      expect(p).toContain("Investigation rounds");
    });

    it("triggers urgency alert for deduction after threshold", () => {
      const p = buildProgressionPolicy("werewolf", 6);
      expect(p).toContain("PROGRESSION ALERT");
      expect(p).toContain("6 player turns");
    });

    it("triggers urgency alert for quiz after threshold", () => {
      const p = buildProgressionPolicy("trivia", 3);
      expect(p).toContain("PROGRESSION ALERT");
    });

    it("does not trigger urgency below threshold", () => {
      expect(buildProgressionPolicy("werewolf", 3)).not.toContain("PROGRESSION ALERT");
      expect(buildProgressionPolicy("trivia", 2)).not.toContain("PROGRESSION ALERT");
      expect(buildProgressionPolicy("custom", 7)).not.toContain("PROGRESSION ALERT");
    });

    it("triggers urgency for open games at threshold 8", () => {
      expect(buildProgressionPolicy("custom", 8)).toContain("PROGRESSION ALERT");
    });
  });
});
