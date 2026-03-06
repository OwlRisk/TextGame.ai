import { describe, it, expect } from "vitest";
import {
  formatMessageTime,
  cleanGMMessageContentForDisplay,
  stripChipLabel,
  htmlToMarkdown,
  addContentToSection,
  replaceContentInSection,
  toRoomType,
  VALID_ROOM_TYPES,
} from "../game-master-utils";

// ---------------------------------------------------------------------------
// formatMessageTime
// ---------------------------------------------------------------------------

describe("formatMessageTime", () => {
  it("returns only time string for today's date", () => {
    const now = new Date();
    const result = formatMessageTime(now);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result).not.toContain("Yesterday");
  });

  it("prefixes 'Yesterday' for yesterday's date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatMessageTime(yesterday);
    expect(result).toMatch(/^Yesterday\s+\d{1,2}:\d{2}/);
  });

  it("includes month and day for older dates", () => {
    const oldDate = new Date(2023, 0, 15, 14, 30);
    const result = formatMessageTime(oldDate);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).not.toContain("Yesterday");
  });
});

// ---------------------------------------------------------------------------
// cleanGMMessageContentForDisplay
// ---------------------------------------------------------------------------

describe("cleanGMMessageContentForDisplay", () => {
  it("strips EDIT_RULES tags", () => {
    const content = "Hello <EDIT_RULES>rules here</EDIT_RULES> world";
    expect(cleanGMMessageContentForDisplay(content)).toBe("Hello  world");
  });

  it("strips ADD_TO_RULES tags", () => {
    const content = 'Before <ADD_TO_RULES section="X">stuff</ADD_TO_RULES> after';
    expect(cleanGMMessageContentForDisplay(content)).toBe("Before  after");
  });

  it("strips REPLACE_IN_RULES tags", () => {
    const content = 'A <REPLACE_IN_RULES section="S" old="x" new="y"></REPLACE_IN_RULES> B';
    expect(cleanGMMessageContentForDisplay(content)).toBe("A  B");
  });

  it("strips UPDATE_RULES tags", () => {
    const content = "Pre <UPDATE_RULES>update</UPDATE_RULES> post";
    expect(cleanGMMessageContentForDisplay(content)).toBe("Pre  post");
  });

  it("strips CONFIG_PLAYERS tags", () => {
    const content = 'Start <CONFIG_PLAYERS>[{"name":"A"}]</CONFIG_PLAYERS> end';
    expect(cleanGMMessageContentForDisplay(content)).toBe("Start  end");
  });

  it("strips CONFIG_CHANNELS tags", () => {
    const content = 'Start <CONFIG_CHANNELS>[{"id":"1","name":"c"}]</CONFIG_CHANNELS> end';
    expect(cleanGMMessageContentForDisplay(content)).toBe("Start  end");
  });

  it("strips SET_PLAYER_COUNT tags", () => {
    const content = "A <SET_PLAYER_COUNT>5</SET_PLAYER_COUNT> B";
    expect(cleanGMMessageContentForDisplay(content)).toBe("A  B");
  });

  it("strips UPDATE_GENERAL tags", () => {
    const content = "A <UPDATE_GENERAL>bg info</UPDATE_GENERAL> B";
    expect(cleanGMMessageContentForDisplay(content)).toBe("A  B");
  });

  it("strips incomplete tags (streaming interrupted)", () => {
    const content = "Chat text <EDIT_RULES>partial rules without closing";
    expect(cleanGMMessageContentForDisplay(content)).toBe("Chat text");
  });

  it("strips multiple incomplete tags", () => {
    const content = "Text <CONFIG_PLAYERS>[{\"name";
    expect(cleanGMMessageContentForDisplay(content)).toBe("Text");
  });

  it("returns empty or whitespace content as-is", () => {
    expect(cleanGMMessageContentForDisplay("")).toBe("");
    expect(cleanGMMessageContentForDisplay("   ")).toBe("   ");
  });

  it("handles case-insensitive tags", () => {
    const content = "X <edit_rules>r</edit_rules> Y";
    expect(cleanGMMessageContentForDisplay(content)).toBe("X  Y");
  });

  it("returns unchanged text when no tags present", () => {
    const content = "Just a normal message.";
    expect(cleanGMMessageContentForDisplay(content)).toBe("Just a normal message.");
  });
});

// ---------------------------------------------------------------------------
// stripChipLabel
// ---------------------------------------------------------------------------

