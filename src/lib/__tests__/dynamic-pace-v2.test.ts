import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for the enhanced dynamicPace with personality factor, jitter, and
 * conversation mode support.
 */

type ConversationMode = "structured" | "freeform";

const HOST_PACE_BASE_MS = 1000;
const HOST_PACE_PER_50_CHARS_MS = 800;
const HOST_PACE_MAX_MS = 4000;

function getPersonalityPaceFactor(personality?: string): number {
  if (!personality) return 1.0;
  const lower = personality.toLowerCase();
  if (/anxious|nervous|eager|impulsive|excitable|energetic|hasty/.test(lower)) return 0.7;
  if (/calm|thoughtful|careful|wise|analytical|stoic|patient/.test(lower)) return 1.3;
  if (/bold|confident|aggressive|brash|loud/.test(lower)) return 0.8;
  return 1.0;
}

function dynamicPace(textLength: number, personality?: string, mode: ConversationMode = "structured"): Promise<void> {
  const base = Math.min(
    HOST_PACE_BASE_MS + Math.floor(textLength / 50) * HOST_PACE_PER_50_CHARS_MS,
    HOST_PACE_MAX_MS,
  );
  const factor = getPersonalityPaceFactor(personality);
  const jitterRange = mode === "freeform" ? 0.6 : 0.4;
  const jitter = (1 - jitterRange / 2) + Math.random() * jitterRange;
  const ms = Math.round(base * factor * jitter);
  return new Promise<void>((r) => setTimeout(r, ms));
}

function calculatePaceMs(textLength: number, personality?: string, mode: ConversationMode = "structured", randomValue = 0.5): number {
  const base = Math.min(
    HOST_PACE_BASE_MS + Math.floor(textLength / 50) * HOST_PACE_PER_50_CHARS_MS,
    HOST_PACE_MAX_MS,
  );
  const factor = getPersonalityPaceFactor(personality);
  const jitterRange = mode === "freeform" ? 0.6 : 0.4;
  const jitter = (1 - jitterRange / 2) + randomValue * jitterRange;
  return Math.round(base * factor * jitter);
}

describe("dynamicPace v2 — personality factor", () => {
  it("anxious personality is faster than default", () => {
    const anxious = calculatePaceMs(100, "Anxious speaker");
    const normal = calculatePaceMs(100, undefined);
    expect(anxious).toBeLessThan(normal);
  });

  it("calm personality is slower than default", () => {
    const calm = calculatePaceMs(100, "Calm thinker");
    const normal = calculatePaceMs(100, undefined);
    expect(calm).toBeGreaterThan(normal);
  });

  it("bold personality is slightly faster than default", () => {
    const bold = calculatePaceMs(100, "Bold leader");
    const normal = calculatePaceMs(100, undefined);
    expect(bold).toBeLessThan(normal);
  });

  it("neutral personality matches default", () => {
    const neutral = calculatePaceMs(100, "Friendly helper");
    const none = calculatePaceMs(100, undefined);
    expect(neutral).toBe(none);
  });
});

describe("dynamicPace v2 — jitter range", () => {
  it("structured mode jitter range is ±20% (0.8-1.2)", () => {
    const minMs = calculatePaceMs(100, undefined, "structured", 0);
    const maxMs = calculatePaceMs(100, undefined, "structured", 1);
    const base = HOST_PACE_BASE_MS + 2 * HOST_PACE_PER_50_CHARS_MS; // 2600
    expect(minMs).toBe(Math.round(base * 0.8));
    expect(maxMs).toBe(Math.round(base * 1.2));
  });

  it("freeform mode jitter range is ±30% (0.7-1.3)", () => {
    const minMs = calculatePaceMs(100, undefined, "freeform", 0);
    const maxMs = calculatePaceMs(100, undefined, "freeform", 1);
    const base = HOST_PACE_BASE_MS + 2 * HOST_PACE_PER_50_CHARS_MS;
    expect(minMs).toBe(Math.round(base * 0.7));
    expect(maxMs).toBe(Math.round(base * 1.3));
  });

  it("freeform has wider jitter spread than structured", () => {
    const sMin = calculatePaceMs(100, undefined, "structured", 0);
    const sMax = calculatePaceMs(100, undefined, "structured", 1);
    const fMin = calculatePaceMs(100, undefined, "freeform", 0);
    const fMax = calculatePaceMs(100, undefined, "freeform", 1);
    expect(fMax - fMin).toBeGreaterThan(sMax - sMin);
  });
});

describe("dynamicPace v2 — combined personality + mode", () => {
  it("anxious + freeform produces the shortest delays", () => {
    const ms = calculatePaceMs(100, "Anxious", "freeform", 0);
    const base = HOST_PACE_BASE_MS + 2 * HOST_PACE_PER_50_CHARS_MS;
    expect(ms).toBe(Math.round(base * 0.7 * 0.7));
  });

  it("calm + structured produces the longest delays", () => {
    const ms = calculatePaceMs(100, "Calm thinker", "structured", 1);
    const base = HOST_PACE_BASE_MS + 2 * HOST_PACE_PER_50_CHARS_MS;
    expect(ms).toBe(Math.round(base * 1.3 * 1.2));
  });

  it("cap still applies before personality/jitter", () => {
    // 500 chars -> base hits cap at 4000
    const ms = calculatePaceMs(500, "Calm", "freeform", 1);
    const expected = Math.round(HOST_PACE_MAX_MS * 1.3 * 1.3);
    expect(ms).toBe(expected);
  });
});

describe("dynamicPace v2 — backward compatibility", () => {
  it("default args match old behavior at random=0.5", () => {
    // Old: dynamicPace(0) -> 1000ms
    // New: dynamicPace(0, undefined, "structured") at random=0.5 -> base*1.0*(0.8+0.5*0.4) = 1000*1.0
    const ms = calculatePaceMs(0, undefined, "structured", 0.5);
    expect(ms).toBe(HOST_PACE_BASE_MS);
  });
});

describe("dynamicPace v2 — promise with fake timers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after personality-adjusted delay", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // jitter = 1.0

    let resolved = false;
    dynamicPace(0, "Calm thinker", "structured").then(() => { resolved = true; });

    // base=1000, factor=1.3, jitter=1.0 -> 1300ms
    await vi.advanceTimersByTimeAsync(1299);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);

    vi.spyOn(Math, "random").mockRestore();
  });
});
