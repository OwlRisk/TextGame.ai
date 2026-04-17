import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_AI_MODEL, getPreferredModel } from "../model-prefs";

describe("DEFAULT_AI_MODEL", () => {
  it("is a non-empty string", () => {
    expect(typeof DEFAULT_AI_MODEL).toBe("string");
    expect(DEFAULT_AI_MODEL.length).toBeGreaterThan(0);
  });
});

describe("getPreferredModel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns DEFAULT_AI_MODEL on server (no window)", () => {
    // In vitest, window exists by default; simulate SSR by deleting it
    const origWindow = globalThis.window;
    // @ts-expect-error simulating SSR
    delete globalThis.window;
    expect(getPreferredModel()).toBe(DEFAULT_AI_MODEL);
    globalThis.window = origWindow;
  });

  it("returns DEFAULT_AI_MODEL when localStorage has no value", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
    });
    expect(getPreferredModel()).toBe(DEFAULT_AI_MODEL);
  });

  it("returns stored model when it is in ALLOWED_MODELS", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("gpt-4o"),
    });
    expect(getPreferredModel()).toBe("gpt-4o");
  });

  it("returns DEFAULT_AI_MODEL when stored model is not in ALLOWED_MODELS", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("invalid-model"),
    });
    expect(getPreferredModel()).toBe(DEFAULT_AI_MODEL);
  });
});
