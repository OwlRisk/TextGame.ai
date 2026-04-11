import { describe, it, expect } from "vitest";
import { GAME_TEMPLATES, getGameTemplate } from "../game-templates";
import type { GameTemplate, QuickAction, DialogueChip } from "../templates/types";
import { buildTemplateMechanics, buildProgressionPolicy } from "../game-template-driver";
import { buildHostSystemPrompt, type HostPromptOpts } from "../host-prompt-builder";
import { buildSystemPrompt } from "../player-speak-prompt";
import { buildAiPlayerBriefing } from "../ai-player-briefing";
import { tAction, tTemplate } from "../i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hostOpts(templateId: string): HostPromptOpts {
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
    gameTemplate: templateId,
  };
}

const ALL_TEMPLATE_IDS = GAME_TEMPLATES.map((t) => t.id);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Structural completeness — every template has required fields
// ═══════════════════════════════════════════════════════════════════════════════

describe("structural completeness: every template", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    describe(tmplId, () => {
      let t: GameTemplate;

      it("is loadable via getGameTemplate", () => {
        const loaded = getGameTemplate(tmplId);
        expect(loaded).toBeDefined();
        t = loaded!;
      });

      it("has non-empty description", () => {
        t = getGameTemplate(tmplId)!;
        expect(t.description.trim().length).toBeGreaterThan(10);
      });

      it("has valid category", () => {
        t = getGameTemplate(tmplId)!;
        expect(["deduction", "quiz", "cooperative", "party", "open"]).toContain(t.category);
      });

      it("has non-empty defaultRules", () => {
        t = getGameTemplate(tmplId)!;
        if (tmplId === "custom") return; // custom has no preset rules
        expect(t.defaultRules.trim().length).toBeGreaterThan(20);
      });

      it("has at least one quickAction", () => {
        t = getGameTemplate(tmplId)!;
        expect(t.quickActions.length).toBeGreaterThanOrEqual(1);
      });

      it("has valid hostVoice", () => {
        t = getGameTemplate(tmplId)!;
        expect(t.hostVoice.maxSentences).toBeGreaterThanOrEqual(1);
        expect(["low", "medium", "high"]).toContain(t.hostVoice.drama);
      });

      it("has valid playerLimits", () => {
        t = getGameTemplate(tmplId)!;
        expect(t.playerLimits.tokenLimit).toBeGreaterThan(0);
        expect(t.playerLimits.sentenceMax).toBeGreaterThanOrEqual(t.playerLimits.sentencePreferred);
        expect(t.playerLimits.charLimit).toBeGreaterThan(0);
      });

      it("has valid pacing", () => {
        t = getGameTemplate(tmplId)!;
        expect(t.pacing.progressionThreshold).toBeGreaterThan(0);
        expect(t.pacing.hint.trim().length).toBeGreaterThan(0);
      });

      it("has valid speakerMode", () => {
        t = getGameTemplate(tmplId)!;
        expect(["round-table", "selective"]).toContain(t.speakerMode);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. QuickAction validity — templates, targets, phases, action types
// ═══════════════════════════════════════════════════════════════════════════════

describe("quickAction validity", () => {
  const VALID_PHASES = ["day", "night", "vote", "combat", "exploration", "rest", "social"];
  const VALID_ACTION_TYPES = ["attack", "defend", "support", "investigate", "move", "social", "vote", "use", "meta"];

  for (const tmplId of ALL_TEMPLATE_IDS) {
    describe(tmplId, () => {
      let actions: QuickAction[];

      it("all actions have non-empty label and template", () => {
        actions = getGameTemplate(tmplId)!.quickActions;
        for (const qa of actions) {
          expect(qa.label.trim().length, `empty label in ${tmplId}`).toBeGreaterThan(0);
          expect(qa.template.trim().length, `empty template for "${qa.label}" in ${tmplId}`).toBeGreaterThan(0);
        }
      });

      it("all actions have non-empty icon", () => {
        actions = getGameTemplate(tmplId)!.quickActions;
        for (const qa of actions) {
          expect(qa.icon?.trim().length, `missing icon for "${qa.label}" in ${tmplId}`).toBeGreaterThan(0);
        }
      });

      it("needsTarget actions contain {player} in template", () => {
        actions = getGameTemplate(tmplId)!.quickActions;
        for (const qa of actions) {
          if (qa.needsTarget) {
            expect(
              qa.template.includes("{player}"),
              `"${qa.label}" in ${tmplId} needs target but template has no {player}`,
            ).toBe(true);
          }
        }
      });

      it("phase values are valid (if specified)", () => {
        actions = getGameTemplate(tmplId)!.quickActions;
        for (const qa of actions) {
          if (qa.phase) {
            expect(VALID_PHASES, `"${qa.label}" in ${tmplId} has invalid phase "${qa.phase}"`).toContain(qa.phase);
          }
        }
      });

      it("actionType values are valid (if specified)", () => {
        actions = getGameTemplate(tmplId)!.quickActions;
        for (const qa of actions) {
          if (qa.actionType) {
            expect(
              VALID_ACTION_TYPES,
              `"${qa.label}" in ${tmplId} has invalid actionType "${qa.actionType}"`,
            ).toContain(qa.actionType);
          }
        }
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DialogueChip validity — label, starter, icon
// ═══════════════════════════════════════════════════════════════════════════════

describe("dialogueChip validity", () => {
  const templatesWithChips = ALL_TEMPLATE_IDS.filter((id) => {
    const t = getGameTemplate(id)!;
    return t.dialogueChips && t.dialogueChips.length > 0;
  });

  for (const tmplId of templatesWithChips) {
    describe(tmplId, () => {
      let chips: DialogueChip[];

      it("all chips have non-empty label and starter", () => {
        chips = getGameTemplate(tmplId)!.dialogueChips!;
        for (const c of chips) {
          expect(c.label.trim().length, `empty label in ${tmplId}`).toBeGreaterThan(0);
          expect(c.starter.trim().length, `empty starter for "${c.label}" in ${tmplId}`).toBeGreaterThan(0);
        }
      });

      it("starters do not have tag prefixes", () => {
        chips = getGameTemplate(tmplId)!.dialogueChips!;
        for (const c of chips) {
          expect(c.starter.startsWith("[SAY]")).toBe(false);
          expect(c.starter.startsWith("[ACTION]")).toBe(false);
        }
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. i18n coverage — all quickAction labels and templates translatable
// ═══════════════════════════════════════════════════════════════════════════════

describe("i18n: quickAction labels have Chinese translations", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    const t = getGameTemplate(tmplId)!;
    for (const qa of t.quickActions) {
      it(`${tmplId} → "${qa.label}" translates to Chinese`, () => {
        const zh = tAction(qa.label, "zh");
        expect(zh).not.toBe(qa.label);
        expect(zh.length).toBeGreaterThan(0);
      });
    }
  }
});

describe("i18n: quickAction templates have Chinese translations", () => {
  const SKIP_TEMPLATES = new Set(["@{player} ", "{player}, ", "1. \n2. \n3. "]);
  for (const tmplId of ALL_TEMPLATE_IDS) {
    const t = getGameTemplate(tmplId)!;
    for (const qa of t.quickActions) {
      if (SKIP_TEMPLATES.has(qa.template)) continue;
      it(`${tmplId} → "${qa.template.slice(0, 40)}…" translates to Chinese`, () => {
        const zh = tTemplate(qa.template, "zh");
        expect(zh).not.toBe(qa.template);
        expect(zh.length).toBeGreaterThan(0);
      });
    }
  }
});

describe("i18n: dialogueChip labels and starters translate", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    const t = getGameTemplate(tmplId)!;
    for (const c of t.dialogueChips ?? []) {
      it(`${tmplId} → chip "${c.label}" label translates`, () => {
        const zh = tAction(c.label, "zh");
        expect(zh).not.toBe(c.label);
      });
      it(`${tmplId} → chip "${c.label}" starter translates`, () => {
        const zh = tTemplate(c.starter, "zh");
        expect(zh).not.toBe(c.starter);
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Mechanics & progression — every template produces output
// ═══════════════════════════════════════════════════════════════════════════════

describe("mechanics and progression per template", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    if (tmplId === "custom") continue;
    describe(tmplId, () => {
      it("buildTemplateMechanics returns non-trivial string", () => {
        const m = buildTemplateMechanics(tmplId);
        expect(m.length).toBeGreaterThan(50);
      });

      it("buildProgressionPolicy returns non-trivial string", () => {
        const p = buildProgressionPolicy(tmplId);
        expect(p.length).toBeGreaterThan(50);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Host prompt — each template generates valid host system prompt
// ═══════════════════════════════════════════════════════════════════════════════

describe("host prompt generation per template", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    it(`${tmplId}: buildHostSystemPrompt returns non-empty output`, () => {
      const output = buildHostSystemPrompt(hostOpts(tmplId));
      expect(output.length).toBeGreaterThan(200);
    });

    it(`${tmplId}: host prompt contains NEXT_SPEAKER instruction`, () => {
      const output = buildHostSystemPrompt(hostOpts(tmplId));
      expect(output).toContain("NEXT_SPEAKER");
    });

    it(`${tmplId}: host prompt does not leak deprecated tags`, () => {
      const output = buildHostSystemPrompt(hostOpts(tmplId));
      expect(output).not.toContain("<REPLY_TYPE>");
      expect(output).not.toContain("<IMAGE_PROMPT>");
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Player prompt — each template generates valid AI player prompt
// ═══════════════════════════════════════════════════════════════════════════════

describe("player speak prompt per template", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    it(`${tmplId}: buildSystemPrompt returns non-empty output`, () => {
      const prompt = buildSystemPrompt("TestPlayer", tmplId, "Test Game");
      expect(prompt.length).toBeGreaterThan(100);
    });

    it(`${tmplId}: prompt contains player name`, () => {
      const prompt = buildSystemPrompt("TestPlayer", tmplId, "Test Game");
      expect(prompt).toContain("TestPlayer");
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. AI briefing — each template generates briefing
// ═══════════════════════════════════════════════════════════════════════════════

describe("AI player briefing per template", () => {
  for (const tmplId of ALL_TEMPLATE_IDS) {
    it(`${tmplId}: buildAiPlayerBriefing returns string`, () => {
      const briefing = buildAiPlayerBriefing({ gameTemplate: tmplId });
      expect(typeof briefing).toBe("string");
      expect(briefing.length).toBeGreaterThan(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Role-specific prompts — templates with byRole have prompts for each role
// ═══════════════════════════════════════════════════════════════════════════════

describe("role-specific player prompts", () => {
  const DEDUCTION_TEMPLATES: Record<string, string[]> = {
    werewolf: ["werewolf", "seer", "doctor", "villager", "hunter", "witch"],
    mafia: ["mafia", "detective", "doctor", "town member"],
    avalon: ["merlin", "assassin", "mordred"],
    spyfall: ["spy"],
    undercover: ["undercover", "mr. white"],
    "detective-mystery": ["detective", "suspect", "witness", "culprit"],
    "script-kill": ["detective"],
  };

  for (const [tmplId, roles] of Object.entries(DEDUCTION_TEMPLATES)) {
    describe(tmplId, () => {
      const t = getGameTemplate(tmplId)!;

      for (const role of roles) {
        it(`has byRole prompt for "${role}"`, () => {
          expect(
            t.playerPrompts.byRole?.[role],
            `${tmplId} missing byRole["${role}"]`,
          ).toBeDefined();
          expect(t.playerPrompts.byRole![role].trim().length).toBeGreaterThan(20);
        });
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Deduction game specifics — hidden roles, voting, channels
// ═══════════════════════════════════════════════════════════════════════════════

describe("deduction template specifics", () => {
  it("werewolf has hidden roles and night phase", () => {
    const t = getGameTemplate("werewolf")!;
    expect(t.hasHiddenRoles).toBe(true);
    expect(t.hasNightPhase).toBe(true);
    expect(t.hasElimination).toBe(true);
  });

  it("werewolf has werewolf-den channel with role restriction", () => {
    const t = getGameTemplate("werewolf")!;
    const wolfChannel = t.channels?.find((c) => c.id === "werewolf-den");
    expect(wolfChannel).toBeDefined();
    expect(wolfChannel!.accessByRole).toContain("werewolf");
    expect(wolfChannel!.roomType).toBe("decision");
  });

  it("mafia has hidden roles", () => {
    const t = getGameTemplate("mafia")!;
    expect(t.hasHiddenRoles).toBe(true);
    expect(t.hasNightPhase).toBe(true);
  });

  it("avalon has hidden roles but no elimination", () => {
    const t = getGameTemplate("avalon")!;
    expect(t.hasHiddenRoles).toBe(true);
    expect(t.hasElimination).toBe(false);
  });

  it("codenames does NOT have hidden roles", () => {
    const t = getGameTemplate("codenames")!;
    expect(t.hasHiddenRoles).toBe(false);
  });

  it("undercover has hidden roles and elimination", () => {
    const t = getGameTemplate("undercover")!;
    expect(t.hasHiddenRoles).toBe(true);
    expect(t.hasElimination).toBe(true);
    expect(t.hasSecretWord).toBe(true);
  });

  it("script-kill has hidden roles", () => {
    const t = getGameTemplate("script-kill")!;
    expect(t.hasHiddenRoles).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Phase-specific actions — day actions exist for social deduction
// ═══════════════════════════════════════════════════════════════════════════════

describe("phase-specific quickActions", () => {
  const SOCIAL_DEDUCTION = ["werewolf", "mafia"];

  for (const tmplId of SOCIAL_DEDUCTION) {
    describe(tmplId, () => {
      it("has day-phase actions (Accuse, Defend, etc.)", () => {
        const t = getGameTemplate(tmplId)!;
        const dayActions = t.quickActions.filter((qa) => qa.phase === "day");
        expect(dayActions.length).toBeGreaterThanOrEqual(3);
        const labels = dayActions.map((qa) => qa.label);
        expect(labels).toContain("Accuse");
        expect(labels).toContain("Defend");
      });

      it("has vote-phase action", () => {
        const t = getGameTemplate(tmplId)!;
        const voteActions = t.quickActions.filter((qa) => qa.phase === "vote");
        expect(voteActions.length).toBeGreaterThanOrEqual(1);
      });

      it("has night-phase role-specific actions", () => {
        const t = getGameTemplate(tmplId)!;
        const nightActions = t.quickActions.filter((qa) => qa.phase === "night");
        expect(nightActions.length).toBeGreaterThanOrEqual(1);
        for (const na of nightActions) {
          expect(na.role, `night action "${na.label}" should have a role`).toBeDefined();
        }
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. RPG Dungeon — channels and combat actions
// ═══════════════════════════════════════════════════════════════════════════════

describe("rpg-dungeon template", () => {
  it("has dungeon channels", () => {
    const t = getGameTemplate("rpg-dungeon")!;
    expect(t.channels).toBeDefined();
    expect(t.channels!.length).toBeGreaterThanOrEqual(1);
  });

  it("has combat-phase actions (Attack, Cast Spell, etc.)", () => {
    const t = getGameTemplate("rpg-dungeon")!;
    const combatActions = t.quickActions.filter((qa) => qa.phase === "combat");
    expect(combatActions.length).toBeGreaterThanOrEqual(3);
  });

  it("has exploration-phase actions", () => {
    const t = getGameTemplate("rpg-dungeon")!;
    const explorationActions = t.quickActions.filter((qa) => qa.phase === "exploration");
    expect(explorationActions.length).toBeGreaterThanOrEqual(2);
  });

  it("has byRole prompts for core RPG roles", () => {
    const t = getGameTemplate("rpg-dungeon")!;
    expect(t.playerPrompts.byRole?.warrior).toBeDefined();
    expect(t.playerPrompts.byRole?.mage).toBeDefined();
    expect(t.playerPrompts.byRole?.rogue).toBeDefined();
    expect(t.playerPrompts.byRole?.healer).toBeDefined();
  });

  it("has dialogueChips", () => {
    const t = getGameTemplate("rpg-dungeon")!;
    expect(t.dialogueChips).toBeDefined();
    expect(t.dialogueChips!.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Quiz games — questions & host behavior
// ═══════════════════════════════════════════════════════════════════════════════

describe("quiz template specifics", () => {
  it("trivia has quiz category", () => {
    const t = getGameTemplate("trivia")!;
    expect(t.category).toBe("quiz");
    expect(t.playerLimits.mustContribute).toBe(true);
  });

  it("20-questions has hostAnswersQuestions flag", () => {
    const t = getGameTemplate("20-questions")!;
    expect(t.hostAnswersQuestions).toBe(true);
  });

  it("20-questions is quiz category", () => {
    const t = getGameTemplate("20-questions")!;
    expect(t.category).toBe("quiz");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Cooperative games — no elimination, selective speaker
// ═══════════════════════════════════════════════════════════════════════════════

describe("cooperative template specifics", () => {
  const COOPERATIVE = ["escape-room"];

  for (const tmplId of COOPERATIVE) {
    it(`${tmplId} has cooperative category`, () => {
      const t = getGameTemplate(tmplId)!;
      expect(t.category).toBe("cooperative");
    });

    it(`${tmplId} uses selective speaker mode`, () => {
      const t = getGameTemplate(tmplId)!;
      expect(t.speakerMode).toBe("selective");
    });

    it(`${tmplId} has no elimination`, () => {
      const t = getGameTemplate(tmplId)!;
      expect(t.hasElimination).toBe(false);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15. Party games — lightweight, fast-paced
// ═══════════════════════════════════════════════════════════════════════════════

describe("party template specifics", () => {
  const PARTY = ["debate", "two-truths-lie"];

  for (const tmplId of PARTY) {
    it(`${tmplId} has party category`, () => {
      const t = getGameTemplate(tmplId)!;
      expect(t.category).toBe("party");
    });

    it(`${tmplId} uses round-table speaker mode`, () => {
      const t = getGameTemplate(tmplId)!;
      expect(t.speakerMode).toBe("round-table");
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16. Custom template — minimal but valid
// ═══════════════════════════════════════════════════════════════════════════════

describe("custom template", () => {
  it("has open category", () => {
    const t = getGameTemplate("custom")!;
    expect(t.category).toBe("open");
  });

  it("has empty roles array (user defines)", () => {
    const t = getGameTemplate("custom")!;
    expect(t.roles).toEqual([]);
  });

  it("has no hidden roles or elimination", () => {
    const t = getGameTemplate("custom")!;
    expect(t.hasHiddenRoles).toBe(false);
    expect(t.hasElimination).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17. Cross-template consistency checks
// ═══════════════════════════════════════════════════════════════════════════════

describe("cross-template consistency", () => {
  it("all template IDs are unique", () => {
    const ids = ALL_TEMPLATE_IDS;
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no template has overlapping quickAction labels", () => {
    for (const tmplId of ALL_TEMPLATE_IDS) {
      const t = getGameTemplate(tmplId)!;
      const labels = t.quickActions.map((qa) => `${qa.label}-${qa.phase ?? "all"}-${qa.role ?? "all"}`);
      const unique = new Set(labels);
      expect(unique.size, `${tmplId} has duplicate quickAction labels`).toBe(labels.length);
    }
  });

  it("social deduction games (werewolf, mafia, undercover, avalon, spyfall) use round-table", () => {
    for (const tmplId of ["werewolf", "mafia", "undercover", "avalon", "spyfall"]) {
      const t = getGameTemplate(tmplId)!;
      expect(t.speakerMode, `${tmplId} should be round-table`).toBe("round-table");
    }
  });

  it("templates with hasNightPhase have night-phase quickActions or mechanicsPrompt mentioning night", () => {
    for (const tmplId of ALL_TEMPLATE_IDS) {
      const t = getGameTemplate(tmplId)!;
      if (t.hasNightPhase) {
        const hasNightAction = t.quickActions.some((qa) => qa.phase === "night");
        const mechanicsMentionNight = t.mechanicsPrompt.toLowerCase().includes("night");
        expect(
          hasNightAction || mechanicsMentionNight,
          `${tmplId} has hasNightPhase but no night actions or mechanics`,
        ).toBe(true);
      }
    }
  });

  it("templates with hasElimination mention elimination/death in rules or mechanics", () => {
    for (const tmplId of ALL_TEMPLATE_IDS) {
      const t = getGameTemplate(tmplId)!;
      if (t.hasElimination) {
        const combined = `${t.defaultRules} ${t.mechanicsPrompt}`.toLowerCase();
        expect(
          /eliminat|death|dead|kill|out|remove|fallen/i.test(combined),
          `${tmplId} has hasElimination but no elimination references in rules/mechanics`,
        ).toBe(true);
      }
    }
  });
});
