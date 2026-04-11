import { describe, it, expect } from "vitest";
import { t } from "../i18n";
import { FAQ_ITEMS } from "@/data/landing-content";
import { localizeFAQ } from "@/data/landing-content-i18n";
import { buildHostSystemPrompt, type HostPromptOpts } from "../host-prompt-builder";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER1_LANGS = ["en", "zh", "ja", "ko", "de", "fr", "es", "pt", "ru", "it", "ar"];

function defaultOpts(overrides: Partial<HostPromptOpts> = {}): HostPromptOpts {
  return {
    gameName: "Test Game",
    humanName: "Alex",
    nonHostPlayerNames: ["Juno", "Edda", "Maribel", "Alex"],
    hasVotingPhase: false,
    hasNightPhase: false,
    hasMultipleRooms: false,
    channels: [],
    gamePhase: "active",
    phaseLabel: "",
    playerRoster: "Juno [AI]\nEdda [AI]\nMaribel [AI]\nAlex [YOU/HUMAN]",
    eventLogSummary: "(No events recorded yet)",
    boardSummary: "(No private board content yet)",
    rulesText: "Standard game rules.",
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. FAQ — voice entry fully removed
// ═════════════════════════════════════════════════════════════════════════════

describe("FAQ: voice entry removed", () => {
  it("English FAQ does not mention 'Do AI characters have voices'", () => {
    const questions = FAQ_ITEMS.map((f) => f.question);
    expect(questions).not.toContain("Do AI characters have voices?");
  });

  it("no FAQ answer mentions text-to-speech", () => {
    for (const faq of FAQ_ITEMS) {
      expect(faq.answer.toLowerCase()).not.toContain("text-to-speech");
    }
  });

  it("English FAQ has exactly 7 items", () => {
    expect(FAQ_ITEMS).toHaveLength(7);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. FAQ i18n — every language overlay matches English count
// ═════════════════════════════════════════════════════════════════════════════

describe("FAQ i18n: array length consistency", () => {
  for (const lang of TIER1_LANGS) {
    it(`${lang} localized FAQ has same length as English`, () => {
      const localized = localizeFAQ(FAQ_ITEMS, lang);
      expect(localized).toHaveLength(FAQ_ITEMS.length);
    });
  }

  it("non-English localized FAQs do not mention voice/TTS", () => {
    for (const lang of TIER1_LANGS.filter((l) => l !== "en")) {
      const localized = localizeFAQ(FAQ_ITEMS, lang);
      for (const faq of localized) {
        const lower = (faq.question + " " + faq.answer).toLowerCase();
        expect(lower).not.toContain("text-to-speech");
        expect(lower).not.toContain("tts");
      }
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. i18n keys — new toast/gameover/profile/btn keys exist
// ═════════════════════════════════════════════════════════════════════════════

describe("i18n: new key coverage", () => {
  const TOAST_KEYS = [
    "toast.sign_in_required",
    "toast.creating_game",
    "toast.setting_up_players",
    "toast.players_fallback",
    "toast.game_ready",
    "toast.game_failed",
    "toast.gathering_crew",
    "toast.lets_go",
    "toast.adventure_failed",
    "toast.signin_failed",
  ];

  const GAMEOVER_KEYS = [
    "gameover.perfect_detective",
    "gameover.sharp_investigator",
    "gameover.decent_deduction",
    "gameover.partial_success",
    "gameover.case_cold",
    "gameover.unknown",
    "gameover.culprit",
    "gameover.correct",
    "gameover.wrong",
    "gameover.score",
    "gameover.pts",
    "gameover.you",
    "gameover.you_suffix",
  ];

  const PROFILE_KEYS = [
    "profile.personality",
    "profile.background",
    "profile.you",
    "profile.your_profile",
    "profile.managed_in_settings",
  ];

  const UI_KEYS = [
    "btn.send",
    "btn.sending",
    "label.my_board",
    "landing.solo",
  ];

  const ALL_KEYS = [...TOAST_KEYS, ...GAMEOVER_KEYS, ...PROFILE_KEYS, ...UI_KEYS];

  for (const key of ALL_KEYS) {
    it(`key "${key}" returns English text (not the raw key)`, () => {
      const result = t(key, "en");
      expect(result).not.toBe(key);
      expect(result.length).toBeGreaterThan(0);
    });
  }

  it("toast keys have Chinese translations", () => {
    for (const key of TOAST_KEYS) {
      const zh = t(key, "zh");
      const en = t(key, "en");
      expect(zh).not.toBe(key);
      expect(zh).not.toBe(en);
    }
  });

  it("gameover keys have Chinese translations", () => {
    for (const key of GAMEOVER_KEYS) {
      const zh = t(key, "zh");
      expect(zh).not.toBe(key);
    }
  });

  it("profile keys have Chinese translations", () => {
    for (const key of PROFILE_KEYS) {
      const zh = t(key, "zh");
      expect(zh).not.toBe(key);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. i18n: resolveKey normalises language codes
// ═════════════════════════════════════════════════════════════════════════════

describe("i18n: language code resolution", () => {
  it("zh-CN and zh-TW both resolve to Chinese", () => {
    const cn = t("btn.send", "zh-CN");
    const tw = t("btn.send", "zh-TW");
    const zh = t("btn.send", "zh");
    expect(cn).toBe(zh);
    expect(tw).toBe(zh);
    expect(zh).not.toBe("btn.send");
  });

  it("ja-JP resolves to Japanese", () => {
    const jaJP = t("btn.send", "ja-JP");
    const ja = t("btn.send", "ja");
    expect(jaJP).toBe(ja);
  });

  it("unknown language falls back to English", () => {
    const result = t("btn.send", "xx");
    const en = t("btn.send", "en");
    expect(result).toBe(en);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. GM prompt: new-player mid-game role assignment instruction
// ═════════════════════════════════════════════════════════════════════════════

describe("GM prompt: mid-game new player handling", () => {
  it("host prompt contains NEW_PLAYER_JOINED instruction", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("NEW_PLAYER_JOINED");
  });

  it("host prompt instructs GM to ASSIGN_ROLE for new players", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("New player mid-game");
    expect(output).toContain("ASSIGN_ROLE");
    expect(output).toContain("[BOARD:");
  });

  it("host prompt tells GM to narrate new player arrival in-character", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("Narrate their arrival naturally in-character");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Landing page i18n: "Solo" key exists
// ═════════════════════════════════════════════════════════════════════════════

describe("Landing page i18n: Solo and players_suffix", () => {
  it("landing.solo translates correctly for Chinese", () => {
    const zh = t("landing.solo", "zh");
    expect(zh).not.toBe("landing.solo");
    expect(zh.length).toBeGreaterThan(0);
  });

  it("landing.players_suffix exists for all tier 1 langs", () => {
    for (const lang of TIER1_LANGS) {
      const result = t("landing.players_suffix", lang);
      expect(result, `landing.players_suffix missing for ${lang}`).not.toBe("landing.players_suffix");
    }
  });
});
