import { describe, it, expect } from "vitest";
import { ALL_PRESETS } from "@/data/discover-templates";

// ─── playerCount field presence ───────────────────────────────────────────

describe("playerCount — field presence", () => {
  it("every template has a playerCount defined (not undefined)", () => {
    for (const t of ALL_PRESETS) {
      expect(t.playerCount, `"${t.id}" missing playerCount`).not.toBeUndefined();
    }
  });

  it("every playerCount is a non-negative number", () => {
    for (const t of ALL_PRESETS) {
      expect(typeof t.playerCount, `"${t.id}" playerCount not a number`).toBe("number");
      expect(t.playerCount!, `"${t.id}" playerCount negative`).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── players display format ───────────────────────────────────────────────

describe("players display format", () => {
  it("RPG adventures use N + N AI format", () => {
    for (const t of ALL_PRESETS) {
      expect(t.players, `"${t.id}" players="${t.players}"`).toMatch(
        /^\d+\s*\+\s*\d+\s*AI$/,
      );
    }
  });
});

// ─── playerCount consistency with display ─────────────────────────────────

describe("playerCount consistency", () => {
  it("RPG adventure playerCount matches the AI count in the players field", () => {
    for (const t of ALL_PRESETS) {
      const match = t.players.match(/^(\d+)\s*\+\s*(\d+)\s*AI$/);
      expect(match, `"${t.id}" players="${t.players}" doesn't match expected format`).not.toBeNull();
      if (match) {
        const aiCount = parseInt(match[2], 10);
        expect(t.playerCount, `"${t.id}" playerCount should match AI count`).toBe(aiCount);
      }
    }
  });

  it("all RPG adventures have playerCount === 3", () => {
    for (const t of ALL_PRESETS) {
      expect(t.playerCount, `"${t.id}" playerCount`).toBe(3);
    }
  });
});
