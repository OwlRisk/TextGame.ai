import { Flame, Swords, Drama } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId?: string;
  playerCount?: number;
  rpgWorldId?: string;
  rpgAdventureNotes?: string;
  cover?: string;
}

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  cover?: string;
  category: string;
  tags: string[];
  players: string;
  duration: string;
  style: "Casual" | "Strategic" | "Competitive";
  color: string;
  badge?: string;
  features?: string[];
  rules: string;
  templateId?: string;
  playerCount?: number;
  rpgWorldId?: string;
  rpgAdventureNotes?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const buildFallbackRules = (name: string) =>
  `OBJECTIVE: Play ${name} with clear goals and fair rules.\n\nSETUP:\n- Decide player count and roles\n- Prepare any materials or prompts\n\nGAMEPLAY:\n- Explain turn order\n- Define how players score or progress\n\nWINNING:\n- Decide how a winner is determined`;

export function getStyleColor(style: string) {
  switch (style) {
    case "Casual":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "Strategic":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "Competitive":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
  }
}

// ── RPG Adventures ──────────────────────────────────────────────────────────

export const RPG_ADVENTURES: GameTemplate[] = [
  {
    id: "rpg-jade-peak",
    name: "The Tournament of Jade Peak",
    description: "A martial arts tournament at the legendary Jade Peak sect. Compete, intrigue, and uncover a conspiracy threatening the martial world.",
    longDescription: "You and your companions arrive at Jade Peak for the annual martial arts tournament. But beneath the contests lies a conspiracy — someone is poisoning the participants, and ancient forbidden techniques are being traded in the shadows. Survive the tournament, uncover the truth, and decide the fate of the martial world.",
    icon: "⚔️",
    cover: "/games/game-cover-rpg-jade-peak.webp",
    category: "RPG",
    tags: ["Wuxia", "Combat", "Intrigue", "Open World"],
    players: "1 + 3 AI",
    duration: "30-60 min",
    style: "Strategic",
    color: "from-red-600 to-amber-900",
    badge: "NEW",
    features: ["Full RPG stats & leveling", "Narrative combat system", "Martial arts skills", "Faction reputation"],
    rules: "Fantasy RPG — Wuxia/martial arts world. Players explore, fight, and solve mysteries.",
    templateId: "custom",
    playerCount: 3,
    rpgWorldId: "wuxia",
    rpgAdventureNotes: `## The Tournament of Jade Peak

SETTING: Jade Peak (翠峰), a legendary mountain sect hosting the annual Grand Martial Tournament. Fighters from all sects gather to compete for glory and the right to study the Peak's secret sword manual.

OPENING: The party arrives at the base of Jade Peak at dawn. Tournament banners line the stone stairway. Registration is at the Hall of Echoes. The atmosphere is festive but tense — last year's champion vanished.

ACT 1 — ARRIVAL (Turns 1-6):
- Register for the tournament. Meet rival fighters from other sects.
- Explore the mountain: training grounds, the Misty Pavilion teahouse, the Forbidden Library (locked).
- First round of the tournament: 1v1 matches. Each party member fights a themed opponent.
- Clue: a participant is found unconscious, qi channels disrupted. Foul play suspected.

ACT 2 — CONSPIRACY (Turns 7-14):
- Tournament continues with team battles. The party fights together against a rival team.
- Investigation: someone is using a forbidden qi-disruption technique. Who?
- Key NPCs: Master Yun (tournament judge, seems fair but has secrets), Mei Ling (a scout from Tang Clan, suspicious), Iron Fist Chen (loud braggart, surprisingly helpful).
- The Forbidden Library contains clues but is guarded. Thieves can try to sneak in.
- Tension escalates: another contestant is poisoned. The tournament may be cancelled.

ACT 3 — CLIMAX (Turns 15+):
- The conspiracy is revealed: a rogue elder is stealing martial arts secrets and selling them to an enemy sect.
- Final battle: the rogue elder and his guards vs. the party. Boss fight.
- Rogue Elder: HP 200, ATK 30, DEF 20. Uses forbidden techniques. Has 2 elite guards (HP 80 each).
- Resolution: save the tournament, earn fame, potentially learn the secret sword manual.

LOOT TABLE:
- Common: Healing Herbs, Qi Restoration Pills, Steel Throwing Needles
- Uncommon: Shadow Step Manual (+3 SPD), Iron Shirt Technique (DEF +5), Dragon Whisker Tea (restore full MP)
- Rare: Jade Peak Sword Manual (new skill: Jade Tempest — 25 DMG, 20 MP), Seven Star Cape (DEF +8, SPD +3)
- Epic: Forbidden Qi Disruption Needle (single-use, stun boss for 2 turns)

ENCOUNTER TABLE:
- Training Ground: Sparring Puppet (HP 40, ATK 10) — warm-up fight, awards 20 EXP
- Tournament Round 1: Rival Fighter (HP 60, ATK 15) — 1v1, awards 40 EXP
- Tournament Round 2: Rival Team (3 fighters, HP 50 each, ATK 12) — team fight, awards 80 EXP total
- Night Ambush: 2 Assassins (HP 45, ATK 18, SPD 16) — caught investigating, awards 60 EXP
- Boss: Rogue Elder + 2 Guards — final battle, awards 200 EXP + epic loot`,
  },
  {
    id: "rpg-starfall-dungeon",
    name: "The Dungeon of Starfall",
    description: "Descend into an ancient dungeon beneath a fallen meteor. Traps, monsters, and a dragon await in the depths.",
    longDescription: "A star fell from the sky and struck the earth, revealing an ancient dungeon sealed for millennia. Your party ventures into the depths seeking treasure and glory. But the dungeon is alive with traps, monsters, and an ancient dragon who guards the Starfall Crystal — a gem of unimaginable power.",
    icon: "🐉",
    cover: "/games/game-cover-rpg-starfall-dungeon.webp",
    category: "RPG",
    tags: ["Fantasy", "Dungeon Crawl", "Combat", "Treasure"],
    players: "1 + 3 AI",
    duration: "30-60 min",
    style: "Strategic",
    color: "from-indigo-600 to-purple-900",
    badge: "NEW",
    features: ["Classic dungeon crawl", "Trap puzzles", "Boss battles", "Loot and leveling"],
    rules: "Fantasy RPG — Western fantasy dungeon crawl. Players explore, fight monsters, and collect loot.",
    templateId: "custom",
    playerCount: 3,
    rpgWorldId: "western-fantasy",
    rpgAdventureNotes: `## The Dungeon of Starfall

SETTING: The Starfall Crater — a massive impact site where a meteorite revealed an ancient dungeon. The entrance is a shattered marble archway glowing with faint blue runes. The local village of Ashwick has offered a bounty for clearing the dungeon.

OPENING: The party stands at the dungeon entrance. Cold air rises from below. Faint blue light pulses from deep within. Carved warnings in Old Elvish line the archway — "Turn back, mortals. The sleeper guards what was never meant to be found."

FLOOR 1 — THE ANTECHAMBER (Turns 1-5):
- Moss-covered stone corridors. Faded murals show ancient mages sealing something underground.
- Trap: pressure-plate arrows in the first corridor. Thief can detect and disarm. Warrior can shield the party.
- Encounter: 3 Giant Rats (HP 20, ATK 5). Easy warm-up fight. Awards 15 EXP each.
- Treasure Room: locked iron chest (Thief can pick). Contains 2 Health Potions and a Bronze Shield (DEF +3).
- Puzzle: a door with three rune slots. The murals contain clues. Mage can read the runes.

FLOOR 2 — THE CRYSTAL CAVERNS (Turns 6-12):
- Natural caves filled with glowing crystals. Some crystals are harmless; others explode if touched.
- Encounter: Crystal Golems (HP 60, ATK 14, DEF 12) — slow but hit hard. Weak to magic. Awards 50 EXP.
- Hidden area: a side passage leads to an underground lake. A water elemental guards a Rare weapon.
- Water Elemental: HP 80, ATK 16. Immune to physical attacks — mages must lead this fight. Awards 70 EXP.
- Rest point: a safe cave with a natural spring. Full HP/MP restoration.
- Encounter: Skeleton Warriors (HP 40, ATK 12). Rise from the ground. Clerics deal double damage. Awards 30 EXP each.

FLOOR 3 — THE DRAGON'S LAIR (Turns 13+):
- Massive cavern. Mountains of gold coins and ancient artifacts. The Starfall Crystal pulses on a pedestal.
- The dragon Ignathir awakens when anyone approaches the crystal.
- Boss: Ancient Dragon Ignathir — HP 300, ATK 35, DEF 25. Breathes fire (AOE 20 damage to all). Has 2 phases:
  Phase 1 (HP > 150): physical attacks + fire breath every 3 turns.
  Phase 2 (HP < 150): takes flight, only ranged/magic attacks work. Fire breath every 2 turns. Summons 2 Dragonlings (HP 30, ATK 10).
- Awards: 300 EXP. The Starfall Crystal (legendary accessory: +10 all stats). Dragon's Hoard: each player picks one epic item.

LOOT TABLE:
- Common: Health Potion (heal 30 HP), Mana Potion (restore 20 MP), Torch, Rope
- Uncommon: Bronze Shield (DEF +3), Silver Dagger (ATK +4, SPD +2), Arcane Focus (+5 spell damage)
- Rare: Flamebrand Sword (ATK +8, fire damage), Crystal Armor (DEF +10, resist magic), Staff of Starlight (ATK +6, MP +20)
- Epic: Dragon Scale Shield (DEF +15, fire immunity), Dragonslayer Bow (ATK +12, +20 vs dragons)
- Legendary: The Starfall Crystal (accessory: +10 ATK, DEF, SPD, LUK)

ENCOUNTER TABLE:
- Floor 1: Giant Rats (HP 20, ATK 5) ×3 — awards 45 EXP total
- Floor 2: Crystal Golems (HP 60, ATK 14) ×2 — awards 100 EXP total
- Floor 2: Water Elemental (HP 80, ATK 16) ×1 — awards 70 EXP
- Floor 2: Skeleton Warriors (HP 40, ATK 12) ×4 — awards 120 EXP total
- Floor 3: Ancient Dragon + 2 Dragonlings — awards 360 EXP total`,
  },
  {
    id: "rpg-cursed-crossroads",
    name: "The Cursed Crossroads",
    description: "A border town where Eastern and Western magic collide. Solve the curse before both worlds tear apart.",
    longDescription: "The border town of Yunjin sits where the martial arts world meets the realm of Western magic. A mysterious curse has sealed the town — no one can leave. Eastern qi and Western mana are clashing, creating chaos. Your party of mixed warriors must unite both traditions to break the curse and survive.",
    icon: "🌀",
    cover: "/games/game-cover-rpg-cursed-crossroads.webp",
    category: "RPG",
    tags: ["Mixed", "Mystery", "Combat", "Exploration"],
    players: "1 + 3 AI",
    duration: "30-60 min",
    style: "Strategic",
    color: "from-emerald-600 to-teal-900",
    badge: "NEW",
    features: ["Mixed Wuxia + Fantasy world", "Mystery & combat blend", "Faction diplomacy", "Dual magic systems"],
    rules: "Fantasy RPG — mixed world where Eastern martial arts and Western magic coexist. Players explore, investigate, and fight.",
    templateId: "custom",
    playerCount: 3,
    rpgWorldId: "western-fantasy",
    rpgAdventureNotes: `## The Cursed Crossroads

SETTING: Yunjin (云津), a border town where the martial world of the East meets the magical kingdoms of the West. An invisible barrier now surrounds the town — no one can leave. Eastern qi and Western mana are interfering with each other, causing wild magical phenomena.

OPENING: The party finds themselves trapped in Yunjin after the barrier appeared at midnight. Buildings shimmer between Eastern and Western architecture. A clocktower tolls thirteen. In the town square, a crystallized tree pulses with alternating qi and mana energy. The townsfolk are panicking.

ACT 1 — TRAPPED (Turns 1-6):
- Explore the town: the Eastern Quarter (teahouses, dojos), the Western Quarter (taverns, wizard shops), and the Neutral Market.
- Meet NPCs: Master Zhou (Eastern sage, calm, knows something), Archmage Helena (Western mage, arrogant but knowledgeable), Kai the Smuggler (knows the town's secrets).
- The barrier shocks anyone who touches it. Mana-based attacks and qi-based attacks both fail against it.
- Clue: the crystallized tree in the square is the focal point. It appeared the night the town's two greatest practitioners — one Eastern, one Western — had a duel.
- Minor encounters: Chaos Sprites (HP 25, ATK 8) — fragments of wild magic that attack randomly. Awards 20 EXP.

ACT 2 — INVESTIGATION (Turns 7-14):
- Find the two practitioners who dueled: Master Xu (missing, was experimenting with combining qi and mana) and Professor Blackwood (injured, hiding in the library).
- Blackwood reveals: they tried to merge Eastern and Western energy to create a new power source. It went wrong. The crystallized tree is the result — a rift anchor.
- To break the curse: need three fragments of the original catalyst, scattered across town.
- Fragment 1: In the collapsed Eastern dojo basement. Guarded by a Qi Wraith (HP 70, ATK 16). Awards 50 EXP.
- Fragment 2: In the Western wizard tower's top floor. Puzzle: rearrange magical runes to unlock the vault.
- Fragment 3: Kai the Smuggler has it. He'll trade it for clearing the Chaos Beasts from his warehouse. 4 Chaos Beasts (HP 45, ATK 12). Awards 40 EXP each.

ACT 3 — RESOLUTION (Turns 15+):
- Bring the three fragments to the tree. Master Xu appears — he's been hiding inside the rift, trying to fix it from within.
- Final choice: merge the energies properly (harder fight, better outcome) or forcefully separate them (easier, but damages the town).
- MERGE path: Boss fight against the Rift Guardian — a being of pure chaos energy. HP 250, ATK 28, DEF 18. Alternates between qi and mana attacks. Only combined Eastern+Western attacks deal full damage. Awards 250 EXP.
- SEPARATE path: Boss fight against two half-guardians. Qi Guardian (HP 120, ATK 22) and Mana Guardian (HP 120, ATK 22). Easier individually but fight simultaneously. Awards 180 EXP total.
- Resolution: the barrier falls. The town celebrates. Master Xu and Blackwood reconcile. The party gains fame in both worlds.

LOOT TABLE:
- Common: Dual-energy Potion (heal 20 HP + 15 MP), Chaos Shard (crafting material), Barrier Fragment (quest item)
- Uncommon: Qi-Infused Blade (ATK +5, +5 vs magical enemies), Mana-Woven Robe (DEF +4, MP +15), Shadow Talisman (SPD +4)
- Rare: Harmony Staff (ATK +7, boosts both qi and mana skills), Rift Walker Boots (SPD +6, LUK +4), Chaos Shield (DEF +8, reflects 5 damage)
- Epic: The Catalyst Shard (accessory: ATK +8, DEF +8, grants "Chaos Strike" skill — 30 DMG, 25 MP, ignores defense)`,
  },
];

