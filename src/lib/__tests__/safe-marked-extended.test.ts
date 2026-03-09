import { describe, it, expect } from "vitest";
import { safeMarked } from "../safe-marked";

describe("safeMarked", () => {
  // ─── Standard markdown rendering ──────────────────────────────────────────

  it("renders headings", () => {
    const result = safeMarked("# Hello");
    expect(result).toContain("<h1");
    expect(result).toContain("Hello");
  });

  it("renders bold text", () => {
    const result = safeMarked("**bold text**");
    expect(result).toContain("<strong>");
    expect(result).toContain("bold text");
  });

  it("renders italic text", () => {
    const result = safeMarked("*italic text*");
    expect(result).toContain("<em>");
    expect(result).toContain("italic text");
  });

  it("renders unordered lists", () => {
    const result = safeMarked("- item 1\n- item 2\n- item 3");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("item 1");
  });

  it("renders ordered lists", () => {
    const result = safeMarked("1. first\n2. second\n3. third");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>");
  });

  it("renders code blocks", () => {
    const result = safeMarked("```\nconst x = 1;\n```");
    expect(result).toContain("<code>");
    expect(result).toContain("const x = 1;");
  });

  it("renders inline code", () => {
    const result = safeMarked("Use `npm install` to install");
    expect(result).toContain("<code>");
    expect(result).toContain("npm install");
  });

  it("renders links", () => {
    const result = safeMarked("[click here](https://example.com)");
    expect(result).toContain("<a");
    expect(result).toContain("https://example.com");
    expect(result).toContain("click here");
  });

  it("renders blockquotes", () => {
    const result = safeMarked("> This is a quote");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("This is a quote");
  });

  it("renders horizontal rules", () => {
    const result = safeMarked("Above\n\n---\n\nBelow");
    expect(result).toContain("<hr");
  });

  it("renders paragraphs for plain text", () => {
    const result = safeMarked("Hello world");
    expect(result).toContain("<p>");
    expect(result).toContain("Hello world");
  });

  // ─── XSS prevention ──────────────────────────────────────────────────────

  it("strips raw HTML script tags", () => {
    const result = safeMarked('<script>alert("xss")</script>');
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
  });

  it("strips inline event handlers in HTML", () => {
    const result = safeMarked('<div onclick="alert(1)">click</div>');
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("alert");
  });

  it("strips img tags with onerror", () => {
    const result = safeMarked('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("strips iframe tags", () => {
    const result = safeMarked('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain("<iframe");
  });

  it("strips style tags", () => {
    const result = safeMarked("<style>body{display:none}</style>");
    expect(result).not.toContain("<style");
  });

  it("strips form tags", () => {
    const result = safeMarked('<form action="https://evil.com"><input></form>');
    expect(result).not.toContain("<form");
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it("handles empty string", () => {
    const result = safeMarked("");
    expect(result).toBe("");
  });

  it("handles whitespace-only string", () => {
    const result = safeMarked("   \n\n   ");
    expect(result.trim()).toBe("");
  });

  it("handles markdown mixed with HTML", () => {
    const result = safeMarked('**bold** <script>evil()</script> *italic*');
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
    expect(result).not.toContain("<script");
  });

  it("preserves markdown links while stripping HTML", () => {
    const result = safeMarked('[good link](https://example.com) <a href="javascript:void(0)">bad</a>');
    expect(result).toContain("https://example.com");
    expect(result).not.toContain("javascript:");
  });

  it("returns a string (synchronous)", () => {
    const result = safeMarked("Hello");
    expect(typeof result).toBe("string");
  });

  it("handles nested markdown (bold inside list)", () => {
    const result = safeMarked("- **bold item**\n- *italic item*");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
    expect(result).toContain("<li>");
  });

  it("handles very long input without crashing", () => {
    const longText = "Hello world. ".repeat(1000);
    const result = safeMarked(longText);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles unicode characters correctly", () => {
    const result = safeMarked("你好世界 **粗体** 🎮");
    expect(result).toContain("你好世界");
    expect(result).toContain("<strong>");
    expect(result).toContain("🎮");
  });
});
