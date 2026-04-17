import { describe, it, expect, afterEach } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  buildLanguageInstruction,
  extractPreferredName,
} from "../content-language";

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORTED_LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════════

describe("SUPPORTED_LANGUAGES", () => {
  it("contains at least 20 languages", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(20);
  });

  it("does not contain an auto option", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).not.toContain("auto");
  });

  it("has English as first entry", () => {
    expect(SUPPORTED_LANGUAGES[0].code).toBe("en");
  });

  it("has unique codes", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every entry has a non-empty label", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang.label.length).toBeGreaterThan(0);
    }
  });

  it("includes major world languages", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    const expected = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar", "hi"];
    for (const code of expected) {
      expect(codes).toContain(code);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// detectBrowserLanguage
// ═══════════════════════════════════════════════════════════════════════════════

describe("detectBrowserLanguage", () => {
  const originalNavigator = globalThis.navigator;

  function mockNavigatorLanguage(lang: string) {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: lang },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns en for English browser", () => {
    mockNavigatorLanguage("en-US");
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns en for en-GB", () => {
    mockNavigatorLanguage("en-GB");
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns zh-CN for simplified Chinese", () => {
    mockNavigatorLanguage("zh-CN");
    expect(detectBrowserLanguage()).toBe("zh-CN");
  });

  it("returns zh-CN for generic zh", () => {
    mockNavigatorLanguage("zh");
    expect(detectBrowserLanguage()).toBe("zh-CN");
  });

  it("returns zh-TW for zh-TW", () => {
    mockNavigatorLanguage("zh-TW");
    expect(detectBrowserLanguage()).toBe("zh-TW");
  });

  it("returns zh-TW for zh-Hant", () => {
    mockNavigatorLanguage("zh-Hant");
    expect(detectBrowserLanguage()).toBe("zh-TW");
  });

  it("returns ja for Japanese", () => {
    mockNavigatorLanguage("ja-JP");
    expect(detectBrowserLanguage()).toBe("ja");
  });

  it("returns ko for Korean", () => {
    mockNavigatorLanguage("ko-KR");
    expect(detectBrowserLanguage()).toBe("ko");
  });

  it("returns es for Spanish", () => {
    mockNavigatorLanguage("es-MX");
    expect(detectBrowserLanguage()).toBe("es");
  });

  it("returns fr for French", () => {
    mockNavigatorLanguage("fr-FR");
    expect(detectBrowserLanguage()).toBe("fr");
  });

  it("returns de for German", () => {
    mockNavigatorLanguage("de-DE");
    expect(detectBrowserLanguage()).toBe("de");
  });

  it("returns pt for Portuguese", () => {
    mockNavigatorLanguage("pt-BR");
    expect(detectBrowserLanguage()).toBe("pt");
  });

  it("returns ru for Russian", () => {
    mockNavigatorLanguage("ru-RU");
    expect(detectBrowserLanguage()).toBe("ru");
  });

  it("returns ar for Arabic", () => {
    mockNavigatorLanguage("ar-SA");
    expect(detectBrowserLanguage()).toBe("ar");
  });

  it("returns hi for Hindi", () => {
    mockNavigatorLanguage("hi-IN");
    expect(detectBrowserLanguage()).toBe("hi");
  });

  it("returns th for Thai", () => {
    mockNavigatorLanguage("th-TH");
    expect(detectBrowserLanguage()).toBe("th");
  });

  it("returns vi for Vietnamese", () => {
    mockNavigatorLanguage("vi-VN");
    expect(detectBrowserLanguage()).toBe("vi");
  });

  it("returns id for Indonesian", () => {
    mockNavigatorLanguage("id-ID");
    expect(detectBrowserLanguage()).toBe("id");
  });

  it("returns en for Norwegian (not in supported list)", () => {
    mockNavigatorLanguage("nb-NO");
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns en for Tagalog (not in supported list)", () => {
    mockNavigatorLanguage("tl-PH");
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns en for unknown language", () => {
    mockNavigatorLanguage("xx-XX");
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns en when navigator is undefined", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(detectBrowserLanguage()).toBe("en");
  });

  it("returns en for empty language string", () => {
    mockNavigatorLanguage("");
    expect(detectBrowserLanguage()).toBe("en");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// buildLanguageInstruction
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildLanguageInstruction", () => {
  it("always includes LANGUAGE ADAPTATION rule", () => {
    const result = buildLanguageInstruction("en");
    expect(result).toContain("LANGUAGE ADAPTATION");
    expect(result).toContain("switch to THEIR language");
  });

  it("does not add LANGUAGE rule for English", () => {
    const result = buildLanguageInstruction("en");
    expect(result).not.toContain("Respond in English");
  });

  it("adds LANGUAGE rule for Chinese", () => {
    const result = buildLanguageInstruction("zh-CN");
    expect(result).toContain("Simplified Chinese");
    expect(result).toContain("简体中文");
    expect(result).toContain("MUST");
  });

  it("adds LANGUAGE rule for Japanese", () => {
    const result = buildLanguageInstruction("ja");
    expect(result).toContain("Japanese");
    expect(result).toContain("日本語");
    expect(result).toContain("MUST");
  });

  it("adds LANGUAGE rule for Korean", () => {
    const result = buildLanguageInstruction("ko");
    expect(result).toContain("Korean");
  });

  it("adds LANGUAGE rule for Arabic", () => {
    const result = buildLanguageInstruction("ar");
    expect(result).toContain("Arabic");
  });

  it("keeps directive keywords in English", () => {
    const result = buildLanguageInstruction("zh-CN");
    expect(result).toContain("NEXT_SPEAKER");
    expect(result).toContain("always remain in English");
  });

  it("defaults to English when undefined", () => {
    const result = buildLanguageInstruction(undefined);
    expect(result).not.toContain("Respond in");
    expect(result).toContain("LANGUAGE ADAPTATION");
  });

  it("defaults to English when empty string", () => {
    const result = buildLanguageInstruction("");
    expect(result).not.toContain("Respond in");
  });

  it("handles unknown language code gracefully", () => {
    const result = buildLanguageInstruction("xx");
    expect(result).toContain("xx");
    expect(result).toContain("LANGUAGE ADAPTATION");
  });

  it("Traditional Chinese has distinct instruction from Simplified", () => {
    const cn = buildLanguageInstruction("zh-CN");
    const tw = buildLanguageInstruction("zh-TW");
    expect(cn).toContain("Simplified Chinese");
    expect(tw).toContain("Traditional Chinese");
    expect(cn).not.toBe(tw);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// extractPreferredName
// ═══════════════════════════════════════════════════════════════════════════════

describe("extractPreferredName", () => {
  it("extracts parenthesized nickname", () => {
    expect(extractPreferredName("Ye Ma (Brook)")).toBe("Brook");
  });

  it("extracts parenthesized nickname with spaces", () => {
    expect(extractPreferredName("张三 (San)")).toBe("San");
  });

  it("returns first name for Western full name", () => {
    expect(extractPreferredName("John Smith")).toBe("John");
  });

  it("returns first name for three-part Western name", () => {
    expect(extractPreferredName("John Michael Smith")).toBe("John");
  });

  it("keeps single name as-is", () => {
    expect(extractPreferredName("Brook")).toBe("Brook");
  });

  it("keeps CJK name whole", () => {
    expect(extractPreferredName("小明")).toBe("小明");
  });

  it("keeps Japanese name whole", () => {
    expect(extractPreferredName("太郎")).toBe("太郎");
  });

  it("keeps Korean name whole", () => {
    expect(extractPreferredName("민수")).toBe("민수");
  });

  it("handles CJK name with parenthesized English name", () => {
    expect(extractPreferredName("叶马 (Brook)")).toBe("Brook");
  });

  it("returns Player for empty string", () => {
    expect(extractPreferredName("")).toBe("Player");
  });

  it("returns Player for whitespace-only string", () => {
    expect(extractPreferredName("   ")).toBe("Player");
  });

  it("trims whitespace from result", () => {
    expect(extractPreferredName("  John Smith  ")).toBe("John");
  });

  it("trims whitespace from parenthesized name", () => {
    expect(extractPreferredName("Ye Ma ( Brook )")).toBe("Brook");
  });

  it("handles name with multiple parentheses (takes first)", () => {
    expect(extractPreferredName("A (B) (C)")).toBe("B");
  });

  it("handles mixed CJK and Latin without parentheses", () => {
    expect(extractPreferredName("小明同学")).toBe("小明同学");
  });

  it("handles email-style fallback name", () => {
    expect(extractPreferredName("user123")).toBe("user123");
  });
});
