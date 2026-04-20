import { describe, it, expect } from "vitest";
import {
  ALL_PRESETS,
  CATEGORIES,
  CATEGORY_MAP,
  getPresetById,
  getStyleColor,
  RPG_ADVENTURES,
} from "@/data/discover-templates";

describe("Discover templates — ALL_PRESETS aggregate", () => {
  it("contains exactly the RPG_ADVENTURES", () => {
    expect(ALL_PRESETS.length).toBe(RPG_ADVENTURES.length);
    const allIds = ALL_PRESETS.map((t) => t.id);
    for (const adv of RPG_ADVENTURES) {
      expect(allIds).toContain(adv.id);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = ALL_PRESETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every template has required fields", () => {
    for (const t of ALL_PRESETS) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(Array.isArray(t.tags)).toBe(true);
      expect(t.players).toBeTruthy();
      expect(t.duration).toBeTruthy();
      expect(typeof t.rules).toBe("string");
      expect(t.rules.length).toBeGreaterThan(0);
    }
  });

  it("all presets are RPG category", () => {
    for (const t of ALL_PRESETS) {
      expect(t.category).toBe("RPG");
    }
  });
});

describe("Discover templates — CATEGORIES", () => {
  it("has 'all' as first category", () => {
    expect(CATEGORIES[0].id).toBe("all");
  });

  it("each category has id, label, icon", () => {
    for (const cat of CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });

  it("has exactly 2 categories (all, fantasy)", () => {
    expect(CATEGORIES.length).toBe(2);
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toContain("all");
    expect(ids).toContain("fantasy");
  });
});

describe("Discover templates — CATEGORY_MAP", () => {
  it("has entries for each non-'all' category", () => {
    const catIds = CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id);
    for (const id of catIds) {
      expect(CATEGORY_MAP).toHaveProperty(id);
      expect(Array.isArray(CATEGORY_MAP[id])).toBe(true);
    }
  });

  it("every mapped template exists in ALL_PRESETS", () => {
    const allIds = new Set(ALL_PRESETS.map((t) => t.id));
    for (const templates of Object.values(CATEGORY_MAP)) {
      for (const t of templates) {
        expect(allIds.has(t.id)).toBe(true);
      }
    }
  });
});

describe("Discover templates — getPresetById", () => {
  it("returns null for null input", () => {
    expect(getPresetById(null)).toBeNull();
  });

  it("returns null for non-existent ID", () => {
    expect(getPresetById("__nonexistent__")).toBeNull();
  });

  it("returns preset for valid ID", () => {
    const first = ALL_PRESETS[0];
    const preset = getPresetById(first.id);
    expect(preset).not.toBeNull();
    expect(preset!.id).toBe(first.id);
    expect(preset!.name).toBe(first.name);
    expect(preset!.rules).toBe(first.rules);
  });

  it("returns correct shape with templateId", () => {
    const preset = getPresetById(ALL_PRESETS[0].id);
    expect(preset).toHaveProperty("id");
    expect(preset).toHaveProperty("name");
    expect(preset).toHaveProperty("rules");
    expect(preset).toHaveProperty("templateId");
  });

  it("defaults templateId to 'custom' when not set", () => {
    const noTemplate = ALL_PRESETS.find((t) => !t.templateId);
    if (noTemplate) {
      const preset = getPresetById(noTemplate.id);
      expect(preset!.templateId).toBe("custom");
    }
  });
});

describe("Discover templates — getStyleColor", () => {
  it("returns a string for known style values", () => {
    const styles = ["Casual", "Strategic", "Immersive", "Dynamic"];
    for (const style of styles) {
      const color = getStyleColor(style);
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("returns a default for unknown styles", () => {
    const color = getStyleColor("unknown-style");
    expect(typeof color).toBe("string");
  });

  it("returns different colors for different styles", () => {
    const a = getStyleColor("Casual");
    const b = getStyleColor("Strategic");
    expect(a).not.toBe(b);
  });
});

describe("Discover templates — template data quality", () => {
  it("all tags are non-empty strings", () => {
    for (const t of ALL_PRESETS) {
      for (const tag of t.tags) {
        expect(typeof tag).toBe("string");
        expect(tag.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("player count format is valid", () => {
    for (const t of ALL_PRESETS) {
      expect(t.players).toMatch(/\d+/);
    }
  });

  it("duration format contains a time unit", () => {
    for (const t of ALL_PRESETS) {
      expect(t.duration.toLowerCase()).toMatch(/min|hour|hr/);
    }
  });
});
