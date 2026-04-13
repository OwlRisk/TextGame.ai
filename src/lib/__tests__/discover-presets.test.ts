import { describe, it, expect } from "vitest";
import {
  ALL_PRESETS,
  EXTRA_GAMES,
  getPresetById,
  CATEGORY_MAP,
} from "@/data/discover-templates";

// ═══════════════════════════════════════════════════════════════════════════════
// ALL_PRESETS integrity
// ═══════════════════════════════════════════════════════════════════════════════

describe("ALL_PRESETS integrity", () => {
  it("has exactly 3 RPG adventure presets", () => {
    expect(ALL_PRESETS.length).toBe(3);
  });

  it("every preset has required fields", () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.id, `missing id`).toBeTruthy();
      expect(preset.name, `${preset.id} missing name`).toBeTruthy();
      expect(preset.rules?.length, `${preset.id} missing rules`).toBeGreaterThan(0);
      expect(preset.category, `${preset.id} missing category`).toBeTruthy();
    }
  });

  it("has no duplicate ids", () => {
    const ids = ALL_PRESETS.map((p) => p.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate ids: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("every preset has an icon (emoji or URL)", () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.icon, `${preset.id} missing icon`).toBeTruthy();
    }
  });

  it("playerCount, when present, is a non-negative number", () => {
    for (const preset of ALL_PRESETS) {
      if (preset.playerCount !== undefined) {
        expect(typeof preset.playerCount).toBe("number");
        expect(preset.playerCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("all presets are RPG adventures with rpgWorldId", () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.rpgWorldId, `${preset.id} missing rpgWorldId`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPresetById
// ═══════════════════════════════════════════════════════════════════════════════

describe("getPresetById", () => {
  it("returns null for null input", () => {
    expect(getPresetById(null)).toBeNull();
  });

  it("returns null for unknown id", () => {
    expect(getPresetById("nonexistent-game-id")).toBeNull();
  });

  it("returns a DiscoverPreset for a known id", () => {
    const first = ALL_PRESETS[0];
    const result = getPresetById(first.id);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(first.id);
    expect(result?.name).toBe(first.name);
    expect(result?.rules).toBe(first.rules);
  });

  it("returns correct templateId field", () => {
    const first = ALL_PRESETS[0];
    const result = getPresetById(first.id);
    expect(result?.templateId).toBeTruthy();
  });

  it("still finds legacy presets via ALL_PRESETS_FULL", () => {
    if (EXTRA_GAMES.length === 0) {
      const werewolf = getPresetById("werewolf-classic");
      expect(werewolf).not.toBeNull();
      expect(werewolf?.name).toBe("Werewolf");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY_MAP
// ═══════════════════════════════════════════════════════════════════════════════

describe("CATEGORY_MAP", () => {
  it("has expected RPG categories", () => {
    expect(Object.keys(CATEGORY_MAP)).toEqual(
      expect.arrayContaining(["wuxia", "fantasy"]),
    );
  });

  it("every category has at least 1 game", () => {
    for (const [cat, games] of Object.entries(CATEGORY_MAP)) {
      expect(games.length, `${cat} is empty`).toBeGreaterThan(0);
    }
  });

  it("all games in categories are from ALL_PRESETS", () => {
    const allIds = new Set(ALL_PRESETS.map((p) => p.id));
    for (const [cat, games] of Object.entries(CATEGORY_MAP)) {
      for (const game of games) {
        expect(allIds.has(game.id), `${cat} has unknown game: ${game.id}`).toBe(true);
      }
    }
  });
});
