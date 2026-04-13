import { describe, it, expect } from "vitest";
import { TEMPLATE_I18N, getTemplateI18n } from "@/data/template-i18n";
import { ALL_PRESETS } from "@/data/discover-templates";

const TIER1_LANGS = ["en", "zh", "ja", "ko", "de", "fr", "es", "pt", "ru", "it", "ar"];

// ─── TEMPLATE_I18N data integrity ─────────────────────────────────────────

describe("TEMPLATE_I18N — data integrity", () => {
  const templateIds = Object.keys(TEMPLATE_I18N);
  const presetIds = ALL_PRESETS.map((p) => p.id);

  it("has i18n entries for legacy presets", () => {
    expect(templateIds.length).toBeGreaterThanOrEqual(3);
  });

  it("every preset in ALL_PRESETS that has an i18n entry is correct", () => {
    for (const id of presetIds) {
      if (TEMPLATE_I18N[id]) {
        expect(TEMPLATE_I18N[id].name).toBeDefined();
        expect(TEMPLATE_I18N[id].desc).toBeDefined();
      }
    }
  });

  it("every i18n entry with name translations has all 11 Tier 1 languages", () => {
    for (const id of templateIds) {
      const nameMap = TEMPLATE_I18N[id].name;
      for (const lang of TIER1_LANGS) {
        expect(nameMap[lang], `"${id}" name missing [${lang}]`).toBeTruthy();
      }
    }
  });

  it("every i18n entry with desc translations has all 11 Tier 1 languages", () => {
    for (const id of templateIds) {
      const descMap = TEMPLATE_I18N[id].desc;
      for (const lang of TIER1_LANGS) {
        expect(descMap[lang], `"${id}" desc missing [${lang}]`).toBeTruthy();
      }
    }
  });

  it("English name is non-empty for every template", () => {
    for (const id of templateIds) {
      expect(TEMPLATE_I18N[id].name.en.trim().length, `"${id}" en name empty`).toBeGreaterThan(0);
    }
  });

  it("English desc is non-empty for every template", () => {
    for (const id of templateIds) {
      expect(TEMPLATE_I18N[id].desc.en.trim().length, `"${id}" en desc empty`).toBeGreaterThan(0);
    }
  });
});

// ─── getTemplateI18n() ────────────────────────────────────────────────────

describe("getTemplateI18n()", () => {
  it("returns Chinese name for werewolf-classic", () => {
    const result = getTemplateI18n("werewolf-classic", "name", "zh");
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
    expect(result).not.toBe("Werewolf");
  });

  it("returns English desc for codenames", () => {
    const result = getTemplateI18n("codenames", "desc", "en");
    expect(result).toBeDefined();
    expect(result).toContain("secret agents");
  });

  it("returns undefined for unknown template id", () => {
    expect(getTemplateI18n("nonexistent-template", "name", "en")).toBeUndefined();
  });

  it("falls back to English when requested language is missing", () => {
    const result = getTemplateI18n("werewolf-classic", "name", "xx");
    expect(result).toBe("Werewolf");
  });

  it("resolves 'zh-CN' to Chinese (strips region)", () => {
    const zh = getTemplateI18n("werewolf-classic", "name", "zh");
    const zhCN = getTemplateI18n("werewolf-classic", "name", "zh-CN");
    expect(zhCN).toBe(zh);
    expect(zhCN).not.toBe("Werewolf");
  });

  it("returns correct translation for all Tier 1 languages on a sample template", () => {
    for (const lang of TIER1_LANGS) {
      const name = getTemplateI18n("mafia-night", "name", lang);
      expect(name, `mafia-night name [${lang}]`).toBeDefined();
      expect(name!.length, `mafia-night name [${lang}] empty`).toBeGreaterThan(0);
    }
  });
});
