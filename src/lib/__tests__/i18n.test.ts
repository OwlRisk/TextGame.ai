import { describe, it, expect, beforeEach, vi } from "vitest";
import { t, tAction, tStyle, tCategory, setAppLanguage, getAppLanguage, getBrowserLanguage } from "../i18n";

// ─── localStorage mock ─────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((_i: number) => null),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ─── setAppLanguage / getAppLanguage ───────────────────────────────────────

describe("setAppLanguage / getAppLanguage", () => {
  it("stores and retrieves a language", () => {
    setAppLanguage("zh");
    expect(getAppLanguage()).toBe("zh");
  });

  it("falls back to 'en' when nothing stored and no navigator", () => {
    const saved = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", { value: undefined, writable: true });
    expect(getAppLanguage()).toBe("en");
    Object.defineProperty(globalThis, "navigator", { value: saved, writable: true });
  });

  it("getBrowserLanguage is an alias for getAppLanguage", () => {
    setAppLanguage("ja");
    expect(getBrowserLanguage()).toBe("ja");
  });
});

// ─── t() — basic translation ──────────────────────────────────────────────

describe("t() — basic translation", () => {
  it("returns English for a known key with lang='en'", () => {
    const result = t("label.you", "en");
    expect(result).toBe("YOU");
  });

  it("returns Chinese for lang='zh'", () => {
    const result = t("label.you", "zh");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("label.you");
    expect(result).not.toBe("YOU");
  });

  it("returns the key itself for an unknown key", () => {
    expect(t("totally.unknown.key", "en")).toBe("totally.unknown.key");
  });

  it("resolves 'zh-CN' to Chinese (zh)", () => {
    const en = t("label.you", "en");
    const zh = t("label.you", "zh");
    const zhCN = t("label.you", "zh-CN");
    expect(zhCN).toBe(zh);
    expect(zhCN).not.toBe(en);
  });

  it("resolves 'ja' to Japanese", () => {
    const result = t("label.you", "ja");
    expect(result).not.toBe("YOU");
    expect(result).not.toBe("label.you");
  });

  it("falls back to English for unsupported language", () => {
    const result = t("label.you", "xx-FAKE");
    expect(result).toBe("YOU");
  });

  it("uses stored language when lang param is omitted", () => {
    setAppLanguage("ko");
    const result = t("label.you");
    expect(result).not.toBe("YOU");
    expect(result).not.toBe("label.you");
  });

  it("interpolates {count} variable", () => {
    const result = t("greeting.default", "en", { count: 5 });
    expect(result).toContain("5");
  });
});

// ─── tAction() ────────────────────────────────────────────────────────────

describe("tAction()", () => {
  it("translates 'Look around' to Chinese", () => {
    const result = tAction("Look around", "zh");
    expect(result).not.toBe("Look around");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns original label for unknown action", () => {
    expect(tAction("SomeRandomAction123", "zh")).toBe("SomeRandomAction123");
  });

  it("handles 'Respond' action", () => {
    const en = tAction("Respond", "en");
    expect(en).toBeTruthy();
  });
});

// ─── tStyle() ─────────────────────────────────────────────────────────────

describe("tStyle()", () => {
  it("translates 'Casual' to Chinese", () => {
    const result = tStyle("Casual", "zh");
    expect(result).not.toBe("Casual");
    expect(result.length).toBeGreaterThan(0);
  });

  it("translates 'Strategic' to Japanese", () => {
    const result = tStyle("Strategic", "ja");
    expect(result).not.toBe("Strategic");
  });

  it("translates 'Competitive' to Korean", () => {
    const result = tStyle("Competitive", "ko");
    expect(result).not.toBe("Competitive");
  });

  it("returns original for unknown style", () => {
    expect(tStyle("UnknownStyle", "en")).toBe("UnknownStyle");
  });
});

// ─── tCategory() ──────────────────────────────────────────────────────────

describe("tCategory()", () => {
  it("translates 'deduction' to Korean", () => {
    const result = tCategory("deduction", "ko");
    expect(result).not.toBe("deduction");
    expect(result.length).toBeGreaterThan(0);
  });

  it("translates 'all' category", () => {
    const result = tCategory("all", "zh");
    expect(result).not.toBe("all");
  });

  it("returns catId for unknown category", () => {
    expect(tCategory("nonexistent_cat", "en")).toBe("nonexistent_cat");
  });
});

// ─── profile.* keys (today's additions) ───────────────────────────────────

const PROFILE_KEYS = [
  "profile.user_settings",
  "profile.my_account",
  "profile.game_history",
  "profile.profile_picture",
  "profile.avatar_provider",
  "profile.username",
  "profile.email",
  "profile.update_hint",
  "profile.game_language",
  "profile.language_hint",
  "profile.lang_saved",
  "profile.lang_failed",
  "profile.games_created",
  "profile.view_all",
  "profile.loading_games",
  "profile.no_games",
  "profile.start_game",
  "profile.untitled",
];

const TIER1_LANGS = ["en", "zh", "ja", "ko", "de", "fr", "es", "pt", "ru", "it", "ar"];

describe("profile.* translation keys", () => {
  it("every profile key exists and returns non-empty for English", () => {
    for (const key of PROFILE_KEYS) {
      const result = t(key, "en");
      expect(result, `${key} missing or empty`).not.toBe(key);
      expect(result.length, `${key} empty`).toBeGreaterThan(0);
    }
  });

  it("every profile key has translations for all 11 Tier 1 languages", () => {
    for (const key of PROFILE_KEYS) {
      for (const lang of TIER1_LANGS) {
        const result = t(key, lang);
        expect(result, `${key} [${lang}] missing`).not.toBe(key);
        expect(result.length, `${key} [${lang}] empty`).toBeGreaterThan(0);
      }
    }
  });

  it("profile.update_hint contains 'Facebook' in all languages, not 'GitHub'", () => {
    for (const lang of TIER1_LANGS) {
      const result = t("profile.update_hint", lang);
      expect(result, `[${lang}] should contain Facebook`).toContain("Facebook");
      expect(result, `[${lang}] should not contain GitHub`).not.toContain("GitHub");
    }
  });
});

// ─── sidebar.* keys reused by profile page ────────────────────────────────

describe("sidebar.* keys (reused by profile)", () => {
  const SIDEBAR_KEYS = ["sidebar.log_out", "sidebar.signing_out", "sidebar.failed_sign_out"];

  it("every sidebar key exists for all 11 Tier 1 languages", () => {
    for (const key of SIDEBAR_KEYS) {
      for (const lang of TIER1_LANGS) {
        const result = t(key, lang);
        expect(result, `${key} [${lang}] missing`).not.toBe(key);
        expect(result.length, `${key} [${lang}] empty`).toBeGreaterThan(0);
      }
    }
  });
});
