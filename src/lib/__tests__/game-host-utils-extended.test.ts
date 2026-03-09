import { describe, it, expect } from "vitest";
import {
  resolveChannelByName,
  getStreamingDisplay,
  splitHostOutput,
  stripDirectiveLines,
  sectionId,
} from "../game-host-utils";

const CHANNELS = [
  { id: "ch-1", name: "Town Square" },
  { id: "ch-2", name: "Dungeon Entrance" },
  { id: "ch-3", name: "Throne Room" },
];

describe("resolveChannelByName", () => {
  it("exact match returns channel id", () => {
    expect(resolveChannelByName("Town Square", CHANNELS)).toBe("ch-1");
    expect(resolveChannelByName("Dungeon Entrance", CHANNELS)).toBe("ch-2");
  });

  it("case-insensitive match", () => {
    expect(resolveChannelByName("TOWN SQUARE", CHANNELS)).toBe("ch-1");
    expect(resolveChannelByName("dungeon entrance", CHANNELS)).toBe("ch-2");
    expect(resolveChannelByName("ThRoNe RoOm", CHANNELS)).toBe("ch-3");
  });

  it("partial match (channel name contains search term)", () => {
    expect(resolveChannelByName("Town", CHANNELS)).toBe("ch-1");
    expect(resolveChannelByName("Dungeon", CHANNELS)).toBe("ch-2");
    expect(resolveChannelByName("Throne", CHANNELS)).toBe("ch-3");
  });

  it("partial match (search term contains channel name)", () => {
    expect(resolveChannelByName("Town Square Extended", CHANNELS)).toBe("ch-1");
    expect(resolveChannelByName("The Dungeon Entrance", CHANNELS)).toBe("ch-2");
  });

  it("no match returns null", () => {
    expect(resolveChannelByName("Castle", CHANNELS)).toBeNull();
    expect(resolveChannelByName("Nonexistent", CHANNELS)).toBeNull();
  });

  it("empty channels array returns null", () => {
    expect(resolveChannelByName("Town Square", [])).toBeNull();
  });

  it("whitespace in name is trimmed", () => {
    expect(resolveChannelByName("  Town Square  ", CHANNELS)).toBe("ch-1");
    expect(resolveChannelByName("\nDungeon Entrance\t", CHANNELS)).toBe("ch-2");
  });

  it("partial match prefers first match when multiple could match", () => {
    const multi = [
      { id: "a", name: "Alpha Room" },
      { id: "b", name: "Beta Alpha" },
    ];
    expect(resolveChannelByName("Alpha", multi)).toBe("a");
  });
});

describe("getStreamingDisplay", () => {
  it("returns text before --- separator", () => {
    expect(getStreamingDisplay("Hello players!\n---\nNEXT_SPEAKER:alice")).toBe("Hello players!");
  });

  it("empty text before --- (silent turn) returns empty string", () => {
    expect(getStreamingDisplay("---\nNEXT_SPEAKER:alice")).toBe("");
  });

  it("no --- yet: strips [BOARD:...][/BOARD] blocks", () => {
    const raw = "Before [BOARD:map][content here][/BOARD] after";
    expect(getStreamingDisplay(raw)).toBe("Before  after");
  });

  it("no --- yet: strips [SECTION:...][/SECTION] blocks", () => {
    const raw = "Before [SECTION:intro][content][/SECTION] after";
    expect(getStreamingDisplay(raw)).toBe("Before  after");
  });

  it("no --- yet: strips [ACCESS:...][/ACCESS] blocks", () => {
    const raw = "Before [ACCESS:ch1][content][/ACCESS] after";
    expect(getStreamingDisplay(raw)).toBe("Before  after");
  });

  it("no --- yet: strips [GAME_OVER]...[/GAME_OVER] blocks", () => {
    const raw = "Before [GAME_OVER]Winner: Alice[/GAME_OVER] after";
    expect(getStreamingDisplay(raw)).toBe("Before  after");
  });

  it("no --- yet: strips incomplete/partial [BOARD:...] at end", () => {
    const raw = "Before [BOARD:map]partial content";
    expect(getStreamingDisplay(raw)).toBe("Before");
  });

  it("strips directive lines (NEXT_SPEAKER, ASSIGN_ROLE, etc.)", () => {
    const raw = "Hello\nNEXT_SPEAKER:alice\nASSIGN_ROLE:bob:detective\nWorld";
    expect(getStreamingDisplay(raw)).toBe("Hello\n\nWorld");
  });

  it("collapses multiple newlines", () => {
    const raw = "Line1\n\n\n\nLine2";
    expect(getStreamingDisplay(raw)).toBe("Line1\n\nLine2");
  });

  it("plain text with no directives returns as-is (trimmed)", () => {
    expect(getStreamingDisplay("  Hello world  ")).toBe("Hello world");
  });

  it("strips GAME_PHASE and MOOD directive lines", () => {
    const raw = "Text\nGAME_PHASE:day\nMOOD:tense\nMore";
    expect(getStreamingDisplay(raw)).toBe("Text\n\nMore");
  });

  it("strips ANNOUNCE directive line", () => {
    const raw = "Before\nANNOUNCE:something\nAfter";
    expect(getStreamingDisplay(raw)).toBe("Before\n\nAfter");
  });

  it("message includes content before first --- when --- appears mid-string", () => {
    const raw = "Part one\n---\nPart two\n---\nPart three";
    expect(getStreamingDisplay(raw)).toBe("Part one");
  });
});

