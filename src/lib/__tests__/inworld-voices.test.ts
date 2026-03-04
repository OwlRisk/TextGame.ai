import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pickVoiceForSpeaker,
  normalizeGender,
  tokenize,
  INWORLD_VOICE_META,
} from "../inworld-voices";

// ═══════════════════════════════════════════════════════════════════════════════
// INWORLD_VOICE_META data integrity
// ═══════════════════════════════════════════════════════════════════════════════

describe("INWORLD_VOICE_META integrity", () => {
  it("has at least 50 voices", () => {
    expect(INWORLD_VOICE_META.length).toBeGreaterThanOrEqual(50);
  });

  it("every voice has required fields", () => {
    for (const v of INWORLD_VOICE_META) {
      expect(v.voiceId).toBeTruthy();
      expect(["male", "female"]).toContain(v.gender);
      expect(v.langCode).toBeTruthy();
      expect(Array.isArray(v.keywords)).toBe(true);
      expect(v.keywords.length).toBeGreaterThan(0);
    }
  });

  it("has voices for multiple languages", () => {
    const langs = new Set(INWORLD_VOICE_META.map((v) => v.langCode));
    expect(langs.size).toBeGreaterThanOrEqual(10);
    expect(langs.has("EN_US")).toBe(true);
    expect(langs.has("ZH_CN")).toBe(true);
    expect(langs.has("FR_FR")).toBe(true);
    expect(langs.has("JA_JP")).toBe(true);
  });

  it("has no duplicate voiceId entries", () => {
    const ids = INWORLD_VOICE_META.map((v) => v.voiceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has both male and female voices for EN_US", () => {
    const enUs = INWORLD_VOICE_META.filter((v) => v.langCode === "EN_US");
    expect(enUs.some((v) => v.gender === "male")).toBe(true);
    expect(enUs.some((v) => v.gender === "female")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// normalizeGender
// ═══════════════════════════════════════════════════════════════════════════════

describe("normalizeGender", () => {
  it('normalizes "male" (case-insensitive)', () => {
    expect(normalizeGender("male")).toBe("male");
    expect(normalizeGender("Male")).toBe("male");
    expect(normalizeGender("MALE")).toBe("male");
  });

  it('normalizes "female" (case-insensitive)', () => {
    expect(normalizeGender("female")).toBe("female");
    expect(normalizeGender("Female")).toBe("female");
  });

  it("returns undefined for unknown gender", () => {
    expect(normalizeGender("robot")).toBeUndefined();
    expect(normalizeGender("non-binary")).toBeUndefined();
    expect(normalizeGender("other")).toBeUndefined();
  });

  it("returns undefined for null/undefined/empty", () => {
    expect(normalizeGender(null)).toBeUndefined();
    expect(normalizeGender(undefined)).toBeUndefined();
    expect(normalizeGender("")).toBeUndefined();
  });

  it("trims whitespace", () => {
    expect(normalizeGender("  male  ")).toBe("male");
    expect(normalizeGender(" female ")).toBe("female");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// tokenize
// ═══════════════════════════════════════════════════════════════════════════════

describe("tokenize", () => {
  it("splits text into lowercase words", () => {
    const result = tokenize("Warm Friendly Inviting");
    expect(result.has("warm")).toBe(true);
    expect(result.has("friendly")).toBe(true);
    expect(result.has("inviting")).toBe(true);
  });

  it("strips non-alphanumeric characters", () => {
    const result = tokenize("laid-back, easy-going!");
    expect(result.has("laid")).toBe(true);
    expect(result.has("back")).toBe(true);
  });

  it("excludes words shorter than 2 characters", () => {
    const result = tokenize("a b cc dd");
    expect(result.has("a")).toBe(false);
    expect(result.has("b")).toBe(false);
    expect(result.has("cc")).toBe(true);
    expect(result.has("dd")).toBe(true);
  });

  it("returns empty set for empty string", () => {
    expect(tokenize("").size).toBe(0);
  });

  it("deduplicates words", () => {
    const result = tokenize("warm warm warm");
    expect(result.size).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickVoiceForSpeaker
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickVoiceForSpeaker", () => {
  beforeEach(() => {
    // Simulate browser environment for localStorage
    vi.stubGlobal("window", { ...globalThis.window });
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a string voice ID", () => {
    const id = pickVoiceForSpeaker("male", null, "EN_US");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns an EN_US voice when langCode is EN_US", () => {
    const id = pickVoiceForSpeaker(undefined, undefined, "EN_US");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.langCode).toBe("EN_US");
  });

  it("returns a ZH_CN voice when langCode is ZH_CN", () => {
    const id = pickVoiceForSpeaker(undefined, undefined, "ZH_CN");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.langCode).toBe("ZH_CN");
  });

  it("falls back to EN_US for an unsupported language", () => {
    const id = pickVoiceForSpeaker(undefined, undefined, "XX_YY");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.langCode).toBe("EN_US");
  });

  it("filters by male gender", () => {
    const id = pickVoiceForSpeaker("male", undefined, "EN_US");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.gender).toBe("male");
  });

  it("filters by female gender", () => {
    const id = pickVoiceForSpeaker("female", undefined, "EN_US");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.gender).toBe("female");
  });

  it("ignores invalid gender and picks from full pool", () => {
    const id = pickVoiceForSpeaker("robot", undefined, "EN_US");
    expect(typeof id).toBe("string");
  });

  it("scores higher for matching personality keywords", () => {
    const id = pickVoiceForSpeaker("female", "southern charming folksy inviting", "EN_US");
    expect(id).toBe("Loretta");
  });

  it("scores higher for menacing personality", () => {
    const id = pickVoiceForSpeaker("male", "menacing gravelly whimsical", "EN_US");
    expect(id).toBe("Mortimer");
  });

  it("scores higher for british authoritative personality", () => {
    const id = pickVoiceForSpeaker("male", "profound authoritative sophisticated british", "EN_US");
    expect(id).toBe("Graham");
  });

  it("handles null personality (returns first candidate)", () => {
    const id = pickVoiceForSpeaker("male", null, "EN_US");
    expect(typeof id).toBe("string");
  });

  it("handles empty personality string", () => {
    const id = pickVoiceForSpeaker("female", "", "EN_US");
    expect(typeof id).toBe("string");
  });

  it("returns a voice for non-EN_US languages with gender filter", () => {
    const id = pickVoiceForSpeaker("female", undefined, "ZH_CN");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice?.gender).toBe("female");
    expect(voice?.langCode).toBe("ZH_CN");
  });

  it("falls back to full pool when gender has no candidates in a language", () => {
    // AR_SA only has 1 male + 1 female; this should still return something
    const id = pickVoiceForSpeaker("male", undefined, "AR_SA");
    const voice = INWORLD_VOICE_META.find((v) => v.voiceId === id);
    expect(voice).toBeDefined();
  });
});
