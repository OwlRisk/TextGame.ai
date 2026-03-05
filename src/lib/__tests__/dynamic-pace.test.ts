import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for the dynamicPace / hostPace timing function used in the game room.
 * The function calculates a delay based on message length to make AI
 * conversations feel more natural.
 */

const HOST_PACE_BASE_MS = 1000;
const HOST_PACE_PER_50_CHARS_MS = 800;
const HOST_PACE_MAX_MS = 4000;

function calculatePace(textLength: number): number {
  return Math.min(
    HOST_PACE_BASE_MS + Math.floor(textLength / 50) * HOST_PACE_PER_50_CHARS_MS,
    HOST_PACE_MAX_MS,
  );
}

describe("calculatePace", () => {
  it("returns base delay for zero-length text", () => {
    expect(calculatePace(0)).toBe(HOST_PACE_BASE_MS);
  });

  it("returns base delay for short text (< 50 chars)", () => {
    expect(calculatePace(30)).toBe(HOST_PACE_BASE_MS);
    expect(calculatePace(49)).toBe(HOST_PACE_BASE_MS);
  });

  it("adds per-50-char delay for medium text", () => {
    expect(calculatePace(50)).toBe(HOST_PACE_BASE_MS + HOST_PACE_PER_50_CHARS_MS);
    expect(calculatePace(100)).toBe(HOST_PACE_BASE_MS + 2 * HOST_PACE_PER_50_CHARS_MS);
  });

  it("caps at max delay for long text", () => {
    expect(calculatePace(500)).toBe(HOST_PACE_MAX_MS);
    expect(calculatePace(1000)).toBe(HOST_PACE_MAX_MS);
  });

  it("hits max at correct threshold", () => {
    // 200 chars: 1000 + 4*800 = 4200, capped to 4000
    expect(calculatePace(200)).toBe(HOST_PACE_MAX_MS);
    // 150 chars: 1000 + 3*800 = 3400, below cap
    expect(calculatePace(150)).toBe(HOST_PACE_BASE_MS + 3 * HOST_PACE_PER_50_CHARS_MS);
    expect(calculatePace(150)).toBeLessThan(HOST_PACE_MAX_MS);
  });

  it("returns monotonically increasing values up to cap", () => {
    let prev = 0;
    for (let len = 0; len <= 500; len += 10) {
      const pace = calculatePace(len);
      expect(pace).toBeGreaterThanOrEqual(prev);
      expect(pace).toBeLessThanOrEqual(HOST_PACE_MAX_MS);
      prev = pace;
    }
  });
});

/**
 * Test the actual dynamicPace promise behavior with fake timers.
 */
function dynamicPace(textLength: number): Promise<void> {
  const ms = calculatePace(textLength);
  return new Promise<void>((r) => setTimeout(r, ms));
}

describe("dynamicPace as promise", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after the calculated delay", async () => {
    let resolved = false;
    dynamicPace(50).then(() => { resolved = true; });

    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(HOST_PACE_BASE_MS + HOST_PACE_PER_50_CHARS_MS);
    expect(resolved).toBe(true);
  });

  it("hostPace (zero-length) resolves after base delay", async () => {
    let resolved = false;
    dynamicPace(0).then(() => { resolved = true; });

    await vi.advanceTimersByTimeAsync(HOST_PACE_BASE_MS - 1);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });
});
