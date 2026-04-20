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

export interface RpgQuestReward {
  /** Bonus EXP awarded on completion (each party member). */
  exp?: number;
  /** Item granted to each party member on completion (free-form name —
   *  the GM narrates it as the appropriate world-flavour item). */
  item?: string;
  /** Currency reward (gold / silver taels — world's currency term). */
  currency?: number;
  /** Free-form reward description for narrative-only rewards
   *  ("Master Yun teaches you the Jade Tempest form"). */
  notes?: string;
}

export interface RpgQuest {
  /** Stable id used by `completedWhen` look-ups and the QuestsCompleted ledger. */
  id: string;
  /** Player-facing name. */
  name: string;
  /** main = drives the story; side = optional but rewarding;
   *  hidden = NOT shown to the player until completed. */
  type: "main" | "side" | "hidden";
  /** Player-facing one-line objective. */
  objective: string;
  /** Auto-completion trigger: when this id appears in either
   *  `gmState.encountersFired` OR `gmState.ingredientsUsed` the quest is
   *  marked complete and the GM is told to grant rewards. Use either an
   *  encounter id (preferred, deterministic) or an ingredient id (for
   *  story-beat completions like "the truth was revealed"). */
  completedWhen: string;
  /** What the party gets on completion. */
  reward?: RpgQuestReward;
}

export interface RpgAdventure {
  id: string;
  worldId: "western-fantasy";
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
  /** Structured quest list — auto-completion driven by encounter / ingredient
   *  ids in `completedWhen`. Hidden quests are kept secret until completed
   *  (then surface to the sidebar). */
  quests: RpgQuest[];
  /** Initial GM state — ingredients, secrets, threats. The runtime seeds
   *  gmStateRef from this on the first turn (parallel to scene mode). */
  initialGmState: GmState;
}

