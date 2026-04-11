import { describe, it, expect } from "vitest";
import {
  parseGmState,
  parseCharacterDirections,
  stripGmDirectives,
  EMPTY_GM_STATE,
} from "../gm-state";

describe("parseGmState", () => {
  it("parses a simple flat GM_STATE", () => {
    const directives = `GM_STATE: {"act":2,"tension":3,"ingredientsUsed":["torch"],"ingredientsAvailable":["key"],"playerKnows":["door is locked"],"playerDoesntKnow":["trap ahead"],"activeThreats":["guard"],"mood":"tense"}`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.act).toBe(2);
    expect(result!.tension).toBe(3);
    expect(result!.ingredientsUsed).toEqual(["torch"]);
    expect(result!.mood).toBe("tense");
  });

  it("handles nested braces in string values (the old regex bug)", () => {
    const directives = `GM_STATE: {"act":1,"tension":2,"ingredientsUsed":[],"ingredientsAvailable":["a {special} item"],"playerKnows":["the code is {42}"],"playerDoesntKnow":[],"activeThreats":[],"mood":"curious"}`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.ingredientsAvailable).toEqual(["a {special} item"]);
    expect(result!.playerKnows).toEqual(["the code is {42}"]);
  });

  it("handles escaped quotes inside string values", () => {
    const directives = `GM_STATE: {"act":1,"tension":1,"ingredientsUsed":[],"ingredientsAvailable":[],"playerKnows":["he said \\"hello\\""],"playerDoesntKnow":[],"activeThreats":[],"mood":"calm"}`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.playerKnows).toEqual(['he said "hello"']);
  });

  it("parses GM_STATE with text before and after", () => {
    const directives = `NEXT_SPEAKER: Alice\nGM_STATE: {"act":3,"tension":5,"ingredientsUsed":[],"ingredientsAvailable":[],"playerKnows":[],"playerDoesntKnow":[],"activeThreats":[],"mood":"climactic"}\nCHARACTER_DIRECTION: Alice | speak now`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.act).toBe(3);
    expect(result!.mood).toBe("climactic");
  });

  it("returns null when GM_STATE is missing", () => {
    expect(parseGmState("NEXT_SPEAKER: Alice")).toBeNull();
    expect(parseGmState("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseGmState("GM_STATE: {not json at all}")).toBeNull();
  });

  it("provides defaults for missing fields", () => {
    const directives = `GM_STATE: {"mood":"happy"}`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.act).toBe(1);
    expect(result!.tension).toBe(1);
    expect(result!.ingredientsUsed).toEqual([]);
    expect(result!.mood).toBe("happy");
  });

  it("handles multiline GM_STATE JSON", () => {
    const directives = `GM_STATE: {
  "act": 2,
  "tension": 4,
  "ingredientsUsed": ["sword", "potion"],
  "ingredientsAvailable": [],
  "playerKnows": ["the dragon is near"],
  "playerDoesntKnow": ["the princess is the dragon"],
  "activeThreats": ["fire"],
  "mood": "epic"
}`;
    const result = parseGmState(directives);
    expect(result).not.toBeNull();
    expect(result!.act).toBe(2);
    expect(result!.playerDoesntKnow).toEqual(["the princess is the dragon"]);
  });

  it("EMPTY_GM_STATE has correct defaults", () => {
    expect(EMPTY_GM_STATE.act).toBe(1);
    expect(EMPTY_GM_STATE.tension).toBe(1);
    expect(EMPTY_GM_STATE.mood).toBe("curious");
    expect(EMPTY_GM_STATE.ingredientsUsed).toEqual([]);
    expect(EMPTY_GM_STATE.activeThreats).toEqual([]);
  });
});

describe("parseCharacterDirections", () => {
  it("parses single direction", () => {
    const directives = "CHARACTER_DIRECTION: Alice | reveal the secret quietly";
    const result = parseCharacterDirections(directives);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: "Alice", direction: "reveal the secret quietly" });
  });

  it("parses multiple directions", () => {
    const directives = [
      "CHARACTER_DIRECTION: Alice | be suspicious",
      "CHARACTER_DIRECTION: Bob | defend yourself",
      "CHARACTER_DIRECTION: Carol | stay silent",
    ].join("\n");
    const result = parseCharacterDirections(directives);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Bob");
    expect(result[2].name).toBe("Carol");
  });

  it("returns empty for no directions", () => {
    expect(parseCharacterDirections("NEXT_SPEAKER: Alice")).toEqual([]);
    expect(parseCharacterDirections("")).toEqual([]);
  });

  it("trims whitespace from names and directions", () => {
    const directives = "CHARACTER_DIRECTION:   Alice   |   speak up   ";
    const result = parseCharacterDirections(directives);
    expect(result[0]).toEqual({ name: "Alice", direction: "speak up" });
  });
});

describe("stripGmDirectives", () => {
  it("strips GM_STATE with nested braces", () => {
    const directives = `NEXT_SPEAKER: Alice\nGM_STATE: {"act":1,"playerKnows":["code is {42}"],"tension":1,"ingredientsUsed":[],"ingredientsAvailable":[],"playerDoesntKnow":[],"activeThreats":[],"mood":"ok"}\nSome other line`;
    const result = stripGmDirectives(directives);
    expect(result).not.toContain("GM_STATE");
    expect(result).toContain("NEXT_SPEAKER: Alice");
    expect(result).toContain("Some other line");
  });

  it("strips CHARACTER_DIRECTION lines", () => {
    const directives = "CHARACTER_DIRECTION: Alice | do something\nNEXT_SPEAKER: Bob";
    const result = stripGmDirectives(directives);
    expect(result).not.toContain("CHARACTER_DIRECTION");
    expect(result).toContain("NEXT_SPEAKER: Bob");
  });

  it("strips both GM_STATE and CHARACTER_DIRECTION", () => {
    const directives = `GM_STATE: {"act":1,"tension":1,"ingredientsUsed":[],"ingredientsAvailable":[],"playerKnows":[],"playerDoesntKnow":[],"activeThreats":[],"mood":"ok"}\nCHARACTER_DIRECTION: Alice | hint\nNEXT_SPEAKER: Alice`;
    const result = stripGmDirectives(directives);
    expect(result).toBe("NEXT_SPEAKER: Alice");
  });

  it("handles empty input", () => {
    expect(stripGmDirectives("")).toBe("");
  });

  it("handles input with no directives", () => {
    expect(stripGmDirectives("NEXT_SPEAKER: Alice")).toBe("NEXT_SPEAKER: Alice");
  });
});