describe("splitHostOutput", () => {
  it("splits at --- separator into message and directives", () => {
    const result = splitHostOutput("Hello!\n---\nNEXT_SPEAKER:alice");
    expect(result.message).toBe("Hello!");
    expect(result.directives).toBe("NEXT_SPEAKER:alice");
  });

  it("message is trimmed", () => {
    const result = splitHostOutput("  Hello  \n---\ndirectives");
    expect(result.message).toBe("Hello");
  });

  it("directives are trimmed", () => {
    const result = splitHostOutput("msg\n---\n  NEXT_SPEAKER:x  ");
    expect(result.directives).toBe("NEXT_SPEAKER:x");
  });

  it("--- at start of string (silent turn): message is empty", () => {
    const result = splitHostOutput("---\nNEXT_SPEAKER:alice");
    expect(result.message).toBe("");
    expect(result.directives).toBe("NEXT_SPEAKER:alice");
  });

  it("no --- found: message is empty, directives is full raw", () => {
    const raw = "Some text without separator";
    const result = splitHostOutput(raw);
    expect(result.message).toBe("");
    expect(result.directives).toBe(raw);
  });

  it("multiple --- lines: splits at first one", () => {
    const result = splitHostOutput("First\n---\nDirective1\n---\nDirective2");
    expect(result.message).toBe("First");
    expect(result.directives).toBe("Directive1\n---\nDirective2");
  });

  it("--- with extra whitespace", () => {
    const result = splitHostOutput("Msg\n---   \nDir");
    expect(result.message).toBe("Msg");
    expect(result.directives).toBe("Dir");
  });

  it("--- at very start with leading newline in raw", () => {
    const result = splitHostOutput("\n---\nDir");
    expect(result.message).toBe("");
    expect(result.directives).toBe("Dir");
  });
});

describe("stripDirectiveLines", () => {
  it("strips NEXT_SPEAKER lines", () => {
    expect(stripDirectiveLines("Hello\nNEXT_SPEAKER:alice\nWorld")).toBe("Hello\n\nWorld");
  });

  it("strips ASSIGN_ROLE lines", () => {
    expect(stripDirectiveLines("A\nASSIGN_ROLE:bob:detective\nB")).toBe("A\n\nB");
  });

  it("strips BOARD blocks", () => {
    expect(stripDirectiveLines("Before [BOARD:x][content][/BOARD] after")).toBe("Before  after");
  });

  it("strips SECTION blocks", () => {
    expect(stripDirectiveLines("Before [SECTION:x][c][/SECTION] after")).toBe("Before  after");
  });

  it("strips GAME_OVER blocks", () => {
    expect(stripDirectiveLines("Before [GAME_OVER]end[/GAME_OVER] after")).toBe("Before  after");
  });

  it("strips <commentary>...</commentary> XML tags", () => {
    expect(stripDirectiveLines("A<commentary>internal</commentary>B")).toBe("AB");
  });

  it("strips <thinking>...</thinking> XML tags", () => {
    expect(stripDirectiveLines("A<thinking>thought</thinking>B")).toBe("AB");
  });

  it("strips incomplete <commentary>... at end", () => {
    expect(stripDirectiveLines("Text <commentary>unclosed")).toBe("Text");
  });

  it("strips incomplete <thinking>... at end", () => {
    expect(stripDirectiveLines("Text <thinking>unclosed")).toBe("Text");
  });

  it("preserves regular text", () => {
    expect(stripDirectiveLines("Hello world")).toBe("Hello world");
  });

  it("collapses multiple blank lines", () => {
    expect(stripDirectiveLines("A\n\n\n\nB")).toBe("A\n\nB");
  });

  it("strips AUTO_CHANNEL and CHANNEL_GOAL directives", () => {
    const raw = "Text\nAUTO_CHANNEL:ch1\nCHANNEL_GOAL:goal\nMore";
    expect(stripDirectiveLines(raw)).toBe("Text\n\nMore");
  });
});

describe("sectionId", () => {
  it("converts title to lowercase kebab-case", () => {
    expect(sectionId("Introduction")).toBe("section-introduction");
    expect(sectionId("The Great Hall")).toBe("section-the-great-hall");
  });

  it("prefixes with 'section-'", () => {
    expect(sectionId("Test")).toMatch(/^section-/);
  });

  it("removes special characters", () => {
    expect(sectionId("Hello! World?")).toBe("section-hello-world");
    expect(sectionId("Test@#$%")).toBe("section-test");
  });

  it("handles spaces correctly", () => {
    expect(sectionId("a b c")).toBe("section-a-b-c");
  });

  it("handles multiple spaces", () => {
    expect(sectionId("a   b")).toBe("section-a-b");
  });

  it("handles empty string", () => {
    expect(sectionId("")).toBe("section-");
  });

  it("preserves numbers", () => {
    expect(sectionId("Chapter 3")).toBe("section-chapter-3");
  });

  it("handles unicode/special chars by stripping", () => {
    expect(sectionId("Café")).toBe("section-caf");
  });
});
