import { Flame, Drama } from "lucide-react";
import { ALL_RPG_ADVENTURES, buildAdventureNotes, type RpgAdventure } from "@/lib/rpg/adventures";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId?: string;
  playerCount?: number;
  rpgWorldId?: string;
  /** Structured adventure id — when present, the runtime seeds gmState from
   *  the matching RpgAdventure (ingredients, secrets, threats, encounters). */
  rpgAdventureId?: string;
  /** Pre-rendered prose adventure brief. Derived from the structured
   *  adventure when one is available, but kept as an optional override so
   *  custom user games can still inject free-form notes. */
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
  rpgAdventureId?: string;
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

/**
 * UI-side metadata for each adventure — cards on the discover page,
 * tags, badges. The actual GM brief / NPCs / encounters live in the
 * structured definitions in `lib/rpg/adventures.ts` and are merged in
 * by `decorateRpgAdventures` below so we don't double-maintain them.
 */
interface RpgAdventureUiMeta {
  description: string;
  longDescription: string;
  icon: string;
  cover?: string;
  tags: string[];
  style: "Casual" | "Strategic" | "Competitive";
  color: string;
  badge?: string;
  features?: string[];
  rules: string;
}

const RPG_ADVENTURE_UI: Record<string, RpgAdventureUiMeta> = {
  "rpg-starfall-dungeon": {
    description: "Descend into an ancient dungeon beneath a fallen meteor. Traps, monsters, and a dragon await in the depths.",
    longDescription: "A star fell from the sky and struck the earth, revealing an ancient dungeon sealed for millennia. Your party ventures into the depths seeking treasure and glory. But the dungeon is alive with traps, monsters, and an ancient dragon who guards the Starfall Crystal — a gem of unimaginable power.",
    icon: "🐉",
    cover: "/games/game-cover-rpg-starfall-dungeon.webp",
    tags: ["Fantasy", "Dungeon Crawl", "Combat", "Treasure"],
    style: "Strategic",
    color: "from-indigo-600 to-purple-900",
    badge: "NEW",
    features: ["Classic dungeon crawl", "Trap puzzles", "Boss battles", "Loot and leveling"],
    rules: "Fantasy RPG — Western fantasy dungeon crawl. Players explore, fight monsters, and collect loot.",
  },
  "rpg-beggars-coin": {
    description: "The pickpocket who stole the prince's signet ring left only one clue — a copper coin marked with a beggar's sigil. Find the ring before dawn court convenes.",
    longDescription: "The capital city is in quiet chaos. Last night a pickpocket lifted the prince's signet ring at the harvest festival, and the throne wants it back by dawn. Three threads to pull: the coin (Underworld), the festival (witnesses), the palace (motive). Investigation-heavy Western Fantasy short-form — combat is optional, the moral choice at the rooftop chase finale is the real climax.",
    icon: "🪙",
    cover: "/games/game-cover-rpg-beggars-coin.webp",
    tags: ["Western Fantasy", "Urban Mystery", "Short Session", "Intrigue"],
    style: "Strategic",
    color: "from-amber-800 to-stone-900",
    badge: "NEW",
    features: ["~25 min session", "Three independent investigation threads", "Optional non-lethal boss resolution", "Faction-favour rewards"],
    rules: "Western Fantasy short-form — urban mystery. Recover the stolen signet ring before dawn.",
  },
  "rpg-witchwood-hunt": {
    description: "Three children have vanished on the strike of the chapel bell. Tonight is the fourth bell — and the woods are walking again.",
    longDescription: "Hollow Hearth is a logging village on the edge of the Witchwood, where every fifty years a bound banshee demands a 'voice'. Tonight she's three children short and the bell tolls one more time at dusk. Investigate the village, brave the wrong-feeling forest, and confront Mother Albinet at her hollow tree — three phases, three endings, none of them clean.",
    icon: "🌲",
    cover: "/games/game-cover-rpg-witchwood-hunt.webp",
    tags: ["Dark Fantasy", "Horror", "Investigation", "Boss Fight"],
    style: "Strategic",
    color: "from-emerald-900 to-stone-900",
    badge: "NEW",
    features: ["~35 min session", "Atmospheric horror — sound and absence", "Three-phase banshee boss", "Three endings (break / reforge / banish)"],
    rules: "Western Fantasy horror — investigate the cursed village and forest, then confront the banshee at the fourth bell.",
  },
  "rpg-masquerade-velour": {
    description: "Lord Velour is dead behind his own throne. The doors are sealed until midnight by enchantment. The killer is still here, behind a mask.",
    longDescription: "Seven masked guests of note. Twenty servants. One stab wound, one fan-blade, four hours until the doors unseal. A combat-light whodunit that rewards careful interrogation, evidence-gathering, and clean accusations. The finale can resolve in dialogue OR in a chandelier-room duel — your choice.",
    icon: "🎭",
    cover: "/games/game-cover-rpg-masquerade-velour.webp",
    tags: ["Western Fantasy", "Mystery", "Social", "Whodunit"],
    style: "Strategic",
    color: "from-rose-900 to-violet-950",
    badge: "NEW",
    features: ["~30 min session", "Combat is OPTIONAL — investigation focus", "Time-sliced bells (real ticking clock)", "Four credible suspects, three layered lies"],
    rules: "Western Fantasy whodunit — find the masked killer in a sealed manor before midnight.",
  },
  "rpg-siege-greyhold": {
    description: "Forty soldiers. One ancient lich. Twelve hundred undead at dawn. Choose where to fortify, who to evacuate, where to make your stand.",
    longDescription: "Greyhold's last night before the assault is half the adventure. Make three fortification choices, befriend Captain Brenna's garrison, and learn the lich Aramor's true secret in the library. Then hold three waves on the walls and face Aramor himself in a three-phase boss — ONLY a phylactery shot can end him for good. The longest, most tactical adventure on offer.",
    icon: "🏰",
    cover: "/games/game-cover-rpg-siege-greyhold.webp",
    tags: ["Western Fantasy", "Epic Combat", "Tactical", "Long Session"],
    style: "Strategic",
    color: "from-slate-700 to-stone-900",
    badge: "NEW",
    features: ["~50 min session", "Pre-battle fortification choices matter mechanically", "Three siege waves + lich boss", "Named NPCs you can save (or fail)"],
    rules: "Western Fantasy epic combat — defend Greyhold against Aramor the Pale's undead horde.",
  },
  "rpg-sunken-crown": {
    description: "Queen Mara's flagship vanished two centuries ago with the royal crown aboard. A fisherman just pulled up a single golden tine. Three captains race for the wreck.",
    longDescription: "Sail the Saltbrood Reefs aboard Captain Calyx's salvage ship while pirate Black Saala and the Drowned Saint cult close in from two sides. Three timed dives into the wreck of the Imperatrix uncover the real story — Queen Mara scuttled her own ship to die at sea, and her shade still guards the crown. The finale is a moral choice with the dead queen, NOT a slugfest.",
    icon: "👑",
    cover: "/games/game-cover-rpg-sunken-crown.webp",
    tags: ["Western Fantasy", "Naval", "Treasure Hunt", "Long Session"],
    style: "Strategic",
    color: "from-cyan-900 to-indigo-950",
    badge: "NEW",
    features: ["~50 min session", "Three competing factions at sea", "Limited-time underwater diving", "Boss can be resolved in dialogue"],
    rules: "Western Fantasy sea adventure — recover (or refuse) the Crown of the Tides from Queen Mara's wreck.",
  },
  "rpg-vault-glassmith": {
    description: "An archmage keeps a Sun-Glass that can scry any face in the kingdom. The wards thin only at the equinox. You have one shift of the moon to take it.",
    longDescription: "Heist! Three security layers, three rooms, six hours of moonlight. Cross the silent Glass Garden, riddle past Tilda the apprentice, beat the mirror-construct in the vault — then choose: take the Sun-Glass and outrun the archmage, replace it with a decoy, or destroy it on the spot. Stealth and timing matter. Combat costs the moon clock.",
    icon: "🔮",
    cover: "/games/game-cover-rpg-vault-glassmith.webp",
    tags: ["Western Fantasy", "Heist", "Stealth", "Puzzle"],
    style: "Strategic",
    color: "from-blue-900 to-violet-950",
    badge: "NEW",
    features: ["~35 min session", "Three-room infiltration puzzle", "Moon clock — combat costs time", "Three endings (take / decoy / destroy)"],
    rules: "Western Fantasy heist — infiltrate the Spire and claim (or destroy) the Sun-Glass before moonset.",
  },
};