/** RPG presets shown prominently on the Discover page */
export const ALL_PRESETS: GameTemplate[] = [
  ...RPG_ADVENTURES,
];

export function getPresetById(presetId: string | null): DiscoverPreset | null {
  if (!presetId) return null;
  const t = ALL_PRESETS.find((g) => g.id === presetId);
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: t.templateId ?? "custom",
    playerCount: t.playerCount,
    ...(t.cover ? { cover: t.cover } : {}),
    ...(t.rpgWorldId ? { rpgWorldId: t.rpgWorldId } : {}),
    ...(t.rpgAdventureNotes ? { rpgAdventureNotes: t.rpgAdventureNotes } : {}),
  };
}

/** The first RPG adventure — used as "Recommended Adventure" quick-start for new users */
export const RECOMMENDED_ADVENTURE = RPG_ADVENTURES[0];

export const CATEGORIES = [
  { id: "all",       label: "All Adventures",   icon: Flame },
  { id: "wuxia",     label: "Wuxia",            icon: Swords },
  { id: "fantasy",   label: "Fantasy",          icon: Drama },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  wuxia:   RPG_ADVENTURES.filter(t => t.rpgWorldId === "wuxia"),
  fantasy: RPG_ADVENTURES.filter(t => t.rpgWorldId === "western-fantasy"),
};
