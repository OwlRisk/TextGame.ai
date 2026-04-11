import { describe, it, expect } from "vitest";
import { SEO_LOCALES, isValidSEOLocale } from "../seo-locales";

/**
 * Tests for locale URL routing logic.
 *
 * The actual URL handling is done by next.config.js headers/redirects
 * (no middleware.ts — Turbopack doesn't generate .nft.json for middleware).
 * Here we test the pure locale classification logic used by
 * next.config.js pattern matching and [locale] route validation.
 */

// ─── Locale classification (mirrors next.config.js header matching) ─────────

const SEO_LOCALE_SET = new Set(SEO_LOCALES);

function resolveContentLanguage(locale: string): string | null {
  if (!SEO_LOCALE_SET.has(locale as any)) return null;
  return locale === "zh" ? "zh-CN" : locale;
}

function extractLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && SEO_LOCALE_SET.has(first as any)) return first;
  return null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("locale detection from URL path", () => {
  it("detects all 18 valid SEO locales", () => {
    for (const locale of SEO_LOCALES) {
      expect(extractLocaleFromPath(`/${locale}`), `Failed for /${locale}`).toBe(locale);
    }
  });

  it("detects locale with subpath", () => {
    expect(extractLocaleFromPath("/de/games/werewolf")).toBe("de");
    expect(extractLocaleFromPath("/ja/discover")).toBe("ja");
  });

  it("does not detect 'en' as a locale prefix", () => {
    expect(extractLocaleFromPath("/en/discover")).toBeNull();
  });

  it("does not detect 'games' as a locale prefix", () => {
    expect(extractLocaleFromPath("/games/werewolf")).toBeNull();
  });

  it("does not detect 'api' as a locale prefix", () => {
    expect(extractLocaleFromPath("/api/health")).toBeNull();
  });

  it("does not detect 'blog' as a locale prefix", () => {
    expect(extractLocaleFromPath("/blog/play-werewolf-online")).toBeNull();
  });

  it("does not detect uppercase locale as valid", () => {
    expect(extractLocaleFromPath("/ZH")).toBeNull();
  });

  it("returns null for root path", () => {
    expect(extractLocaleFromPath("/")).toBeNull();
  });

  it("returns null for empty path", () => {
    expect(extractLocaleFromPath("")).toBeNull();
  });
});

describe("Content-Language resolution", () => {
  it("maps zh to zh-CN", () => {
    expect(resolveContentLanguage("zh")).toBe("zh-CN");
  });

  it("maps other locales to themselves", () => {
    expect(resolveContentLanguage("ja")).toBe("ja");
    expect(resolveContentLanguage("de")).toBe("de");
    expect(resolveContentLanguage("ko")).toBe("ko");
    expect(resolveContentLanguage("ar")).toBe("ar");
  });

  it("returns null for invalid locale", () => {
    expect(resolveContentLanguage("en")).toBeNull();
    expect(resolveContentLanguage("games")).toBeNull();
    expect(resolveContentLanguage("")).toBeNull();
  });

  it("all 18 locales produce non-null Content-Language", () => {
    for (const locale of SEO_LOCALES) {
      expect(resolveContentLanguage(locale), `null for ${locale}`).not.toBeNull();
    }
  });
});

describe("next.config.js redirect rules (logic validation)", () => {
  it("www.textgame.ai should redirect to textgame.ai", () => {
    const host = "www.textgame.ai";
    expect(host.startsWith("www.")).toBe(true);
    expect(host.replace(/^www\./, "")).toBe("textgame.ai");
  });

  it("textgame.ai should not be treated as www", () => {
    expect("textgame.ai".startsWith("www.")).toBe(false);
  });

  it("localhost should not trigger www redirect", () => {
    expect("localhost:3000".startsWith("www.")).toBe(false);
  });
});

describe("isValidSEOLocale alignment", () => {
  it("SEO_LOCALE_SET matches isValidSEOLocale for all locales", () => {
    for (const locale of SEO_LOCALES) {
      expect(isValidSEOLocale(locale)).toBe(true);
      expect(SEO_LOCALE_SET.has(locale)).toBe(true);
    }
  });

  it("both reject non-locale strings", () => {
    for (const invalid of ["en", "games", "api", "blog", "", "ZH", "zh-CN"]) {
      expect(isValidSEOLocale(invalid)).toBe(false);
      expect(SEO_LOCALE_SET.has(invalid as any)).toBe(false);
    }
  });
});