function decorateRpgAdventures(adventures: RpgAdventure[]): GameTemplate[] {
  return adventures.map((a) => {
    const ui = RPG_ADVENTURE_UI[a.id];
    if (!ui) {
      throw new Error(`Missing RPG_ADVENTURE_UI entry for adventure id "${a.id}"`);
    }
    return {
      id: a.id,
      name: a.title,
      description: ui.description,
      longDescription: ui.longDescription,
      icon: ui.icon,
      cover: ui.cover,
      category: "RPG",
      tags: ui.tags,
      players: `1 + ${a.partySize} AI`,
      duration: a.estimatedDuration,
      style: ui.style,
      color: ui.color,
      badge: ui.badge,
      features: ui.features,
      rules: ui.rules,
      templateId: "custom",
      playerCount: a.partySize,
      rpgWorldId: a.worldId,
      rpgAdventureId: a.id,
      rpgAdventureNotes: buildAdventureNotes(a),
    };
  });
}

export const RPG_ADVENTURES: GameTemplate[] = decorateRpgAdventures(ALL_RPG_ADVENTURES);


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
    ...(t.rpgAdventureId ? { rpgAdventureId: t.rpgAdventureId } : {}),
    ...(t.rpgAdventureNotes ? { rpgAdventureNotes: t.rpgAdventureNotes } : {}),
  };
}

/** The first RPG adventure — used as "Recommended Adventure" quick-start for new users */
export const RECOMMENDED_ADVENTURE = RPG_ADVENTURES[0];

export const CATEGORIES = [
  { id: "all",       label: "All Adventures",   icon: Flame },
  { id: "fantasy",   label: "Fantasy",          icon: Drama },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  fantasy: RPG_ADVENTURES.filter(t => t.rpgWorldId === "western-fantasy"),
};
