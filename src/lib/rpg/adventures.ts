/**
 * Authored RPG adventures — the structured backbone behind the prose
 * `rpgAdventureNotes` shown to the GM.
 *
 * Why structure? The GM previously got a long prose blob and improvised
 * everything else. That led to:
 *   - The same encounter firing twice ("a pack of goblins ambushes you" — wait, again?).
 *   - NPCs introduced inconsistently (Master Yun is "kindly" in turn 5, "scheming" in turn 12).
 *   - Boss "phase 2" mechanics in the brief but never triggered in play because
 *     nothing tracked HP thresholds.
 *   - Plot ingredients (the cursed shard, the rogue elder reveal, the rift
 *     anchor) revealed out of order or forgotten.
 *
 * With structure, the GM gets:
 *   - A typed ingredient ledger (auto-validated by reconcileIngredients).
 *   - An encounter table with one-shot IDs (auto-validated against re-firing).
 *   - Boss definitions with phase thresholds (the runtime triggers transitions).
 *   - Authored NPCs the GM is told about up front.
 *
 * The prose `directorBrief` is still emitted into the prompt; the structure
 * just makes it enforceable.
 */

import type { GmState } from "@/lib/gm-state";

export interface RpgKeyNpc {
  /** Stable id used in encounters / dialogue. */
  id: string;
  /** Display name shown to players. */
  name: string;
  /** Internal description for the GM (one line). */
  role: string;
  /** Whether the GM has met this NPC yet — set at init from `introducedAtStart`. */
  introducedAtStart?: boolean;
  /** When GM should bring them onstage if not already (act number). */
  appearsInAct?: number;
}

export interface RpgEncounterSpec {
  /** Stable id — used by ENCOUNTER_FIRED to mark this encounter consumed. */
  id: string;
  /** Display name in narration. */
  label: string;
  /** Which act this encounter belongs to (for pacing). */
  act: 1 | 2 | 3;
  /** What kind of encounter — drives default tactics. */
  type: "combat" | "puzzle" | "social" | "trap" | "discovery";
  /** Combat-only: opening enemy roster (the GM may scale to party size). */
  enemies?: Array<{
    name: string;
    hp: number;
    atk: number;
    def?: number;
    /** A boss flag flips this through the boss-phase tracker. */
    isBoss?: boolean;
    /** HP-percent thresholds where the boss changes phase (e.g. [0.5, 0.25]). */
    phaseThresholds?: number[];
  }>;
  /** Reward in EXP for the party on completion. */
  expReward: number;
  /** Brief one-line hint the GM follows. */
  notes: string;
}

export interface RpgActArc {
  act: 1 | 2 | 3;
  /** Short label — mirrored into PHASE directive for UI. */
  label: string;
  /** What story progress should trigger the act transition. */
  triggers: string[];
}

export interface RpgAdventure {
  id: string;
  worldId: "western-fantasy" | "wuxia";
  /** Short tagline — used as adventure title. */
  title: string;
  /** Long-form opening hook (1-2 sentences, second-person). */
  hook: string;
  /** Recommended party size. */
  partySize: number;
  /** Estimated session length, mirrored in the UI. */
  estimatedDuration: string;
  /** Rich prose still injected into the GM prompt's ## ADVENTURE section. */
  directorBrief: string;
  /** Authored NPCs the GM should keep consistent. */
  keyNpcs: RpgKeyNpc[];
  /** All planned encounters. The GM can skip some, but cannot duplicate. */
  encounters: RpgEncounterSpec[];
  /** Act structure with transition triggers. */
  acts: RpgActArc[];
  /** Initial GM state — ingredients, secrets, threats. The runtime seeds
   *  gmStateRef from this on the first turn (parallel to scene mode). */
  initialGmState: GmState;
}

// ─── Adventure 1: The Tournament of Jade Peak (Wuxia) ──────────────────────

