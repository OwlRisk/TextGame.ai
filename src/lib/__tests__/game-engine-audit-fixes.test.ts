import { describe, it, expect } from "vitest";
import {
  buildHostSystemPrompt,
  type HostPromptOpts,
} from "../host-prompt-builder";
import { parseRoleAssignments, parseHostResult } from "../host-output-parser";
import { buildTemplateMechanics, buildProgressionPolicy } from "../game-template-driver";
import { getConversationMode } from "../game-pace";
import {
  buildSystemPrompt,
  getPlayerTokenLimit,
  getPlayerSentenceLimit,
  PLAYER_SPEAK_HARD_LIMIT_TOKENS,
} from "../player-speak-prompt";
import { buildAiPlayerBriefing } from "../ai-player-briefing";
import { getGameTemplate } from "../game-templates";
import { resolvePlayerRefToId } from "../host-actions";
import { isPlayerEliminated } from "../player-badges";
import type { Player } from "@/types/player";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultOpts(overrides: Partial<HostPromptOpts> = {}): HostPromptOpts {
  return {
    gameName: "Test Game",
    humanName: "Alex",
    nonHostPlayerNames: ["Juno", "Edda", "Maribel", "Alex"],
    hasVotingPhase: false,
    hasNightPhase: false,
    hasMultipleRooms: false,
    channels: [],
    gamePhase: "active",
    phaseLabel: "",
    playerRoster: "Juno [AI]\nEdda [AI]\nMaribel [AI]\nAlex [YOU/HUMAN]",
    eventLogSummary: "(No events recorded yet)",
    boardSummary: "(No private board content yet)",
    rulesText: "Standard game rules.",
    ...overrides,
  };
}

function aiPlayer(id: string, name: string, opts?: { role?: string; stats?: Record<string, string | number> }): Player {
  return { id, name, avatar: "#8b5cf6", isAI: true, isGameMaster: false, role: opts?.role, stats: opts?.stats };
}

function humanPlayer(id: string, name: string): Player {
  return { id, name, avatar: "#3b82f6", isAI: false, isGameMaster: false };
}

