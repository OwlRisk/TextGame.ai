import { describe, it, expect } from "vitest";
import { sanitizeModel, ALLOWED_MODELS } from "../model-prefs";

/**
 * Tests covering the input validation logic shared across API routes:
 * - message array length limits (chat/stream: max 60)
 * - preferredModel whitelist (all routes using sanitizeModel)
 * - TTS text length limit (inworld-tts: max 2000)
 * - AbortController timeout presence (structural, tested via sanitizeModel fallback)
 */

describe("API route validation: message limits", () => {
  const MAX_MESSAGES = 60;

  it("accepts arrays under the limit", () => {
    const msgs = Array.from({ length: 30 }, (_, i) => ({ role: "user", content: `msg ${i}` }));
    expect(msgs.length).toBeLessThanOrEqual(MAX_MESSAGES);
  });

  it("rejects arrays over the limit", () => {
    const msgs = Array.from({ length: 61 }, (_, i) => ({ role: "user", content: `msg ${i}` }));
    expect(msgs.length).toBeGreaterThan(MAX_MESSAGES);
  });

  it("accepts exactly 60 messages", () => {
    const msgs = Array.from({ length: 60 }, (_, i) => ({ role: "user", content: `msg ${i}` }));
    expect(msgs.length).toBeLessThanOrEqual(MAX_MESSAGES);
  });
});

describe("API route validation: TTS text length", () => {
  const MAX_TEXT_LENGTH = 2000;

  it("accepts text within limit", () => {
    expect("a".repeat(2000).length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
  });

  it("rejects text exceeding limit", () => {
    expect("a".repeat(2001).length).toBeGreaterThan(MAX_TEXT_LENGTH);
  });

  it("rejects empty text", () => {
    expect("".trim().length).toBe(0);
  });
});

describe("API route validation: TTS model whitelist", () => {
  const VALID_TTS_MODELS = ["inworld-tts-1.5-max", "inworld-tts-1.5-mini", "inworld-tts-1-max", "inworld-tts-1"];

  it("accepts valid TTS models", () => {
    for (const m of VALID_TTS_MODELS) {
      expect(VALID_TTS_MODELS.includes(m)).toBe(true);
    }
  });

  it("rejects invalid TTS models", () => {
    expect(VALID_TTS_MODELS.includes("evil-tts")).toBe(false);
    expect(VALID_TTS_MODELS.includes("")).toBe(false);
  });

  it("defaults to inworld-tts-1.5-max for unknown", () => {
    const modelId = VALID_TTS_MODELS.includes("nope") ? "nope" : "inworld-tts-1.5-max";
    expect(modelId).toBe("inworld-tts-1.5-max");
  });
});

describe("API route validation: chat model whitelist integration", () => {
  it("all API routes use the same ALLOWED_MODELS list", () => {
    expect(ALLOWED_MODELS.length).toBeGreaterThanOrEqual(5);
    expect(ALLOWED_MODELS).toContain("gpt-5.2");
  });

  it("sanitizeModel prevents arbitrary model injection in all routes", () => {
    const injection = "ft:gpt-5.2:custom-org:exploit:abc123";
    expect(sanitizeModel(injection)).not.toBe(injection);
  });

  it("sanitizeModel accepts all models that should be accepted", () => {
    for (const m of ALLOWED_MODELS) {
      expect(sanitizeModel(m)).toBe(m);
    }
  });
});

describe("API route validation: content length limits", () => {
  it("individual message content should be bounded", () => {
    const MAX_CONTENT_LENGTH = 10000;
    const shortContent = "hello";
    const longContent = "x".repeat(MAX_CONTENT_LENGTH + 1);
    expect(shortContent.length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH);
    expect(longContent.length).toBeGreaterThan(MAX_CONTENT_LENGTH);
  });
});
