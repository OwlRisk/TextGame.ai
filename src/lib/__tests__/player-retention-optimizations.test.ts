import { describe, it, expect } from "vitest";
import {
  buildHostSystemPrompt,
  type HostPromptOpts,
} from "../host-prompt-builder";
import {
  ALL_PRESETS,
  getPresetById,
} from "@/data/discover-templates";
import { FEATURED_GAMES, FAQ_ITEMS } from "@/data/landing-content";
import { GAME_TEMPLATES } from "@/lib/game-templates";

// ─── Helpers ────────────────────────────────────────────────────────────────

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
// Quick Game Mode — host prompt builder
// ═══════════════════════════════════════════════════════════════════════════════

describe("Quick Game mode in host prompt", () => {
  it("includes QUICK GAME MODE section when quickGame is true", () => {
    const output = buildHostSystemPrompt(defaultOpts({ quickGame: true }));
    expect(output).toContain("## QUICK GAME MODE");
    expect(output).toContain("3-4 rounds");
    expect(output).toContain("GAME_OVER");
  });

  it("does NOT include QUICK GAME MODE section when quickGame is false", () => {
    const output = buildHostSystemPrompt(defaultOpts({ quickGame: false }));
    expect(output).not.toContain("## QUICK GAME MODE");
  });

  it("does NOT include QUICK GAME MODE section when quickGame is undefined", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).not.toContain("## QUICK GAME MODE");
  });

  it("quick game mode coexists with progression policy", () => {
    const output = buildHostSystemPrompt(
      defaultOpts({ quickGame: true, gameTemplate: "werewolf" }),
    );
    expect(output).toContain("## QUICK GAME MODE");
    expect(output).toContain("PACING & PROGRESSION");
  });

  it("quick game section is placed between progression and narrative voice", () => {
    const output = buildHostSystemPrompt(defaultOpts({ quickGame: true }));
    const progressionIdx = output.indexOf("PACING & PROGRESSION");
    const quickIdx = output.indexOf("## QUICK GAME MODE");
    const voiceIdx = output.indexOf("## NARRATIVE VOICE");
    expect(progressionIdx).toBeLessThan(quickIdx);
    expect(quickIdx).toBeLessThan(voiceIdx);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Landing featured games → preset IDs resolve correctly
// ═══════════════════════════════════════════════════════════════════════════════

describe("Landing FEATURED_GAMES preset resolution", () => {
  it("every featured game has a presetId", () => {
    for (const game of FEATURED_GAMES) {
      expect(game.presetId, `${game.title} missing presetId`).toBeTruthy();
    }
  });

  it("every featured game presetId resolves via getPresetById", () => {
    for (const game of FEATURED_GAMES) {
      const preset = getPresetById(game.presetId);
      expect(preset, `presetId "${game.presetId}" for "${game.title}" not found in ALL_PRESETS`).not.toBeNull();
    }
  });

  it("resolved presets have valid templateIds that exist in GAME_TEMPLATES", () => {
    const templateIds = new Set(GAME_TEMPLATES.map((t) => t.id));
    for (const game of FEATURED_GAMES) {
      const preset = getPresetById(game.presetId);
      if (!preset) continue;
      const tid = preset.templateId;
      expect(
        (tid != null && templateIds.has(tid)) || tid === "custom",
        `${game.title}: templateId "${tid ?? ""}" not in GAME_TEMPLATES`,
      ).toBe(true);
    }
  });

  it("resolved presets have non-empty rules", () => {
    for (const game of FEATURED_GAMES) {
      const preset = getPresetById(game.presetId);
      if (!preset) continue;
      expect(preset.rules?.length, `${game.title} preset has empty rules`).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ content consistency
// ═══════════════════════════════════════════════════════════════════════════════

describe("FAQ content matches current flow", () => {
  it("'How do I create a game?' answer does NOT mention 'Create' page", () => {
    const faq = FAQ_ITEMS.find((f) => f.question.includes("create a game"));
    expect(faq).toBeDefined();
    expect(faq!.answer).not.toContain("go to Create");
    expect(faq!.answer).not.toContain("chat with the Game Master");
  });

  it("'How do I create a game?' answer mentions templates or Discover", () => {
    const faq = FAQ_ITEMS.find((f) => f.question.includes("create a game"));
    expect(faq).toBeDefined();
    expect(faq!.answer).toMatch(/template|Discover/i);
  });

  it("no FAQ mentions subscriptions or 'subscribe'", () => {
    for (const faq of FAQ_ITEMS) {
      expect(faq.answer).not.toMatch(/\bsubscrib/i);
    }
  });

  it("pricing FAQ mentions pay-as-you-go or credits", () => {
    const faq = FAQ_ITEMS.find((f) => f.question.includes("cost"));
    expect(faq).toBeDefined();
    expect(faq!.answer).toMatch(/credit|pay.*as.*you.*go|usage/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Discover preset IDs — no orphans
// ═══════════════════════════════════════════════════════════════════════════════

describe("ALL_PRESETS templateId validity", () => {
  const templateIds = new Set(GAME_TEMPLATES.map((t) => t.id));

  it("every preset's templateId matches a GAME_TEMPLATES entry or is 'custom'", () => {
    for (const preset of ALL_PRESETS) {
      const tid = preset.templateId ?? "custom";
      expect(
        templateIds.has(tid) || tid === "custom",
        `Preset "${preset.id}" has unknown templateId "${tid}"`,
      ).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Host prompt — identity and greeting (smoke tests)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Host prompt — narrator identity", () => {
  it("defaults to invisible narrator when no hostName given", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("invisible narrator");
  });

  it("uses hostName when provided", () => {
    const output = buildHostSystemPrompt(
      defaultOpts({ hostName: "Luna the Enchantress" }),
    );
    expect(output).toContain("Luna the Enchantress");
  });

  it("includes host personality when provided", () => {
    const output = buildHostSystemPrompt(
      defaultOpts({ hostName: "Luna", hostPersonality: "mysterious and dramatic" }),
    );
    expect(output).toContain("mysterious and dramatic");
  });

  it("contains REMEMBER section with narrator identity", () => {
    const output = buildHostSystemPrompt(defaultOpts());
    expect(output).toContain("## REMEMBER");
    expect(output).toContain("invisible");
  });
});
