import { Flame, Swords, Drama } from "lucide-react";
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
  "rpg-jade-peak": {
    description: "A martial arts tournament at the legendary Jade Peak sect. Compete, intrigue, and uncover a conspiracy threatening the martial world.",
    longDescription: "You and your companions arrive at Jade Peak for the annual martial arts tournament. But beneath the contests lies a conspiracy — someone is poisoning the participants, and ancient forbidden techniques are being traded in the shadows. Survive the tournament, uncover the truth, and decide the fate of the martial world.",
    icon: "⚔️",
    cover: "/games/game-cover-rpg-jade-peak.webp",
    tags: ["Wuxia", "Combat", "Intrigue", "Open World"],
    style: "Strategic",
    color: "from-red-600 to-amber-900",
    badge: "NEW",
    features: ["Full RPG stats & leveling", "Narrative combat system", "Martial arts skills", "Faction reputation"],
    rules: "Fantasy RPG — Wuxia/martial arts world. Players explore, fight, and solve mysteries.",
  },
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
  "rpg-cursed-crossroads": {
    description: "A border town where Eastern and Western magic collide. Solve the curse before both worlds tear apart.",
    longDescription: "The border town of Yunjin sits where the martial arts world meets the realm of Western magic. A mysterious curse has sealed the town — no one can leave. Eastern qi and Western mana are clashing, creating chaos. Your party of mixed warriors must unite both traditions to break the curse and survive.",
    icon: "🌀",
    cover: "/games/game-cover-rpg-cursed-crossroads.webp",
    tags: ["Mixed", "Mystery", "Combat", "Exploration"],
    style: "Strategic",
    color: "from-emerald-600 to-teal-900",
    badge: "NEW",
    features: ["Mixed Wuxia + Fantasy world", "Mystery & combat blend", "Faction diplomacy", "Dual magic systems"],
    rules: "Fantasy RPG — mixed world where Eastern martial arts and Western magic coexist. Players explore, investigate, and fight.",
  },
  "rpg-heishan-bell": {
    description: "The iron bell of a remote mountain village rings for the first time in forty years. The villagers are gone.",
    longDescription: "Heishan (黑山), a remote mountain village, hasn't rung its iron warning-bell in forty years. Tonight at dusk it tolled three times — and every villager vanished from their homes. Half-eaten meals, dropped lanterns, scorch marks on the door frames. A short, focused Wuxia rescue: investigate the empty village, find the surviving villagers in the cave shelters, and stop whatever the bell was holding back.",
    icon: "🔔",
    // Reuses the Jade Peak cover for now — both are Wuxia, and shipping a new
    // adventure shouldn't be blocked on commissioning a new cover asset.
    // Replace with a dedicated /games/game-cover-rpg-heishan-bell.webp once
    // the asset is ready.
    cover: "/games/game-cover-rpg-jade-peak.webp",
    tags: ["Wuxia", "Mystery", "Short Session", "Rescue"],
    style: "Strategic",
    color: "from-zinc-700 to-red-900",
    badge: "NEW",
    features: ["~25 min session", "One pivotal boss with a unique mechanic", "Spirit-mentor optional ally", "Investigation-heavy"],
    rules: "Wuxia short-form — empty village rescue. Investigate, find survivors, defeat the released spirit.",
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
  { id: "wuxia",     label: "Wuxia",            icon: Swords },
  { id: "fantasy",   label: "Fantasy",          icon: Drama },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  wuxia:   RPG_ADVENTURES.filter(t => t.rpgWorldId === "wuxia"),
  fantasy: RPG_ADVENTURES.filter(t => t.rpgWorldId === "western-fantasy"),
};