// ─── Adventure 1: The Dungeon of Starfall (Western Fantasy) ────────────────

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
  quests: [
    {
      id: "clear_dungeon",
      name: "Clear the Starfall Dungeon",
      type: "main",
      objective: "Reach and defeat whatever guards the Starfall Crystal — Ashwick's bounty depends on it.",
      completedWhen: "boss_ignathir",
      reward: { exp: 300, currency: 500, item: "Ashwick Bounty Purse" },
    },
    {
      id: "uncover_seal_truth",
      name: "Uncover the dungeon's true purpose",
      type: "side",
      objective: "Find out what the ancient mages were really hiding here.",
      completedWhen: "skeletons_were_adventurers_clue",
      reward: { exp: 60, notes: "The grim truth — these tombs are former adventurers." },
    },
    {
      id: "claim_starfall_crystal",
      name: "Claim the Starfall Crystal",
      type: "hidden",
      objective: "Recover the legendary gem from the dragon's hoard.",
      completedWhen: "boss_ignathir",
      reward: { exp: 100, item: "Starfall Crystal" },
    },
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

// ─── Adventure 2: The Beggar's Coin (Western Fantasy, short-form) ─────────
//
// Western Fantasy parity for Heishan Bell — a ~25 minute investigation
// adventure to balance Starfall Dungeon's longer dungeon-crawl arc.
// Validates the structure under a NON-dungeon Western Fantasy
// archetype (urban mystery / faction politics).

const BEGGARS_COIN: RpgAdventure = {
  id: "rpg-beggars-coin",
  worldId: "western-fantasy",
  title: "The Beggar's Coin",
  hook: "The pickpocket who stole the prince's signet ring left only one clue: a copper coin marked with a beggar's sigil. The throne wants the ring back by dawn.",
  partySize: 3,
  estimatedDuration: "20-30 min",
  directorBrief: `The capital city of Westmarch is in quiet chaos. Last night a pickpocket lifted the prince's signet ring from his belt at the harvest festival. Crown guards have torn through the lower wards finding nothing. The only lead is a copper coin the thief dropped — stamped with the sigil of the Beggar King, the apocryphal head of the city's underworld guild. The throne hires the party to recover the ring before dawn, when court convenes.

THE TRUTH (only the GM knows): The "thief" was actually Lady Ymara, the prince's own younger sister, who took the ring to discredit him before the succession vote. She paid the Beggar King 50 gold to provide the coin as misdirection. The Beggar King knows but won't betray a paying client unless leveraged. The ring is in Ymara's chambers in the palace itself.

PRINCIPLES:
- Investigation, not dungeon crawl. Combat is one optional set-piece (sewer ambush) and one rooftop chase finale.
- Three threads to pull: the coin (leads to Beggar King), the festival (witnesses), the palace (Ymara's motive). Any path can crack the case.
- Lady Ymara is sympathetic — she's not evil, she's desperate. Players choose whether to expose her or cover for her.
- The dawn deadline is a real ticking clock — narrate the sky lightening.

TONE: Urban noir → faction intrigue → moral ambiguity.`,
  keyNpcs: [
    { id: "captain_orin", name: "Captain Orin of the Crown Guard", role: "Hired the party; gruff, by-the-book, increasingly worried about dawn", introducedAtStart: true },
    { id: "beggar_king", name: "The Beggar King", role: "Underworld figurehead; trades information for coin or favours; appears in Act 1-2", appearsInAct: 1 },
    { id: "lady_ymara", name: "Lady Ymara", role: "TRUE CULPRIT — appears as helpful royal cousin in Act 1, revealed as thief in Act 3", introducedAtStart: true },
    { id: "festival_witness", name: "Pip the lamplighter", role: "Saw the theft from a rooftop but no one took him seriously; appears in Act 2 if the festival is investigated", appearsInAct: 2 },
  ],
  encounters: [
    {
      id: "sewer_ambush",
      label: "Sewer ambush — the Beggar King's bouncers",
      act: 1, type: "combat",
      enemies: [
        { name: "Underwarren Brawler", hp: 55, atk: 14 },
        { name: "Underwarren Brawler", hp: 55, atk: 14 },
        { name: "Underwarren Brawler", hp: 55, atk: 14 },
      ],
      expReward: 70,
      notes: "Triggers if the party enters the sewers loudly. The Beggar King watches and decides whether to talk based on how the fight ends — efficient OR merciful both impress him.",
    },
    {
      id: "festival_witness_breakthrough",
      label: "Festival recreation — find Pip",
      act: 2, type: "discovery",
      expReward: 50,
      notes: "Investigation set-piece, no combat. Visit the festival square at the same hour as the theft. If the party climbed to a rooftop, asked vendors about the prince's path, OR bribed children — Pip surfaces and identifies a 'pretty woman in green' near the prince.",
    },
    {
      id: "library_succession_records",
      label: "Royal library — succession records",
      act: 2, type: "puzzle",
      expReward: 40,
      notes: "If the party investigates Lady Ymara's motive: the library contains the succession bylaws. Mage / scholar character pieces together that Ymara is third in line; the prince's signet missing from court would force a delay vote.",
    },
    {
      id: "rooftop_chase_finale",
      label: "Rooftop chase — Ymara flees",
      act: 3, type: "combat",
      enemies: [
        { name: "Lady Ymara (chase)", hp: 80, atk: 18, def: 8, isBoss: true, phaseThresholds: [0.5] },
        { name: "Hired Bodyguard", hp: 60, atk: 16 },
      ],
      expReward: 180,
      notes: "Once cornered, Ymara flees across the palace rooftops. Phase 1: she fights via the bodyguard while she runs. Phase 2 (HP<50%): bodyguard down, Ymara turns and pleads — combat can end here if the party offers a non-lethal bargain (she returns the ring, party covers for her). Mechanically: if any party member uses a 'social' or 'support' action this round, treat the boss as defeated; otherwise narrate the killing blow as a tragedy.",
    },
  ],
  acts: [
    { act: 1, label: "Hired by the Crown — The Coin", triggers: ["meet Captain Orin", "first lead pursued (sewers OR festival OR palace)"] },
    { act: 2, label: "Three Threads", triggers: ["Beggar King spoken to OR Pip's testimony OR succession motive uncovered"] },
    { act: 3, label: "Dawn Approaches — Ymara Revealed", triggers: ["culprit identified", "rooftop chase begun"] },
  ],
  quests: [
    {
      id: "recover_ring",
      name: "Recover the prince's signet ring",
      type: "main",
      objective: "Find the ring before dawn court convenes.",
      completedWhen: "rooftop_chase_finale",
      reward: { exp: 200, currency: 200, item: "Crown's Favor Token" },
    },
    {
      id: "lean_on_beggar_king",
      name: "Question the Beggar King",
      type: "side",
      objective: "Find the Underwarren court and pressure the Beggar King for information.",
      completedWhen: "sewer_ambush",
      reward: { exp: 70, notes: "The Beggar King owes you a favour — recoverable in future Western Fantasy adventures." },
    },
    {
      id: "find_witness",
      name: "Find a witness from the festival",
      type: "side",
      objective: "Recreate the moment of the theft and find anyone who saw it clearly.",
      completedWhen: "festival_witness_breakthrough",
      reward: { exp: 50, item: "Pip's Lantern Charm" },
    },
    {
      id: "uncover_ymara_motive",
      name: "Uncover the succession motive",
      type: "hidden",
      objective: "Discover that Lady Ymara has political reasons to take the ring.",
      completedWhen: "library_succession_records",
      reward: { exp: 60, notes: "Ymara's secret — leverage that may be spent or kept." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 2,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "captain_orin_briefing",
      "copper_coin_with_beggar_sigil",
      "sewer_ambush",
      "beggar_king_audience",
      "festival_witness_breakthrough",
      "library_succession_records",
      "ymara_caught_in_lie",
      "rooftop_chase_finale",
      "dawn_approaching",
    ],
    playerKnows: ["the prince's signet ring was stolen", "the only clue is a copper coin with the Beggar King's sigil"],
    playerDoesntKnow: [
      "the thief is Lady Ymara, the prince's sister",
      "the Beggar King was paid 50 gold to provide the coin as misdirection",
      "Ymara's motive is the upcoming succession vote",
      "the ring is in Ymara's own chambers",
    ],
    activeThreats: ["dawn_court_convenes", "kingdom_political_instability"],
    mood: "urgent",
    partyLevel: 2,
    questLog: ["Recover the prince's signet ring before dawn"],
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const ALL_RPG_ADVENTURES: RpgAdventure[] = [
  STARFALL_DUNGEON,
  BEGGARS_COIN,
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

  const formatQuestReward = (r: RpgQuest["reward"]): string => {
    if (!r) return "";
    const parts: string[] = [];
    if (r.exp) parts.push(`+${r.exp} EXP`);
    if (r.currency) parts.push(`+${r.currency} currency`);
    if (r.item) parts.push(`item: ${r.item}`);
    if (r.notes) parts.push(r.notes);
    return parts.length ? ` → ${parts.join(", ")}` : "";
  };
  const questLines = adventure.quests
    .map((q) => {
      const tag = q.type === "hidden" ? " [HIDDEN — only visible after completion]" : q.type === "side" ? " [side]" : "";
      return `  - [${q.id}]${tag} ${q.name}\n      Objective: ${q.objective}\n      Auto-completes when [${q.completedWhen}] fires${formatQuestReward(q.reward)}`;
    })
    .join("\n");

  return `${adventure.directorBrief}

## KEY NPCs (keep CONSISTENT across turns)
${npcLines}

## ENCOUNTER TABLE (each fires AT MOST ONCE — emit ENCOUNTER_FIRED: <id>)
${encounterLines}

## QUESTS (the runtime auto-completes these — you only narrate them and grant rewards)
${questLines}

## ACT STRUCTURE
${actLines}`;
}
