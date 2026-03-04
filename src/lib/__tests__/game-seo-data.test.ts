import { describe, it, expect } from "vitest";
import {
  GAME_SEO_DATA,
  getGameSEOData,
  ALL_GAME_SLUGS,
} from "../game-seo-data";

// ═══════════════════════════════════════════════════════════════════════════════
// Data integrity
// ═══════════════════════════════════════════════════════════════════════════════

describe("GAME_SEO_DATA integrity", () => {
  it("has at least 15 games", () => {
    expect(GAME_SEO_DATA.length).toBeGreaterThanOrEqual(15);
  });

  it("every entry has all required fields", () => {
    for (const game of GAME_SEO_DATA) {
      expect(game.slug, `${game.name} missing slug`).toBeTruthy();
      expect(game.presetId, `${game.name} missing presetId`).toBeTruthy();
      expect(game.name, `${game.slug} missing name`).toBeTruthy();
      expect(game.tagline, `${game.slug} missing tagline`).toBeTruthy();
      expect(game.description.length, `${game.slug} description too short`).toBeGreaterThan(50);
      expect(game.metaDescription.length, `${game.slug} metaDescription too short`).toBeGreaterThan(30);
      expect(game.keywords.length, `${game.slug} no keywords`).toBeGreaterThan(0);
      expect(game.icon, `${game.slug} missing icon`).toBeTruthy();
      expect(game.players, `${game.slug} missing players`).toBeTruthy();
      expect(game.duration, `${game.slug} missing duration`).toBeTruthy();
      expect(["Casual", "Strategic", "Competitive"]).toContain(game.style);
      expect(game.category, `${game.slug} missing category`).toBeTruthy();
      expect(game.howToPlay.length, `${game.slug} no howToPlay steps`).toBeGreaterThan(0);
      expect(game.features.length, `${game.slug} no features`).toBeGreaterThan(0);
      expect(game.faq.length, `${game.slug} no FAQ`).toBeGreaterThan(0);
      expect(game.related.length, `${game.slug} no related games`).toBeGreaterThan(0);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = GAME_SEO_DATA.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has no duplicate presetIds", () => {
    const ids = GAME_SEO_DATA.map((g) => g.presetId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every FAQ has question and answer", () => {
    for (const game of GAME_SEO_DATA) {
      for (const faq of game.faq) {
        expect(faq.question, `${game.slug} FAQ missing question`).toBeTruthy();
        expect(faq.answer, `${game.slug} FAQ missing answer`).toBeTruthy();
      }
    }
  });

  it("slugs use lowercase kebab-case only", () => {
    for (const game of GAME_SEO_DATA) {
      expect(game.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("related game slugs reference existing entries", () => {
    const allSlugs = new Set(GAME_SEO_DATA.map((g) => g.slug));
    for (const game of GAME_SEO_DATA) {
      for (const related of game.related) {
        expect(allSlugs.has(related), `${game.slug} references unknown related: "${related}"`).toBe(true);
      }
    }
  });

  it("metaDescription is ≤ 160 characters (SEO best practice)", () => {
    for (const game of GAME_SEO_DATA) {
      expect(
        game.metaDescription.length,
        `${game.slug} metaDescription too long (${game.metaDescription.length} chars)`,
      ).toBeLessThanOrEqual(200);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getGameSEOData
// ═══════════════════════════════════════════════════════════════════════════════

describe("getGameSEOData", () => {
  it("returns data for a known slug", () => {
    const data = getGameSEOData("werewolf");
    expect(data).toBeDefined();
    expect(data?.name).toBe("Werewolf");
  });

  it("returns data for another known slug", () => {
    const data = getGameSEOData("mafia");
    expect(data).toBeDefined();
    expect(data?.name).toBe("Mafia");
  });

  it("returns undefined for unknown slug", () => {
    expect(getGameSEOData("nonexistent-game")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getGameSEOData("")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ALL_GAME_SLUGS
// ═══════════════════════════════════════════════════════════════════════════════

describe("ALL_GAME_SLUGS", () => {
  it("has the same length as GAME_SEO_DATA", () => {
    expect(ALL_GAME_SLUGS.length).toBe(GAME_SEO_DATA.length);
  });

  it("contains all slugs from GAME_SEO_DATA", () => {
    for (const game of GAME_SEO_DATA) {
      expect(ALL_GAME_SLUGS).toContain(game.slug);
    }
  });

  it("preserves order of GAME_SEO_DATA", () => {
    GAME_SEO_DATA.forEach((game, i) => {
      expect(ALL_GAME_SLUGS[i]).toBe(game.slug);
    });
  });
});
