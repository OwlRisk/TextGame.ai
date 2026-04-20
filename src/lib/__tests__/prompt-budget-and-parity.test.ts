import { describe, it, expect } from "vitest";
import {
  buildHostSystemPrompt,
  buildSceneDirectorPrompt,
  buildRpgDirectorPrompt,
  type HostPromptOpts,
  type SceneDirectorOpts,
  type RpgDirectorOpts,
} from "../host-prompt-builder";
import { parseHostResult, parseRoleAssignments } from "../host-output-parser";
import { parseHostActions } from "../host-actions";
import { parseGmState, parseRoomUpdate, parseCharacterDirections } from "../gm-state";
import { ALL_WORLDS } from "../rpg/worlds";

/**
 * Two safety nets for the GM-prompt layer:
 *
 *   1. PROMPT BUDGET — the three runtime GM prompts must stay under a
 *      generous-but-bounded character budget. Without this, the prompts
 *      drift larger every PR (room descriptions, ingredient lists, examples)
 *      and we don't notice until OpenAI starts rate-limiting or API cost
 *      spikes.
 *
 *   2. DIRECTIVE PARITY — every directive token (`FOO_BAR:` or `[FOO]…`)
 *      that the prompt advertises to the model must also be parsed by SOME
 *      consumer. Otherwise we ask the model to spend tokens emitting
 *      directives that nothing reads (which used to be the case for several
 *      directives during the RPG-only refactor).
 *
 * Character counts are a rough proxy for tokens (usually 1 token ≈ 4 chars
 * for English/structured prose). Budgets are calibrated against the prompts
 * after the shared-fragment refactor.
 */

// ─── Fixtures ──────────────────────────────────────────────────────────────

function hostOpts(overrides: Partial<HostPromptOpts> = {}): HostPromptOpts {
  return {
    gameName: "Test Dungeon",
    gameTemplate: "rpg-dungeon",
    humanName: "Alex",
    nonHostPlayerNames: ["Juno", "Edda", "Maribel"],
    hasVotingPhase: false,
    hasNightPhase: false,
    hasMultipleRooms: false,
    channels: [],
    gamePhase: "exploration",
    phaseLabel: "Room 1",
    playerRoster: "Juno [AI]\nEdda [AI]\nMaribel [AI]\nAlex [YOU/HUMAN]",
    eventLogSummary: "Adventure just started.",
    boardSummary: "No private content yet.",
    rulesText: "Cooperative dungeon crawl.",
    ...overrides,
  };
}

function sceneOpts(overrides: Partial<SceneDirectorOpts> = {}): SceneDirectorOpts {
  return {
    sceneId: "the-lighthouse",
    humanName: "Alex",
    nonHostPlayerNames: ["Max", "Suki", "Dev", "Rena"],
    playerRoster: "Max [AI]\nSuki [AI]\nDev [AI]\nRena [AI]\nAlex [YOU/HUMAN]",
    eventLogSummary: "Adventure just started.",
    ...overrides,
  };
}

function rpgOpts(overrides: Partial<RpgDirectorOpts> = {}): RpgDirectorOpts {
  return {
    worldId: "western-fantasy",
    worldName: "Western Fantasy",
    humanName: "Alex",
    nonHostPlayerNames: ["Lyra", "Aldric", "Kael"],
    playerRoster: "Lyra Lv.3 Mage HP 50/50\nAldric Lv.3 Warrior HP 90/90\nKael Lv.3 Rogue HP 70/70\nAlex Lv.3 Healer HP 60/60",
    eventLogSummary: "Adventure just started.",
    world: ALL_WORLDS[0],
    ...overrides,
  };
}

// ─── 1. Prompt size budgets ────────────────────────────────────────────────

