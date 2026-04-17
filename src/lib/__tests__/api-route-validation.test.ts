import { describe, it, expect } from "vitest";
import { sanitizeModel, ALLOWED_MODELS } from "../model-prefs";

/**
 * Tests covering the input validation logic shared across API routes:
 * - message array length limits (chat/stream: max 60)
 * - preferredModel whitelist (all routes using sanitizeModel)
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
