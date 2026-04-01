import { describe, it, expect } from "vitest";
import { buildInitialChannelPermissions } from "../game-host-utils";
import { isNightPhase } from "../speaker-queue";
import { withDefaults, AFTERLIFE_CHANNEL_ID } from "../templates/types";
import type { TemplateChannel } from "../templates/types";
import { werewolf } from "../templates/werewolf";
import { mafia } from "../templates/mafia";
import { trivia } from "../templates/trivia";
import { storyteller } from "../templates/storyteller";
import { debate } from "../templates/debate";
import { twentyQuestions } from "../templates/twenty-questions";
import { undercover } from "../templates/undercover";
import { GAME_TEMPLATES } from "../templates/index";
import { DEFAULT_GAME_PHASE } from "../../app/config/game-phase";
import { buildHostSystemPrompt } from "../host-prompt-builder";

// ═══════════════════════════════════════════════════════════════════════════════
// TemplateChannel & withDefaults
// ═══════════════════════════════════════════════════════════════════════════════

describe("TemplateChannel in GameTemplate", () => {
  it("withDefaults preserves channels when provided", () => {
    const channels: TemplateChannel[] = [
      { id: "main", name: "Main", roomType: "public" },
      { id: "wolf-den", name: "Wolf Den", roomType: "decision", accessByRole: ["werewolf"] },
    ];
    const tmpl = withDefaults({
      id: "test",
      name: "Test",
      description: "test",
      minPlayers: 2,
      maxPlayers: 10,
      defaultRules: "",
      icon: "🎮",
      color: "from-purple-600 to-indigo-600",
      estimatedTime: "10 min",
      recommendedAICount: 3,
      hasHiddenRoles: false,
      hasElimination: false,
      category: "deduction",
      channels,
    });
    expect(tmpl.channels).toEqual(channels);
    expect(tmpl.channels![1].accessByRole).toEqual(["werewolf"]);
  });

  it("withDefaults leaves channels undefined when not provided", () => {
    const tmpl = withDefaults({
      id: "test2",
      name: "Test2",
      description: "test",
      minPlayers: 2,
      maxPlayers: 10,
      defaultRules: "",
      icon: "🎮",
      color: "from-purple-600 to-indigo-600",
      estimatedTime: "10 min",
      recommendedAICount: 3,
      hasHiddenRoles: false,
      hasElimination: false,
      category: "party",
    });
    expect(tmpl.channels).toBeUndefined();
  });
});

