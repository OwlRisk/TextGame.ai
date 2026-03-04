import { describe, it, expect } from "vitest";
import { djb2Hash, makeKey } from "../tts-broadcast";

// ═══════════════════════════════════════════════════════════════════════════════
// djb2Hash
// ═══════════════════════════════════════════════════════════════════════════════

describe("djb2Hash", () => {
  it("returns a non-empty string", () => {
    expect(djb2Hash("hello").length).toBeGreaterThan(0);
  });

  it("is deterministic — same input produces same output", () => {
    expect(djb2Hash("test input")).toBe(djb2Hash("test input"));
  });

  it("produces different hashes for different inputs", () => {
    const a = djb2Hash("Hello world");
    const b = djb2Hash("Hello World");
    expect(a).not.toBe(b);
  });

  it("produces different hashes for strings sharing a long prefix", () => {
    const prefix = "A".repeat(48);
    const a = djb2Hash(prefix + "X");
    const b = djb2Hash(prefix + "Y");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const hash = djb2Hash("");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("handles very long strings", () => {
    const longStr = "x".repeat(10000);
    const hash = djb2Hash(longStr);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("handles unicode characters", () => {
    const hash = djb2Hash("你好世界");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(djb2Hash("hello world"));
  });

  it("produces base-36 output (only lowercase letters and digits)", () => {
    const hash = djb2Hash("some test string");
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// makeKey
// ═══════════════════════════════════════════════════════════════════════════════

describe("makeKey", () => {
  it("combines hash and voiceId with separator", () => {
    const key = makeKey("Hello", "Loretta");
    expect(key).toContain("||");
    expect(key.endsWith("Loretta")).toBe(true);
  });

  it("is deterministic", () => {
    expect(makeKey("text", "Alex")).toBe(makeKey("text", "Alex"));
  });

  it("different texts produce different keys", () => {
    expect(makeKey("Hello", "Alex")).not.toBe(makeKey("Hi", "Alex"));
  });

  it("different voiceIds produce different keys", () => {
    expect(makeKey("Hello", "Alex")).not.toBe(makeKey("Hello", "Ashley"));
  });

  it("handles empty text", () => {
    const key = makeKey("", "Loretta");
    expect(key).toContain("||");
    expect(key.endsWith("Loretta")).toBe(true);
  });

  it("handles empty voiceId", () => {
    const key = makeKey("Hello", "");
    expect(key).toContain("||");
  });
});