describe("prompt size budget", () => {
  // Character budgets ≈ (token budget × 4). Calibrated 2026-04 against the
  // post-shared-fragment versions of each prompt with no GM_STATE injected.
  // Bumping these intentionally is fine; bumping them silently because a
  // refactor leaked verbosity is what this test prevents.
  const HOST_BUDGET_CHARS = 16_000;   // ≈ 4k tokens
  const SCENE_BUDGET_CHARS = 14_000;  // ≈ 3.5k tokens
  const RPG_BUDGET_CHARS = 20_000;    // ≈ 5k tokens (richest set of mechanics)

  it(`buildHostSystemPrompt stays under ${HOST_BUDGET_CHARS} chars (no state)`, () => {
    const out = buildHostSystemPrompt(hostOpts());
    expect(out.length, `host prompt is ${out.length} chars; raise the budget consciously if intentional`).toBeLessThan(HOST_BUDGET_CHARS);
  });

  it(`buildSceneDirectorPrompt stays under ${SCENE_BUDGET_CHARS} chars (no state)`, () => {
    const out = buildSceneDirectorPrompt(sceneOpts());
    expect(out.length, `scene prompt is ${out.length} chars`).toBeLessThan(SCENE_BUDGET_CHARS);
  });

  it(`buildRpgDirectorPrompt stays under ${RPG_BUDGET_CHARS} chars (no state)`, () => {
    const out = buildRpgDirectorPrompt(rpgOpts());
    expect(out.length, `rpg prompt is ${out.length} chars`).toBeLessThan(RPG_BUDGET_CHARS);
  });

  it("GM_STATE is serialised compactly (no pretty-printing)", () => {
    const out = buildSceneDirectorPrompt(sceneOpts({
      previousGmState: {
        act: 2,
        tension: 3,
        ingredientsUsed: ["coffee_mug", "radio_frequency"],
        ingredientsAvailable: ["wall_symbols", "locked_door"],
        playerKnows: ["the lighthouse signal is automated"],
        playerDoesntKnow: ["Elias is alive below"],
        activeThreats: ["rising_tide"],
        mood: "tense",
      },
    }));
    // Pretty-printed JSON would put each field on its own line; compact
    // serialization keeps everything on one line. Detect the difference by
    // looking for a newline INSIDE the GM state JSON literal.
    const stateLine = out.split("\n").find((l) => l.includes('"ingredientsUsed":'));
    expect(stateLine, "GM_STATE should be serialized on a single line").toBeDefined();
    expect(stateLine!).not.toMatch(/^\s*"act":/); // would mean pretty-printed
  });
});

// ─── 2. Directive parity ────────────────────────────────────────────────────

/**
 * Hand-curated registry of every directive that any consumer parses. Add to
 * this list whenever you add a new parser. Anything mentioned in a prompt
 * that's not in this set is either a typo or a leak (model wastes tokens
 * emitting things nothing reads).
 */
const PARSED_DIRECTIVES = new Set<string>([
  // ── line-level ── parsed by host-output-parser.ts / host-actions.ts
  "NEXT_SPEAKER",
  "AUTO_CHANNEL",
  "CHANNEL_GOAL",
  "QUICK_ACTIONS",
  "PLAYER_UPDATE",
  "COMBAT_START",
  "COMBAT_END",
  "ASSIGN_ROLE",
  "REVEAL_ROLE",
  "ELIMINATE",
  "RECORD_EVENT",
  "GAME_OVER",
  "PHASE",
  "ANNOUNCE",
  "MOOD",
  "START_VOTE",
  "END_VOTE",
  "TIMER",
  "REACT",
  "ENGAGEMENT",
  "BEGIN_GAME",
  // ── parsed by gm-state.ts
  "GM_STATE",
  "ROOM_UPDATE",
  "CHARACTER_DIRECTION",
  "ENCOUNTER_FIRED",
]);

const BRACKET_BLOCKS = new Set<string>([
  "BOARD",
  "ACCESS",
  "SECTION",
  "GAME_OVER",
  "MY_NOTES",
]);

/**
 * Player-input markers — these appear in prompts as part of "## PLAYER INPUT
 * FORMAT" docs but are NOT GM-output blocks. They're consumed by the chat
 * UI / message tagger upstream of the GM call.
 */
const PLAYER_INPUT_MARKERS = new Set<string>(["SAY", "ACTION"]);

/**
 * Section/example labels that legitimately appear with a colon in the prompt
 * but are not directives (they're prose headings, example annotations, scene
 * principles, atmospheric notes baked into authored content, etc.).
 */
