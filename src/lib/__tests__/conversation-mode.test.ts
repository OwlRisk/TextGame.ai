import { describe, it, expect } from "vitest";

/**
 * Tests for conversation mode helpers introduced for natural conversation flow.
 * These functions live in page.tsx but are pure and can be replicated here for unit testing.
 */

type ConversationMode = "structured" | "freeform";
const STRUCTURED_TEMPLATES = ["werewolf", "mafia", "codenames", "undercover", "secret_hitler", "avalon", "resistance", "spyfall"];

function getConversationMode(template?: string): ConversationMode {
  if (template && STRUCTURED_TEMPLATES.includes(template)) return "structured";
  return "freeform";
}

function getPersonalityPaceFactor(personality?: string): number {
  if (!personality) return 1.0;
  const lower = personality.toLowerCase();
  if (/anxious|nervous|eager|impulsive|excitable|energetic|hasty/.test(lower)) return 0.7;
  if (/calm|thoughtful|careful|wise|analytical|stoic|patient/.test(lower)) return 1.3;
  if (/bold|confident|aggressive|brash|loud/.test(lower)) return 0.8;
  return 1.0;
}

function getTypewriterSpeed(personality?: string): number {
  const factor = getPersonalityPaceFactor(personality);
  if (factor <= 0.75) return 5;
  if (factor >= 1.25) return 2;
  return 3;
}

// ─── getConversationMode ───

describe("getConversationMode", () => {
  it("returns 'structured' for all turn-based templates", () => {
    for (const t of STRUCTURED_TEMPLATES) {
      expect(getConversationMode(t)).toBe("structured");
    }
  });

  it("returns 'freeform' for narrative/social templates", () => {
    expect(getConversationMode("roleplay")).toBe("freeform");
    expect(getConversationMode("adventure")).toBe("freeform");
    expect(getConversationMode("trivia")).toBe("freeform");
    expect(getConversationMode("tarot")).toBe("freeform");
    expect(getConversationMode("custom")).toBe("freeform");
  });

  it("returns 'freeform' when template is undefined", () => {
    expect(getConversationMode(undefined)).toBe("freeform");
    expect(getConversationMode()).toBe("freeform");
  });

  it("returns 'freeform' for empty string", () => {
    expect(getConversationMode("")).toBe("freeform");
  });

  it("is case-sensitive (templates are lowercase)", () => {
    expect(getConversationMode("Werewolf")).toBe("freeform");
    expect(getConversationMode("MAFIA")).toBe("freeform");
  });
});

// ─── getPersonalityPaceFactor ───

describe("getPersonalityPaceFactor", () => {
  it("returns 1.0 for undefined/null personality", () => {
    expect(getPersonalityPaceFactor(undefined)).toBe(1.0);
    expect(getPersonalityPaceFactor("")).toBe(1.0);
  });

  it("returns 0.7 for anxious/energetic personalities", () => {
    expect(getPersonalityPaceFactor("Anxious and nervous")).toBe(0.7);
    expect(getPersonalityPaceFactor("Very eager to please")).toBe(0.7);
    expect(getPersonalityPaceFactor("Impulsive decision maker")).toBe(0.7);
    expect(getPersonalityPaceFactor("Energetic and fast-talking")).toBe(0.7);
    expect(getPersonalityPaceFactor("Excitable and restless")).toBe(0.7);
  });

  it("returns 1.3 for calm/thoughtful personalities", () => {
    expect(getPersonalityPaceFactor("Calm and collected")).toBe(1.3);
    expect(getPersonalityPaceFactor("A thoughtful observer")).toBe(1.3);
    expect(getPersonalityPaceFactor("Careful with words")).toBe(1.3);
    expect(getPersonalityPaceFactor("Wise beyond years")).toBe(1.3);
    expect(getPersonalityPaceFactor("Analytical thinker")).toBe(1.3);
    expect(getPersonalityPaceFactor("Stoic warrior")).toBe(1.3);
    expect(getPersonalityPaceFactor("Patient listener")).toBe(1.3);
  });

  it("returns 0.8 for bold/confident personalities", () => {
    expect(getPersonalityPaceFactor("Bold and daring")).toBe(0.8);
    expect(getPersonalityPaceFactor("Very confident leader")).toBe(0.8);
    expect(getPersonalityPaceFactor("Aggressive negotiator")).toBe(0.8);
    expect(getPersonalityPaceFactor("Loud and brash")).toBe(0.8);
  });

  it("returns 1.0 for unrecognized personalities", () => {
    expect(getPersonalityPaceFactor("Mysterious")).toBe(1.0);
    expect(getPersonalityPaceFactor("Kind and friendly")).toBe(1.0);
    expect(getPersonalityPaceFactor("Sarcastic jokester")).toBe(1.0);
  });

  it("is case-insensitive", () => {
    expect(getPersonalityPaceFactor("ANXIOUS")).toBe(0.7);
    expect(getPersonalityPaceFactor("Calm")).toBe(1.3);
    expect(getPersonalityPaceFactor("BOLD")).toBe(0.8);
  });

  it("matches first applicable rule when multiple keywords present", () => {
    // "anxious" matches first rule (0.7) even though "calm" also appears
    expect(getPersonalityPaceFactor("anxious but trying to stay calm")).toBe(0.7);
  });
});

// ─── getTypewriterSpeed ───

describe("getTypewriterSpeed", () => {
  it("returns 3 (default) for undefined personality", () => {
    expect(getTypewriterSpeed(undefined)).toBe(3);
  });

  it("returns 5 (fast) for anxious/eager personalities (factor <= 0.75)", () => {
    expect(getTypewriterSpeed("Eager and impulsive")).toBe(5);
    expect(getTypewriterSpeed("Nervous speaker")).toBe(5);
  });

  it("returns 2 (slow) for calm/thoughtful personalities (factor >= 1.25)", () => {
    expect(getTypewriterSpeed("Calm philosopher")).toBe(2);
    expect(getTypewriterSpeed("Patient and wise")).toBe(2);
  });

  it("returns 3 (default) for bold personalities (factor 0.8, between thresholds)", () => {
    expect(getTypewriterSpeed("Bold leader")).toBe(3);
    expect(getTypewriterSpeed("Confident speaker")).toBe(3);
  });

  it("returns 3 (default) for neutral personalities", () => {
    expect(getTypewriterSpeed("Friendly and warm")).toBe(3);
    expect(getTypewriterSpeed("")).toBe(3);
  });
});
