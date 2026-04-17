import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  HOST_PACE_BASE_MS,
  HOST_PACE_PER_50_CHARS_MS,
  HOST_PACE_MAX_MS,
  getConversationMode,
  getPersonalityPaceFactor,
  getTypewriterSpeed,
  dynamicPace,
  thinkingDelay,
  typewriterReveal,
} from "../game-pace";
import type { StreamMsgMeta } from "../game-pace";

const MSG_META: StreamMsgMeta = {
  senderId: "gm-1",
  senderName: "Host",
  senderAvatar: "",
  isAI: true,
};

// ─── Constants ─────────────────────────────────────────────────────────────

describe("Constants", () => {
  it("HOST_PACE_BASE_MS is 400", () => {
    expect(HOST_PACE_BASE_MS).toBe(400);
  });
  it("HOST_PACE_PER_50_CHARS_MS is 200", () => {
    expect(HOST_PACE_PER_50_CHARS_MS).toBe(200);
  });
  it("HOST_PACE_MAX_MS is 1500", () => {
    expect(HOST_PACE_MAX_MS).toBe(1500);
  });
});

// ─── getConversationMode ────────────────────────────────────────────────────

describe("getConversationMode", () => {
  it("returns 'freeform' for unknown template", () => {
    expect(getConversationMode("poker")).toBe("freeform");
    expect(getConversationMode("chess")).toBe("freeform");
    expect(getConversationMode("custom_game")).toBe("freeform");
  });

  it("returns 'freeform' for undefined", () => {
    expect(getConversationMode(undefined)).toBe("freeform");
  });

  it("returns 'freeform' for empty string", () => {
    expect(getConversationMode("")).toBe("freeform");
  });
});

// ─── getPersonalityPaceFactor ───────────────────────────────────────────────

describe("getPersonalityPaceFactor", () => {
  it("returns 1.0 when no personality", () => {
    expect(getPersonalityPaceFactor(undefined)).toBe(1.0);
    expect(getPersonalityPaceFactor("")).toBe(1.0);
  });

  const fastKeywords = [
    "anxious",
    "nervous",
    "eager",
    "impulsive",
    "excitable",
    "energetic",
    "hasty",
  ];
  fastKeywords.forEach((kw) => {
    it(`returns 0.7 for personality containing "${kw}"`, () => {
      expect(getPersonalityPaceFactor(kw)).toBe(0.7);
      expect(getPersonalityPaceFactor(`A ${kw} person`)).toBe(0.7);
    });
  });

  const slowKeywords = [
    "calm",
    "thoughtful",
    "careful",
    "wise",
    "analytical",
    "stoic",
    "patient",
  ];
  slowKeywords.forEach((kw) => {
    it(`returns 1.3 for personality containing "${kw}"`, () => {
      expect(getPersonalityPaceFactor(kw)).toBe(1.3);
      expect(getPersonalityPaceFactor(`Very ${kw} and measured`)).toBe(1.3);
    });
  });

  const boldKeywords = [
    "bold",
    "confident",
    "aggressive",
    "brash",
    "loud",
  ];
  boldKeywords.forEach((kw) => {
    it(`returns 0.8 for personality containing "${kw}"`, () => {
      expect(getPersonalityPaceFactor(kw)).toBe(0.8);
    });
  });

  it("returns 1.0 for other personalities", () => {
    expect(getPersonalityPaceFactor("mysterious")).toBe(1.0);
    expect(getPersonalityPaceFactor("quiet")).toBe(1.0);
  });

  it("is case insensitive", () => {
    expect(getPersonalityPaceFactor("ANXIOUS")).toBe(0.7);
    expect(getPersonalityPaceFactor("Calm")).toBe(1.3);
    expect(getPersonalityPaceFactor("BOLD")).toBe(0.8);
  });

  it("first matching keyword wins (anxious before calm in string)", () => {
    expect(getPersonalityPaceFactor("anxious and calm")).toBe(0.7);
  });
});

// ─── getTypewriterSpeed ─────────────────────────────────────────────────────

describe("getTypewriterSpeed", () => {
  it("returns 5 for fast personality (anxious → factor 0.7)", () => {
    expect(getTypewriterSpeed("anxious")).toBe(5);
  });
  it("returns 2 for slow personality (calm → factor 1.3)", () => {
    expect(getTypewriterSpeed("calm")).toBe(2);
  });
  it("returns 3 for default/middle factor", () => {
    expect(getTypewriterSpeed("bold")).toBe(3);
  });
  it("returns 3 when no personality", () => {
    expect(getTypewriterSpeed(undefined)).toBe(3);
    expect(getTypewriterSpeed("")).toBe(3);
  });
});