const JADE_PEAK: RpgAdventure = {
  id: "rpg-jade-peak",
  worldId: "wuxia",
  title: "The Tournament of Jade Peak",
  hook: "You arrive at Jade Peak (翠峰) for the annual Grand Martial Tournament. Tournament banners line the stone stairway — but last year's champion vanished.",
  partySize: 3,
  estimatedDuration: "30-60 min",
  directorBrief: `Jade Peak is the legendary mountain sect hosting the annual Grand Martial Tournament. Fighters from all sects gather to compete for glory and the right to study the Peak's secret sword manual.

THE TRUTH (only the GM knows): Elder Wu Sheng, a rogue Peak elder, is poisoning contestants and trafficking forbidden martial arts to a foreign sect. Master Yun (the public judge) suspects but lacks proof. Mei Ling (Tang Clan scout) is investigating in secret. The Forbidden Library contains the evidence.

PRINCIPLES:
- Tournament rounds escalate: 1v1 → team battle → final showdown.
- Investigation runs in parallel — the party can choose how much they pursue clues vs focus on fights.
- Wu Sheng never appears as the villain until Act 3; in Acts 1-2 he is a quiet, respected senior who occasionally offers "advice."
- Use the disrupted-qi technique (a forbidden style that paralyses opponents) as the recurring forensic clue.

TONE: Honourable martial pageantry → quiet conspiracy → desperate confrontation.`,
  keyNpcs: [
    { id: "master_yun", name: "Master Yun (云大师)", role: "Tournament judge — fair, perceptive, withholding suspicions", introducedAtStart: true },
    { id: "mei_ling", name: "Mei Ling (美玲)", role: "Tang Clan scout investigating undercover; trades information cautiously", appearsInAct: 1 },
    { id: "iron_fist_chen", name: "Iron Fist Chen (铁拳陈)", role: "Boisterous Shaolin contestant, secretly insightful and helpful", appearsInAct: 1 },
    { id: "elder_wu_sheng", name: "Elder Wu Sheng (吴升长老)", role: "TRAITOR — appears as a kindly senior; revealed in Act 3", introducedAtStart: true },
  ],
  encounters: [
    {
      id: "sparring_puppet",
      label: "Sparring Puppet warm-up",
      act: 1, type: "combat",
      enemies: [{ name: "Sparring Puppet", hp: 40, atk: 10 }],
      expReward: 20,
      notes: "Optional warm-up at the training grounds. Lets the party feel out the d20+stat math before stakes rise.",
    },
    {
      id: "tournament_round_1",
      label: "Tournament Round 1 — 1v1 matches",
      act: 1, type: "combat",
      enemies: [{ name: "Rival Fighter", hp: 60, atk: 15 }],
      expReward: 40,
      notes: "Each party member fights a themed opponent in 1v1. Narrate the crowd; reveal the disrupted-qi clue when one rival inexplicably collapses.",
    },
    {
      id: "tournament_round_2_team",
      label: "Tournament Round 2 — team match",
      act: 2, type: "combat",
      enemies: [
        { name: "Stone Tiger Disciple", hp: 50, atk: 12 },
        { name: "Stone Tiger Disciple", hp: 50, atk: 12 },
        { name: "Stone Tiger Disciple", hp: 50, atk: 12 },
      ],
      expReward: 80,
      notes: "3v3. After the match, a non-party contestant collapses with disrupted qi — stakes escalate.",
    },
    {
      id: "library_ambush",
      label: "Forbidden Library ambush",
      act: 2, type: "combat",
      enemies: [
        { name: "Wu Sheng's Assassin", hp: 45, atk: 18, def: 6 },
        { name: "Wu Sheng's Assassin", hp: 45, atk: 18, def: 6 },
      ],
      expReward: 60,
      notes: "Triggers if the party investigates the library or visits at night. Only Wu Sheng knew they were here — the party should notice.",
    },
    {
      id: "boss_wu_sheng",
      label: "Boss — Elder Wu Sheng & elite guards",
      act: 3, type: "combat",
      enemies: [
        { name: "Elder Wu Sheng", hp: 200, atk: 30, def: 20, isBoss: true, phaseThresholds: [0.6, 0.3] },
        { name: "Elite Guard", hp: 80, atk: 18, def: 10 },
        { name: "Elite Guard", hp: 80, atk: 18, def: 10 },
      ],
      expReward: 200,
      notes: "Boss has 3 phases. Phase 1: standard sword forms. Phase 2 (HP<60%): unleashes the forbidden disrupted-qi technique, paralyses one party member for 1 turn each round. Phase 3 (HP<30%): desperate, calls a final assassin from the shadows + AoE qi blast.",
    },
  ],
  acts: [
    { act: 1, label: "Arrival — Tournament Begins", triggers: ["party registers", "first round fought", "first poisoning clue noticed"] },
    { act: 2, label: "Conspiracy Surfaces", triggers: ["second poisoning", "library lead pursued", "Mei Ling makes contact"] },
    { act: 3, label: "Confrontation", triggers: ["traitor identified", "Wu Sheng cornered or revealed publicly"] },
  ],
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "first_disrupted_qi_collapse",
      "tournament_round_1",
      "library_locked_clue",
      "mei_ling_makes_contact",
      "second_contestant_poisoned",
      "library_ambush",
      "wu_sheng_offers_advice",
      "tournament_round_2_team",
      "library_evidence_found",
      "boss_wu_sheng_revealed",
    ],
    playerKnows: ["last year's tournament champion vanished without explanation"],
    playerDoesntKnow: [
      "Elder Wu Sheng is the traitor",
      "the disrupted-qi technique is a forbidden Peak art",
      "Mei Ling is a Tang Clan scout, not a contestant",
      "Master Yun suspects but lacks proof",
    ],
    activeThreats: ["tournament_running_out", "more_contestants_being_poisoned"],
    mood: "festive but watchful",
    questLog: ["Win the tournament", "Investigate the disrupted-qi poisonings"],
  },
};