describe("stripChipLabel", () => {
  it("strips bold markdown", () => {
    expect(stripChipLabel("**Bold Text**")).toBe("Bold Text");
  });

  it("strips italic markdown", () => {
    expect(stripChipLabel("*Italic*")).toBe("Italic");
  });

  it("strips backtick code", () => {
    expect(stripChipLabel("`code`")).toBe("code");
  });

  it("strips combined markdown formatting", () => {
    expect(stripChipLabel("**Bold** and *italic* with `code`")).toBe(
      "Bold and italic with code"
    );
  });

  it("collapses extra whitespace", () => {
    expect(stripChipLabel("  too   many   spaces  ")).toBe("too many spaces");
  });

  it("handles empty or falsy input", () => {
    expect(stripChipLabel("")).toBe("");
    expect(stripChipLabel(undefined as unknown as string)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// htmlToMarkdown
// ---------------------------------------------------------------------------

describe("htmlToMarkdown", () => {
  it("converts h1 to markdown heading", () => {
    expect(htmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
  });

  it("converts h2 to markdown heading", () => {
    expect(htmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
  });

  it("converts h3 to markdown heading", () => {
    expect(htmlToMarkdown("<h3>Section</h3>")).toBe("### Section");
  });

  it("converts unordered lists", () => {
    const html = "<ul><li>Apple</li><li>Banana</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("- Apple");
    expect(md).toContain("- Banana");
  });

  it("converts ordered lists with sequential numbering", () => {
    const html = "<ol><li>First</li><li>Second</li><li>Third</li></ol>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("1. First");
    expect(md).toContain("2. Second");
    expect(md).toContain("3. Third");
  });

  it("converts bold tags", () => {
    expect(htmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
  });

  it("converts italic tags", () => {
    expect(htmlToMarkdown("<em>italic</em>")).toBe("*italic*");
  });

  it("converts code tags", () => {
    expect(htmlToMarkdown("<code>code</code>")).toBe("`code`");
  });

  it("converts paragraphs and trims", () => {
    const html = "<p>Paragraph one</p><p>Paragraph two</p>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("Paragraph one");
    expect(md).toContain("Paragraph two");
  });

  it("strips remaining unknown HTML tags", () => {
    const html = "<div><span>Content</span></div>";
    expect(htmlToMarkdown(html)).toBe("Content");
  });

  it("handles combined HTML elements", () => {
    const html =
      "<h1>Title</h1><p>Intro <strong>bold</strong> text.</p><ul><li>Item</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("# Title");
    expect(md).toContain("**bold**");
    expect(md).toContain("- Item");
  });
});

// ---------------------------------------------------------------------------
// addContentToSection
// ---------------------------------------------------------------------------

describe("addContentToSection", () => {
  it("appends content to an existing section", () => {
    const rules = "COMBAT:\nSwing sword.\n\nMAGIC:\nCast spell.";
    const result = addContentToSection(rules, "COMBAT", "Block with shield.");
    expect(result).toContain("Swing sword.");
    expect(result).toContain("Block with shield.");
  });

  it("appends to end when section is not found", () => {
    const rules = "COMBAT:\nSwing sword.";
    const result = addContentToSection(rules, "STEALTH", "Sneak past guards.");
    expect(result).toContain("COMBAT:\nSwing sword.");
    expect(result).toContain("Sneak past guards.");
  });

  it("returns content directly when rules is empty", () => {
    expect(addContentToSection("", "ANY", "New content")).toBe("New content");
  });
});

// ---------------------------------------------------------------------------
// replaceContentInSection
// ---------------------------------------------------------------------------

describe("replaceContentInSection", () => {
  it("replaces content within a matching section", () => {
    const rules = "ROLES:\nSeer can view. Doctor can heal.\n\nGAMEPLAY:\nDay phase.";
    const result = replaceContentInSection(rules, "ROLES", "Seer", "Oracle");
    expect(result).toContain("Oracle can view.");
    expect(result).not.toContain("Seer");
  });

  it("falls back to global replacement if section has no match", () => {
    const rules = "ROLES:\nWerewolf howls.\n\nSeer can peek.";
    const result = replaceContentInSection(rules, "ROLES", "Seer", "Oracle");
    expect(result).toContain("Oracle can peek.");
  });

  it("returns rules unchanged when oldContent not found anywhere", () => {
    const rules = "ROLES:\nDoctor heals.";
    const result = replaceContentInSection(rules, "ROLES", "NonExistent", "Replacement");
    expect(result).toBe(rules);
  });

  it("returns empty rules unchanged", () => {
    expect(replaceContentInSection("", "ANY", "old", "new")).toBe("");
  });

  it("escapes special regex characters in oldContent", () => {
    const rules = "NOTES:\nCost is 100% (per item).";
    const result = replaceContentInSection(
      rules,
      "NOTES",
      "100% (per item)",
      "200% (bulk)"
    );
    expect(result).toContain("200% (bulk)");
    expect(result).not.toContain("100%");
  });
});

// ---------------------------------------------------------------------------
// toRoomType
// ---------------------------------------------------------------------------

describe("toRoomType", () => {
  it("returns the value for valid room types", () => {
    expect(toRoomType("public")).toBe("public");
    expect(toRoomType("private_ai")).toBe("private_ai");
    expect(toRoomType("decision")).toBe("decision");
    expect(toRoomType("broadcast")).toBe("broadcast");
  });

  it("returns undefined for invalid strings", () => {
    expect(toRoomType("unknown")).toBeUndefined();
    expect(toRoomType("PUBLIC")).toBeUndefined();
    expect(toRoomType("")).toBeUndefined();
  });

  it("returns undefined for non-string values", () => {
    expect(toRoomType(42)).toBeUndefined();
    expect(toRoomType(null)).toBeUndefined();
    expect(toRoomType(undefined)).toBeUndefined();
    expect(toRoomType(true)).toBeUndefined();
    expect(toRoomType({})).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// VALID_ROOM_TYPES
// ---------------------------------------------------------------------------

describe("VALID_ROOM_TYPES", () => {
  it("contains exactly four room types", () => {
    expect(VALID_ROOM_TYPES.size).toBe(4);
    expect(VALID_ROOM_TYPES.has("public")).toBe(true);
    expect(VALID_ROOM_TYPES.has("private_ai")).toBe(true);
    expect(VALID_ROOM_TYPES.has("decision")).toBe(true);
    expect(VALID_ROOM_TYPES.has("broadcast")).toBe(true);
  });
});
