import { describe, it, expect } from "vitest";
import {
  formatMessageTime,
  stripEmotionTags,
  extractTTSSentences,
  MAX_TTS_CHARS_HOST,
  MAX_TTS_CHARS_PLAYER,
} from "../chat-utils";

// ─── formatMessageTime ──────────────────────────────────────────────────────

describe("formatMessageTime", () => {
  const now = new Date(2026, 2, 6, 15, 0, 0); // March 6, 2026, 3:00 PM

  it("returns just time for today's messages", () => {
    const date = new Date(2026, 2, 6, 10, 30, 0);
    const result = formatMessageTime(date, now);
    expect(result).toMatch(/10:30/);
    expect(result).not.toContain("Yesterday");
    expect(result).not.toContain("Mar");
  });

  it("returns 'Yesterday' prefix for yesterday's messages", () => {
    const date = new Date(2026, 2, 5, 14, 15, 0);
    const result = formatMessageTime(date, now);
    expect(result).toContain("Yesterday");
    expect(result).toMatch(/2:15|14:15/);
  });

  it("returns 'MonthDay time' for older messages", () => {
    const date = new Date(2026, 1, 28, 9, 0, 0);
    const result = formatMessageTime(date, now);
    expect(result).toContain("Feb");
    expect(result).toContain("28");
  });

  it("handles midnight boundary correctly (today 00:00)", () => {
    const midnight = new Date(2026, 2, 6, 0, 0, 0);
    const result = formatMessageTime(midnight, now);
    expect(result).toMatch(/12:00|00:00/);
    expect(result).not.toContain("Yesterday");
  });

  it("handles yesterday at 23:59", () => {
    const date = new Date(2026, 2, 5, 23, 59, 0);
    const result = formatMessageTime(date, now);
    expect(result).toContain("Yesterday");
  });

  it("handles date from last year", () => {
    const date = new Date(2025, 11, 25, 12, 0, 0);
    const result = formatMessageTime(date, now);
    expect(result).toContain("Dec");
    expect(result).toContain("25");
  });

  it("handles same timestamp as now", () => {
    const result = formatMessageTime(now, now);
    expect(result).toMatch(/3:00|15:00/);
    expect(result).not.toContain("Yesterday");
  });
});

// ─── stripEmotionTags ────────────────────────────────────────────────────────

describe("stripEmotionTags", () => {
  it("replaces known emotion tag with emoji", () => {
    const result = stripEmotionTags("Hello [laughs] world");
    expect(result).not.toContain("[laughs]");
    expect(result.length).toBeGreaterThan(0);
  });

  it("strips unknown emotion tags entirely", () => {
    const result = stripEmotionTags("Hello [unknown_noise] world");
    expect(result).not.toContain("[unknown_noise]");
  });

  it("handles underscore-form tags", () => {
    const result = stripEmotionTags("[clear_throat] Before we begin...");
    expect(result).not.toContain("[clear_throat]");
  });

  it("handles space-form tags", () => {
    const result = stripEmotionTags("[clears throat] Let me explain");
    expect(result).not.toContain("[clears throat]");
  });

  it("preserves markdown links (does not strip [text](url))", () => {
    const input = "Check [this link](https://example.com) out";
    const result = stripEmotionTags(input);
    expect(result).toContain("[this link](https://example.com)");
  });

  it("collapses multiple spaces after stripping", () => {
    const result = stripEmotionTags("A  [unknown]  B");
    expect(result).not.toContain("  ");
  });

  it("handles empty string", () => {
    expect(stripEmotionTags("")).toBe("");
  });

  it("handles text with no tags", () => {
    expect(stripEmotionTags("Plain text")).toBe("Plain text");
  });

  it("handles multiple tags in one string", () => {
    const result = stripEmotionTags("[sighs] I don't know [laughs] maybe");
    expect(result).not.toContain("[sighs]");
    expect(result).not.toContain("[laughs]");
  });
});

// ─── extractTTSSentences ─────────────────────────────────────────────────────

describe("extractTTSSentences", () => {
  it("extracts complete sentences ending with period", () => {
    const text = "Hello world. How are you? Fine thanks!";
    const { sentences } = extractTTSSentences(text, 0);
    expect(sentences.length).toBeGreaterThan(0);
    for (const s of sentences) {
      expect(s).toMatch(/[.!?]$/);
    }
  });

  it("returns empty for text with no sentence-ending punctuation", () => {
    const text = "Hello world, how are you";
    const { sentences } = extractTTSSentences(text, 0);
    expect(sentences).toHaveLength(0);
  });

  it("skips sentences shorter than 8 chars", () => {
    const text = "Hi. Ok. This is a longer sentence.";
    const { sentences } = extractTTSSentences(text, 0);
    for (const s of sentences) {
      expect(s.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("respects fromChar offset", () => {
    const text = "Skip this part. Start from here.";
    const { sentences } = extractTTSSentences(text, 16);
    expect(sentences.length).toBe(1);
    expect(sentences[0]).toContain("Start from here");
  });

  it("returns updated newOffset pointing past last extracted sentence", () => {
    const text = "First sentence. Second one here.";
    const { newOffset } = extractTTSSentences(text, 0);
    expect(newOffset).toBeGreaterThan(0);
    expect(newOffset).toBeLessThanOrEqual(text.length);
  });

  it("caps text at maxChars", () => {
    const longText = "A".repeat(500) + ". End sentence.";
    const { sentences } = extractTTSSentences(longText, 0, 50);
    for (const s of sentences) {
      expect(s.length).toBeLessThanOrEqual(60);
    }
  });

  it("handles exclamation and question marks", () => {
    const text = "What happened? That's amazing! Let me think.";
    const { sentences } = extractTTSSentences(text, 0);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty text", () => {
    const { sentences, newOffset } = extractTTSSentences("", 0);
    expect(sentences).toHaveLength(0);
    expect(newOffset).toBe(0);
  });

  it("handles fromChar beyond text length", () => {
    const { sentences, newOffset } = extractTTSSentences("Hello.", 100);
    expect(sentences).toHaveLength(0);
    expect(newOffset).toBe(100);
  });
});

// ─── TTS constants ───────────────────────────────────────────────────────────

describe("TTS constants", () => {
  it("MAX_TTS_CHARS_HOST is a reasonable limit", () => {
    expect(MAX_TTS_CHARS_HOST).toBeGreaterThan(100);
    expect(MAX_TTS_CHARS_HOST).toBeLessThan(1000);
  });

  it("MAX_TTS_CHARS_PLAYER is smaller than HOST", () => {
    expect(MAX_TTS_CHARS_PLAYER).toBeLessThan(MAX_TTS_CHARS_HOST);
  });

  it("MAX_TTS_CHARS_PLAYER is a reasonable limit", () => {
    expect(MAX_TTS_CHARS_PLAYER).toBeGreaterThan(50);
    expect(MAX_TTS_CHARS_PLAYER).toBeLessThan(500);
  });
});