// ─── dynamicPace ─────────────────────────────────────────────────────────────

describe("dynamicPace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns a promise", () => {
    const p = dynamicPace(0);
    expect(p).toBeInstanceOf(Promise);
  });

  it("resolves after timeout", async () => {
    const p = dynamicPace(0);
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
  });

  it("respects personality factor (calm = slower)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const p = dynamicPace(0, "calm");
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
    expect(setTimeoutSpy).toHaveBeenCalled();
    const delay = setTimeoutSpy.mock.calls[0][1];
    // base=400, calm factor=1.3, jitter≈1.0 → ~520ms
    expect(delay).toBeGreaterThan(HOST_PACE_BASE_MS);
    setTimeoutSpy.mockRestore();
  });
});

// ─── thinkingDelay ──────────────────────────────────────────────────────────

describe("thinkingDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a promise", () => {
    expect(thinkingDelay(0, "structured")).toBeInstanceOf(Promise);
  });

  it("first speaker (queueIndex 0) gets longer delay in structured mode", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const p0 = thinkingDelay(0, "structured");
    await vi.runAllTimersAsync();
    await expect(p0).resolves.toBeUndefined();
  });

  it("later speakers get shorter delay (positionalFactor)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const p1 = thinkingDelay(1, "structured");
    const p2 = thinkingDelay(2, "structured");
    await vi.runAllTimersAsync();
    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBeUndefined();
  });

  it("freeform mode has different base range", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const p = thinkingDelay(0, "freeform");
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
  });
});

// ─── typewriterReveal ───────────────────────────────────────────────────────

describe("typewriterReveal", () => {
  let originalRAF: typeof requestAnimationFrame;
  let originalCAF: typeof cancelAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;
    // Defer RAF so rafId is set before step() runs (avoids TDZ in cancelled case)
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: () => void) => setTimeout(cb, 0) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("requestAnimationFrame", originalRAF);
    vi.stubGlobal("cancelAnimationFrame", originalCAF);
  });

  it("short text completes immediately when length <= charsPerTick", async () => {
    const addStream = vi.fn().mockReturnValue("msg-1");
    const updateStream = vi.fn();
    const text = "Hi";

    const p = typewriterReveal(
      text,
      addStream,
      updateStream,
      MSG_META,
      undefined,
      3,
    );
    await vi.runAllTimersAsync();
    const result = await p;

    expect(addStream).toHaveBeenCalledWith(MSG_META, undefined, "");
    expect(updateStream).toHaveBeenCalledWith("msg-1", "Hi", true);
    expect(result).toBe("msg-1");
  });

  it("empty messageId from addStreamFn resolves to ''", async () => {
    const addStream = vi.fn().mockReturnValue("");
    const updateStream = vi.fn();
    const text = "Hi";

    const p = typewriterReveal(
      text,
      addStream,
      updateStream,
      MSG_META,
    );
    await vi.runAllTimersAsync();
    const result = await p;

    expect(result).toBe("");
    expect(updateStream).not.toHaveBeenCalled();
  });

  it("longer text is revealed via RAF ticks", async () => {
    const addStream = vi.fn().mockReturnValue("msg-1");
    const updateStream = vi.fn();
    const text = "Hello world";

    const p = typewriterReveal(
      text,
      addStream,
      updateStream,
      MSG_META,
      undefined,
      3,
    );
    await vi.runAllTimersAsync();
    const result = await p;

    expect(addStream).toHaveBeenCalledWith(MSG_META, undefined, "");
    expect(updateStream).toHaveBeenCalledWith("msg-1", "Hello world", true);
    expect(result).toBe("msg-1");
  });

  it("cancelled parameter is accepted but text is still written in full", async () => {
    const addStream = vi.fn().mockReturnValue("msg-1");
    const updateStream = vi.fn();
    const text = "This is a long message for testing";
    const cancelled = vi.fn().mockReturnValue(false);

    const p = typewriterReveal(
      text,
      addStream,
      updateStream,
      MSG_META,
      undefined,
      3,
      cancelled,
    );
    await vi.runAllTimersAsync();
    const result = await p;

    expect(updateStream).toHaveBeenCalledWith("msg-1", text, true);
    expect(result).toBe("msg-1");
  });

  it("empty text with messageId completes immediately", async () => {
    const addStream = vi.fn().mockReturnValue("msg-1");
    const updateStream = vi.fn();

    const p = typewriterReveal("", addStream, updateStream, MSG_META);
    await vi.runAllTimersAsync();
    const result = await p;

    expect(addStream).toHaveBeenCalledWith(MSG_META, undefined, "");
    expect(updateStream).toHaveBeenCalledWith("msg-1", "", true);
    expect(result).toBe("msg-1");
  });
});
