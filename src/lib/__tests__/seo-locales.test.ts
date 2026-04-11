import { describe, it, expect } from "vitest";
import {
  SEO_LOCALES,
  isValidSEOLocale,
  LOCALE_HTML_LANG,
  LOCALE_TO_I18N_KEY,
  buildHreflangAlternates,
  HOME_META,
  DISCOVER_META,
  GAMES_META,
} from "../seo-locales";
import { SITE_DOMAIN } from "../site";

// ═══════════════════════════════════════════════════════════════════════════════
// SEO_LOCALES constant
// ═══════════════════════════════════════════════════════════════════════════════

describe("SEO_LOCALES", () => {
  it("has exactly 18 locales", () => {
    expect(SEO_LOCALES).toHaveLength(18);
  });

  it("does not include English (served at root, not /en/)", () => {
    expect(SEO_LOCALES).not.toContain("en");
  });

  it("contains no duplicates", () => {
    expect(new Set(SEO_LOCALES).size).toBe(SEO_LOCALES.length);
  });

  it("includes key CJK locales", () => {
    expect(SEO_LOCALES).toContain("zh");
    expect(SEO_LOCALES).toContain("ja");
    expect(SEO_LOCALES).toContain("ko");
  });

  it("includes key European locales", () => {
    for (const code of ["de", "fr", "es", "pt", "it", "ru", "pl", "nl", "uk"]) {
      expect(SEO_LOCALES).toContain(code);
    }
  });

  it("includes RTL locale ar", () => {
    expect(SEO_LOCALES).toContain("ar");
  });

  it("includes South/Southeast Asian locales", () => {
    for (const code of ["hi", "tr", "id", "vi", "th"]) {
      expect(SEO_LOCALES).toContain(code);
    }
  });

  it("all entries are lowercase short codes", () => {
    for (const locale of SEO_LOCALES) {
      expect(locale).toMatch(/^[a-z]{2}$/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isValidSEOLocale
// ═══════════════════════════════════════════════════════════════════════════════

describe("isValidSEOLocale", () => {
  it("returns true for every locale in SEO_LOCALES", () => {
    for (const locale of SEO_LOCALES) {
      expect(isValidSEOLocale(locale)).toBe(true);
    }
  });

  it("returns false for 'en' (not a locale prefix)", () => {
    expect(isValidSEOLocale("en")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidSEOLocale("")).toBe(false);
  });

  it("returns false for non-locale strings", () => {
    expect(isValidSEOLocale("games")).toBe(false);
    expect(isValidSEOLocale("api")).toBe(false);
    expect(isValidSEOLocale("blog")).toBe(false);
    expect(isValidSEOLocale("discover")).toBe(false);
  });

  it("returns false for uppercase variant", () => {
    expect(isValidSEOLocale("ZH")).toBe(false);
    expect(isValidSEOLocale("JA")).toBe(false);
  });

  it("returns false for full BCP-47 tags", () => {
    expect(isValidSEOLocale("zh-CN")).toBe(false);
    expect(isValidSEOLocale("pt-BR")).toBe(false);
    expect(isValidSEOLocale("en-US")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE_HTML_LANG / LOCALE_TO_I18N_KEY
// ═══════════════════════════════════════════════════════════════════════════════

describe("LOCALE_HTML_LANG", () => {
  it("has an entry for every SEO locale", () => {
    for (const locale of SEO_LOCALES) {
      expect(LOCALE_HTML_LANG[locale]).toBeDefined();
    }
  });

  it("maps zh to zh-CN (simplified Chinese is default)", () => {
    expect(LOCALE_HTML_LANG["zh"]).toBe("zh-CN");
  });

  it("maps simple locales to themselves", () => {
    expect(LOCALE_HTML_LANG["ja"]).toBe("ja");
    expect(LOCALE_HTML_LANG["ko"]).toBe("ko");
    expect(LOCALE_HTML_LANG["de"]).toBe("de");
  });
});

describe("LOCALE_TO_I18N_KEY", () => {
  it("has an entry for every SEO locale", () => {
    for (const locale of SEO_LOCALES) {
      expect(LOCALE_TO_I18N_KEY[locale]).toBeDefined();
    }
  });

  it("maps zh to zh-CN to match i18n key", () => {
    expect(LOCALE_TO_I18N_KEY["zh"]).toBe("zh-CN");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// buildHreflangAlternates
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildHreflangAlternates", () => {
  it("includes x-default pointing to root path", () => {
    const result = buildHreflangAlternates("/");
    expect(result["x-default"]).toBe(`${SITE_DOMAIN}/`);
  });

  it("includes en pointing to root path", () => {
    const result = buildHreflangAlternates("/");
    expect(result["en"]).toBe(`${SITE_DOMAIN}/`);
  });

  it("generates an entry for every SEO locale", () => {
    const result = buildHreflangAlternates("/");
    for (const locale of SEO_LOCALES) {
      const htmlLang = LOCALE_HTML_LANG[locale];
      expect(result[htmlLang]).toBeDefined();
    }
  });

  it("total entries = 2 (x-default + en) + 18 locales = 20", () => {
    const result = buildHreflangAlternates("/");
    expect(Object.keys(result)).toHaveLength(20);
  });

  it("locale URLs include the locale prefix", () => {
    const result = buildHreflangAlternates("/discover");
    expect(result["zh-CN"]).toBe(`${SITE_DOMAIN}/zh/discover`);
    expect(result["ja"]).toBe(`${SITE_DOMAIN}/ja/discover`);
    expect(result["de"]).toBe(`${SITE_DOMAIN}/de/discover`);
  });

  it("handles root path correctly", () => {
    const result = buildHreflangAlternates("/");
    expect(result["ja"]).toBe(`${SITE_DOMAIN}/ja/`);
    expect(result["x-default"]).toBe(`${SITE_DOMAIN}/`);
  });

  it("handles nested paths", () => {
    const result = buildHreflangAlternates("/games/werewolf");
    expect(result["ko"]).toBe(`${SITE_DOMAIN}/ko/games/werewolf`);
    expect(result["en"]).toBe(`${SITE_DOMAIN}/games/werewolf`);
  });

  it("all values start with SITE_DOMAIN", () => {
    const result = buildHreflangAlternates("/test");
    for (const url of Object.values(result)) {
      expect(url).toMatch(new RegExp(`^${SITE_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Page metadata completeness
// ═══════════════════════════════════════════════════════════════════════════════

describe("page metadata maps", () => {
  const metaMaps = [
    { name: "HOME_META", map: HOME_META },
    { name: "DISCOVER_META", map: DISCOVER_META },
    { name: "GAMES_META", map: GAMES_META },
  ];

  for (const { name, map } of metaMaps) {
    describe(name, () => {
      it("has an entry for every SEO locale", () => {
        for (const locale of SEO_LOCALES) {
          expect(map[locale], `Missing ${locale} in ${name}`).toBeDefined();
        }
      });

      it("every entry has non-empty title", () => {
        for (const locale of SEO_LOCALES) {
          expect(map[locale].title.length, `Empty title for ${locale}`).toBeGreaterThan(0);
        }
      });

      it("every entry has non-empty description", () => {
        for (const locale of SEO_LOCALES) {
          expect(map[locale].description.length, `Empty desc for ${locale}`).toBeGreaterThan(10);
        }
      });

      it("no two locales have identical title", () => {
        const titles = SEO_LOCALES.map((l) => map[l].title);
        expect(new Set(titles).size).toBe(titles.length);
      });

      it("no two locales have identical description", () => {
        const descs = SEO_LOCALES.map((l) => map[l].description);
        expect(new Set(descs).size).toBe(descs.length);
      });
    });
  }
});