// ─── Adventure 2: The Dungeon of Starfall (Western Fantasy) ────────────────

const STARFALL_DUNGEON: RpgAdventure = {
  id: "rpg-starfall-dungeon",
  worldId: "western-fantasy",
  title: "The Dungeon of Starfall",
  hook: "A meteor struck the earth and revealed an ancient dungeon sealed for millennia. The village of Ashwick offers a bounty for clearing it. Cold air rises from the entrance. Faint blue light pulses below.",
  partySize: 3,
  estimatedDuration: "30-60 min",
  directorBrief: `The Starfall Crater dungeon is a three-floor descent ending in an Ancient Dragon, Ignathir, who guards the Starfall Crystal — a gem of unimaginable power.

THE TRUTH (only the GM knows): The dungeon was sealed by a council of mages to imprison Ignathir, NOT to hide treasure. The "treasure" is bait for greedy adventurers, who replenish his lair when he eats them. The carved Old Elvish warnings at the entrance are sincere.

PRINCIPLES:
- Each floor changes tone: F1 antechamber (history & traps) → F2 caverns (wonder & danger) → F3 lair (epic confrontation).
- Floor 2's lake side-passage is OPTIONAL but rewards the curious.
- The Skeleton Warriors hint at the dungeon's true purpose (they are former adventurers).
- Make Ignathir's fire breath visceral; this fight should feel survival-tier.

TONE: Adventurous descent → unease → desperate boss fight.`,
  keyNpcs: [
    { id: "village_elder_ashwick", name: "Elder Marrick of Ashwick", role: "Posts the bounty, knows fragments of the dungeon's history but withholds the dragon's name", introducedAtStart: true },
    { id: "ignathir", name: "Ignathir, the Ancient", role: "BOSS — slumbering dragon; awakens when the party reaches the crystal", appearsInAct: 3 },
  ],
  encounters: [
    {
      id: "f1_pressure_arrows",
      label: "Floor 1 — Pressure-plate arrow trap",
      act: 1, type: "trap",
      expReward: 15,
      notes: "Rogue can detect and disarm; Warrior can shield the party. Failing = 1d6 damage to a random party member.",
    },
    {
      id: "f1_giant_rats",
      label: "Floor 1 — Giant Rats warm-up",
      act: 1, type: "combat",
      enemies: [
        { name: "Giant Rat", hp: 20, atk: 5 },
        { name: "Giant Rat", hp: 20, atk: 5 },
        { name: "Giant Rat", hp: 20, atk: 5 },
      ],
      expReward: 45,
      notes: "Easy fight to teach combat math. After: a Bronze Shield in a locked chest (Thief picks).",
    },
    {
      id: "f1_rune_door_puzzle",
      label: "Floor 1 — Rune door puzzle",
      act: 1, type: "puzzle",
      expReward: 30,
      notes: "Three rune slots; murals on the wall encode the order. Mage reads the runes; without a mage, party can brute-force at the cost of 1 HP per wrong attempt.",
    },
    {
      id: "f2_crystal_golems",
      label: "Floor 2 — Crystal Golems",
      act: 2, type: "combat",
      enemies: [
        { name: "Crystal Golem", hp: 60, atk: 14, def: 12 },
        { name: "Crystal Golem", hp: 60, atk: 14, def: 12 },
      ],
      expReward: 100,
      notes: "Slow, hard-hitting. Weak to magic (mage spells deal +50%). Some surrounding crystals explode if struck — environmental hazard.",
    },
    {
      id: "f2_water_elemental",
      label: "Floor 2 — Water Elemental (optional side path)",
      act: 2, type: "combat",
      enemies: [{ name: "Water Elemental", hp: 80, atk: 16 }],
      expReward: 70,
      notes: "Optional. Immune to physical attacks (DEF=∞ vs melee/ranged). Mages must lead. Drops a Rare staff or wand.",
    },
    {
      id: "f2_skeleton_warriors",
      label: "Floor 2 — Skeleton Warriors",
      act: 2, type: "combat",
      enemies: [
        { name: "Skeleton Warrior", hp: 40, atk: 12 },
        { name: "Skeleton Warrior", hp: 40, atk: 12 },
        { name: "Skeleton Warrior", hp: 40, atk: 12 },
        { name: "Skeleton Warrior", hp: 40, atk: 12 },
      ],
      expReward: 120,
      notes: "Rise from the floor. Cleric/healer deals double damage. Drop hints they were once adventurers (rusted equipment with Ashwick crests).",
    },
    {
      id: "f2_rest_spring",
      label: "Floor 2 — Underground spring rest point",
      act: 2, type: "discovery",
      expReward: 0,
      notes: "Safe area, full HP/MP restore, optional roleplay beat. Don't fire combat here.",
    },
    {
      id: "boss_ignathir",
      label: "Boss — Ancient Dragon Ignathir",
      act: 3, type: "combat",
      enemies: [
        { name: "Ignathir", hp: 300, atk: 35, def: 25, isBoss: true, phaseThresholds: [0.5] },
      ],
      expReward: 300,
      notes: "Phase 1 (HP>50%): physical claws + fire breath every 3 turns (AoE 20). Phase 2 (HP<50%): takes flight (only ranged/magic hit), fire breath every 2 turns, summons 2 Dragonlings (HP 30, ATK 10). On defeat: Starfall Crystal (legendary) + Dragon's Hoard (each player picks one epic).",
    },
  ],
  acts: [
    { act: 1, label: "Antechamber — Descent Begins", triggers: ["party enters dungeon", "first trap survived", "first chest opened"] },
    { act: 2, label: "Crystal Caverns", triggers: ["Crystal Golems fought", "Skeleton Warriors revealed as ex-adventurers", "rest spring discovered"] },
    { act: 3, label: "Dragon's Lair", triggers: ["party reaches crystal pedestal", "Ignathir awakens"] },
  ],
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "f1_pressure_arrows",
      "f1_giant_rats",
      "f1_rune_door_puzzle",
      "f2_crystal_golems",
      "f2_water_elemental",
      "f2_skeleton_warriors",
      "f2_rest_spring",
      "skeletons_were_adventurers_clue",
      "old_elvish_warnings",
      "boss_ignathir_awakens",
    ],
    playerKnows: ["a meteor revealed the dungeon", "Ashwick posted a bounty"],
    playerDoesntKnow: [
      "the dungeon was a prison, not a vault",
      "Ignathir is the prisoner the seal contained",
      "the skeletons are former adventurers Ignathir consumed",
    ],
    activeThreats: ["air_grows_colder_with_descent"],
    mood: "curious",
    partyLevel: 1,
    questLog: ["Clear the Starfall Dungeon for Ashwick's bounty"],
  },
};