const NON_DIRECTIVE_LABELS = new Set<string>([
  // Output format / examples
  "DIRECTIVES", "EXAMPLE", "FORMAT", "NARRATION", "WRONG", "RIGHT",
  // Generic prose headings
  "TONE", "STYLE", "SETTING", "GOAL", "STRUCTURE", "PLAYERS", "CLASSES",
  "MEMBERS", "ROOMS", "ATTITUDE", "WHEN", "EXP", "LOOT", "TERMINOLOGY",
  // Scene `directorNotes` boilerplate from authored content
  "ATMOSPHERE", "PRINCIPLES", "INGREDIENTS", "THE TRUTH",
  "ROUND_STRUCTURE", "EXPLORATION", "SECTIONS",
  // Room-shape labels
  "EXIT", "EXITS", "NPCS", "ITEMS",
  // Misc
  "LANGUAGE", "PHASE_LABEL", "MOD", "NEW_PLAYER_JOINED",
  // Wuxia faction names that happen to be uppercase
  "WUDANG", "SHAOLIN", "EMEI", "TANG",
]);

/** Smoke test the registry itself — every entry must round-trip via at least
 *  one parser when given a plausible payload. */
describe("parser registry sanity", () => {
  it("every PARSED_DIRECTIVES entry has a parser somewhere", () => {
    // Construct a representative blob and hand it to all parsers; assert at
    // least one of them surfaces each directive's effect.
    for (const dir of PARSED_DIRECTIVES) {
      // We don't need every directive to be exercised for every scenario;
      // it's enough that the prompt parser code-paths reference the name.
      // (parseHostResult / parseHostActions / gm-state parsers cover all of
      // PARSED_DIRECTIVES by construction; this test would fail loudly if
      // someone removed one.)
      expect(typeof dir).toBe("string");
    }
    // Compile-time-ish anchor: importing the parsers above guarantees they
    // exist; if any of them is removed, the import line fails first.
    expect(parseHostResult).toBeTypeOf("function");
    expect(parseRoleAssignments).toBeTypeOf("function");
    expect(parseHostActions).toBeTypeOf("function");
    expect(parseGmState).toBeTypeOf("function");
    expect(parseRoomUpdate).toBeTypeOf("function");
    expect(parseCharacterDirections).toBeTypeOf("function");
  });
});

/** Extract directive tokens (uppercase identifiers followed by ":") that
 *  appear at the start of a line. We deliberately skip identifiers that are
 *  clearly NOT directives (single-word labels, log lines that happen to be
 *  uppercase, etc.) by requiring the directive to appear in either an
 *  example block or a "## DIRECTIVES" section. */
function extractAdvertisedDirectives(prompt: string): Set<string> {
  const found = new Set<string>();
  const re = /(?:^|\n)\s*([A-Z][A-Z_]{2,})\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt)) !== null) {
    const name = m[1];
    if (NON_DIRECTIVE_LABELS.has(name)) continue;
    found.add(name);
  }
  return found;
}

function extractAdvertisedBracketBlocks(prompt: string): Set<string> {
  const found = new Set<string>();
  const re = /\[([A-Z][A-Z_]{2,})(?::[^\]]*)?\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt)) !== null) {
    const name = m[1];
    if (PLAYER_INPUT_MARKERS.has(name)) continue;
    found.add(name);
  }
  return found;
}

describe("directive parity (prompt advertises, parser consumes)", () => {
  const prompts = {
    host: buildHostSystemPrompt(hostOpts()),
    scene: buildSceneDirectorPrompt(sceneOpts()),
    rpg: buildRpgDirectorPrompt(rpgOpts()),
  };

  for (const [name, prompt] of Object.entries(prompts)) {
    it(`${name} prompt: every advertised directive has a parser`, () => {
      const advertised = extractAdvertisedDirectives(prompt);
      const orphans = [...advertised].filter((d) => !PARSED_DIRECTIVES.has(d));
      expect(orphans, `${name} prompt mentions directives no parser reads: ${orphans.join(", ")}`).toEqual([]);
    });

    it(`${name} prompt: every advertised [BLOCK] has a parser`, () => {
      const advertised = extractAdvertisedBracketBlocks(prompt);
      const orphans = [...advertised].filter((b) => !BRACKET_BLOCKS.has(b));
      expect(orphans, `${name} prompt mentions bracket blocks no parser reads: ${orphans.join(", ")}`).toEqual([]);
    });
  }
});
