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
    // Reuses the Starfall Dungeon cover for now — both are Western Fantasy.
    // Replace with /games/game-cover-rpg-beggars-coin.webp when commissioned.
    cover: "/games/game-cover-rpg-starfall-dungeon.webp",
    tags: ["Western Fantasy", "Urban Mystery", "Short Session", "Intrigue"],
    style: "Strategic",
    color: "from-amber-800 to-stone-900",
    badge: "NEW",
    features: ["~25 min session", "Three independent investigation threads", "Optional non-lethal boss resolution", "Faction-favour rewards"],
    rules: "Western Fantasy short-form — urban mystery. Recover the stolen signet ring before dawn.",
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
