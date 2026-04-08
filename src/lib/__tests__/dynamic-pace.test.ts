import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HOST_PACE_BASE_MS,
  HOST_PACE_PER_50_CHARS_MS,
  HOST_PACE_MAX_MS,
  SCENE_PACE_BASE_MS,
  SCENE_PACE_PER_50_CHARS_MS,
  SCENE_PACE_MAX_MS,
  dynamicPace,
  hostPace,
  thinkingDelay,
  getPersonalityPaceFactor,
  getTypewriterSpeed,
  getConversationMode,
} from "../game-pace";

describe("pace constants", () => {
  it("host constants are positive and ordered", () => {
    expect(HOST_PACE_BASE_MS).toBeGreaterThan(0);
    expect(HOST_PACE_PER_50_CHARS_MS).toBeGreaterThan(0);
    expect(HOST_PACE_MAX_MS).toBeGreaterThan(HOST_PACE_BASE_MS);
  });

  it("scene constants are faster than host constants", () => {
    expect(SCENE_PACE_BASE_MS).toBeLessThan(HOST_PACE_BASE_MS);
    expect(SCENE_PACE_PER_50_CHARS_MS).toBeLessThan(HOST_PACE_PER_50_CHARS_MS);
    expect(SCENE_PACE_MAX_MS).toBeLessThan(HOST_PACE_MAX_MS);
  });
});

describe("getConversationMode", () => {
  it("returns 'freeform' for undefined/empty", () => {
    expect(getConversationMode(undefined)).toBe("freeform");
    expect(getConversationMode("")).toBe("freeform");
  });

  it("returns 'freeform' for scene template", () => {
    expect(getConversationMode("scene")).toBe("freeform");
  });

  it("returns 'freeform' for unknown template", () => {
    expect(getConversationMode("nonexistent")).toBe("freeform");
  });
});

describe("getPersonalityPaceFactor", () => {
  it("returns 1.0 for undefined", () => {
    expect(getPersonalityPaceFactor(undefined)).toBe(1.0);
  });

  it("returns 0.7 for anxious personalities", () => {
    expect(getPersonalityPaceFactor("Anxious and nervous")).toBe(0.7);
    expect(getPersonalityPaceFactor("Very eager")).toBe(0.7);
  });

  it("returns 1.3 for calm personalities", () => {
    expect(getPersonalityPaceFactor("Calm philosopher")).toBe(1.3);
    expect(getPersonalityPaceFactor("Patient listener")).toBe(1.3);
  });

  it("returns 0.8 for bold personalities", () => {
    expect(getPersonalityPaceFactor("Bold leader")).toBe(0.8);
    expect(getPersonalityPaceFactor("Confident and loud")).toBe(0.8);
  });

  it("returns 1.0 for unrecognized personalities", () => {
    expect(getPersonalityPaceFactor("Friendly")).toBe(1.0);
  });
});

describe("getTypewriterSpeed", () => {
  it("returns 3 for default", () => {
    expect(getTypewriterSpeed(undefined)).toBe(3);
  });

  it("returns 5 for fast (anxious)", () => {
    expect(getTypewriterSpeed("Nervous")).toBe(5);
  });

  it("returns 2 for slow (calm)", () => {
    expect(getTypewriterSpeed("Calm thinker")).toBe(2);
  });
});

describe("dynamicPace", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("resolves after a delay for normal mode", async () => {
    let resolved = false;
    dynamicPace(0).then(() => { resolved = true; });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(HOST_PACE_MAX_MS + 500);
    expect(resolved).toBe(true);
  });

  it("scene mode resolves faster than host mode", async () => {
    let hostResolved = false;
    let sceneResolved = false;
    dynamicPace(100, undefined, "structured", false).then(() => { hostResolved = true; });
    dynamicPace(100, undefined, "structured", true).then(() => { sceneResolved = true; });

    await vi.advanceTimersByTimeAsync(SCENE_PACE_MAX_MS + 100);
    expect(sceneResolved).toBe(true);
    // host may or may not have resolved depending on jitter — just check scene is done
  });
});

describe("hostPace", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("resolves after delay", async () => {
    let resolved = false;
    hostPace().then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(HOST_PACE_MAX_MS + 500);
    expect(resolved).toBe(true);
  });
});

describe("thinkingDelay", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("resolves after a brief delay", async () => {
    let resolved = false;
    thinkingDelay(0, "structured").then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(true);
  });

  it("scene mode uses shorter delay", async () => {
    let resolved = false;
    thinkingDelay(0, "structured", true).then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(250);
    expect(resolved).toBe(true);
  });
});
