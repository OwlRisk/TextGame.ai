import { describe, it, expect } from "vitest";
import {
  ALL_PRESETS,
  CATEGORY_MAP,
  EXTRA_GAMES,
  getPresetById,
} from "@/data/discover-templates";

describe("Discover page data integrity", () => {
  // ── ALL_PRESETS ──────────────────────────────────────────────────────────────

  it("ALL_PRESETS contains at least 10 templates", () => {
    expect(ALL_PRESETS.length).toBeGreaterThanOrEqual(10);
  });

  it("every template has a unique id", () => {
    const ids = ALL_PRESETS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every template has non-empty name, description, and rules", () => {
    for (const t of ALL_PRESETS) {
      expect(t.name.trim().length, `${t.id} name`).toBeGreaterThan(0);
      expect(t.description.trim().length, `${t.id} description`).toBeGreaterThan(0);
      expect(t.rules.trim().length, `${t.id} rules`).toBeGreaterThan(50);
    }
  });

  it("every template has valid players range", () => {
    for (const t of ALL_PRESETS) {
      expect(t.players).toMatch(/^\d+(-\d+)?$/);
    }
  });

  it("every template has a duration string", () => {
    for (const t of ALL_PRESETS) {
      expect(t.duration.trim().length, `${t.id} duration`).toBeGreaterThan(0);
    }
  });

  it("every template has a category", () => {
    for (const t of ALL_PRESETS) {
      expect(t.category.trim().length, `${t.id} category`).toBeGreaterThan(0);
    }
  });

  it("every template has at least one tag", () => {
    for (const t of ALL_PRESETS) {
      expect(t.tags.length, `${t.id} tags`).toBeGreaterThanOrEqual(1);
    }
  });

  it("every template has an icon (emoji)", () => {
    for (const t of ALL_PRESETS) {
      expect(t.icon.trim().length, `${t.id} icon`).toBeGreaterThan(0);
    }
  });

  it("style is one of Casual, Strategic, Competitive", () => {
    const valid = new Set(["Casual", "Strategic", "Competitive"]);
    for (const t of ALL_PRESETS) {
      expect(valid.has(t.style), `${t.id} style="${t.style}"`).toBe(true);
    }
  });

  // ── EXTRA_GAMES visibility ───────────────────────────────────────────────────

  it("EXTRA_GAMES are included in ALL_PRESETS", () => {
    const allIds = new Set(ALL_PRESETS.map((t) => t.id));
    for (const g of EXTRA_GAMES) {
      expect(allIds.has(g.id), `${g.id} missing from ALL_PRESETS`).toBe(true);
    }
  });

  it("every EXTRA_GAME appears in at least one CATEGORY_MAP bucket", () => {
    const allCategorized = new Set(
      Object.values(CATEGORY_MAP).flat().map((t) => t.id)
    );
    for (const g of EXTRA_GAMES) {
      expect(allCategorized.has(g.id), `${g.id} not in any category`).toBe(true);
    }
  });

  // ── CATEGORY_MAP ─────────────────────────────────────────────────────────────

  it("CATEGORY_MAP has entries for all expected categories", () => {
    const expected = ["deduction", "party", "mystery", "creative", "brain"];
    for (const cat of expected) {
      expect(CATEGORY_MAP[cat], `missing category: ${cat}`).toBeDefined();
      expect(CATEGORY_MAP[cat].length, `empty category: ${cat}`).toBeGreaterThan(0);
    }
  });

  it("no template appears twice in the same category bucket", () => {
    for (const [cat, templates] of Object.entries(CATEGORY_MAP)) {
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size, `duplicates in ${cat}`).toBe(ids.length);
    }
  });

  // ── getPresetById ────────────────────────────────────────────────────────────

  it("returns null for null or empty id", () => {
    expect(getPresetById(null)).toBeNull();
    expect(getPresetById("")).toBeNull();
  });

  it("returns null for unknown id", () => {
    expect(getPresetById("nonexistent-game-xyz")).toBeNull();
  });

  it("returns correct preset for each template in ALL_PRESETS", () => {
    for (const t of ALL_PRESETS) {
      const preset = getPresetById(t.id);
      expect(preset, `${t.id} not found`).not.toBeNull();
      expect(preset!.id).toBe(t.id);
      expect(preset!.name).toBe(t.name);
      expect(preset!.rules).toBe(t.rules);
    }
  });

  it("preset templateId defaults to 'custom' when not specified", () => {
    const templateWithout = ALL_PRESETS.find((t) => !t.templateId);
    if (templateWithout) {
      const preset = getPresetById(templateWithout.id);
      expect(preset!.templateId).toBe("custom");
    }
  });

  it("preset templateId is preserved when specified", () => {
    const werewolf = getPresetById("werewolf-classic");
    expect(werewolf).not.toBeNull();
    expect(werewolf!.templateId).toBe("werewolf");

    const undercover = getPresetById("undercover-party");
    expect(undercover).not.toBeNull();
    expect(undercover!.templateId).toBe("undercover");
  });

  // ── Rules content quality ────────────────────────────────────────────────────

  it("no template rules contain deleted /slash commands", () => {
    for (const t of ALL_PRESETS) {
      expect(t.rules).not.toMatch(/\/vote\b/);
      expect(t.rules).not.toMatch(/\/skip\b/);
      expect(t.rules).not.toMatch(/\/reveal\b/);
    }
  });

  it("rules contain OBJECTIVE or WIN CONDITIONS or GAMEPLAY or GOAL section", () => {
    for (const t of ALL_PRESETS) {
      const hasStructure =
        /OBJECTIVE/i.test(t.rules) ||
        /WIN CONDITIONS/i.test(t.rules) ||
        /GAMEPLAY/i.test(t.rules) ||
        /SESSION FLOW/i.test(t.rules) ||
        /\bGOAL:/i.test(t.rules);
      expect(hasStructure, `${t.id} rules lack structure headings`).toBe(true);
    }
  });
});
