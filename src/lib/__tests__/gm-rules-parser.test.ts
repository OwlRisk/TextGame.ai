import { describe, it, expect } from "vitest";
import {
  parseGMResponseTags,
  applyRulesUpdates,
  applyBackgroundToRules,
  clampPlayerCount,
} from "../gm-rules-parser";

// ---------------------------------------------------------------------------
// parseGMResponseTags
// ---------------------------------------------------------------------------

describe("parseGMResponseTags", () => {
  describe("EDIT_RULES", () => {
    it("extracts a complete EDIT_RULES block and strips it from cleanedResponse", () => {
      const response =
        "Here is the update.\n<EDIT_RULES>\nRule 1\nRule 2\n</EDIT_RULES>\nDone.";
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBe("Rule 1\nRule 2");
      expect(parsed.cleanedResponse).toContain("Here is the update.");
      expect(parsed.cleanedResponse).toContain("Done.");
      expect(parsed.cleanedResponse).not.toContain("EDIT_RULES");
    });

    it("handles case-insensitive tags", () => {
      const response = "<edit_rules>lower case rules</edit_rules>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBe("lower case rules");
      expect(parsed.cleanedResponse).toBe("");
    });

    it("extracts incomplete EDIT_RULES when content > 50 chars (streaming interrupted)", () => {
      const longContent = "A".repeat(60);
      const response = `Some chat\n<EDIT_RULES>${longContent}`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBe(longContent);
      expect(parsed.cleanedResponse).toBe("Some chat");
    });

    it("ignores incomplete EDIT_RULES when content <= 50 chars", () => {
      const shortContent = "short";
      const response = `Chat\n<EDIT_RULES>${shortContent}`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBeNull();
    });

    it("ignores empty EDIT_RULES", () => {
      const response = "<EDIT_RULES>   </EDIT_RULES>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBeNull();
    });
  });

  describe("ADD_TO_RULES", () => {
    it("parses single ADD_TO_RULES", () => {
      const response =
        'Text <ADD_TO_RULES section="Combat">New combat rule</ADD_TO_RULES> more text';
      const parsed = parseGMResponseTags(response);
      expect(parsed.addToRules).toEqual([
        { section: "Combat", content: "New combat rule" },
      ]);
      expect(parsed.cleanedResponse).toBe("Text  more text");
    });

    it("parses multiple ADD_TO_RULES blocks", () => {
      const response =
        '<ADD_TO_RULES section="A">Content A</ADD_TO_RULES>\n' +
        '<ADD_TO_RULES section="B">Content B</ADD_TO_RULES>';
      const parsed = parseGMResponseTags(response);
      expect(parsed.addToRules).toHaveLength(2);
      expect(parsed.addToRules[0]).toEqual({ section: "A", content: "Content A" });
      expect(parsed.addToRules[1]).toEqual({ section: "B", content: "Content B" });
    });

    it("ignores ADD_TO_RULES with empty section or content", () => {
      const response = '<ADD_TO_RULES section="">stuff</ADD_TO_RULES>';
      const parsed = parseGMResponseTags(response);
      expect(parsed.addToRules).toHaveLength(0);
    });
  });

  describe("REPLACE_IN_RULES", () => {
    it("parses a REPLACE_IN_RULES tag", () => {
      const response =
        '<REPLACE_IN_RULES section="Roles" old="Seer" new="Oracle"></REPLACE_IN_RULES>';
      const parsed = parseGMResponseTags(response);
      expect(parsed.replaceInRules).toEqual([
        { section: "Roles", oldContent: "Seer", newContent: "Oracle" },
      ]);
      expect(parsed.cleanedResponse).toBe("");
    });

    it("parses multiple REPLACE_IN_RULES", () => {
      const response =
        '<REPLACE_IN_RULES section="A" old="x" new="y"></REPLACE_IN_RULES>\n' +
        '<REPLACE_IN_RULES section="B" old="1" new="2"></REPLACE_IN_RULES>';
      const parsed = parseGMResponseTags(response);
      expect(parsed.replaceInRules).toHaveLength(2);
    });
  });

  describe("UPDATE_RULES (legacy)", () => {
    it("extracts UPDATE_RULES when no EDIT_RULES present", () => {
      const response = "Intro <UPDATE_RULES>Legacy rules here</UPDATE_RULES> end";
      const parsed = parseGMResponseTags(response);
      expect(parsed.updateRules).toBe("Legacy rules here");
      expect(parsed.editRules).toBeNull();
      expect(parsed.cleanedResponse).toBe("Intro  end");
    });

    it("ignores UPDATE_RULES when EDIT_RULES is present", () => {
      const response =
        "<EDIT_RULES>Main rules</EDIT_RULES>\n<UPDATE_RULES>Legacy</UPDATE_RULES>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.editRules).toBe("Main rules");
      expect(parsed.updateRules).toBeNull();
    });
  });

  describe("SET_PLAYER_COUNT", () => {
    it("parses a valid player count", () => {
      const response = "Setting players <SET_PLAYER_COUNT>5</SET_PLAYER_COUNT> done";
      const parsed = parseGMResponseTags(response);
      expect(parsed.setPlayerCount).toBe(5);
      expect(parsed.cleanedResponse).toBe("Setting players  done");
    });

    it("handles whitespace around the number", () => {
      const response = "<SET_PLAYER_COUNT>  8  </SET_PLAYER_COUNT>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.setPlayerCount).toBe(8);
    });

    it("returns null for missing count", () => {
      const response = "No count here";
      const parsed = parseGMResponseTags(response);
      expect(parsed.setPlayerCount).toBeNull();
    });
  });

  describe("UPDATE_GENERAL", () => {
    it("extracts UPDATE_GENERAL content", () => {
      const response =
        "Here <UPDATE_GENERAL>Background story content</UPDATE_GENERAL> done";
      const parsed = parseGMResponseTags(response);
      expect(parsed.updateGeneral).toBe("Background story content");
      expect(parsed.cleanedResponse).toBe("Here  done");
    });
  });

  describe("CONFIG_CHANNELS", () => {
    it("parses valid JSON channel config", () => {
      const channels = [
        { id: "ch1", name: "General", roomType: "public" },
        { id: "ch2", name: "Mafia", roomType: "private_ai" },
      ];
      const response = `<CONFIG_CHANNELS>${JSON.stringify(channels)}</CONFIG_CHANNELS>`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toEqual([
        { id: "ch1", name: "General", roomType: "public" },
        { id: "ch2", name: "Mafia", roomType: "private_ai" },
      ]);
    });

    it("filters out entries missing id or name", () => {
      const channels = [
        { id: "ch1", name: "Good" },
        { name: "No ID" },
        { id: "ch3" },
      ];
      const response = `<CONFIG_CHANNELS>${JSON.stringify(channels)}</CONFIG_CHANNELS>`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toHaveLength(1);
      expect(parsed.configChannels![0].id).toBe("ch1");
    });

    it("returns null for invalid JSON", () => {
      const response = "<CONFIG_CHANNELS>not json</CONFIG_CHANNELS>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toBeNull();
    });

    it("returns null for empty array", () => {
      const response = "<CONFIG_CHANNELS>[]</CONFIG_CHANNELS>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toBeNull();
    });

    it("strips incomplete CONFIG_CHANNELS (streaming)", () => {
      const response = "Chat text <CONFIG_CHANNELS>[{\"id\":\"ch1\"";
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toBeNull();
      expect(parsed.cleanedResponse).toBe("Chat text");
    });

    it("sets roomType to undefined for invalid roomType values", () => {
      const channels = [{ id: "ch1", name: "Test", roomType: "invalid_type" }];
      const response = `<CONFIG_CHANNELS>${JSON.stringify(channels)}</CONFIG_CHANNELS>`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.configChannels).toHaveLength(1);
      expect(parsed.configChannels![0].roomType).toBeUndefined();
    });
  });

  describe("CONFIG_PLAYERS", () => {
    it("parses valid JSON player config", () => {
      const players = [
        { name: "Alice", gender: "female", personality: "brave" },
        { name: "Bob", background: "detective" },
      ];
      const response = `<CONFIG_PLAYERS>${JSON.stringify(players)}</CONFIG_PLAYERS>`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.configPlayers).toEqual(players);
    });

    it("filters out entries without a name", () => {
      const players = [
        { name: "Valid" },
        { gender: "male" } as unknown,
        42,
      ];
      const response = `<CONFIG_PLAYERS>${JSON.stringify(players)}</CONFIG_PLAYERS>`;
      const parsed = parseGMResponseTags(response);
      expect(parsed.configPlayers).toHaveLength(1);
      expect(parsed.configPlayers![0].name).toBe("Valid");
    });

    it("returns null for invalid JSON", () => {
      const response = "<CONFIG_PLAYERS>{broken</CONFIG_PLAYERS>";
      const parsed = parseGMResponseTags(response);
      expect(parsed.configPlayers).toBeNull();
    });

    it("strips incomplete CONFIG_PLAYERS (streaming)", () => {
      const response = "Hi <CONFIG_PLAYERS>[{\"name\":\"A\"";
      const parsed = parseGMResponseTags(response);
      expect(parsed.configPlayers).toBeNull();
      expect(parsed.cleanedResponse).toBe("Hi");
    });
  });

  describe("cleanedResponse — combined tags", () => {
    it("strips all tags from a response containing every type", () => {
      const response = [
        "Visible start.",
        "<EDIT_RULES>rules body</EDIT_RULES>",
        '<ADD_TO_RULES section="S">add</ADD_TO_RULES>',
        '<REPLACE_IN_RULES section="S" old="a" new="b"></REPLACE_IN_RULES>',
        "<SET_PLAYER_COUNT>4</SET_PLAYER_COUNT>",
        "<UPDATE_GENERAL>bg</UPDATE_GENERAL>",
        '<CONFIG_CHANNELS>[{"id":"c","name":"n"}]</CONFIG_CHANNELS>',
        '<CONFIG_PLAYERS>[{"name":"p"}]</CONFIG_PLAYERS>',
        "Visible end.",
      ].join("\n");
      const parsed = parseGMResponseTags(response);
      expect(parsed.cleanedResponse).toContain("Visible start.");
      expect(parsed.cleanedResponse).toContain("Visible end.");
      expect(parsed.cleanedResponse).not.toMatch(/<[A-Z_]+>/);
    });

    it("returns original text when there are no tags", () => {
      const response = "Just a normal message with no tags.";
      const parsed = parseGMResponseTags(response);
      expect(parsed.cleanedResponse).toBe(response);
      expect(parsed.editRules).toBeNull();
      expect(parsed.addToRules).toEqual([]);
      expect(parsed.replaceInRules).toEqual([]);
      expect(parsed.updateRules).toBeNull();
      expect(parsed.setPlayerCount).toBeNull();
      expect(parsed.updateGeneral).toBeNull();
      expect(parsed.configChannels).toBeNull();
      expect(parsed.configPlayers).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// applyRulesUpdates
// ---------------------------------------------------------------------------

describe("applyRulesUpdates", () => {
  it("returns editRules directly when present (highest priority)", () => {
    const result = applyRulesUpdates("old rules", {
      editRules: "brand new rules",
      addToRules: [{ section: "X", content: "extra" }],
      replaceInRules: [],
      updateRules: "should be ignored",
    });
    expect(result).toBe("brand new rules");
  });

  it("applies addToRules to matching sections", () => {
    const rules = "COMBAT:\nHit with sword.\n\nMAGIC:\nCast fireball.";
    const result = applyRulesUpdates(rules, {
      editRules: null,
      addToRules: [{ section: "COMBAT", content: "Dodge available." }],
      replaceInRules: [],
      updateRules: null,
    });
    expect(result).toContain("Hit with sword.");
    expect(result).toContain("Dodge available.");
  });

  it("applies replaceInRules within a section", () => {
    const rules = "ROLES:\nSeer can see roles.\n\nGAMEPLAY:\nDay then night.";
    const result = applyRulesUpdates(rules, {
      editRules: null,
      addToRules: [],
      replaceInRules: [{ section: "ROLES", oldContent: "Seer", newContent: "Oracle" }],
      updateRules: null,
    });
    expect(result).toContain("Oracle can see roles.");
    expect(result).not.toContain("Seer");
  });

  it("falls back to updateRules (legacy) when no editRules", () => {
    const result = applyRulesUpdates("old rules", {
      editRules: null,
      addToRules: [],
      replaceInRules: [],
      updateRules: "legacy replacement",
    });
    expect(result).toBe("legacy replacement");
  });

  it("uses defaultRules when currentRules is empty", () => {
    const result = applyRulesUpdates("", {
      editRules: null,
      addToRules: [{ section: "DEFAULT", content: "appended" }],
      replaceInRules: [],
      updateRules: null,
    }, "DEFAULT:\nBase rules.");
    expect(result).toContain("Base rules.");
    expect(result).toContain("appended");
  });

  it("returns empty string when everything is empty", () => {
    const result = applyRulesUpdates("", {
      editRules: null,
      addToRules: [],
      replaceInRules: [],
      updateRules: null,
    });
    expect(result).toBe("");
  });
});

// ---------------------------------------------------------------------------
// applyBackgroundToRules
// ---------------------------------------------------------------------------

describe("applyBackgroundToRules", () => {
  it("prepends background when rules have no existing background section", () => {
    const result = applyBackgroundToRules("Some rules here.", "BACKGROUND: A dark castle.");
    expect(result).toBe("BACKGROUND: A dark castle.\n\nSome rules here.");
  });

  it("replaces existing BACKGROUND prefix", () => {
    const existing = "BACKGROUND old info\n\nMore rules.";
    const result = applyBackgroundToRules(existing, "BACKGROUND new info");
    expect(result).toContain("BACKGROUND new info");
  });

  it("replaces existing STORY prefix", () => {
    const existing = "STORY old story\n\nRules follow.";
    const result = applyBackgroundToRules(existing, "New story");
    expect(result).toContain("New story");
  });

  it("replaces existing WORLD prefix", () => {
    const existing = "WORLD old world\n\nRules follow.";
    const result = applyBackgroundToRules(existing, "New world");
    expect(result).toContain("New world");
  });

  it("uses defaultRules when currentRules is empty", () => {
    const result = applyBackgroundToRules("", "BG content", "Default rules.");
    expect(result).toBe("BG content\n\nDefault rules.");
  });

  it("returns just background when everything else is empty", () => {
    const result = applyBackgroundToRules("", "Solo background");
    expect(result).toBe("Solo background");
  });
});

// ---------------------------------------------------------------------------
// clampPlayerCount
// ---------------------------------------------------------------------------

describe("clampPlayerCount", () => {
  it("clamps within template range (minPlayers-1 .. maxPlayers-1)", () => {
    const template = { minPlayers: 4, maxPlayers: 10 };
    expect(clampPlayerCount(5, template)).toBe(5);
    expect(clampPlayerCount(0, template)).toBe(3);
    expect(clampPlayerCount(100, template)).toBe(9);
  });

  it("returns min when value is below range", () => {
    const template = { minPlayers: 5, maxPlayers: 12 };
    expect(clampPlayerCount(-1, template)).toBe(4);
  });

  it("returns max when value is above range", () => {
    const template = { minPlayers: 2, maxPlayers: 8 };
    expect(clampPlayerCount(20, template)).toBe(7);
  });

  it("uses default range [1, 19] when template is null", () => {
    expect(clampPlayerCount(10, null)).toBe(10);
    expect(clampPlayerCount(0, null)).toBe(1);
    expect(clampPlayerCount(25, null)).toBe(19);
  });

  it("handles template where min equals max", () => {
    const template = { minPlayers: 5, maxPlayers: 5 };
    expect(clampPlayerCount(0, template)).toBe(4);
    expect(clampPlayerCount(4, template)).toBe(4);
    expect(clampPlayerCount(10, template)).toBe(4);
  });
});
