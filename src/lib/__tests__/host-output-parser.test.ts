import { describe, it, expect } from "vitest";
import { parseRoleAssignments, parseHostResult } from "../host-output-parser";
import type { Player } from "@/types/player";

// ─── Test Fixtures ─────────────────────────────────────────────────────────

const USER_ID = "human-001";

function aiPlayer(id: string, name: string, role?: string): Player {
  return { id, name, avatar: "#8b5cf6", isAI: true, isGameMaster: false, role };
}

function humanPlayer(id: string, name: string): Player {
  return { id, name, avatar: "#3b82f6", isAI: false, isGameMaster: false };
}

function gmPlayer(id: string, name: string): Player {
  return { id, name, avatar: "#f59e0b", isAI: true, isGameMaster: true };
}

const GAME_ROOM_ENTRIES = [
  { id: "ch-1", name: "General" },
  { id: "ch-2", name: "Werewolves Only" },
  { id: "ch-3", name: "Town Square" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// parseRoleAssignments
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseRoleAssignments", () => {
  describe("ASSIGN_ROLE directive", () => {
    it("assigns role to AI player by exact name", () => {
      const players = [
        aiPlayer("p1", "Alice"),
        aiPlayer("p2", "Bob"),
      ];
      const content = "ASSIGN_ROLE: Alice -> Villager";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toEqual([{ playerId: "p1", role: "Villager" }]);
      expect(result.cleanedContent).toBe("");
    });

    it("assigns role to human player when directive says You", () => {
      const players = [
        humanPlayer(USER_ID, "You"),
        aiPlayer("p1", "Alice"),
      ];
      const content = "ASSIGN_ROLE: You -> Werewolf";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toEqual([{ playerId: USER_ID, role: "Werewolf" }]);
    });

    it("assigns role with humanGameIdentityName match", () => {
      const players = [
        humanPlayer(USER_ID, "Alice"),
        aiPlayer("p1", "Bob"),
      ];
      const content = "ASSIGN_ROLE: Detective -> Seer";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        "Alice",
        "Detective",
      );
      expect(result.roleUpdates).toEqual([{ playerId: USER_ID, role: "Seer" }]);
    });

    it("extracts nameBase from comma-separated name", () => {
      const players = [
        aiPlayer("p1", "Alice"),
      ];
      const content = "ASSIGN_ROLE: Alice, extra -> Villager";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toEqual([{ playerId: "p1", role: "Villager" }]);
    });

    it("skips ASSIGN_ROLE when role part is empty", () => {
      const players = [aiPlayer("p1", "Alice")];
      const content = "ASSIGN_ROLE: Alice -> ";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toHaveLength(0);
    });

    it("handles multiple ASSIGN_ROLE lines", () => {
      const players = [
        aiPlayer("p1", "Alice"),
        aiPlayer("p2", "Bob"),
      ];
      const content = "ASSIGN_ROLE: Alice -> Villager\nASSIGN_ROLE: Bob -> Werewolf";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toEqual([
        { playerId: "p1", role: "Villager" },
        { playerId: "p2", role: "Werewolf" },
      ]);
    });
  });

  describe("REVEAL_ROLE directive", () => {
    it("reveals role for specific player", () => {
      const players = [
        aiPlayer("p1", "Alice"),
        aiPlayer("p2", "Bob"),
      ];
      const content = "REVEAL_ROLE: Alice";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.revealIds).toEqual(["p1"]);
    });

    it("REVEAL_ROLE: All reveals all non-GM players", () => {
      const players = [
        aiPlayer("p1", "Alice"),
        aiPlayer("p2", "Bob"),
        gmPlayer("gm1", "GameMaster"),
      ];
      const content = "REVEAL_ROLE: All";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.revealIds).toContain("p1");
      expect(result.revealIds).toContain("p2");
      expect(result.revealIds).not.toContain("gm1");
      expect(result.revealIds).toHaveLength(2);
    });

    it("REVEAL_ROLE: You reveals human player", () => {
      const players = [
        humanPlayer(USER_ID, "You"),
        aiPlayer("p1", "Alice"),
      ];
      const content = "REVEAL_ROLE: You";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.revealIds).toEqual([USER_ID]);
    });
  });

  describe("ELIMINATE directive", () => {
    it("removes player and records event with role", () => {
      const players = [
        aiPlayer("p1", "Alice", "Villager"),
      ];
      const content = "ELIMINATE: Alice";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.eliminateIds).toEqual(["p1"]);
      expect(result.newEvents).toContain("Alice was eliminated (role: Villager)");
    });

    it("adds no eliminateIds when name not found", () => {
      const players = [aiPlayer("p1", "Alice")];
      const content = "ELIMINATE: NonExistent";
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.eliminateIds).toHaveLength(0);
      expect(result.newEvents).toHaveLength(0);
    });
  });

  describe("GAME_OVER directive", () => {
    it("sets isGameOver true and gameOverSummary", () => {
      const content = "GAME_OVER: Villagers win!";
      const result = parseRoleAssignments(
        content,
        [],
        USER_ID,
        null,
        null,
      );
      expect(result.isGameOver).toBe(true);
      expect(result.gameOverSummary).toBe("Villagers win!");
      expect(result.newEvents).toContain("GAME OVER — Villagers win!");
    });

    it("defaults gameOverSummary to 'Game over!' when empty", () => {
      const content = "GAME_OVER: ";
      const result = parseRoleAssignments(
        content,
        [],
        USER_ID,
        null,
        null,
      );
      expect(result.isGameOver).toBe(true);
      expect(result.gameOverSummary).toBe("Game over!");
      expect(result.newEvents).toContain("GAME OVER — ");
    });
  });

  describe("RECORD_EVENT directive", () => {
    it("adds event string", () => {
      const content = "RECORD_EVENT: Night falls.";
      const result = parseRoleAssignments(
        content,
        [],
        USER_ID,
        null,
        null,
      );
      expect(result.newEvents).toEqual(["Night falls."]);
    });
  });

  describe("Mixed directives", () => {
    it("handles multiple directive types in one content", () => {
      const players = [
        aiPlayer("p1", "Alice"),
        humanPlayer(USER_ID, "You"),
      ];
      const content = [
        "The game begins.",
        "ASSIGN_ROLE: Alice -> Villager",
        "REVEAL_ROLE: You",
        "RECORD_EVENT: Roles assigned.",
      ].join("\n");
      const result = parseRoleAssignments(
        content,
        players,
        USER_ID,
        null,
        null,
      );
      expect(result.roleUpdates).toEqual([{ playerId: "p1", role: "Villager" }]);
      expect(result.revealIds).toEqual([USER_ID]);
      expect(result.newEvents).toContain("Roles assigned.");
      expect(result.cleanedContent).toBe("The game begins.");
    });
  });

  describe("cleanedContent", () => {
    it("strips directive lines and preserves regular text", () => {
      const content = [
        "Welcome to the game!",
        "ASSIGN_ROLE: Alice -> Villager",
        "Let's begin.",
      ].join("\n");
      const result = parseRoleAssignments(
        content,
        [],
        USER_ID,
        null,
        null,
      );
      expect(result.cleanedContent).toBe("Welcome to the game!\nLet's begin.");
    });

    it("collapses multiple blank lines to one", () => {
      const content = [
        "Line one.",
        "",
        "",
        "",
        "ASSIGN_ROLE: X -> Y",
        "",
        "",
        "Line two.",
      ].join("\n");
      const result = parseRoleAssignments(
        content,
        [],
        USER_ID,
        null,
        null,
      );
      expect(result.cleanedContent).not.toMatch(/\n{3,}/);
      expect(result.cleanedContent).toContain("Line one.");
      expect(result.cleanedContent).toContain("Line two.");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// parseHostResult
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostResult", () => {
  const players = [
    aiPlayer("p1", "Alice"),
    aiPlayer("p2", "Bob"),
    humanPlayer(USER_ID, "You"),
  ];

  describe("NEXT_SPEAKER", () => {
    it("who is null and speakerQueue empty when no NEXT_SPEAKER", () => {
      const raw = "Just some host content.";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBeNull();
      expect(result.speakerQueue).toHaveLength(0);
      expect(result.hostContent).toBe("Just some host content.");
    });

    it("creates ai item in queue for single AI name", () => {
      const raw = "Welcome!\nNEXT_SPEAKER: Alice";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBe("Alice");
      expect(result.speakerQueue).toHaveLength(1);
      expect((result.speakerQueue[0] as { type: "ai"; player: Player }).type).toBe("ai");
      expect((result.speakerQueue[0] as { type: "ai"; player: Player }).player.name).toBe("Alice");
      expect(result.hostContent).toBe("Welcome!");
    });

    it("creates human item and breaks when NEXT_SPEAKER says You", () => {
      const raw = "Your turn!\nNEXT_SPEAKER: You";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBe("You");
      expect(result.speakerQueue).toEqual([{ type: "human" }]);
      expect(result.hostContent).toBe("Your turn!");
    });

    it("creates human item when humanName matches", () => {
      const raw = "Speak now!\nNEXT_SPEAKER: Alice";
      const humanPlayerList = [
        humanPlayer(USER_ID, "Alice"),
        aiPlayer("p2", "Bob"),
      ];
      const result = parseHostResult(
        raw,
        humanPlayerList,
        "Alice",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBe("Alice");
      expect(result.speakerQueue).toEqual([{ type: "human" }]);
    });

    it("creates everyone item when NEXT_SPEAKER says Everyone", () => {
      const raw = "Discuss!\nNEXT_SPEAKER: Everyone";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBe("Everyone");
      expect(result.speakerQueue).toEqual([{ type: "everyone" }]);
      expect(result.hostContent).toBe("Discuss!");
    });

    it("handles multiple comma-separated AI names", () => {
      const raw = "NEXT_SPEAKER: Alice, Bob";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.who).toBe("Alice, Bob");
      expect(result.speakerQueue).toHaveLength(2);
      expect((result.speakerQueue[0] as { type: "ai"; player: Player }).player.name).toBe("Alice");
      expect((result.speakerQueue[1] as { type: "ai"; player: Player }).player.name).toBe("Bob");
    });

    it("human does not break the loop when mixed with AI names", () => {
      const raw = "NEXT_SPEAKER: Alice, You, Bob";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.speakerQueue).toEqual([
        { type: "ai", player: players[0] },
        { type: "human" },
        { type: "ai", player: players[1] },
      ]);
    });

    it("strips NEXT_SPEAKER line from hostContent", () => {
      const raw = "The night ends.\nNEXT_SPEAKER: Alice";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.hostContent).not.toContain("NEXT_SPEAKER");
      expect(result.hostContent).toBe("The night ends.");
    });

    it("skips eliminated or non-existent player (not added to speakerQueue)", () => {
      const raw = "NEXT_SPEAKER: Alice, GhostPlayer, Bob";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      // GhostPlayer not found -> player undefined -> not pushed (isAI check fails)
      expect(result.speakerQueue).toHaveLength(2);
      expect((result.speakerQueue[0] as { type: "ai"; player: Player }).player.name).toBe("Alice");
      expect((result.speakerQueue[1] as { type: "ai"; player: Player }).player.name).toBe("Bob");
    });
  });

  describe("AUTO_CHANNEL", () => {
    it("resolves channel name to ID", () => {
      const raw = "Go to the room.\nAUTO_CHANNEL: General";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.autoChannelId).toBe("ch-1");
      expect(result.autoChannelGoal).toBeNull();
      expect(result.hostContent).toBe("Go to the room.");
    });

    it("extracts channelId and channelGoal with pipe", () => {
      const raw = "Discuss privately.\nAUTO_CHANNEL: Werewolves Only | Plan the attack";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.autoChannelId).toBe("ch-2");
      expect(result.autoChannelGoal).toBe("Plan the attack");
      expect(result.hostContent).toBe("Discuss privately.");
    });

    it("autoChannelId is null when channel unresolvable", () => {
      const raw = "AUTO_CHANNEL: Nonexistent Room XYZ";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.autoChannelId).toBeNull();
      expect(result.autoChannelGoal).toBeNull();
    });

    it("strips AUTO_CHANNEL line from hostContent", () => {
      const raw = "Move along.\nAUTO_CHANNEL: Town Square";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.hostContent).not.toContain("AUTO_CHANNEL");
      expect(result.hostContent).toBe("Move along.");
    });
  });

  describe("Combined directives", () => {
    it("handles both NEXT_SPEAKER and AUTO_CHANNEL together", () => {
      const raw = [
        "The werewolves meet.",
        "NEXT_SPEAKER: Alice, Bob",
        "AUTO_CHANNEL: Werewolves Only | Discuss",
      ].join("\n");
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.hostContent).toBe("The werewolves meet.");
      expect(result.who).toBe("Alice, Bob");
      expect(result.speakerQueue).toHaveLength(2);
      expect(result.autoChannelId).toBe("ch-2");
      expect(result.autoChannelGoal).toBe("Discuss");
    });

    it("extracts CHANNEL_GOAL and strips from hostContent", () => {
      const raw = [
        "Discuss clues.",
        "CHANNEL_GOAL: Interview two suspects before dinner",
        "NEXT_SPEAKER: Alice",
      ].join("\n");
      const result = parseHostResult(raw, players, "You", GAME_ROOM_ENTRIES);
      expect(result.channelGoal).toBe("Interview two suspects before dinner");
      expect(result.hostContent).toBe("Discuss clues.");
      expect(result.who).toBe("Alice");
      expect(result.hostContent).not.toContain("CHANNEL_GOAL");
    });
  });

  describe("Content without directives", () => {
    it("hostContent is the full text trimmed when no directives", () => {
      const raw = "  \n  Just narrative text.\n  ";
      const result = parseHostResult(
        raw,
        players,
        "You",
        GAME_ROOM_ENTRIES,
      );
      expect(result.hostContent).toBe("Just narrative text.");
      expect(result.who).toBeNull();
      expect(result.autoChannelId).toBeNull();
    });
  });
});
