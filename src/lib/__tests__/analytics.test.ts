import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent } from "../analytics";

describe("trackEvent", () => {
  let gtagMock: ReturnType<typeof vi.fn>;
  let originalGtag: unknown;

  beforeEach(() => {
    gtagMock = vi.fn();
    originalGtag = typeof globalThis.window !== "undefined" ? globalThis.window.gtag : undefined;
  });

  afterEach(() => {
    if (typeof globalThis.window !== "undefined") {
      globalThis.window.gtag = originalGtag as typeof globalThis.window.gtag;
    }
    vi.restoreAllMocks();
  });

  it("does nothing when window is undefined (SSR)", () => {
    const origWin = (globalThis as { window?: unknown }).window;
    try {
      (globalThis as { window?: unknown }).window = undefined;
      trackEvent("test_event", { foo: "bar" });
      expect(gtagMock).not.toHaveBeenCalled();
    } finally {
      (globalThis as { window?: unknown }).window = origWin;
    }
  });

  it("does nothing when window.gtag is not a function", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = undefined;
    trackEvent("test_event", { foo: "bar" });
    expect(gtagMock).not.toHaveBeenCalled();
  });

  it("does nothing when window.gtag is a string (not function)", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = "not-a-function" as unknown as typeof globalThis.window.gtag;
    trackEvent("test_event");
    expect(gtagMock).not.toHaveBeenCalled();
  });

  it("calls window.gtag with event name and empty params when no params", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("page_view");
    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith("event", "page_view", {});
  });

  it("calls window.gtag with cleaned params (undefined values stripped)", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("click", { a: "ok", b: undefined, c: 42 });
    expect(gtagMock).toHaveBeenCalledWith("event", "click", { a: "ok", c: 42 });
  });

  it("passes string, number, boolean params through correctly", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("custom", {
      str: "hello",
      num: 123,
      flag: true,
    });
    expect(gtagMock).toHaveBeenCalledWith("event", "custom", {
      str: "hello",
      num: 123,
      flag: true,
    });
  });

  it("strips undefined values from params", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("evt", {
      x: undefined,
      y: "keep",
      z: undefined,
    });
    expect(gtagMock).toHaveBeenCalledWith("event", "evt", { y: "keep" });
  });

  it("handles empty params object", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("event_name", {});
    expect(gtagMock).toHaveBeenCalledWith("event", "event_name", {});
  });

  it("handles null-like edge cases gracefully", () => {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.gtag = gtagMock as typeof globalThis.window.gtag;
    trackEvent("evt", {
      a: undefined,
      b: 0,
      c: false,
      d: "",
    });
    expect(gtagMock).toHaveBeenCalledWith("event", "evt", {
      b: 0,
      c: false,
      d: "",
    });
  });
});
