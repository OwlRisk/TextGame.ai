import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sanitizeModel, ALLOWED_MODELS, DEFAULT_AI_MODEL } from "../model-prefs";

describe("ALLOWED_MODELS", () => {
  it("is a non-empty array of strings", () => {
    expect(Array.isArray(ALLOWED_MODELS)).toBe(true);
    expect(ALLOWED_MODELS.length).toBeGreaterThan(0);
    for (const m of ALLOWED_MODELS) {
      expect(typeof m).toBe("string");
      expect(m.length).toBeGreaterThan(0);
    }
  });

  it("includes the default model", () => {
    expect(ALLOWED_MODELS).toContain(DEFAULT_AI_MODEL);
  });

  it("has no duplicates", () => {
    const unique = new Set(ALLOWED_MODELS);
    expect(unique.size).toBe(ALLOWED_MODELS.length);
  });
});

describe("sanitizeModel", () => {
  const originalEnv = process.env.OPENAI_CHAT_MODEL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENAI_CHAT_MODEL = originalEnv;
    } else {
      delete process.env.OPENAI_CHAT_MODEL;
    }
  });

  it("returns DEFAULT_AI_MODEL when no preferred and no env", () => {
    delete process.env.OPENAI_CHAT_MODEL;
    expect(sanitizeModel()).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel(undefined)).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel("")).toBe(DEFAULT_AI_MODEL);
  });

  it("returns env model when no preferred but env is set", () => {
    process.env.OPENAI_CHAT_MODEL = "gpt-4o";
    expect(sanitizeModel()).toBe("gpt-4o");
    expect(sanitizeModel(undefined)).toBe("gpt-4o");
  });

  it("accepts all allowed models", () => {
    for (const model of ALLOWED_MODELS) {
      expect(sanitizeModel(model)).toBe(model);
    }
  });

  it("rejects unknown model and falls back to env", () => {
    process.env.OPENAI_CHAT_MODEL = "gpt-4.1-mini";
    expect(sanitizeModel("malicious-model")).toBe("gpt-4.1-mini");
  });

  it("rejects unknown model and falls back to DEFAULT when no env", () => {
    delete process.env.OPENAI_CHAT_MODEL;
    expect(sanitizeModel("evil-model-9000")).toBe(DEFAULT_AI_MODEL);
  });

  it("rejects model names with injection attempts", () => {
    expect(sanitizeModel("gpt-5.2; DROP TABLE users")).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel("gpt-5.2\n--")).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel("../../../etc/passwd")).toBe(DEFAULT_AI_MODEL);
  });

  it("rejects model names that are substrings of allowed models", () => {
    expect(sanitizeModel("gpt-5")).not.toBe("gpt-5");
    expect(sanitizeModel("gpt-4")).not.toBe("gpt-4");
    expect(sanitizeModel("o3")).not.toBe("o3");
  });

  it("is case-sensitive (rejects wrong case)", () => {
    expect(sanitizeModel("GPT-5.2")).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel("Gpt-4o")).toBe(DEFAULT_AI_MODEL);
  });
});