describe("AFTERLIFE_CHANNEL_ID constant", () => {
  it("is 'afterlife'", () => {
    expect(AFTERLIFE_CHANNEL_ID).toBe("afterlife");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Werewolf & Mafia template channels
// ═══════════════════════════════════════════════════════════════════════════════

describe("Werewolf template", () => {
  it("defines 3 channels", () => {
    expect(werewolf.channels).toHaveLength(3);
  });

  it("has a public town square channel", () => {
    const pub = werewolf.channels!.find(c => c.roomType === "public");
    expect(pub).toBeDefined();
    expect(pub!.id).toBe("town-square");
  });

  it("has a decision channel for werewolves", () => {
    const den = werewolf.channels!.find(c => c.id === "werewolf-den");
    expect(den).toBeDefined();
    expect(den!.roomType).toBe("decision");
    expect(den!.accessByRole).toEqual(["werewolf"]);
    expect(den!.autoConverse).toBeDefined();
    expect(den!.autoConverse!.goal).toContain("eliminate");
  });

  it("has an afterlife channel", () => {
    const afterlife = werewolf.channels!.find(c => c.id === AFTERLIFE_CHANNEL_ID);
    expect(afterlife).toBeDefined();
    expect(afterlife!.roomType).toBe("private_ai");
  });
});

describe("Mafia template", () => {
  it("defines 3 channels", () => {
    expect(mafia.channels).toHaveLength(3);
  });

  it("has a decision channel for mafia", () => {
    const hideout = mafia.channels!.find(c => c.id === "mafia-hideout");
    expect(hideout).toBeDefined();
    expect(hideout!.roomType).toBe("decision");
    expect(hideout!.accessByRole).toEqual(["mafia"]);
    expect(hideout!.autoConverse).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Templates without channels
// ═══════════════════════════════════════════════════════════════════════════════

describe("Templates without private channels", () => {
  it("trivia has no channels", () => {
    expect(trivia.channels).toBeUndefined();
  });

  it("storyteller has no channels", () => {
    expect(storyteller.channels).toBeUndefined();
  });

  it("debate has no channels", () => {
    expect(debate.channels).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// buildInitialChannelPermissions
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildInitialChannelPermissions", () => {
  const templateChannels: TemplateChannel[] = [
    { id: "town-square", name: "Town Square", roomType: "public" },
    { id: "werewolf-den", name: "Werewolf Den", roomType: "decision", accessByRole: ["werewolf"] },
    { id: "afterlife", name: "Afterlife", roomType: "private_ai" },
  ];

  const players = [
    { id: "gm-1", role: "Host", isGameMaster: true },
    { id: "ai-1", role: "Werewolf" },
    { id: "ai-2", role: "Villager" },
    { id: "ai-3", role: "Werewolf" },
    { id: "ai-4", role: "Seer" },
    { id: "human-1", role: "Doctor" },
  ];

  it("maps werewolf-den to werewolf-role players only", () => {
    const perms = buildInitialChannelPermissions(templateChannels, players);
    expect(perms["werewolf-den"]).toBeDefined();
    expect(perms["werewolf-den"]).toContain("ai-1");
    expect(perms["werewolf-den"]).toContain("ai-3");
    expect(perms["werewolf-den"]).not.toContain("ai-2");
    expect(perms["werewolf-den"]).not.toContain("ai-4");
    expect(perms["werewolf-den"]).not.toContain("human-1");
    expect(perms["werewolf-den"]).not.toContain("gm-1");
  });

  it("does not create permissions for public channels (no accessByRole)", () => {
    const perms = buildInitialChannelPermissions(templateChannels, players);
    expect(perms["town-square"]).toBeUndefined();
  });

  it("initializes afterlife with empty array (restricted, no one has access yet)", () => {
    const perms = buildInitialChannelPermissions(templateChannels, players);
    expect(perms["afterlife"]).toEqual([]);
  });

  it("returns empty object when no template channels", () => {
    expect(buildInitialChannelPermissions(undefined, players)).toEqual({});
  });

  it("role matching is case-insensitive", () => {
    const perms = buildInitialChannelPermissions(templateChannels, [
      { id: "p1", role: "WEREWOLF" },
      { id: "p2", role: "werewolf" },
    ]);
    expect(perms["werewolf-den"]).toContain("p1");
    expect(perms["werewolf-den"]).toContain("p2");
  });

  it("non-public channels without accessByRole get empty array (hidden by default)", () => {
    const perms = buildInitialChannelPermissions(
      [
        { id: "general", roomType: "public" },
        { id: "secret-room", roomType: "private_ai" },
      ],
      [{ id: "p1", role: "Villager" }],
    );
    expect(perms["general"]).toBeUndefined();
    expect(perms["secret-room"]).toEqual([]);
  });

  it("excludes game master from permissions (empty array when no non-GM matches)", () => {
    const perms = buildInitialChannelPermissions(
      [{ id: "den", roomType: "decision", accessByRole: ["host"] }],
      [{ id: "gm-1", role: "Host", isGameMaster: true }],
    );
    expect(perms["den"]).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isNightPhase (fixed to use phaseLabel)
// ═══════════════════════════════════════════════════════════════════════════════

describe("isNightPhase", () => {
  it("returns true for Night labels", () => {
    expect(isNightPhase("Night Phase")).toBe(true);
    expect(isNightPhase("Night · Round 2")).toBe(true);
    expect(isNightPhase("NIGHT")).toBe(true);
    expect(isNightPhase("The village falls asleep — Night")).toBe(true);
  });

  it("returns false for Day labels", () => {
    expect(isNightPhase("Day Discussion")).toBe(false);
    expect(isNightPhase("Vote Phase")).toBe(false);
    expect(isNightPhase("Dawn")).toBe(false);
  });

  it("returns false for 'active' (old bug scenario)", () => {
    expect(isNightPhase("active")).toBe(false);
  });

  it("returns false for empty/undefined", () => {
    expect(isNightPhase("")).toBe(false);
    expect(isNightPhase(undefined)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GamePhaseState roundNumber
// ═══════════════════════════════════════════════════════════════════════════════

describe("GamePhaseState", () => {
  it("defaults roundNumber to 0", () => {
    expect(DEFAULT_GAME_PHASE.roundNumber).toBe(0);
  });

  it("has all expected fields", () => {
    expect(DEFAULT_GAME_PHASE).toHaveProperty("phase");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("phaseLabel");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("mood");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("activeVote");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("timerEndsAt");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("gameOverSummary");
    expect(DEFAULT_GAME_PHASE).toHaveProperty("roundNumber");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Host prompt builder — roundNumber injection
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildHostSystemPrompt — roundNumber", () => {
  const baseOpts = {
    gameName: "Test Werewolf",
    gameTemplate: "werewolf",
    humanName: "Alice",
    nonHostPlayerNames: ["Alice", "Bob", "Carol"],
    hasVotingPhase: true,
    hasNightPhase: true,
    hasMultipleRooms: false,
    channels: [],
    gamePhase: "active",
    phaseLabel: "Night 2",
    playerRoster: "Alice (human), Bob (AI), Carol (AI)",
    eventLogSummary: "Round 1: ...",
    boardSummary: "",
    rulesText: "Standard werewolf rules",
  };

  it("includes current round in GAME LENGTH section", () => {
    const prompt = buildHostSystemPrompt({ ...baseOpts, roundNumber: 2 });
    expect(prompt).toContain("Current round: 2");
  });

  it("forces GAME_OVER when at maxRounds", () => {
    const prompt = buildHostSystemPrompt({ ...baseOpts, roundNumber: 4 });
    expect(prompt).toContain("MAXIMUM ROUNDS");
    expect(prompt).toContain("GAME_OVER NOW");
  });

  it("includes GAME LENGTH without roundNumber", () => {
    const prompt = buildHostSystemPrompt({ ...baseOpts });
    expect(prompt).toContain("GAME LENGTH");
    expect(prompt).not.toContain("Current round:");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Template flags: hostAnswersQuestions, hasSecretWord
// ═══════════════════════════════════════════════════════════════════════════════

describe("Template flags — hostAnswersQuestions", () => {
  it("20-questions has hostAnswersQuestions: true", () => {
    expect(twentyQuestions.hostAnswersQuestions).toBe(true);
  });

  it("werewolf has hostAnswersQuestions: false (default)", () => {
    expect(werewolf.hostAnswersQuestions).toBe(false);
  });

  it("trivia has hostAnswersQuestions: false (default)", () => {
    expect(trivia.hostAnswersQuestions).toBe(false);
  });
});

describe("Template flags — hasSecretWord", () => {
  it("undercover has hasSecretWord: true", () => {
    expect(undercover.hasSecretWord).toBe(true);
  });

  it("werewolf has hasSecretWord: false (default)", () => {
    expect(werewolf.hasSecretWord).toBe(false);
  });

  it("mafia has hasSecretWord: false (default)", () => {
    expect(mafia.hasSecretWord).toBe(false);
  });
});

describe("withDefaults — new boolean flags default to false", () => {
  it("hostAnswersQuestions defaults to false", () => {
    const tmpl = withDefaults({
      id: "flag-test", name: "FlagTest", description: "test",
      minPlayers: 2, maxPlayers: 8, defaultRules: "", icon: "🎮",
      color: "from-gray-500 to-gray-600", estimatedTime: "10 min",
      recommendedAICount: 3, hasHiddenRoles: false, hasElimination: false,
      category: "party",
    });
    expect(tmpl.hostAnswersQuestions).toBe(false);
    expect(tmpl.hasSecretWord).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Discover preset playerCount fix (nullish coalescing)
// ═══════════════════════════════════════════════════════════════════════════════

describe("playerCount nullish coalescing behavior", () => {
  it("preserves 0 with ?? but not with ||", () => {
    const presetPlayerCount = 0;
    const withOr = presetPlayerCount || 4;
    const withNullish = presetPlayerCount ?? 4;
    expect(withOr).toBe(4);
    expect(withNullish).toBe(0);
  });

  it("preserves undefined/null fallback with ??", () => {
    const undef: number | undefined = undefined;
    const nul: number | null = null;
    expect(undef ?? 4).toBe(4);
    expect(nul ?? 4).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Template channel compatibility (no conflicts)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Template channel compatibility — all templates", () => {
  it("all templates have valid structure", () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      if (t.channels) {
        expect(Array.isArray(t.channels)).toBe(true);
        for (const ch of t.channels) {
          expect(ch.id).toBeTruthy();
          expect(ch.name).toBeTruthy();
          expect(["public", "private_ai", "decision", "broadcast"]).toContain(ch.roomType);
          if (ch.accessByRole) {
            expect(Array.isArray(ch.accessByRole)).toBe(true);
          }
        }
      }
    }
  });

  it("channel IDs are unique within each template", () => {
    for (const t of GAME_TEMPLATES) {
      if (!t.channels) continue;
      const ids = t.channels.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only werewolf, mafia, and rpg-dungeon define channels", () => {
    const templatesWithChannels = GAME_TEMPLATES.filter(
      t => t.channels && t.channels.length > 0
    ).map(t => t.id);
    expect(templatesWithChannels.sort()).toEqual(["mafia", "rpg-dungeon", "werewolf"]);
  });

  it("all templates with channels have a public channel as first entry", () => {
    for (const t of GAME_TEMPLATES) {
      if (!t.channels || t.channels.length === 0) continue;
      expect(t.channels[0].roomType).toBe("public");
    }
  });
});
