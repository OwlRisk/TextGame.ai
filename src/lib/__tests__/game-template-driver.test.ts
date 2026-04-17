import { describe, expect, it } from "vitest";
import {
  buildTemplateMechanics,
  buildProgressionPolicy,
  getTemplateControlMode,
} from "../game-template-driver";

describe("game-template-driver", () => {
  describe("getTemplateControlMode", () => {
    it("returns the template's category for known templates", () => {
      expect(getTemplateControlMode("custom")).toBe("open");
      expect(getTemplateControlMode("rpg-dungeon")).toBeDefined();
    });

    it("falls back to open for unknown templates", () => {
      expect(getTemplateControlMode("nonexistent-game-xyz")).toBe("open");
      expect(getTemplateControlMode("")).toBe("open");
      expect(getTemplateControlMode(undefined)).toBe("open");
    });
  });

  describe("buildTemplateMechanics", () => {
    it("returns mechanics string (possibly empty) for known templates", () => {
      expect(typeof buildTemplateMechanics("custom")).toBe("string");
      expect(typeof buildTemplateMechanics("rpg-dungeon")).toBe("string");
    });

    it("returns empty string for unknown templates", () => {
      expect(buildTemplateMechanics(undefined)).toBe("");
      expect(buildTemplateMechanics("nonexistent")).toBe("");
    });
  });

  describe("buildProgressionPolicy", () => {
    it("includes base pacing rules for any template", () => {
      const p = buildProgressionPolicy("custom");
      expect(p).toContain("Never dwell on the same beat twice");
      expect(p).toContain("Never re-explain rules");
    });

    it("includes open-specific rules for open games", () => {
      const p = buildProgressionPolicy("custom");
      expect(p).toContain("Creative freedom");
    });

    it("does not trigger urgency below threshold", () => {
      expect(buildProgressionPolicy("custom", 1)).not.toContain("PROGRESSION ALERT");
    });

    it("triggers urgency for open games once threshold is exceeded", () => {
      expect(buildProgressionPolicy("custom", 8)).toContain("PROGRESSION ALERT");
    });
  });
});
