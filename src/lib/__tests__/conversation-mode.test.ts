import { describe, it, expect } from "vitest";
import {
  getConversationMode,
  getPersonalityPaceFactor,
  getTypewriterSpeed,
} from "../game-pace";

describe("getConversationMode", () => {
  it("returns 'freeform' when template is undefined or empty", () => {
    expect(getConversationMode(undefined)).toBe("freeform");
    expect(getConversationMode("")).toBe("freeform");
  });

  it("returns 'freeform' for scene mode", () => {
    expect(getConversationMode("scene")).toBe("freeform");
  });

  it("returns 'freeform' for unknown templates", () => {
    expect(getConversationMode("nonexistent")).toBe("freeform");
    expect(getConversationMode("custom")).toBe("freeform");
  });
});

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
    expect(getPersonalityPaceFactor("anxious but trying to stay calm")).toBe(0.7);
  });
});

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
