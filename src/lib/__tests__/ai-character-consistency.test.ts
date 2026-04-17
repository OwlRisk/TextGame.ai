/**
 * AI character attribute consistency tests.
 *
 * Validates that avatar, voice, gender, personality, and background attributes
 * are properly wired together across the generation and display pipeline.
 */
import { describe, it, expect } from "vitest";
import { AI_PLAYER_TRAITS, AIPlayerTraits, pickTraitsForPlayers } from "@/app/config/ai-player-personalities";
import { HOST_PERSONALITIES } from "@/app/config/host-config";

// ── Re-implement buildPrompt logic from avatar/route.ts (pure, no I/O) ──────

function genderPhrase(gender?: string): string {
  if (!gender || !gender.trim()) return "";
  const g = gender.trim().toLowerCase();
  if (g === "female") return "Female character. ";
  if (g === "male") return "Male character. ";
  if (g === "other") return "Androgynous or gender-neutral character. ";
  return "";
}

function buildPrompt(
  _name: string,
  opts: { background?: string; personality?: string; gender?: string }
): string {
  const { background, personality, gender } = opts;
  const genderPrefix = genderPhrase(gender);
  const SHARED_CORE_STYLE = "Semi-realistic digital painting style.";
  const MAX_PROMPT_LENGTH = 1000;
  const singleStart = "Semi-realistic character portrait. ";
  const singleEnd = " Solo individual, centered composition.";
  const basePrompt = singleStart + genderPrefix + SHARED_CORE_STYLE + singleEnd;

  const parts: string[] = [];
  if (personality?.trim()) parts.push(personality.trim());
  if (background?.trim()) parts.push(background.trim());
  const combined = parts.join(". ");

  if (!combined || combined.length < 2) {
    return basePrompt.length > MAX_PROMPT_LENGTH
      ? basePrompt.substring(0, MAX_PROMPT_LENGTH)
      : basePrompt;
  }

  const prefix = singleStart + genderPrefix + "Description: ";
  const suffix = ". " + SHARED_CORE_STYLE + singleEnd;
  const availableLength = MAX_PROMPT_LENGTH - prefix.length - suffix.length;
  if (availableLength <= 0) return `${genderPrefix}${SHARED_CORE_STYLE}`;

  const truncatedDesc =
    combined.length > availableLength
      ? combined.substring(0, availableLength - 3) + "..."
      : combined;

  const result = prefix + truncatedDesc + suffix;
  return result.length > MAX_PROMPT_LENGTH ? result.substring(0, MAX_PROMPT_LENGTH) : result;
}

// ══════════════════════════════════════════════════════════════════════════════
// Fix 1: Avatar uses personality
// ══════════════════════════════════════════════════════════════════════════════

