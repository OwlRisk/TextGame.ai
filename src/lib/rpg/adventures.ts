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

// ─── Adventure 3: The Witchwood Hunt (Western Fantasy, dark horror) ───────
//
// Mid-length atmospheric horror — investigation that escalates into a
// 3-phase boss against an Old-World banshee. Validates the structure
// under a horror archetype where dread ramps up turn-by-turn.

const WITCHWOOD_HUNT: RpgAdventure = {
  id: "rpg-witchwood-hunt",
  worldId: "western-fantasy",
  title: "The Witchwood Hunt",
  hook: "Three children have vanished from Hollow Hearth in three nights — each at the strike of the chapel bell. The villagers swear the woods are walking again. Tonight is the fourth bell.",
  partySize: 3,
  estimatedDuration: "30-45 min",
  directorBrief: `Hollow Hearth is a logging hamlet on the edge of the Witchwood — a forest the maps mark "do not cut". Three nights ago, on the strike of the chapel bell, a child vanished from her bed. Two more followed on the second and third nights. The villagers found no tracks, no broken windows, only a single white feather on each pillow. Tonight the bell rings for a fourth time at dusk.

THE TRUTH (only the GM knows): The Witchwood is the prison of Mother Albinet, a banshee bound a century ago by the village's founding charter. Every fifty years she must take a "voice" to keep the binding fed. The chapel bell IS the binding mechanism — when it tolls, the contract demands payment. The current pastor knows; his predecessor went mad and stopped ringing it; Mother Albinet broke loose for a generation and now the village pays the catch-up debt: three children at once. The pastor will lie until cornered.

PRINCIPLES:
- Sensory horror. Sound (the bell, breathing in the trees), wrongness (deer with too many eyes), absence (no birdsong). Avoid jump-scares — build dread.
- The forest is alive — paths shift between scenes. Players who insist on retracing steps "find" the route changed; this is the Witchwood, not a navigation puzzle.
- The pastor (Father Cael) is sympathetic but complicit. Players choose: kill the binding (releases Mother Albinet permanently — village is doomed but children safe), reforge it (one party member must offer a "voice", losing the ability to speak for a week of game time), or banish (combat finale).
- Children are alive throughout — being held in Mother Albinet's hollow tree until the fourth bell. Time pressure is real.

TONE: Cosy village → wrongness creeps in → forest hunt → dread crescendo → moral choice.`,
  keyNpcs: [
    { id: "father_cael", name: "Father Cael", role: "Village pastor; lights a candle for each missing child; lies about the bell's purpose until cornered", introducedAtStart: true },
    { id: "miller_branna", name: "Branna the Miller", role: "Mother of one of the missing; offers the party shelter, food, and her late husband's hunting bow", introducedAtStart: true },
    { id: "old_threpp", name: "Old Threpp", role: "Drunk woodcutter who wandered the Witchwood once and came back wrong; speaks in fragments; reveals the binding history if pressed", appearsInAct: 1 },
    { id: "mother_albinet", name: "Mother Albinet", role: "BANSHEE — the Witchwood's prisoner; appears as a beautiful woman in white in Act 2, true form in Act 3 boss", appearsInAct: 2 },
  ],
  encounters: [
    {
      id: "wrong_deer",
      label: "The deer with too many eyes",
      act: 1, type: "discovery",
      expReward: 30,
      notes: "First sign the woods are wrong. A deer steps into the lantern-light; it has too many eyes, all blinking at different rates. It does not flee. Pure atmospheric — no combat unless the party attacks (which it allows, then the corpse becomes a normal deer at dawn).",
    },
    {
      id: "thornroot_ambush",
      label: "Thornroot ambush in the forest",
      act: 1, type: "combat",
      enemies: [
        { name: "Thornroot Stalker", hp: 50, atk: 14, def: 4 },
        { name: "Thornroot Stalker", hp: 50, atk: 14, def: 4 },
      ],
      expReward: 80,
      notes: "Vine-wrapped husks of past missing villagers, animated by the binding's overflow. They moan a child's name as they attack. Killing them frees the soul (small EXP bonus narrated as a whisper of thanks).",
    },
    {
      id: "white_lady_offering",
      label: "Mother Albinet appears — the white-lady offering",
      act: 2, type: "social",
      expReward: 60,
      notes: "Mother Albinet appears to the party as a beautiful woman in a white dress at a moonlit clearing. She is gentle, articulate, hungry. She offers a deal: leave one of the children in exchange for the others. If any party member is tempted, narrate the temptation; the choice flips later moral weight regardless.",
    },
    {
      id: "chapel_basement_truth",
      label: "Father Cael cornered in the chapel basement",
      act: 2, type: "social",
      expReward: 50,
      notes: "Investigation set-piece. The chapel basement holds the founding charter and the binding journal. Father Cael appears mid-search and breaks down — confesses everything if pressed with what they've already found. Reveals the three options: break, reforge, banish.",
    },
    {
      id: "boss_mother_albinet",
      label: "Boss — Mother Albinet at the hollow tree",
      act: 3, type: "combat",
      enemies: [
        { name: "Mother Albinet", hp: 220, atk: 28, def: 12, isBoss: true, phaseThresholds: [0.66, 0.33] },
        { name: "Bound Husk", hp: 40, atk: 12 },
        { name: "Bound Husk", hp: 40, atk: 12 },
      ],
      expReward: 220,
      notes: "Boss has 3 phases. Phase 1 (white lady form): physical attacks + summons one Bound Husk per turn (cap at 4 on field). Phase 2 (HP<66%, true banshee form): screams that force WIS saves — failure stuns 1 turn; the bell tower is now visible above the trees. Phase 3 (HP<33%): she begs to be released; players who chose 'break' OR 'reforge' in Act 2 can end combat with a single ritual action; players who chose 'banish' must finish the kill (narrated as bittersweet — the children freed but the binding broken anyway, dooming the village over time).",
    },
  ],
  acts: [
    { act: 1, label: "Hollow Hearth — the village", triggers: ["meet Father Cael or Branna", "first wrongness witnessed (wrong deer or thornroot)"] },
    { act: 2, label: "Into the Witchwood", triggers: ["thornroot ambush survived", "Mother Albinet's offer made OR Cael cornered"] },
    { act: 3, label: "The Fourth Bell", triggers: ["binding choice declared", "hollow tree reached"] },
  ],
  quests: [
    {
      id: "save_the_children",
      name: "Save the missing children",
      type: "main",
      objective: "Find the three children before the fourth bell strikes.",
      completedWhen: "boss_mother_albinet",
      reward: { exp: 220, currency: 150, item: "Hollow Hearth Charm (resists fear once per session)" },
    },
    {
      id: "uncover_the_binding",
      name: "Uncover what the bell does",
      type: "main",
      objective: "Find out why the chapel bell tolls and what feeds the Witchwood.",
      completedWhen: "chapel_basement_truth",
      reward: { exp: 60, notes: "Father Cael shares the binding journal — useful in any future haunted-charter adventure." },
    },
    {
      id: "free_the_husks",
      name: "Free the bound husks",
      type: "side",
      objective: "Defeat the thornroot stalkers in the forest — each was once a missing villager.",
      completedWhen: "thornroot_ambush",
      reward: { exp: 80, item: "Whispered Thanks (minor blessing — +1 to next critical roll)" },
    },
    {
      id: "refuse_the_white_lady",
      name: "Refuse Mother Albinet's bargain",
      type: "hidden",
      objective: "Walk away from the offering at the moonlit clearing without taking the deal.",
      completedWhen: "white_lady_offering",
      reward: { exp: 70, notes: "The forest takes no payment from you — the boss's first phase deals -10% damage." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 2,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "village_gathering_meets_pastor",
      "wrong_deer",
      "old_threpp_fragments",
      "thornroot_ambush",
      "white_lady_offering",
      "chapel_basement_truth",
      "binding_choice_declared",
      "hollow_tree_revealed",
      "boss_mother_albinet",
      "fourth_bell_tolls",
    ],
    playerKnows: ["three children have vanished on consecutive nights at the chapel bell", "a single white feather was left on each pillow"],
    playerDoesntKnow: [
      "the chapel bell IS the binding",
      "Mother Albinet is a banshee bound a century ago",
      "Father Cael knows but lies",
      "the children are still alive — held until the fourth bell",
    ],
    activeThreats: ["fourth_bell_at_dusk", "forest_paths_shifting", "more_husks_being_made"],
    mood: "creeping dread",
    partyLevel: 3,
    questLog: ["Find the missing children before the fourth bell"],
  },
};

// ─── Adventure 4: The Masquerade of Lord Velour (social whodunit) ─────────
//
// A combat-light adventure that validates the structure under
// social/intrigue play. Combat is optional — the climax is the unmasking
// scene, which can be resolved by evidence OR by combat if pursued.

const MASQUERADE_VELOUR: RpgAdventure = {
  id: "rpg-masquerade-velour",
  worldId: "western-fantasy",
  title: "The Masquerade of Lord Velour",
  hook: "You arrive at Lord Velour's harvest masquerade to find the host already dead behind his own throne. The doors lock at midnight by enchantment. The killer is still here, behind a mask.",
  partySize: 3,
  estimatedDuration: "30-40 min",
  directorBrief: `Lord Aldebar Velour throws the most lavish masquerade ball in the duchy each harvest. Seven guests of note, dozens of minor nobles, a servant staff of twenty. At the eighth bell, the doors are sealed by the manor's old protective enchantment — no one in or out until dawn. Tonight, ten minutes before the doors sealed, Lord Velour was found stabbed behind his own throne.

THE TRUTH (only the GM knows): The killer is Madame Coquette, the famed opera singer. She and Velour were lovers; he ended their affair last month and threatened to expose her past as a former assassin (true). She used a fan-blade — a thin folded steel inside a feathered fan — and slipped it back into her train. The fan is still on her person. THREE other suspects have credible motive and will lie under questioning, making the deduction non-trivial.

PRINCIPLES:
- Combat is optional. The party can solve this entirely through interrogation, evidence, and one lab/library check. Combat triggers ONLY if Madame Coquette is cornered AND chooses to fight.
- Seven NPC suspects, but only four matter: Madame Coquette, the Brother (Reginald, debt-ridden), the Steward (Giles, embezzling), the Visiting Ambassador (Lady Thorne, here for blackmail). Track their alibis tightly.
- Time-sliced — events happen on bells (8th = doors sealed; 9th = body discovered; 10th = a SECOND murder if the party hasn't named a suspect; 12th = doors open and killer escapes).
- Reward investigation: every clue uncovered narrows suspects. Be specific in narration ("Lady Thorne's perfume but no perfume on the body" etc.).

TONE: Glittering surface, knife under the table, escalating clock.`,
  keyNpcs: [
    { id: "captain_byrn", name: "Captain Byrn", role: "Velour's sworn captain; deputises the party; gruff but reasonable; rules out himself by being on the gate", introducedAtStart: true },
    { id: "madame_coquette", name: "Madame Coquette", role: "TRUE KILLER — opera singer; charming, articulate; fan never leaves her hand; pretends to grieve", introducedAtStart: true },
    { id: "reginald_velour", name: "Reginald Velour", role: "Lord Velour's younger brother; gambling debts; inheritor; sweating in his red domino mask", introducedAtStart: true },
    { id: "giles_steward", name: "Giles, the Steward", role: "Embezzling from the estate; terrified the audit will surface; was alone in the wine cellar at the time", introducedAtStart: true },
    { id: "lady_thorne", name: "Lady Thorne", role: "Visiting ambassador; blackmailing Velour over an old border treaty; cold, polished, openly hostile", introducedAtStart: true },
  ],
  encounters: [
    {
      id: "scene_of_death",
      label: "Behind the throne — examine the body",
      act: 1, type: "discovery",
      expReward: 40,
      notes: "Investigation set-piece. The throne dais. Single thin puncture wound. No blood-spatter on the carpet front (so the killer was BEHIND when stabbing). A single feather caught in the velvet — white-and-gold — matches Madame Coquette's costume but ALSO matches several others.",
    },
    {
      id: "interrogations_round_one",
      label: "Round one — alibis from the four suspects",
      act: 1, type: "social",
      expReward: 80,
      notes: "Each suspect gives an alibi. Reginald: 'in the gardens'. Giles: 'wine cellar, alone'. Lady Thorne: 'with the foreign delegation'. Madame Coquette: 'rehearsing my second-act aria, the staff heard me'. Three lies and one truth — Madame's claim is verifiable as TRUE for her singing (a servant heard) but says nothing about a 4-minute gap mid-aria.",
    },
    {
      id: "ninth_bell_evidence",
      label: "Ninth bell — the lab/library find",
      act: 2, type: "puzzle",
      expReward: 60,
      notes: "If the party investigates Velour's study OR pressures the household: a torn letter naming a 'dangerous mistake from her past' addressed to one of the suspects. Plus, a wound-thickness check — the puncture is too narrow for any normal dagger. Hints toward a concealed weapon.",
    },
    {
      id: "tenth_bell_second_murder",
      label: "Tenth bell — second murder (failure trigger)",
      act: 2, type: "discovery",
      expReward: 30,
      notes: "FIRES ONLY if no suspect has been formally accused by the tenth bell. Captain Byrn is found stabbed in the same way in the servants' corridor. The party realises the killer is targeting witnesses. Increases tension; gives ONE last clue: a footprint in his blood matching Madame's heels.",
    },
    {
      id: "fan_revealed",
      label: "Eleventh bell — the fan is revealed",
      act: 3, type: "social",
      expReward: 100,
      notes: "If the party asks to see Madame Coquette's fan, she refuses. If they call for the Captain or insist, the fan unfolds and the blade is visible. She drops the act and either flees (toward midnight bell), surrenders (rare; possible if the party offered mercy in dialogue), or fights. Confession scene: she explains the affair, the threat, the impulse.",
    },
    {
      id: "boss_madame_combat",
      label: "Optional finale — Madame Coquette fights",
      act: 3, type: "combat",
      enemies: [
        { name: "Madame Coquette", hp: 140, atk: 24, def: 6, isBoss: true, phaseThresholds: [0.4] },
        { name: "Hired Bodyguard", hp: 50, atk: 14 },
      ],
      expReward: 200,
      notes: "ONLY fires if 'fan_revealed' ended in combat (she fights). Phase 1: standard fan-fighting with poisoned darts (-2 ATK debuff). Phase 2 (HP<40%): she retreats to the chandelier room, climbs, fights from above. The party can finish her or accept a non-lethal arrest (she will face a ducal court — narrate as a complete win).",
    },
  ],
  acts: [
    { act: 1, label: "The Body — eighth bell, doors sealed", triggers: ["scene examined", "first round of interrogations completed"] },
    { act: 2, label: "Threads — ninth bell", triggers: ["lab/library evidence found OR tenth-bell second murder occurs"] },
    { act: 3, label: "The Unmasking — eleventh bell", triggers: ["accusation made", "fan revealed"] },
  ],
  quests: [
    {
      id: "find_the_killer",
      name: "Identify Lord Velour's killer before midnight",
      type: "main",
      objective: "Name and confront the killer before the doors open at the twelfth bell.",
      completedWhen: "fan_revealed",
      reward: { exp: 220, currency: 250, item: "Velour Family Crest Pin (open social doors at any noble venue)" },
    },
    {
      id: "prevent_second_murder",
      name: "Prevent further deaths",
      type: "side",
      objective: "Name a suspect before the tenth bell.",
      completedWhen: "tenth_bell_second_murder",
      reward: { notes: "Failed if Captain Byrn dies — narrate accordingly. Quest auto-completes by being TRIGGERED, but reward is conditional." },
    },
    {
      id: "uncover_three_motives",
      name: "Uncover the suspects' motives",
      type: "side",
      objective: "Find the secret motives of at least three of the four key suspects.",
      completedWhen: "ninth_bell_evidence",
      reward: { exp: 60, notes: "Three favours owed by surviving suspects — usable in future urban adventures." },
    },
    {
      id: "spare_madame",
      name: "Spare Madame Coquette",
      type: "hidden",
      objective: "Resolve the unmasking without killing the suspect.",
      completedWhen: "fan_revealed",
      reward: { exp: 80, notes: "Mercy noted by the duchy — opens a future 'redeemed assassin' companion arc." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 3,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "captain_byrn_briefs_party",
      "scene_of_death",
      "interrogations_round_one",
      "white_feather_clue",
      "ninth_bell_evidence",
      "tenth_bell_second_murder",
      "fan_clue_surfaces",
      "fan_revealed",
      "midnight_bell_approaches",
    ],
    playerKnows: ["Lord Velour was stabbed behind his throne", "the doors are sealed until the twelfth bell", "seven masked guests of note are in the manor"],
    playerDoesntKnow: [
      "the killer is Madame Coquette",
      "she used a fan-blade hidden in her costume",
      "she and Velour were ex-lovers and he threatened to expose her past",
      "two other suspects (Reginald, Giles) have separate guilty secrets that will look incriminating",
    ],
    activeThreats: ["midnight_doors_open", "killer_will_strike_again", "innocents_being_falsely_suspected"],
    mood: "polished menace",
    partyLevel: 3,
    questLog: ["Find Lord Velour's killer before midnight"],
  },
};

// ─── Adventure 5: The Siege of Greyhold (epic combat / tactical defense) ──
//
// The longest combat-forward adventure — a tower-defense style stand
// against a lich's undead horde. Validates party-level tactical planning
// (where to fortify, who to evacuate) on top of the boss-phase mechanics.

const SIEGE_GREYHOLD: RpgAdventure = {
  id: "rpg-siege-greyhold",
  worldId: "western-fantasy",
  title: "The Siege of Greyhold",
  hook: "You arrive at Greyhold the night before the assault. The walls are old. The garrison is forty men. The lich Aramor's horde marches at dawn — twelve hundred strong.",
  partySize: 4,
  estimatedDuration: "45-60 min",
  directorBrief: `Greyhold is the last frontier fortress between the kingdom's heartland and the Whitebone Wastes. For centuries it has been a quiet posting — until last season, when Aramor the Pale, an ancient lich, rose from a barrow and began gathering a horde. He marches at dawn. The party is the relief force the kingdom could spare on short notice: four heroes, where a thousand were needed.

THE TRUTH (only the GM knows): Aramor's phylactery is hidden inside his own ribcage — a black opal fused to his sternum. Standard combat will break his current body but he will reform within a day. The ONLY way to end the siege permanently is to expose the phylactery (Phase 2 mechanic) and shatter it (Phase 3). Captain Brenna of the Greyhold garrison has fragments of this lore but no proof. The library scribe (Thessaly) can confirm if consulted.

PRINCIPLES:
- The night-before phase IS the adventure as much as the battle. The party makes 3-4 fortification choices that mechanically affect the assault: which gate to reinforce (changes which wall the horde breaches), evacuate the village or arm the villagers (gain reserves but lose moral high ground), study Aramor or rest (Aramor study unlocks the phylactery hint; rest grants HP bonus).
- The assault unfolds in three waves, each on a wall section. Party splits to defend (or stays together and one wall falls — narrate consequence).
- Boss Aramor descends in Wave 3. He is HARD by design (lich-tier). The party MUST learn the phylactery trick or lose narrative weight even on victory.
- Every named soldier matters. Mention Brenna, Sergeant Dax, the scribe Thessaly, the kid Pell ringing the alarm bell. If they die, narrate it specifically.

TONE: Cosy night before → quiet dread → all-out tactical war.`,
  keyNpcs: [
    { id: "captain_brenna", name: "Captain Brenna", role: "Greyhold's commander; tired, capable, will trust the party if shown competence in Act 1", introducedAtStart: true },
    { id: "scribe_thessaly", name: "Thessaly the scribe", role: "Old library woman; knows the phylactery lore if asked; appears at her library all of Act 1", introducedAtStart: true },
    { id: "sergeant_dax", name: "Sergeant Dax", role: "Veteran of three wars; offers tactical advice on fortification choices; defends whichever wall the party doesn't", introducedAtStart: true },
    { id: "pell_the_alarm_kid", name: "Pell, the alarm-bell kid", role: "Twelve-year-old village orphan stationed at the bell tower; appears in Act 2; in danger throughout Act 3", appearsInAct: 2 },
    { id: "aramor_the_pale", name: "Aramor the Pale", role: "LICH — appears only in Act 3 Wave 3; calm, ancient, weary of his own immortality", appearsInAct: 3 },
  ],
  encounters: [
    {
      id: "fortification_council",
      label: "The night before — fortification council",
      act: 1, type: "social",
      expReward: 60,
      notes: "Party + Brenna + Dax sit around a map. THREE choices to make: (1) reinforce north gate OR south gate (the horde will breach the OTHER); (2) evacuate the village OR arm the villagers (60 reserves if armed, +moral if evacuated); (3) study Aramor in the library OR drill the soldiers (study = phylactery hint; drill = +5 ATK to all defenders next day). Narrate consequences in real time.",
    },
    {
      id: "thessaly_phylactery_lore",
      label: "Thessaly reveals the phylactery",
      act: 1, type: "discovery",
      expReward: 80,
      notes: "Triggers if the party visits the library OR chose 'study Aramor'. Thessaly explains: a lich's true life is bound to a phylactery — usually a hidden object, but Aramor's is FUSED INTO his ribcage. To kill him forever: stagger him to expose it (HP<50%), then shatter it. Without this knowledge the boss CANNOT be permanently defeated.",
    },
    {
      id: "first_wave_skirmishers",
      label: "Wave 1 — skeleton skirmishers at the wall",
      act: 2, type: "combat",
      enemies: [
        { name: "Skeleton Skirmisher", hp: 30, atk: 12 },
        { name: "Skeleton Skirmisher", hp: 30, atk: 12 },
        { name: "Skeleton Skirmisher", hp: 30, atk: 12 },
        { name: "Skeleton Skirmisher", hp: 30, atk: 12 },
      ],
      expReward: 100,
      notes: "Easy wave to test the formation. The reinforced gate holds; the OTHER wall takes minor damage. Casualties among NPC defenders depend on choices: armed villagers = 5 dead, evacuated = 0 villagers but 3 soldiers down.",
    },
    {
      id: "second_wave_wraith_riders",
      label: "Wave 2 — wraith riders breach a wall",
      act: 2, type: "combat",
      enemies: [
        { name: "Wraith Rider", hp: 75, atk: 18, def: 6 },
        { name: "Wraith Rider", hp: 75, atk: 18, def: 6 },
        { name: "Bone Mount", hp: 50, atk: 10 },
        { name: "Bone Mount", hp: 50, atk: 10 },
      ],
      expReward: 160,
      notes: "Hard wave. They breach whichever wall the party did NOT reinforce. Sergeant Dax may be fatally wounded here (narrate his death if the party stays at the OTHER wall). Pell rings the alarm bell mid-wave — he's now a target.",
    },
    {
      id: "boss_aramor",
      label: "Wave 3 — Aramor descends",
      act: 3, type: "combat",
      enemies: [
        { name: "Aramor the Pale", hp: 360, atk: 36, def: 18, isBoss: true, phaseThresholds: [0.66, 0.33] },
        { name: "Bone Knight", hp: 90, atk: 20, def: 10 },
        { name: "Bone Knight", hp: 90, atk: 20, def: 10 },
      ],
      expReward: 320,
      notes: "Boss has 3 phases. Phase 1 (full lich): ranged necrotic blasts + raises one fallen NPC defender as a Bone Thrall per turn. Phase 2 (HP<66%): rib cage cracks open, exposing the black opal phylactery. Players who learned the phylactery trick (thessaly_phylactery_lore) can target it specifically — direct hits on the opal deal 3x damage. Phase 3 (HP<33%): Aramor goes berserk, AoE necrotic wave (-15 HP all party, -10 HP all defenders). To END HIM: shatter the phylactery (a single called shot once exposed). Without the lore, the party can defeat his body but the campaign-wide narration notes 'he will return'.",
    },
  ],
  acts: [
    { act: 1, label: "The Night Before — Greyhold prepares", triggers: ["fortification council completed", "library OR drill choice resolved"] },
    { act: 2, label: "The Walls — first two waves", triggers: ["first wave repelled", "second wave breach contained"] },
    { act: 3, label: "Aramor — the lich descends", triggers: ["wave 3 begins", "phylactery exposed OR ignored"] },
  ],
  quests: [
    {
      id: "hold_greyhold",
      name: "Hold Greyhold against the horde",
      type: "main",
      objective: "Survive all three waves of the assault.",
      completedWhen: "boss_aramor",
      reward: { exp: 320, currency: 400, item: "Greyhold Standard (heirloom — +2 ATK in any future siege)" },
    },
    {
      id: "expose_phylactery",
      name: "End Aramor permanently",
      type: "main",
      objective: "Learn what binds Aramor to life — and shatter it.",
      completedWhen: "thessaly_phylactery_lore",
      reward: { exp: 80, notes: "Required to make the boss kill stick. Failure leaves Aramor to return in a future season." },
    },
    {
      id: "save_pell",
      name: "Keep Pell alive",
      type: "side",
      objective: "Protect the alarm-bell kid through the assault.",
      completedWhen: "boss_aramor",
      reward: { exp: 80, item: "Pell's Brass Bell (rings once to grant +5 to all party defense)", notes: "Auto-grants if Wave 2 was contained and party stays near the bell tower in Wave 3 narration." },
    },
    {
      id: "save_dax",
      name: "Save Sergeant Dax",
      type: "hidden",
      objective: "Prevent the veteran sergeant's death at the breached wall.",
      completedWhen: "second_wave_wraith_riders",
      reward: { exp: 60, notes: "Dax becomes a recruitable companion in any future Western Fantasy siege adventure." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 4,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "arrival_at_greyhold",
      "fortification_council",
      "thessaly_phylactery_lore",
      "drill_or_study_choice",
      "first_wave_skirmishers",
      "second_wave_wraith_riders",
      "wall_breach_consequences",
      "boss_aramor",
      "phylactery_exposed",
      "phylactery_shattered",
    ],
    playerKnows: ["the lich Aramor marches at dawn with a horde of twelve hundred", "Greyhold has 40 soldiers and a small village"],
    playerDoesntKnow: [
      "Aramor's phylactery is fused inside his own ribcage",
      "without exposing and shattering it, he will reform within a day",
      "Captain Brenna suspects this but has no proof",
      "Thessaly the scribe holds the lore",
    ],
    activeThreats: ["dawn_assault", "garrison_outnumbered_30_to_1", "village_in_path"],
    mood: "grim resolve",
    partyLevel: 5,
    questLog: ["Hold Greyhold against Aramor's horde"],
  },
};

// ─── Adventure 6: The Sunken Crown of Mara (sea / treasure hunt) ──────────
//
// Naval / underwater adventure. Validates the structure under a setting
// where mobility itself (a ship) is a recurring resource and the boss
// is reached via a multi-stage descent.

const SUNKEN_CROWN: RpgAdventure = {
  id: "rpg-sunken-crown",
  worldId: "western-fantasy",
  title: "The Sunken Crown of Mara",
  hook: "Two centuries ago Queen Mara's flagship vanished with the royal crown aboard. Last week a fisherman pulled a single golden tine from the deep. The race for the wreck has begun.",
  partySize: 3,
  estimatedDuration: "45-60 min",
  directorBrief: `Two hundred years ago, Queen Mara's flagship Imperatrix vanished in the Saltbrood Reefs during a sudden storm. With it went the Crown of the Tides, the kingdom's foundational regalia. Last week, a Driftwater fisherman hauled up a golden crown-tine. Three captains now race for the wreck: Captain Calyx (the party's hire — efficient, fair), Black Saala (pirate; will take the crown by force), and the Order of the Drowned Saint (cult who believe Mara should stay drowned).

THE TRUTH (only the GM knows): The Imperatrix did not sink in a storm. Queen Mara, dying of plague she would NOT bring back to court, ordered her own ship scuttled with her aboard. She bound her dying breath to the crown so it would never crown a living monarch again. The crown is now haunted by her shade — anyone who lifts it from the wreck must promise her something binding. The cult is, in fact, correct: raising the crown will free Mara's vengeful spirit on the kingdom. The party will choose: surface with the crown (and the haunting), leave it (the cult stops fighting them), or strike a bargain with Mara's shade (binds the party to a future quest).

PRINCIPLES:
- The ship Calyx pilots IS a third character — repairs, choices about heading, and crew interactions matter. Treat it as a "party member" in narration.
- Three races converge at the reef: pick your fights. Black Saala is the combat threat; the cult is a moral / negotiation thread; the wreck itself is the puzzle.
- Underwater diving has limited time (3 dives, each ~2 turns of action). Party MUST plan what to do per dive — explore, recover, fight.
- Mara's shade is gentle, sad, articulate. NOT a horror monster. Her boss form fires only if the party tries to take the crown without speaking to her.

TONE: Briny adventure → captain politics at sea → eerie wreck → moral choice with the dead queen.`,
  keyNpcs: [
    { id: "captain_calyx", name: "Captain Calyx", role: "Owns the Wavecrest; efficient salvage captain; trusts the party but expects an honest split", introducedAtStart: true },
    { id: "black_saala", name: "Black Saala", role: "Pirate captain of the Brine Fang; beautiful, brutal, will board the party's ship in Act 2", introducedAtStart: true },
    { id: "drowned_saint", name: "The Drowned Saint", role: "Cult leader (a former monk); his cultists circle in coracles; will hail the party and beg them to leave the crown", appearsInAct: 1 },
    { id: "first_mate_perro", name: "First Mate Perro", role: "Calyx's first mate; old salt; mutters about bad omens; useful diving partner", introducedAtStart: true },
    { id: "queen_mara_shade", name: "Queen Mara's Shade", role: "Appears only on the third dive into the captain's cabin; sad, articulate, NOT hostile unless the crown is taken without dialogue", appearsInAct: 3 },
  ],
  encounters: [
    {
      id: "saltbrood_passage",
      label: "Sailing the Saltbrood reefs",
      act: 1, type: "puzzle",
      expReward: 60,
      notes: "Calyx asks the party to call shifts at the wheel. Reefs are visible only from the crow's nest. A scholar/perception check OR a roll-with-the-tide approach get them through. Failure costs a sail (narrated; affects a later escape).",
    },
    {
      id: "cult_hail",
      label: "The Drowned Saint hails the ship",
      act: 1, type: "social",
      expReward: 50,
      notes: "Coracles encircle the Wavecrest under white flag. The Drowned Saint speaks calmly: 'Whatever you find below, leave it. The kingdom is not ready for what is in that crown.' Party can talk, dismiss, or attack (cult will withdraw if attacked but warn that the fight isn't over).",
    },
    {
      id: "saala_boarding",
      label: "Black Saala boards the Wavecrest",
      act: 2, type: "combat",
      enemies: [
        { name: "Black Saala", hp: 130, atk: 24, def: 8 },
        { name: "Brine Fang Pirate", hp: 50, atk: 14 },
        { name: "Brine Fang Pirate", hp: 50, atk: 14 },
        { name: "Brine Fang Pirate", hp: 50, atk: 14 },
      ],
      expReward: 180,
      notes: "Mid-Act 2 boarding action. Saala fights herself in this encounter (she is NOT the boss, just a tough mid-combat). On defeat she retreats to her ship and may return in Act 3 if the party is slow. Sparing her unlocks a future pirate-captain favour.",
    },
    {
      id: "first_dive",
      label: "First dive — the ship's hull",
      act: 2, type: "discovery",
      expReward: 50,
      notes: "Limited time. The party can recover salvage (gold), rescue a trapped sailor's bones (lore — confirms the scuttling), or look for an entry to the lower decks. Pick ONE focus per dive.",
    },
    {
      id: "second_dive",
      label: "Second dive — the gun deck",
      act: 2, type: "combat",
      enemies: [
        { name: "Drowned Sailor", hp: 55, atk: 16 },
        { name: "Drowned Sailor", hp: 55, atk: 16 },
        { name: "Reef Eel", hp: 40, atk: 18, def: 4 },
      ],
      expReward: 130,
      notes: "Drowned crew animated by the binding's overflow — easy to put to rest with a gentle word (party can BYPASS combat by speaking to them, narrated as them sinking peacefully). Reef eel is opportunistic and won't stop until killed.",
    },
    {
      id: "boss_mara_shade",
      label: "Third dive — Queen Mara's cabin",
      act: 3, type: "social",
      enemies: [
        { name: "Queen Mara's Shade (boss form)", hp: 200, atk: 28, def: 10, isBoss: true, phaseThresholds: [0.5] },
      ],
      expReward: 260,
      notes: "Combat ONLY fires if the party tries to take the crown without speaking to her. The encounter STARTS as social — Mara's shade speaks softly, asks why they came, asks what they would do with the crown. Players who promise something binding (return it to a temple, never crown a king with it, etc.) can take the crown peacefully (combat skipped, narrate the choice). Players who lie OR grab and run trigger Phase 1 (haunting attacks). Phase 2 (HP<50%): she begs them to listen — combat can still end here with a sincere apology + promise.",
    },
  ],
  acts: [
    { act: 1, label: "Setting Sail — three captains converge", triggers: ["passage cleared", "cult hail responded to"] },
    { act: 2, label: "The Wreck — boarding and diving", triggers: ["Saala dealt with", "first dive completed", "second dive completed"] },
    { act: 3, label: "The Queen — the crown and the choice", triggers: ["third dive begun", "Mara's shade addressed"] },
  ],
  quests: [
    {
      id: "find_the_crown",
      name: "Find the Crown of the Tides",
      type: "main",
      objective: "Recover (or decide the fate of) the Crown of the Tides from the Imperatrix wreck.",
      completedWhen: "boss_mara_shade",
      reward: { exp: 260, currency: 500, item: "A binding promise (notes only — Mara may call on you)" },
    },
    {
      id: "best_black_saala",
      name: "Drive off the Brine Fang",
      type: "side",
      objective: "Defeat or repel Black Saala's boarding action.",
      completedWhen: "saala_boarding",
      reward: { exp: 180, currency: 200, item: "Saala's Cutlass (sharper than steel — +3 ATK)" },
    },
    {
      id: "lay_drowned_to_rest",
      name: "Lay the drowned crew to rest",
      type: "side",
      objective: "Free the Imperatrix's bound sailors.",
      completedWhen: "second_dive",
      reward: { exp: 130, notes: "The sea grants the party safe passage in any future Western Fantasy sea adventure." },
    },
    {
      id: "heed_the_drowned_saint",
      name: "Listen to the cult's warning",
      type: "hidden",
      objective: "Hear the Drowned Saint's warning before going below.",
      completedWhen: "cult_hail",
      reward: { exp: 50, notes: "If the party also chooses to leave the crown in Act 3, the cult dedicates a shrine to them." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 2,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "wavecrest_sets_sail",
      "saltbrood_passage",
      "cult_hail",
      "saala_boarding",
      "first_dive",
      "second_dive",
      "queen_mara_addressed",
      "boss_mara_shade",
      "crown_taken_or_left",
    ],
    playerKnows: ["a fisherman pulled a golden tine from the Saltbrood Reefs", "three captains race for the wreck (Calyx, Black Saala, the Drowned Saint cult)"],
    playerDoesntKnow: [
      "Queen Mara scuttled her own ship to die at sea",
      "the crown is bound to her dying breath",
      "the cult is warning of a real haunting",
      "raising the crown without dialogue will free a vengeful queen on the kingdom",
    ],
    activeThreats: ["pirate_saala_pursuit", "limited_dive_time", "cult_intervention"],
    mood: "briny adventure",
    partyLevel: 4,
    questLog: ["Recover the Crown of the Tides from the Imperatrix"],
  },
};

// ─── Adventure 7: The Vault of the Glassmith (heist / stealth puzzle) ─────
//
// Heist adventure — three-phase infiltration of an enchanted vault.
// Combat is NOT the focus; puzzle, stealth, and one possible boss
// confrontation if the party blows the heist.

const VAULT_GLASSMITH: RpgAdventure = {
  id: "rpg-vault-glassmith",
  worldId: "western-fantasy",
  title: "The Vault of the Glassmith",
  hook: "The Archmage Vorenne keeps a Sun-Glass that can scry any face in the kingdom. Tonight only, the wards thin for the equinox. You have one shift of the moon to take it.",
  partySize: 3,
  estimatedDuration: "30-45 min",
  directorBrief: `Archmage Vorenne, the Glassmith of the Spire, crafted the Sun-Glass — a scrying mirror that can find any face in the kingdom by name. He uses it to find runaway debtors and sometimes worse. Your patron — the deposed Lord Marrick — wants the glass before Vorenne uses it on his hidden daughter. The wards on the Spire's vault thin only at the equinox midnight. You have ONE pass: from moonrise to moonset, six hours.

THE TRUTH (only the GM knows): The Sun-Glass was forged with a piece of Vorenne's own soul. He will know the moment it leaves the Spire. Trying to take it triggers a tracking link. The party can: (1) extract the glass and outrun him (combat finale), (2) destroy the glass on the way out (Vorenne is wounded, no chase), or (3) replace it with the decoy Lord Marrick provided in the briefing — but the decoy will fail in 3 days and Vorenne will know who took the original. Each ending sets up a different future.

PRINCIPLES:
- Three security layers, three rooms: the Glass Garden (sound/light puzzle), the Library Rotunda (riddle puzzle), the Vault Chamber (the prize, plus a possible reflection-construct).
- Loud play (combat) DRAINS the equinox window. Each combat that fires deducts an "hour" of moonlight. If the party takes more than 4 hours, Vorenne returns and the heist becomes a boss fight.
- Stealth is rewarded: full silent runs unlock a hidden bonus (Vorenne's diary — leverage).
- Lord Marrick is NOT a noble villain. He's a desperate father. The party can betray him to Vorenne for a richer reward (and break his daughter's safety) — narrative choice, not a railroad.

TONE: Cool blue moonlight → puzzle silences → tension build → either silent triumph or chase.`,
  keyNpcs: [
    { id: "lord_marrick", name: "Lord Marrick (deposed)", role: "Desperate, intelligent patron; provides the decoy and the layout; expects the glass back at dawn", introducedAtStart: true },
    { id: "archmage_vorenne", name: "Archmage Vorenne", role: "Glassmith of the Spire; absent during the heist (at the equinox observatory); appears only in failure / chase finale", appearsInAct: 3 },
    { id: "spire_apprentice", name: "Tilda the apprentice", role: "Junior mage left to mind the spire; appears in the Library Rotunda; can be fooled, bluffed, or knocked out", appearsInAct: 1 },
    { id: "vault_construct", name: "The Reflection", role: "A silver-glass golem inside the vault; a mirror of whoever opens the vault door", appearsInAct: 2 },
  ],
  encounters: [
    {
      id: "glass_garden_puzzle",
      label: "The Glass Garden — silent crossing",
      act: 1, type: "puzzle",
      expReward: 60,
      notes: "First room. Crystal flowers chime if disturbed by sound or light. Party must cross silently — solutions: blow out lanterns and walk slowly, magic-muffle, or one party member distracts (loud) while others slip through (alarms a stage but bypasses the garden). Loud cross = -1 hour from the moon clock.",
    },
    {
      id: "library_riddle",
      label: "The Library Rotunda — Tilda and the riddle door",
      act: 1, type: "social",
      expReward: 80,
      notes: "Tilda the apprentice is reading by candlelight; the door to the next room is sealed by a riddle she's been told the answer to. Party can: bluff her ('we are Vorenne's couriers'), bribe her, knock her out (silent if fast — costs 0 hours; loud takes -1 hour), OR convince her to ask Vorenne herself (catastrophic, ends the heist). Riddle: 'I have a face but no eyes; I show truth but cannot lie' — answer 'a mirror'.",
    },
    {
      id: "vault_door_reflection",
      label: "The Vault Chamber — the Reflection wakes",
      act: 2, type: "combat",
      enemies: [
        { name: "The Reflection", hp: 130, atk: 22, def: 10, isBoss: true, phaseThresholds: [0.5] },
      ],
      expReward: 200,
      notes: "Inside the vault. Whoever opens the door triggers the Reflection — a silver-glass mirror of the opener with their stats. Phase 1: identical to the opener (mirror match). Phase 2 (HP<50%): the Reflection inverts — it now mimics a DIFFERENT party member. Defeat ends the encounter quietly (no moon clock cost). Party can BYPASS by having a non-party member (Tilda if befriended, OR a summoned creature) open the door — narrate as clever play.",
    },
    {
      id: "claim_the_sunglass",
      label: "Claim the Sun-Glass — three choices",
      act: 2, type: "discovery",
      expReward: 120,
      notes: "The Sun-Glass sits in the centre of the vault chamber. THREE choices spelled out: (1) take it (triggers Vorenne's tracking link — chase finale), (2) replace it with Marrick's decoy (delays detection 3 days; sets up a future adventure), (3) destroy it on the spot (huge magical backlash, -10 HP all party, but Vorenne is wounded and no chase). Narrate the trade-offs in real time.",
    },
    {
      id: "boss_vorenne_chase",
      label: "Chase finale — Vorenne returns",
      act: 3, type: "combat",
      enemies: [
        { name: "Archmage Vorenne", hp: 280, atk: 32, def: 14, isBoss: true, phaseThresholds: [0.66, 0.33] },
        { name: "Glass-Spider Familiar", hp: 60, atk: 16 },
      ],
      expReward: 280,
      notes: "FIRES ONLY if the party took the glass without destroying it AND was loud enough to spend more than 4 'hours' in the spire (or chose option 1 above). Phase 1: Vorenne fights from the spire balcony with bound-light blasts. Phase 2 (HP<66%): he summons reflections of the party from his own glass (each reflection has half the original's HP). Phase 3 (HP<33%): he tries to grab the Sun-Glass back — a successful grapple ends the heist in failure (he scries the party's sleeping faces forever). Defeat earns the glass clean.",
    },
  ],
  acts: [
    { act: 1, label: "Moonrise — into the Spire", triggers: ["Glass Garden crossed", "Library Rotunda passed"] },
    { act: 2, label: "The Vault — the Sun-Glass", triggers: ["Reflection bested or bypassed", "Sun-Glass claim choice made"] },
    { act: 3, label: "Moonset — extraction (or chase)", triggers: ["clean exit OR Vorenne returns"] },
  ],
  quests: [
    {
      id: "steal_the_sunglass",
      name: "Steal the Sun-Glass",
      type: "main",
      objective: "Recover (or destroy / decoy) the Sun-Glass before moonset.",
      completedWhen: "claim_the_sunglass",
      reward: { exp: 240, currency: 400, item: "Marrick's Favour (a deposed lord owes you a real debt)" },
    },
    {
      id: "silent_run",
      name: "Run the heist without raising alarm",
      type: "side",
      objective: "Pass both the Glass Garden and the Library without any combat.",
      completedWhen: "library_riddle",
      reward: { exp: 100, item: "Vorenne's Diary (leverage on a powerful archmage)" },
    },
    {
      id: "spare_tilda",
      name: "Spare the apprentice",
      type: "side",
      objective: "Get past Tilda without harming or knocking her out.",
      completedWhen: "library_riddle",
      reward: { exp: 60, notes: "Tilda may surface as an ally in a future spire adventure." },
    },
    {
      id: "destroy_the_glass",
      name: "Destroy the Sun-Glass",
      type: "hidden",
      objective: "Break the glass instead of taking it — ending its threat permanently.",
      completedWhen: "claim_the_sunglass",
      reward: { exp: 80, notes: "Marrick is furious but his daughter is safe; the kingdom is freer." },
    },
  ],
  initialGmState: {
    act: 1,
    tension: 3,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "marrick_briefing",
      "moonrise_at_the_spire",
      "glass_garden_puzzle",
      "library_riddle",
      "vault_door_reflection",
      "claim_the_sunglass",
      "moon_clock_warning",
      "boss_vorenne_chase",
      "exit_the_spire",
    ],
    playerKnows: ["the Sun-Glass scries any face in the kingdom by name", "the wards thin only at equinox midnight", "you have from moonrise to moonset"],
    playerDoesntKnow: [
      "the Sun-Glass contains a piece of Vorenne's soul",
      "taking it (without destroying it) creates a tracking link",
      "Lord Marrick's hidden daughter is the real target Vorenne would scry",
      "Tilda the apprentice can be bluffed out of the riddle",
    ],
    activeThreats: ["moonset_deadline", "vorenne_may_return_early_if_loud", "tracking_link_on_the_glass"],
    mood: "cool tension",
    partyLevel: 4,
    questLog: ["Steal the Sun-Glass before moonset"],
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const ALL_RPG_ADVENTURES: RpgAdventure[] = [
  STARFALL_DUNGEON,
  BEGGARS_COIN,
  WITCHWOOD_HUNT,
  MASQUERADE_VELOUR,
  SIEGE_GREYHOLD,
  SUNKEN_CROWN,
  VAULT_GLASSMITH,
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
