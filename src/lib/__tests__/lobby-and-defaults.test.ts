import { describe, it, expect } from "vitest";
import { getDefaultAICountForTemplate } from "../game-utils";
import { getGameTemplate, GAME_TEMPLATES } from "../game-templates";
import { getStreamingDisplay, stripDirectiveLines, resolveChannelByName } from "../game-host-utils";
import { parseHostResult } from "../host-output-parser";
import type { Player } from "@/types/player";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aiPlayer(id: string, name: string): Player {
  return { id, name, isAI: true, isGameMaster: false, avatar: "#000" } as Player;
}
function humanPlayer(id: string, name: string): Player {
  return { id, name, isAI: false, isGameMaster: false, avatar: "#000" } as Player;
}

const GAME_ROOM_ENTRIES = [{ id: "main", name: "Main Hall" }];

// ═════════════════════════════════════════════════════════════════════════════
// 1. Default AI count uses recommendedAICount (not maxPlayers-1)
// ═════════════════════════════════════════════════════════════════════════════

describe("getDefaultAICountForTemplate uses recommendedAICount", () => {
  it.each([
    ["werewolf", 5],
    ["mafia", 7],
    ["undercover", 5],
    ["avalon", 5],
    ["codenames", 5],
    ["spyfall", 4],
    ["detective-mystery", 4],
    ["escape-room", 3],
    ["trivia", 3],
    ["debate", 3],
    ["storyteller", 3],
    ["two-truths-lie", 4],
    ["rpg-dungeon", 3],
    ["tarot", 0],
    ["20-questions", 3],
    ["custom", 4],
  ] as const)("%s → %d AI players", (templateId, expected) => {
    expect(getDefaultAICountForTemplate(templateId)).toBe(expected);
  });

  it("returns 4 for unknown template", () => {
    expect(getDefaultAICountForTemplate("nonexistent")).toBe(4);
    expect(getDefaultAICountForTemplate(undefined)).toBe(4);
  });

  it("never exceeds maxPlayers - 1 (room for the human)", () => {
    for (const tmpl of GAME_TEMPLATES) {
      const aiCount = getDefaultAICountForTemplate(tmpl.id);
      expect(aiCount).toBeLessThanOrEqual(tmpl.maxPlayers - 1);
    }
  });

  it("is always >= 0", () => {
    for (const tmpl of GAME_TEMPLATES) {
      expect(getDefaultAICountForTemplate(tmpl.id)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Template minPlayers/maxPlayers/recommendedAICount consistency
// ═════════════════════════════════════════════════════════════════════════════

describe("template player count consistency", () => {
  for (const tmpl of GAME_TEMPLATES) {
    describe(tmpl.id, () => {
      it("minPlayers <= maxPlayers", () => {
        expect(tmpl.minPlayers).toBeLessThanOrEqual(tmpl.maxPlayers);
      });

      it("recommendedAICount < maxPlayers (leaves room for human)", () => {
        if (tmpl.maxPlayers > 1) {
          expect(tmpl.recommendedAICount).toBeLessThan(tmpl.maxPlayers);
        }
      });

      it("recommendedAICount >= 0", () => {
        expect(tmpl.recommendedAICount).toBeGreaterThanOrEqual(0);
      });

      it("minPlayers >= 1", () => {
        expect(tmpl.minPlayers).toBeGreaterThanOrEqual(1);
      });
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Streaming display strips GM directives
// ═════════════════════════════════════════════════════════════════════════════

describe("getStreamingDisplay strips GM directives", () => {
  it("strips GM_STATE lines", () => {
    const raw = 'The tavern grows quiet.\nGM_STATE: {"act":2}\n';
    expect(getStreamingDisplay(raw)).not.toContain("GM_STATE");
    expect(getStreamingDisplay(raw)).toContain("tavern");
  });

  it("strips CHARACTER_DIRECTION lines", () => {
    const raw = "The fire crackles.\nCHARACTER_DIRECTION: Alice | be bold\n";
    expect(getStreamingDisplay(raw)).not.toContain("CHARACTER_DIRECTION");
    expect(getStreamingDisplay(raw)).toContain("fire crackles");
  });

  it("strips ENGAGEMENT lines", () => {
    const raw = "A shadow moves.\nENGAGEMENT: 4\n";
    expect(getStreamingDisplay(raw)).not.toContain("ENGAGEMENT");
  });

  it("strips BEGIN_GAME lines", () => {
    const raw = "Welcome everyone.\nBEGIN_GAME: true\n";
    expect(getStreamingDisplay(raw)).not.toContain("BEGIN_GAME");
  });

  it("preserves content before --- separator", () => {
    const raw = "The battle begins!\n---\nNEXT_SPEAKER: Alice\nGM_STATE: {}\n";
    const display = getStreamingDisplay(raw);
    expect(display).toBe("The battle begins!");
  });
});

describe("stripDirectiveLines handles all directive types", () => {
  it("strips standard directives", () => {
    const content = "Hello world\nNEXT_SPEAKER: Alice\nASSIGN_ROLE: Alice -> Werewolf\nGoodbye";
    const result = stripDirectiveLines(content);
    expect(result).not.toContain("NEXT_SPEAKER");
    expect(result).not.toContain("ASSIGN_ROLE");
    expect(result).toContain("Hello world");
    expect(result).toContain("Goodbye");
  });

  it("strips GM directives", () => {
    const content = "Story text\nGM_STATE: something\nCHARACTER_DIRECTION: test\nENGAGEMENT: 3";
    const result = stripDirectiveLines(content);
    expect(result).not.toContain("GM_STATE");
    expect(result).not.toContain("CHARACTER_DIRECTION");
    expect(result).not.toContain("ENGAGEMENT");
    expect(result).toContain("Story text");
  });

  it("is a no-op on clean content", () => {
    expect(stripDirectiveLines("Just normal text")).toBe("Just normal text");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Case-insensitive NEXT_SPEAKER name matching
// ═════════════════════════════════════════════════════════════════════════════

describe("parseHostResult case-insensitive name matching", () => {
  it("matches AI player name with different casing", () => {
    const players = [aiPlayer("p1", "Alice"), aiPlayer("p2", "Bob")];
    const raw = "NEXT_SPEAKER: alice, BOB";
    const result = parseHostResult(raw, players, "Human", GAME_ROOM_ENTRIES);
    expect(result.speakerQueue).toHaveLength(2);
    expect(result.speakerQueue[0]).toEqual({ type: "ai", player: players[0] });
    expect(result.speakerQueue[1]).toEqual({ type: "ai", player: players[1] });
  });

  it("still matches exact case", () => {
    const players = [aiPlayer("p1", "Alice")];
    const raw = "NEXT_SPEAKER: Alice";
    const result = parseHostResult(raw, players, "Human", GAME_ROOM_ENTRIES);
    expect(result.speakerQueue).toHaveLength(1);
    expect(result.speakerQueue[0]).toEqual({ type: "ai", player: players[0] });
  });

  it("recognizes 'you' as human regardless of case", () => {
    const players = [aiPlayer("p1", "Alice"), humanPlayer("h1", "Human")];
    const raw = "NEXT_SPEAKER: Alice, YOU";
    const result = parseHostResult(raw, players, "Human", GAME_ROOM_ENTRIES);
    expect(result.speakerQueue).toHaveLength(2);
    expect(result.speakerQueue[0]).toEqual({ type: "ai", player: players[0] });
    expect(result.speakerQueue[1]).toEqual({ type: "human" });
  });

  it("recognizes 'everyone' as open floor", () => {
    const players = [aiPlayer("p1", "Alice")];
    const raw = "NEXT_SPEAKER: Everyone";
    const result = parseHostResult(raw, players, "Human", GAME_ROOM_ENTRIES);
    expect(result.speakerQueue).toHaveLength(1);
    expect(result.speakerQueue[0]).toEqual({ type: "everyone" });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Channel resolution (fuzzy matching)
// ═════════════════════════════════════════════════════════════════════════════

describe("resolveChannelByName", () => {
  const channels = [
    { id: "ch1", name: "Town Hall" },
    { id: "ch2", name: "Mafia Hideout" },
    { id: "ch3", name: "Afterlife" },
  ];

  it("exact match", () => {
    expect(resolveChannelByName("Town Hall", channels)).toBe("ch1");
  });

  it("case-insensitive match", () => {
    expect(resolveChannelByName("town hall", channels)).toBe("ch1");
    expect(resolveChannelByName("MAFIA HIDEOUT", channels)).toBe("ch2");
  });

  it("partial match", () => {
    expect(resolveChannelByName("Mafia", channels)).toBe("ch2");
  });

  it("returns null for no match", () => {
    expect(resolveChannelByName("Nonexistent Room", channels)).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. byRole key matches runtime role.toLowerCase()
// ═════════════════════════════════════════════════════════════════════════════

describe("byRole keys match runtime role names", () => {
  const ROLE_CHECKS: Record<string, string[]> = {
    codenames: ["spymaster", "field operative"],
    undercover: ["undercover", "mr. white"],
    avalon: ["merlin", "assassin", "mordred", "percival", "minion of mordred", "servant of arthur"],
    werewolf: ["werewolf", "seer", "doctor", "villager", "hunter", "witch"],
    mafia: ["mafia", "detective", "doctor", "town member"],
    "detective-mystery": ["detective", "suspect", "witness", "culprit"],
  };

  for (const [templateId, roles] of Object.entries(ROLE_CHECKS)) {
    const tmpl = getGameTemplate(templateId);
    if (!tmpl?.playerPrompts?.byRole) continue;

    describe(templateId, () => {
      for (const role of roles) {
        it(`role "${role}" has matching byRole key`, () => {
          const key = role.toLowerCase();
          expect(tmpl.playerPrompts.byRole![key]).toBeDefined();
        });
      }

      it("all byRole keys match a role from the roles array (lowercased)", () => {
        const templateRoles = new Set(tmpl.roles.map(r => r.toLowerCase()));
        for (const key of Object.keys(tmpl.playerPrompts.byRole!)) {
          expect(
            templateRoles.has(key),
            `byRole key "${key}" has no matching role in ${templateId}.roles: [${tmpl.roles.join(", ")}]`,
          ).toBe(true);
        }
      });
    });
  }
});
