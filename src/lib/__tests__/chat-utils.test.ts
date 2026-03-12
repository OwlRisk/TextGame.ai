import { describe, it, expect } from "vitest";
import {
  formatMessageTime,
  stripEmotionTags,
  stripPrivateNotes,
  extractTTSSentences,
  MAX_TTS_CHARS_HOST,
  MAX_TTS_CHARS_PLAYER,
} from "../chat-utils";

// ═══════════════════════════════════════════════════════════════════════════════
// formatMessageTime
// ═══════════════════════════════════════════════════════════════════════════════

describe("formatMessageTime", () => {
  const now = new Date(2026, 2, 3, 14, 30, 0); // Mar 3, 2026 14:30

  it('returns time only for today', () => {
    const today = new Date(2026, 2, 3, 7, 29, 0);
    const result = formatMessageTime(today, now);
    expect(result).toMatch(/07:29/);
    expect(result).not.toContain("Yesterday");
    expect(result).not.toContain("Mar");
  });

  it('returns "Yesterday HH:MM" for yesterday', () => {
    const yesterday = new Date(2026, 2, 2, 19, 45, 0);
    const result = formatMessageTime(yesterday, now);
    expect(result).toContain("Yesterday");
    expect(result).toMatch(/07:45|19:45/);
  });

  it("returns month + day + time for older dates", () => {
    const older = new Date(2026, 1, 15, 10, 0, 0);
    const result = formatMessageTime(older, now);
    expect(result).toContain("Feb");
    expect(result).toContain("15");
  });

  it("handles midnight boundary (11:59 PM yesterday vs 12:00 AM today)", () => {
    const lateYesterday = new Date(2026, 2, 2, 23, 59, 0);
    const earlyToday = new Date(2026, 2, 3, 0, 1, 0);
    expect(formatMessageTime(lateYesterday, now)).toContain("Yesterday");
    expect(formatMessageTime(earlyToday, now)).not.toContain("Yesterday");
  });

  it("handles cross-year dates", () => {
    const lastYear = new Date(2025, 11, 31, 20, 0, 0);
    const result = formatMessageTime(lastYear, now);
    expect(result).toContain("Dec");
    expect(result).toContain("31");
  });

  it("handles same minute (edge case)", () => {
    const sameMinute = new Date(2026, 2, 3, 14, 30, 0);
    const result = formatMessageTime(sameMinute, now);
    expect(result).toMatch(/02:30|14:30/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// stripEmotionTags
// ═══════════════════════════════════════════════════════════════════════════════

describe("stripEmotionTags", () => {
  it("replaces known sound-effect tags with emoji", () => {
    expect(stripEmotionTags("[clear_throat] Ahem")).toContain("😤");
    expect(stripEmotionTags("[sigh] Whatever")).toContain("😮‍💨");
    expect(stripEmotionTags("[laugh] Ha")).toContain("😄");
  });

  it("strips unknown emotion tags entirely", () => {
    expect(stripEmotionTags("[happy] Hello")).not.toContain("[");
    expect(stripEmotionTags("[happy] Hello")).toContain("Hello");
    expect(stripEmotionTags("[angry] Go away")).not.toContain("[");
    expect(stripEmotionTags("[angry] Go away")).toContain("Go away");
  });

  it("replaces known space-form tags with emoji via fallback", () => {
    expect(stripEmotionTags("[clear throat] Ahem")).toContain("😤");
  });

  it("strips unknown tags entirely", () => {
    const result = stripEmotionTags("[unknown_emotion] Hello world");
    expect(result).not.toContain("[");
    expect(result).toContain("Hello world");
  });

  it("does not strip markdown links [text](url)", () => {
    const input = "Check [this link](https://example.com) out";
    const result = stripEmotionTags(input);
    expect(result).toContain("[this link](https://example.com)");
  });

  it("collapses multiple spaces into one", () => {
    const result = stripEmotionTags("[happy]   [sad]   Hello");
    expect(result).not.toMatch(/\s{2,}/);
  });

  it("handles text with no tags", () => {
    expect(stripEmotionTags("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(stripEmotionTags("")).toBe("");
  });

  it("strips multiple unknown emotion tags, keeps text", () => {
    const result = stripEmotionTags("[laughing] That was [surprised] amazing!");
    expect(result).not.toContain("[laughing]");
    expect(result).not.toContain("[surprised]");
    expect(result).toContain("amazing!");
  });

  it("handles tag at the end of text", () => {
    const result = stripEmotionTags("Goodbye [sigh]");
    expect(result).toContain("😮‍💨");
  });

  it("strips unknown tags that start with uppercase", () => {
    const result = stripEmotionTags("[Happy] world");
    expect(result).not.toContain("[");
    expect(result).toContain("world");
  });
});

describe("stripPrivateNotes", () => {
  it("removes full MY_NOTES block", () => {
    const input = "Public line.\n[MY_NOTES]\n- secret\n[/MY_NOTES]\nAfter";
    expect(stripPrivateNotes(input)).toBe("Public line.\n\nAfter");
  });

  it("removes orphan MY_NOTES tags", () => {
    const input = "Hello [MY_NOTES] world [/MY_NOTES]";
    expect(stripPrivateNotes(input)).toBe("Hello");
  });

  it("removes leaked em-dash note tail", () => {
    const input = "All good here. — Early lean: watch Eira's tone-setting. [/MY_NOTES]";
    expect(stripPrivateNotes(input)).toBe("All good here.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// extractTTSSentences
// ═══════════════════════════════════════════════════════════════════════════════

describe("extractTTSSentences", () => {
  it("extracts complete sentences from text", () => {
    const text = "Hello there. Welcome to the game. Let us begin!";
    const { sentences, newOffset } = extractTTSSentences(text, 0);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(newOffset).toBeGreaterThan(0);
  });

  it("skips sentences shorter than 8 characters", () => {
    const text = "Hi. OK. Let us begin the adventure now.";
    const { sentences } = extractTTSSentences(text, 0);
    expect(sentences.every((s) => s.length >= 8)).toBe(true);
    expect(sentences.some((s) => s === "Hi.")).toBe(false);
    expect(sentences.some((s) => s === "OK.")).toBe(false);
  });

  it("respects the fromChar offset", () => {
    const text = "Skip this. Start here. Continue reading.";
    const fromChar = "Skip this. ".length;
    const { sentences } = extractTTSSentences(text, fromChar);
    expect(sentences[0]).toContain("Start here.");
  });

  it("respects maxChars limit", () => {
    const text = "A".repeat(100) + ". " + "B".repeat(100) + ". " + "C".repeat(200) + ".";
    const { sentences } = extractTTSSentences(text, 0, 150);
    const totalChars = sentences.join("").length;
    expect(totalChars).toBeLessThanOrEqual(150);
  });

  it("returns empty for text with no sentence endings", () => {
    const text = "This text has no period or exclamation or question mark";
    const { sentences, newOffset } = extractTTSSentences(text, 0);
    expect(sentences).toHaveLength(0);
    expect(newOffset).toBe(0);
  });

  it("handles exclamation and question marks", () => {
    const text = "What is your name? I am the Game Master! Let me explain.";
    const { sentences } = extractTTSSentences(text, 0);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.some((s) => s.includes("?"))).toBe(true);
    expect(sentences.some((s) => s.includes("!"))).toBe(true);
  });

  it("correctly updates newOffset for incremental extraction", () => {
    const text = "First sentence. Second sentence. Third sentence.";
    const first = extractTTSSentences(text, 0);
    expect(first.sentences.length).toBeGreaterThanOrEqual(1);
    const second = extractTTSSentences(text, first.newOffset);
    // No new complete sentences since first call consumed everything
    if (first.newOffset >= text.length) {
      expect(second.sentences).toHaveLength(0);
    }
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

  it("exports correct constants", () => {
    expect(MAX_TTS_CHARS_HOST).toBe(300);
    expect(MAX_TTS_CHARS_PLAYER).toBe(150);
  });
});
