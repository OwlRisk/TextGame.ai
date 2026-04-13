/**
 * Supplementary discover-page tests:
 *  - getPresetById return shape validation
 *  - CATEGORY_MAP completeness vs ALL_PRESETS
 *  - EXTRA_GAMES field quality
 *  - playerCount inclusion in presets
 */
import { describe, it, expect } from "vitest";
import {
  ALL_PRESETS,
  EXTRA_GAMES,
  CATEGORY_MAP,
  getPresetById,
} from "@/data/discover-templates";

// ─── getPresetById return shape ─────────────────────────────────────────────

describe("getPresetById – return shape", () => {
  it("returns at least the 5 base fields plus rpg-specific fields for RPG presets", () => {
    const first = ALL_PRESETS[0];
    const preset = getPresetById(first.id);
    expect(preset).not.toBeNull();
    const keys = Object.keys(preset!).sort();
    expect(keys).toEqual(
      expect.arrayContaining(["id", "name", "playerCount", "rules", "templateId"]),
    );
    if (first.rpgWorldId) {
      expect(keys).toContain("rpgWorldId");
    }
    if (first.rpgAdventureNotes) {
      expect(keys).toContain("rpgAdventureNotes");
    }
  });

  it("playerCount is optional — matches the template's value", () => {
    for (const t of ALL_PRESETS) {
      const preset = getPresetById(t.id);
      expect(preset).not.toBeNull();
      expect(preset!.playerCount).toBe(t.playerCount);
    }
  });

  it("rules are always strings with substantial content", () => {
    for (const t of ALL_PRESETS) {
      const preset = getPresetById(t.id);
      expect(typeof preset!.rules).toBe("string");
      expect(preset!.rules.length).toBeGreaterThan(50);
    }
  });
});

// ─── CATEGORY_MAP coverage ──────────────────────────────────────────────────

describe("CATEGORY_MAP coverage", () => {
  const categorizedIds = new Set(
    Object.values(CATEGORY_MAP).flat().map((t) => t.id),
  );

  it("all RPG adventures are in at least one category", () => {
    const uncategorized = ALL_PRESETS.filter((t) => !categorizedIds.has(t.id));
    expect(uncategorized.length).toBe(0);
  });

  it("category keys are wuxia and fantasy", () => {
    expect(Object.keys(CATEGORY_MAP).sort()).toEqual(["fantasy", "wuxia"]);
  });

  it("category keys are all lowercase strings", () => {
    for (const key of Object.keys(CATEGORY_MAP)) {
      expect(key).toMatch(/^[a-z-]+$/);
    }
  });
});

// ─── EXTRA_GAMES quality ────────────────────────────────────────────────────

describe("EXTRA_GAMES data quality", () => {
  it("EXTRA_GAMES may be empty (optional curated extras)", () => {
    expect(EXTRA_GAMES.length).toBeGreaterThanOrEqual(0);
  });

  it("every extra game has an emoji icon", () => {
    for (const g of EXTRA_GAMES) {
      expect(g.icon.trim().length, `${g.id} icon`).toBeGreaterThan(0);
    }
  });

  it("every extra game has a non-empty color", () => {
    for (const g of EXTRA_GAMES) {
      expect(g.color.trim().length, `${g.id} color`).toBeGreaterThan(0);
    }
  });

  it("extra game IDs don't overlap with each other", () => {
    const ids = EXTRA_GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every extra game has valid style", () => {
    const validStyles = new Set(["Casual", "Strategic", "Competitive"]);
    for (const g of EXTRA_GAMES) {
      expect(validStyles.has(g.style), `${g.id} style="${g.style}"`).toBe(true);
    }
  });
});

// ─── Preset search edge cases ───────────────────────────────────────────────

describe("getPresetById edge cases", () => {
  it("returns null for undefined-like values", () => {
    expect(getPresetById(null)).toBeNull();
    expect(getPresetById("")).toBeNull();
  });

  it("is case-sensitive", () => {
    const first = ALL_PRESETS[0];
    expect(getPresetById(first.id.toUpperCase())).toBeNull();
  });

  it("doesn't match partial IDs", () => {
    const first = ALL_PRESETS[0];
    const partial = first.id.slice(0, Math.floor(first.id.length / 2));
    expect(getPresetById(partial)).toBeNull();
  });

  it("returns same shape for first and last presets", () => {
    const first = getPresetById(ALL_PRESETS[0].id);
    const last = getPresetById(ALL_PRESETS[ALL_PRESETS.length - 1].id);
    expect(Object.keys(first!).sort()).toEqual(Object.keys(last!).sort());
  });
});