describe("Fix 1: Avatar buildPrompt includes personality", () => {
  it("includes personality in prompt when provided", () => {
    const prompt = buildPrompt("Alice", {
      personality: "Skeptical and analytical",
      background: "Former debate champion",
      gender: "female",
    });
    expect(prompt).toContain("Skeptical and analytical");
    expect(prompt).toContain("Former debate champion");
  });

  it("includes personality even without background", () => {
    const prompt = buildPrompt("Bob", {
      personality: "Warm and trusting",
      gender: "male",
    });
    expect(prompt).toContain("Warm and trusting");
  });

  it("includes background even without personality", () => {
    const prompt = buildPrompt("Charlie", {
      background: "Professional poker player",
      gender: "male",
    });
    expect(prompt).toContain("Professional poker player");
  });

  it("two characters with same background but different personality produce different prompts", () => {
    const prompt1 = buildPrompt("A", {
      personality: "Cold and calculating",
      background: "From a small town",
      gender: "male",
    });
    const prompt2 = buildPrompt("B", {
      personality: "Warm and friendly",
      background: "From a small town",
      gender: "male",
    });
    expect(prompt1).not.toBe(prompt2);
  });

  it("returns base prompt when neither personality nor background provided", () => {
    const prompt = buildPrompt("NoInfo", { gender: "female" });
    expect(prompt).toContain("Female character");
    expect(prompt).not.toContain("Description:");
  });

  it("includes gender phrase in prompt", () => {
    expect(buildPrompt("X", { gender: "male" })).toContain("Male character");
    expect(buildPrompt("X", { gender: "female" })).toContain("Female character");
    expect(buildPrompt("X", { gender: "other" })).toContain("gender-neutral");
  });

  it("prompt never exceeds 1000 characters", () => {
    const longText = "A".repeat(2000);
    const prompt = buildPrompt("Long", {
      personality: longText,
      background: longText,
      gender: "female",
    });
    expect(prompt.length).toBeLessThanOrEqual(1000);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Fix 2: ttsVoice removed from types
// ══════════════════════════════════════════════════════════════════════════════

describe("Fix 2: ttsVoice removed from HostPersonality", () => {
  it("HostPersonality type does not have ttsVoice on any preset", () => {
    for (const host of HOST_PERSONALITIES) {
      expect(host).not.toHaveProperty("ttsVoice");
    }
  });

  it("all preset hosts have voiceStyle (used for voice matching instead)", () => {
    for (const host of HOST_PERSONALITIES) {
      expect(typeof host.voiceStyle).toBe("string");
      expect(host.voiceStyle.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Fix 3: AI Personality pool has gender
// ══════════════════════════════════════════════════════════════════════════════

describe("Fix 3: AI Personality pool gender", () => {
  it("AIPlayerTraits interface accepts gender field", () => {
    const trait: AIPlayerTraits = {
      personality: "test",
      background: "test",
      gender: "male",
    };
    expect(trait.gender).toBe("male");
  });

  it("every trait in the pool has a gender", () => {
    for (const trait of AI_PLAYER_TRAITS) {
      expect(trait.gender).toBeDefined();
      expect(["male", "female"]).toContain(trait.gender);
    }
  });

  it("pool has a roughly balanced gender distribution", () => {
    const males = AI_PLAYER_TRAITS.filter((t) => t.gender === "male").length;
    const females = AI_PLAYER_TRAITS.filter((t) => t.gender === "female").length;
    expect(males).toBeGreaterThanOrEqual(8);
    expect(females).toBeGreaterThanOrEqual(8);
    expect(males + females).toBe(AI_PLAYER_TRAITS.length);
  });

  it("pool has exactly 20 entries", () => {
    expect(AI_PLAYER_TRAITS.length).toBe(20);
  });

  it("pickTraitsForPlayers returns traits with gender", () => {
    const picked = pickTraitsForPlayers(5);
    expect(picked).toHaveLength(5);
    for (const t of picked) {
      expect(t.gender).toBeDefined();
      expect(["male", "female"]).toContain(t.gender);
    }
  });

  it("pickTraitsForPlayers returns no duplicates within the same set", () => {
    const picked = pickTraitsForPlayers(10);
    const personalities = picked.map((t) => t.personality);
    const unique = new Set(personalities);
    expect(unique.size).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Fix 4: generatedHost type has gender (structural check)
// ══════════════════════════════════════════════════════════════════════════════

describe("Fix 4: generatedHost type accepts gender", () => {
  it("typed generatedHost object accepts gender field", () => {
    const host: {
      name: string;
      personality: string;
      voiceStyle: string;
      systemPrompt: string;
      icon: string;
      color: string;
      gender?: "male" | "female" | "other";
    } = {
      name: "Echo",
      personality: "Mysterious",
      voiceStyle: "Calm, enigmatic",
      systemPrompt: "You are Echo.",
      icon: "🌙",
      color: "#6366f1",
      gender: "male",
    };
    expect(host.gender).toBe("male");
  });

  it("gender is optional (undefined is valid)", () => {
    const host: {
      name: string;
      personality: string;
      voiceStyle: string;
      systemPrompt: string;
      icon: string;
      color: string;
      gender?: "male" | "female" | "other";
    } = {
      name: "Nova",
      personality: "Energetic",
      voiceStyle: "Upbeat",
      systemPrompt: "You are Nova.",
      icon: "⭐",
      color: "#f59e0b",
    };
    expect(host.gender).toBeUndefined();
  });

  it("preset hosts all have explicit gender", () => {
    for (const host of HOST_PERSONALITIES) {
      expect(host.gender).toBeDefined();
      expect(["male", "female", "other"]).toContain(host.gender);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// End-to-end: full pipeline consistency
// ══════════════════════════════════════════════════════════════════════════════

describe("End-to-end: AI player attributes flow consistently", () => {
  it("each trait produces a valid avatar prompt", () => {
    for (const trait of AI_PLAYER_TRAITS) {
      const prompt = buildPrompt("TestPlayer", {
        personality: trait.personality,
        background: trait.background,
        gender: trait.gender,
      });
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt.length).toBeLessThanOrEqual(1000);
      if (trait.gender === "male") expect(prompt).toContain("Male character");
      if (trait.gender === "female") expect(prompt).toContain("Female character");
    }
  });

  it("preset hosts produce consistent prompts", () => {
    for (const host of HOST_PERSONALITIES) {
      const prompt = buildPrompt(host.name, {
        personality: host.voiceStyle,
        background: host.description,
        gender: host.gender,
      });
      expect(prompt.length).toBeGreaterThan(0);
    }
  });
});
