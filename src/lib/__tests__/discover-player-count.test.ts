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
  it("players field is a valid format: range (N-N), fixed number, N+N AI, or '1'", () => {
    for (const t of ALL_PRESETS) {
      expect(t.players, `"${t.id}" players="${t.players}"`).toMatch(
        /^(\d+-\d+|\d+\+\d+\s*AI|\d+)$/,
      );
    }
  });

  it("range formats have min < max", () => {
    for (const t of ALL_PRESETS) {
      const rangeMatch = t.players.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        expect(min, `"${t.id}" min >= max in "${t.players}"`).toBeLessThan(max);
      }
    }
  });
});

// ─── playerCount consistency with display ─────────────────────────────────

describe("playerCount consistency", () => {
  it("non-script-kill templates: playerCount is within displayed range", () => {
    const nonScriptKill = ALL_PRESETS.filter(
      (t) => t.templateId !== "script-kill" && !t.players.includes("AI") && t.players !== "1"
    );
    for (const t of nonScriptKill) {
      const rangeMatch = t.players.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        // playerCount (AI count) + 1 human should be within the displayed range
        const total = t.playerCount! + 1;
        expect(total, `"${t.id}": total ${total} < min ${min}`).toBeGreaterThanOrEqual(min);
        expect(total, `"${t.id}": total ${total} > max ${max}`).toBeLessThanOrEqual(max);
      } else {
        const displayTotal = parseInt(t.players, 10);
        expect(
          t.playerCount,
          `"${t.id}": playerCount=${t.playerCount}, expected ${displayTotal - 1}`
        ).toBe(displayTotal - 1);
      }
    }
  });

  it("tarot template: playerCount === 0 and players === '1'", () => {
    const tarot = ALL_PRESETS.find((t) => t.id === "tarot-reading");
    expect(tarot, "tarot-reading not found").toBeDefined();
    expect(tarot!.playerCount).toBe(0);
    expect(tarot!.players).toBe("1");
  });

  it("script-kill templates: playerCount >= 3 and <= 8", () => {
    const scriptKills = ALL_PRESETS.filter((t) => t.templateId === "script-kill");
    expect(scriptKills.length, "no script-kill templates found").toBeGreaterThan(0);
    for (const t of scriptKills) {
      expect(t.playerCount!, `"${t.id}" playerCount`).toBeGreaterThanOrEqual(3);
      expect(t.playerCount!, `"${t.id}" playerCount`).toBeLessThanOrEqual(8);
    }
  });

  it("script-kill templates show N+N AI format", () => {
    const scriptKills = ALL_PRESETS.filter((t) => t.templateId === "script-kill");
    for (const t of scriptKills) {
      expect(t.players, `"${t.id}"`).toMatch(/^\d+\+\d+\s*AI$/);
    }
  });
});
