import { describe, it, expect } from "vitest";
import {
  buildHostSystemPrompt,
  buildSceneDirectorPrompt,
  type HostPromptOpts,
  type SceneDirectorOpts,
} from "../host-prompt-builder";

// ─── Helper ─────────────────────────────────────────────────────────────────

function defaultOpts(overrides: Partial<HostPromptOpts> = {}): HostPromptOpts {
  return {
    gameName: "Test Game",
    humanName: "Alex",
    nonHostPlayerNames: ["Juno", "Edda", "Maribel"],
    hasVotingPhase: false,
    hasNightPhase: false,
    hasMultipleRooms: false,
    channels: [],
    gamePhase: "day",
    phaseLabel: "",
    playerRoster: "Juno [AI]\nEdda [AI]\nMaribel [AI]\nAlex [YOU/HUMAN]",
    eventLogSummary: "Day 1 began.",
    boardSummary: "No private content yet.",
    rulesText: "Vote to eliminate one player each day.",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// buildHostSystemPrompt
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildHostSystemPrompt", () => {
  describe("basic content", () => {
    it("contains the game name in the output", () => {
      const opts = defaultOpts({ gameName: "Werewolf Night" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain('for "Werewolf Night"');
    });

    it("contains the human player name in NEXT_SPEAKER examples", () => {
      const opts = defaultOpts({ humanName: "Mira Thorne" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("NEXT_SPEAKER: Mira Thorne");
    });

    it("lists all non-host player names", () => {
      const opts = defaultOpts({
        nonHostPlayerNames: ["Alice", "Bob", "Charlie"],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Alice, Bob, Charlie");
    });

    it("includes the game phase and phase label", () => {
      const opts = defaultOpts({
        gamePhase: "night",
        phaseLabel: "Round 2",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Phase: night");
      expect(output).toContain("(Round 2)");
    });

    it("includes the player roster", () => {
      const opts = defaultOpts({
        playerRoster: "Player1 [AI]\nPlayer2 [AI]\nHuman [YOU/HUMAN]",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Player1 [AI]");
      expect(output).toContain("Player2 [AI]");
      expect(output).toContain("Human [YOU/HUMAN]");
    });

    it("includes event log summary", () => {
      const opts = defaultOpts({
        eventLogSummary: "Marcus was eliminated. Role: Villager.",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Event Log:");
      expect(output).toContain("Marcus was eliminated. Role: Villager.");
    });

    it("includes board summary", () => {
      const opts = defaultOpts({
        boardSummary: "You are the Seer. Investigate one player tonight.",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Private Board (already sent — do not repeat publicly):");
      expect(output).toContain("You are the Seer. Investigate one player tonight.");
    });

    it("includes rules text when provided", () => {
      const opts = defaultOpts({
        rulesText: "Villagers vote by day. Werewolves kill by night.",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Villagers vote by day. Werewolves kill by night.");
    });

    it('shows "No specific rules defined." when rulesText is empty', () => {
      const opts = defaultOpts({ rulesText: "" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("No specific rules defined.");
    });

    it("injects deduction progression policy for deduction templates", () => {
      const opts = defaultOpts({ gameTemplate: "werewolf" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("PACING & PROGRESSION");
      expect(output).toContain("Force state changes");
    });

    it("injects quiz progression policy for quiz templates", () => {
      const opts = defaultOpts({ gameTemplate: "trivia" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("PACING & PROGRESSION");
      expect(output).toContain("Adjudicate quickly");
    });
  });

  describe("voting phase", () => {
    it("when hasVotingPhase is true: includes VOTING section", () => {
      const opts = defaultOpts({ hasVotingPhase: true });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("VOTING:");
      expect(output).toContain("List ALL eligible AI players");
    });

    it("when hasVotingPhase is false: does NOT include VOTING section", () => {
      const opts = defaultOpts({ hasVotingPhase: false });
      const output = buildHostSystemPrompt(opts);
      expect(output).not.toContain("VOTING:");
    });
  });

  describe("night phase", () => {
    it("when hasNightPhase is true: includes NIGHT section", () => {
      const opts = defaultOpts({ hasNightPhase: true });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("NIGHT:");
      expect(output).toContain("night-action roles");
    });

    it("when hasNightPhase is false: does NOT include NIGHT section", () => {
      const opts = defaultOpts({ hasNightPhase: false });
      const output = buildHostSystemPrompt(opts);
      expect(output).not.toContain("NIGHT: Announce once");
    });
  });

  describe("multiple rooms", () => {
    it("when hasMultipleRooms is true: includes room section with ACCESS syntax", () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Main" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("[ACCESS:");
      expect(output).toContain("[/ACCESS]");
      expect(output).toContain("**Room access**");
    });

    it("when hasMultipleRooms is true: lists all channels with room types", () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [
          { name: "Town Square", roomType: "public" },
          { name: "Werewolves", roomType: "decision" },
        ],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain('"Town Square"');
      expect(output).toContain('"Werewolves"');
    });

    it('room type "decision" shows decision hint', () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Secret Room", roomType: "decision" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("AI-only private room — use AUTO_CHANNEL here at the start of each private phase with a clear goal");
      expect(output).toContain("summarise the outcome");
    });

    it('room type "private_ai" shows private AI hint', () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Chat Room", roomType: "private_ai" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("AI-only private room — use AUTO_CHANNEL for free side-discussion (no structured outcome)");
    });

    it('room type "broadcast" shows broadcast hint', () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Announcements", roomType: "broadcast" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("read-only for players; host-only announcements");
    });

    it("default room type shows \"public\" hint", () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Lobby" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("public — everyone can see and speak");
    });

    it("when hasMultipleRooms is false: no room section", () => {
      const opts = defaultOpts({ hasMultipleRooms: false });
      const output = buildHostSystemPrompt(opts);
      expect(output).not.toContain("**Room access**");
      expect(output).not.toContain("Available rooms and their types:");
    });

    it("includes AUTO_CHANNEL documentation when multiple rooms", () => {
      const opts = defaultOpts({
        hasMultipleRooms: true,
        channels: [{ name: "Test" }],
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("AUTO_CHANNEL:");
      expect(output).toContain("**Private channel auto-conversation**");
    });
  });

  describe("mandatory sections", () => {
    it("contains mandatory output format section (--- separator)", () => {
      const opts = defaultOpts();
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("## OUTPUT FORMAT — MANDATORY");
      expect(output).toContain('only "---"');
      expect(output).toContain("---");
    });

    it("contains SILENT TURNS section", () => {
      const opts = defaultOpts();
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("**SILENT TURNS");
    });

    it("contains DIRECTIVES section heading", () => {
      const opts = defaultOpts();
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain(
        '## DIRECTIVES (after "---", hidden from players)',
      );
    });

    it("contains NARRATIVE VOICE section", () => {
      const opts = defaultOpts();
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("## NARRATIVE VOICE");
    });

    it("contains example patterns (Example A, B, C)", () => {
      const opts = defaultOpts();
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Example A");
      expect(output).toContain("Example B");
      expect(output).toContain("Example C");
    });
  });

  describe("phase label", () => {
    it("phase label is shown in parentheses when provided", () => {
      const opts = defaultOpts({
        gamePhase: "night",
        phaseLabel: "Round 3",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Phase: night");
      expect(output).toContain("(Round 3)");
    });

    it("phase label section omitted when phaseLabel is empty", () => {
      const opts = defaultOpts({
        gamePhase: "day",
        phaseLabel: "",
      });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Phase: day");
      expect(output).not.toMatch(/Phase: day\s*\(\s*\)/);
      expect(output).not.toContain("Phase: day ()");
    });
  });

  describe("edge cases", () => {
    it("uses 'waiting' when gamePhase is empty", () => {
      const opts = defaultOpts({ gamePhase: "" });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Phase: waiting");
    });

    it("handles single non-host player", () => {
      const opts = defaultOpts({ nonHostPlayerNames: ["Solo"] });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain("Solo");
    });

    it("handles empty non-host player list", () => {
      const opts = defaultOpts({ nonHostPlayerNames: [] });
      const output = buildHostSystemPrompt(opts);
      expect(output).toContain(
        'Players: . Use "Everyone" for open discussion, "Alex" for human\'s turn.',
      );
    });
  });

  // ─── Content Language ───────────────────────────────────────────────────

  describe("contentLanguage", () => {
    it("includes LANGUAGE ADAPTATION for English (default)", () => {
      const output = buildHostSystemPrompt(defaultOpts());
      expect(output).toContain("LANGUAGE ADAPTATION");
    });

    it("does not include explicit LANGUAGE rule for English", () => {
      const output = buildHostSystemPrompt(defaultOpts({ contentLanguage: "en" }));
      expect(output).not.toMatch(/LANGUAGE:.*Respond in English/);
    });

    it("includes Chinese language instruction", () => {
      const output = buildHostSystemPrompt(defaultOpts({ contentLanguage: "zh-CN" }));
      expect(output).toContain("Simplified Chinese");
      expect(output).toContain("LANGUAGE ADAPTATION");
      expect(output).toContain("MUST");
    });

    it("includes Japanese language instruction", () => {
      const output = buildHostSystemPrompt(defaultOpts({ contentLanguage: "ja" }));
      expect(output).toContain("Japanese");
      expect(output).toContain("MUST");
    });

    it("includes Arabic language instruction", () => {
      const output = buildHostSystemPrompt(defaultOpts({ contentLanguage: "ar" }));
      expect(output).toContain("Arabic");
    });

    it("keeps directive keywords in English regardless of language", () => {
      const output = buildHostSystemPrompt(defaultOpts({ contentLanguage: "zh-CN" }));
      expect(output).toContain("NEXT_SPEAKER");
      expect(output).toContain("ASSIGN_ROLE");
      expect(output).toContain("always remain in English");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// buildSceneDirectorPrompt — language support
// ═══════════════════════════════════════════════════════════════════════════════

describe("buildSceneDirectorPrompt — contentLanguage", () => {
  function sceneOpts(overrides: Partial<SceneDirectorOpts> = {}): SceneDirectorOpts {
    return {
      sceneId: "museum-heist",
      humanName: "Brook",
      nonHostPlayerNames: ["Kai", "Noor", "Brook"],
      playerRoster: "Kai [AI]\nNoor [AI]\nBrook [YOU/HUMAN]",
      eventLogSummary: "Adventure just started.",
      ...overrides,
    };
  }

  it("includes LANGUAGE ADAPTATION by default", () => {
    const output = buildSceneDirectorPrompt(sceneOpts());
    expect(output).toContain("LANGUAGE ADAPTATION");
  });

  it("includes Chinese language instruction when set", () => {
    const output = buildSceneDirectorPrompt(sceneOpts({ contentLanguage: "zh-CN" }));
    expect(output).toContain("Simplified Chinese");
    expect(output).toContain("MUST");
  });

  it("does not duplicate language rule for English", () => {
    const output = buildSceneDirectorPrompt(sceneOpts({ contentLanguage: "en" }));
    expect(output).not.toMatch(/LANGUAGE:.*Respond in English/);
  });
});