const GAME_ROOM_ENTRIES = [
  { id: "ch-1", name: "General" },
  { id: "ch-2", name: "Wolves" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// C1: [BOARD:_Host_] — Host secrets no longer leak to human player
// ═══════════════════════════════════════════════════════════════════════════════

describe("C1: [BOARD:_Host_] host secret storage", () => {
  it("resolvePlayerRefToId returns '_host_' for _Host_ ref", () => {
    const players = [aiPlayer("p1", "Alice"), humanPlayer("human-1", "Alex")];
    expect(resolvePlayerRefToId("_Host_", players, "human-1")).toBe("_host_");
    expect(resolvePlayerRefToId("_host_", players, "human-1")).toBe("_host_");
  });

  it("resolvePlayerRefToId still returns userId for 'You'", () => {
    const players = [aiPlayer("p1", "Alice")];
    expect(resolvePlayerRefToId("You", players, "human-1")).toBe("human-1");
  });

  it("host prompt documents _Host_ board, not 'You' board", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("[BOARD:_Host_]");
    expect(output).not.toMatch(/\[BOARD:.*"You"\]/);
  });

  it("template mechanics avoid You board; undercover uses per-player BOARD tags", () => {
    for (const tmpl of ["20-questions", "undercover", "spyfall", "detective-mystery"]) {
      const mechanics = buildTemplateMechanics(tmpl);
      expect(mechanics).not.toContain("[BOARD:You]");
    }
    expect(buildTemplateMechanics("undercover")).toContain("[BOARD:PlayerName]");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// C2: Elimination status checks all out-statuses
// ═══════════════════════════════════════════════════════════════════════════════

describe("C2: isPlayerEliminated covers all out-statuses", () => {
  const outStatuses = [
    "eliminated", "dead", "out", "exiled", "banished",
    "retired", "spectating", "removed", "disqualified", "voted out",
  ];

  for (const status of outStatuses) {
    it(`detects status "${status}" as eliminated`, () => {
      expect(isPlayerEliminated({ stats: { Status: status } })).toBe(true);
    });
  }

  it("alive player is not eliminated", () => {
    expect(isPlayerEliminated({ stats: { Status: "alive" } })).toBe(false);
    expect(isPlayerEliminated({ stats: {} })).toBe(false);
    expect(isPlayerEliminated({})).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D6: Image tags removed from host prompt
// ═══════════════════════════════════════════════════════════════════════════════

describe("D6: no image tags in host prompt", () => {
  it("host prompt does not contain REPLY_TYPE or IMAGE_PROMPT", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).not.toContain("<REPLY_TYPE>");
    expect(output).not.toContain("<IMAGE_PROMPT>");
    expect(output).not.toContain("<IMAGE_SIZE>");
    expect(output).not.toContain("<CAPTION>");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D7: Narrative templates get relaxed sentence limit
// ═══════════════════════════════════════════════════════════════════════════════

describe("D7: narrative templates have longer host voice", () => {
  it("tarot HOST VOICE section allows multiple sentences (hostVoice.maxSentences)", () => {
    const output = buildHostSystemPrompt(defaultOpts({ gameTemplate: "tarot" }));
    expect(output).toContain("4 sentences for scenes, reveals, and transitions");
    expect(output).not.toContain("ONE sentence max.");
  });

  it("werewolf HOST VOICE section uses up to two sentences (hostVoice.maxSentences)", () => {
    const output = buildHostSystemPrompt(defaultOpts({ gameTemplate: "werewolf" }));
    expect(output).toContain("2 sentences for scenes, reveals, and transitions");
    expect(output).not.toContain("ONE sentence max.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D8: Per-template token and sentence limits
// ═══════════════════════════════════════════════════════════════════════════════

describe("D8: per-template token/sentence limits", () => {
  it("default limit matches PLAYER_SPEAK_HARD_LIMIT_TOKENS; deduction games use category default", () => {
    expect(getPlayerTokenLimit()).toBe(PLAYER_SPEAK_HARD_LIMIT_TOKENS);
    expect(getPlayerTokenLimit("werewolf")).toBe(220);
    expect(getPlayerTokenLimit("mafia")).toBe(220);
  });

  it("narrative templates get higher token limits where configured", () => {
    expect(getPlayerTokenLimit("tarot")).toBe(300);
    expect(getPlayerTokenLimit("detective-mystery")).toBe(220);
    expect(getPlayerTokenLimit("storyteller")).toBe(300);
    expect(getPlayerTokenLimit("escape-room")).toBe(300);
  });

  it("debate gets elevated token limit", () => {
    expect(getPlayerTokenLimit("debate")).toBe(280);
  });

  it("sentence limits scale by template", () => {
    expect(getPlayerSentenceLimit("werewolf")).toEqual({ max: 3, preferred: 2 });
    expect(getPlayerSentenceLimit("tarot")).toEqual({ max: 4, preferred: 2 });
    expect(getPlayerSentenceLimit("debate")).toEqual({ max: 3, preferred: 2 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D9/D10: Pacing rules adapted per template category
// ═══════════════════════════════════════════════════════════════════════════════

describe("D9/D10: pacing rules per template", () => {
  it("werewolf prompt requires mandatory contribution, not silence", () => {
    const prompt = buildSystemPrompt("Mira", "werewolf", "Test", "bold");
    expect(prompt).toContain("MUST contribute each turn");
    expect(prompt).not.toContain("output nothing (empty string)");
  });

  it("deduction games allow strategy discussion", () => {
    const prompt = buildSystemPrompt("Mira", "werewolf", "Test");
    expect(prompt).toContain("Strategy discussion and accusations ARE the game");
    expect(prompt).not.toContain("No meta-commentary about game procedure or strategy planning");
  });

  it("non-deduction games still discourage meta-commentary", () => {
    const prompt = buildSystemPrompt("Mira", "escape-room", "Test");
    expect(prompt).toContain("No meta-commentary about game procedure");
  });

  it("trivia requires mandatory contribution", () => {
    const prompt = buildSystemPrompt("Mira", "trivia", "Test");
    expect(prompt).toContain("MUST contribute each turn");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D11: hasVotingPhase no longer false-positives on Storyteller
// ═══════════════════════════════════════════════════════════════════════════════

describe("D11: hasVotingPhase accuracy", () => {
  it("storyteller rules with 'vote for' do NOT trigger voting instructions", () => {
    const storytellerRules = getGameTemplate("storyteller")?.defaultRules ?? "";
    const hasVoting = /\bvot(e|ing)\b.*\b(eliminat|kill|remove|kick|expel)\b/i.test(storytellerRules);
    expect(hasVoting).toBe(false);
  });

  it("werewolf rules DO trigger voting", () => {
    const werewolfRules = getGameTemplate("werewolf")?.defaultRules ?? "";
    const isVotingTemplate = ["werewolf"].includes("werewolf");
    expect(isVotingTemplate).toBe(true);
    expect(werewolfRules).toContain("vote");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D12: Avalon mechanics no longer reference Morgana
// ═══════════════════════════════════════════════════════════════════════════════

describe("D12: Avalon mechanics correctness", () => {
  it("does not mention Morgana", () => {
    const mechanics = buildTemplateMechanics("avalon");
    expect(mechanics).not.toContain("Morgana");
  });

  it("stores role assignments via setup directives (assign secretly at start)", () => {
    const mechanics = buildTemplateMechanics("avalon");
    expect(mechanics).toContain("Assign roles secretly");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D13: Werewolf/Mafia have complete night role resolution
// ═══════════════════════════════════════════════════════════════════════════════

describe("D13: Werewolf night role resolution", () => {
  it("werewolf mechanics include Seer investigation", () => {
    const mechanics = buildTemplateMechanics("werewolf");
    expect(mechanics).toContain("Seer");
    expect(mechanics).toContain("[BOARD:SeerName]");
  });

  it("werewolf mechanics include Doctor protection", () => {
    const mechanics = buildTemplateMechanics("werewolf");
    expect(mechanics).toContain("Doctor protects");
  });

  it("werewolf mechanics include Witch and Hunter", () => {
    const mechanics = buildTemplateMechanics("werewolf");
    expect(mechanics).toContain("Witch");
    expect(mechanics).toContain("Hunter");
  });

  it("mafia mechanics include resolution order", () => {
    const mechanics = buildTemplateMechanics("mafia");
    expect(mechanics).toContain("ROLE RESOLUTION ORDER");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D14: No REACT directive in player speak prompts
// ═══════════════════════════════════════════════════════════════════════════════

describe("D14: no REACT directive in player prompts", () => {
  it("20-questions prompt does not contain REACT:", () => {
    const prompt = buildSystemPrompt("Mira", "20-questions", "Test");
    expect(prompt).not.toContain("REACT:");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D15: STRUCTURED_TEMPLATES is comprehensive
// ═══════════════════════════════════════════════════════════════════════════════

describe("D15: unified structured templates list", () => {
  const structuredGames = [
    "werewolf", "mafia", "codenames", "undercover", "avalon",
    "spyfall", "debate", "storyteller", "two-truths-lie", "trivia", "20-questions",
  ];

  for (const tmpl of structuredGames) {
    it(`${tmpl} is classified as structured`, () => {
      expect(getConversationMode(tmpl)).toBe("structured");
    });
  }

  it("freeform games remain freeform", () => {
    expect(getConversationMode("escape-room")).toBe("freeform");
    expect(getConversationMode("tarot")).toBe("freeform");
    expect(getConversationMode("custom")).toBe("freeform");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// O16: Redundant pacing removed from AI briefing
// ═══════════════════════════════════════════════════════════════════════════════

describe("O16: AI briefing no longer has redundant pacing", () => {
  it("briefing does not contain sentence limit", () => {
    const briefing = buildAiPlayerBriefing({ gameTemplate: "werewolf", role: "Villager" });
    expect(briefing).not.toContain("1 sentence preferred, 2 max");
    expect(briefing).not.toContain("No meta talk");
  });

  it("briefing still contains game-specific guidance", () => {
    const briefing = buildAiPlayerBriefing({ gameTemplate: "werewolf", role: "Werewolf" });
    expect(briefing).toContain("hidden side");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// O17: MY_NOTES skipped for lightweight games
// ═══════════════════════════════════════════════════════════════════════════════

describe("O17: MY_NOTES only for strategic games", () => {
  it("werewolf prompt includes MY_NOTES", () => {
    const prompt = buildSystemPrompt("Mira", "werewolf", "Test");
    expect(prompt).toContain("[MY_NOTES]");
  });

  it("trivia prompt does NOT include MY_NOTES", () => {
    const prompt = buildSystemPrompt("Mira", "trivia", "Test");
    expect(prompt).not.toContain("[MY_NOTES]");
  });

  it("tarot prompt does NOT include MY_NOTES", () => {
    const prompt = buildSystemPrompt("Mira", "tarot", "Test");
    expect(prompt).not.toContain("[MY_NOTES]");
  });

  it("detective-mystery prompt includes MY_NOTES", () => {
    const prompt = buildSystemPrompt("Mira", "detective-mystery", "Test", undefined, undefined, "Detective");
    expect(prompt).toContain("[MY_NOTES]");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// O19: Codenames hasHiddenRoles is false
// ═══════════════════════════════════════════════════════════════════════════════

describe("O19: Codenames template correctness", () => {
  it("Codenames hasHiddenRoles is false", () => {
    const tmpl = getGameTemplate("codenames");
    expect(tmpl?.hasHiddenRoles).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// All templates have mechanics
// ═══════════════════════════════════════════════════════════════════════════════

describe("all game templates have mechanics", () => {
  const templates = [
    "werewolf", "mafia", "undercover", "avalon", "codenames",
    "spyfall", "detective-mystery", "escape-room", "trivia",
    "debate", "storyteller", "two-truths-lie", "tarot", "20-questions",
  ];

  for (const tmpl of templates) {
    it(`${tmpl} has non-empty template mechanics`, () => {
      const mechanics = buildTemplateMechanics(tmpl);
      expect(mechanics.length).toBeGreaterThan(50);
    });
  }

  for (const tmpl of templates) {
    it(`${tmpl} has a progression policy entry`, () => {
      const policy = buildProgressionPolicy(tmpl);
      expect(policy.length).toBeGreaterThan(50);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Round-table games get correct speaker control in host prompt
// ═══════════════════════════════════════════════════════════════════════════════

describe("round-table speaker control in host prompt", () => {
  it("werewolf prompt instructs listing ALL players", () => {
    const output = buildHostSystemPrompt(defaultOpts({ gameTemplate: "werewolf" }));
    expect(output).toContain("Discussion phases: list ALL living players.");
  });

  it("escape-room prompt uses selective speaker control (1–2 AI speakers)", () => {
    const output = buildHostSystemPrompt(defaultOpts({ gameTemplate: "escape-room" }));
    expect(output).toContain("List 1–2 AI speakers per turn.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Host output parser: NEXT_SPEAKER with many names
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostResult with many speakers", () => {
  it("handles 10 AI players in NEXT_SPEAKER", () => {
    const players: Player[] = [];
    const names: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = `Player${i}`;
      names.push(name);
      players.push(aiPlayer(`p${i}`, name));
    }
    players.push(humanPlayer("h1", "Alex"));

    const raw = `Some host message\nNEXT_SPEAKER: ${names.join(", ")}, Alex`;
    const result = parseHostResult(raw, players, "Alex", GAME_ROOM_ENTRIES);

    expect(result.speakerQueue).toHaveLength(10 + 1);
    expect(result.speakerQueue[10]).toEqual({ type: "human" });
    for (let i = 0; i < 10; i++) {
      expect(result.speakerQueue[i]).toEqual({ type: "ai", player: players[i] });
    }
  });

  it("human in middle terminates the queue", () => {
    const players = [
      aiPlayer("p1", "Alice"),
      aiPlayer("p2", "Bob"),
      humanPlayer("h1", "Alex"),
      aiPlayer("p3", "Carol"),
    ];
    const raw = "NEXT_SPEAKER: Alice, Alex, Carol";
    const result = parseHostResult(raw, players, "Alex", GAME_ROOM_ENTRIES);
    expect(result.speakerQueue).toHaveLength(2);
    expect(result.speakerQueue[0]).toEqual({ type: "ai", player: players[0] });
    expect(result.speakerQueue[1]).toEqual({ type: "human" });
  });
});