// ─── Adventure 3: The Cursed Crossroads (Mixed) ────────────────────────────

const CURSED_CROSSROADS: RpgAdventure = {
  id: "rpg-cursed-crossroads",
  worldId: "western-fantasy",
  title: "The Cursed Crossroads",
  hook: "You wake in Yunjin (云津), a border town where Eastern qi and Western mana collide. An invisible barrier has sealed the town — no one can leave. A crystallized tree pulses in the square with alternating energies.",
  partySize: 3,
  estimatedDuration: "30-60 min",
  directorBrief: `Yunjin is the rare town where Wuxia and Western magic coexist. Last night, two practitioners — Master Xu (Eastern) and Professor Blackwood (Western) — tried to fuse qi and mana into a new power source. It went catastrophically wrong: the experiment crystallised into a tree-shaped rift anchor in the town square, sealing everyone inside.

THE TRUTH (only the GM knows): Master Xu was actually pulled into the rift mid-experiment. He's alive, conscious, and trying to fix it from inside. Professor Blackwood is hiding in the library wracked with guilt. The barrier feeds on the unbalanced energy; cutting it requires three catalyst fragments.

PRINCIPLES:
- The town's mixed culture is the world. Eastern Quarter (teahouses, dojos) and Western Quarter (taverns, wizard shops) are equally vivid.
- Two factions distrust each other; the party often has to broker between them.
- The Final Choice in Act 3 (MERGE vs SEPARATE) is the player's biggest agency moment — both outcomes are valid endings.

TONE: Disorientation → investigation → moral weight.`,
  keyNpcs: [
    { id: "master_zhou", name: "Master Zhou", role: "Eastern sage, calm, knows fragments of the truth", introducedAtStart: true },
    { id: "archmage_helena", name: "Archmage Helena", role: "Western mage, arrogant, knowledgeable, hostile to Eastern practitioners", introducedAtStart: true },
    { id: "kai_smuggler", name: "Kai the Smuggler", role: "Knows the town's secrets; trades information for favours", appearsInAct: 1 },
    { id: "professor_blackwood", name: "Professor Blackwood", role: "Hiding in the library; wracked with guilt; reveals the truth in Act 2", appearsInAct: 2 },
    { id: "master_xu", name: "Master Xu", role: "Trapped inside the rift; appears in Act 3 climax", appearsInAct: 3 },
  ],
  encounters: [
    {
      id: "chaos_sprites_intro",
      label: "Act 1 — Chaos Sprites in the streets",
      act: 1, type: "combat",
      enemies: [
        { name: "Chaos Sprite", hp: 25, atk: 8 },
        { name: "Chaos Sprite", hp: 25, atk: 8 },
        { name: "Chaos Sprite", hp: 25, atk: 8 },
      ],
      expReward: 60,
      notes: "Wild magic fragments. Easy fight that establishes the town isn't safe to walk through. Awards 20 EXP each.",
    },
    {
      id: "fragment_1_qi_wraith",
      label: "Fragment 1 — Qi Wraith in the dojo basement",
      act: 2, type: "combat",
      enemies: [{ name: "Qi Wraith", hp: 70, atk: 16 }],
      expReward: 50,
      notes: "Guards the first catalyst fragment in the collapsed Eastern dojo basement. Phases through walls — narrate the dread.",
    },
    {
      id: "fragment_2_rune_puzzle",
      label: "Fragment 2 — Wizard tower rune puzzle",
      act: 2, type: "puzzle",
      expReward: 40,
      notes: "Top floor of Helena's tower. Rearrange magical runes to unlock the vault. Mage solves easily; others get scorched (5 HP) on wrong attempts.",
    },
    {
      id: "fragment_3_smuggler_bargain",
      label: "Fragment 3 — Kai's warehouse Chaos Beasts",
      act: 2, type: "combat",
      enemies: [
        { name: "Chaos Beast", hp: 45, atk: 12 },
        { name: "Chaos Beast", hp: 45, atk: 12 },
        { name: "Chaos Beast", hp: 45, atk: 12 },
        { name: "Chaos Beast", hp: 45, atk: 12 },
      ],
      expReward: 160,
      notes: "Kai trades the third fragment for clearing his warehouse. Awards 40 EXP each.",
    },
    {
      id: "boss_rift_guardian_merge",
      label: "Boss (MERGE path) — Rift Guardian",
      act: 3, type: "combat",
      enemies: [
        { name: "Rift Guardian", hp: 250, atk: 28, def: 18, isBoss: true, phaseThresholds: [0.66, 0.33] },
      ],
      expReward: 250,
      notes: "Triggered by MERGE path choice. Alternates qi/mana attack types each round; only combined Eastern+Western strikes deal full damage. Phase 2 (66%): adds environmental chaos blasts. Phase 3 (33%): pulls Master Xu out of the rift mid-fight, who joins as ally.",
    },
    {
      id: "boss_split_guardians_separate",
      label: "Boss (SEPARATE path) — Twin Half-Guardians",
      act: 3, type: "combat",
      enemies: [
        { name: "Qi Guardian", hp: 120, atk: 22 },
        { name: "Mana Guardian", hp: 120, atk: 22 },
      ],
      expReward: 180,
      notes: "Triggered by SEPARATE path. Two simultaneous bosses, no phase mechanics — easier individually but the action economy hurts. Town survives but barrier shock damages buildings.",
    },
  ],
  acts: [
    { act: 1, label: "Trapped — Yunjin Sealed", triggers: ["party explores both quarters", "first Chaos Sprite encounter", "Kai or Master Zhou met"] },
    { act: 2, label: "Investigation — Three Fragments", triggers: ["Blackwood reveals the truth", "at least 2 fragments retrieved"] },
    { act: 3, label: "Final Choice", triggers: ["all three fragments brought to the tree", "MERGE or SEPARATE chosen"] },
  ],
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "barrier_shocks_anyone_who_touches",
      "chaos_sprites_intro",
      "kai_first_appearance",
      "master_zhou_introduces_qi_mana_history",
      "blackwood_found_in_library",
      "blackwood_reveals_truth",
      "fragment_1_qi_wraith",
      "fragment_2_rune_puzzle",
      "fragment_3_smuggler_bargain",
      "tree_pulses_response_to_fragment",
      "final_choice_merge_or_separate",
      "boss_rift_guardian_merge",
      "boss_split_guardians_separate",
    ],
    playerKnows: ["the town is sealed by an invisible barrier", "the crystallised tree in the square is the focal point"],
    playerDoesntKnow: [
      "Master Xu is alive inside the rift",
      "Professor Blackwood caused the disaster and is hiding in the library",
      "the barrier feeds on unbalanced qi/mana energy",
      "three catalyst fragments are needed to break the seal",
    ],
    activeThreats: ["barrier_slowly_destabilises_town", "townsfolk_panic_rising"],
    mood: "uneasy",
    partyLevel: 2,
    questLog: ["Find a way out of Yunjin"],
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const ALL_RPG_ADVENTURES: RpgAdventure[] = [
  JADE_PEAK,
  STARFALL_DUNGEON,
  CURSED_CROSSROADS,
];

export function getRpgAdventureById(id: string | null | undefined): RpgAdventure | undefined {
  if (!id) return undefined;
  return ALL_RPG_ADVENTURES.find((a) => a.id === id);
}

/**
 * Generate the prose `directorBrief` block we want injected into the GM
 * prompt's ## ADVENTURE section. Combines authored brief + structured npc
 * roster + encounter table so the GM has both narrative voice and concrete
 * data to draw on.
 */
export function buildAdventureNotes(adventure: RpgAdventure): string {
  const npcLines = adventure.keyNpcs
    .map((n) => `  - ${n.name}: ${n.role}${n.introducedAtStart ? "" : ` (appears in Act ${n.appearsInAct ?? "?"})`}`)
    .join("\n");

  const encounterLines = adventure.encounters
    .map((e) => {
      const enemyDesc = e.enemies
        ? ` — ${e.enemies.map((en) => `${en.name} (HP ${en.hp}, ATK ${en.atk}${en.def ? `, DEF ${en.def}` : ""}${en.isBoss ? ", BOSS" : ""})`).join(", ")}`
        : "";
      return `  - [${e.id}] (Act ${e.act}, ${e.type}) ${e.label}${enemyDesc}\n      ${e.notes} (+${e.expReward} EXP)`;
    })
    .join("\n");

  const actLines = adventure.acts
    .map((a) => `  - Act ${a.act} — ${a.label}\n      Triggers: ${a.triggers.join("; ")}`)
    .join("\n");

  return `${adventure.directorBrief}

## KEY NPCs (keep CONSISTENT across turns)
${npcLines}

## ENCOUNTER TABLE (each fires AT MOST ONCE — emit ENCOUNTER_FIRED: <id>)
${encounterLines}

## ACT STRUCTURE
${actLines}`;
}
