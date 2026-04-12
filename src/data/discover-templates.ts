import {
  Compass,
  Search,
  Skull,
  Gem,
} from "lucide-react";
import { SCENES } from "../lib/scenes";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId?: string;
  playerCount?: number;
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
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const buildFallbackRules = (name: string) =>
  `A group adventure: explore ${name} with your AI companions. Make choices, solve mysteries, survive dangers.`;

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

// ── Adventures ──────────────────────────────────────────────────────────────

const GENRE_META: Record<string, { category: string; tags: string[]; style: "Casual" | "Strategic" }> = {
  mystery:   { category: "Mystery",   tags: ["Mystery", "Exploration", "Suspense"],           style: "Strategic" },
  survival:  { category: "Survival",  tags: ["Survival", "Horror", "Tension"],                style: "Strategic" },
  adventure: { category: "Adventure", tags: ["Adventure", "Exploration", "Teamwork"],         style: "Casual" },
  heist:     { category: "Heist",     tags: ["Heist", "Stealth", "Thriller"],                 style: "Strategic" },
};

function sceneToTemplate(scene: typeof SCENES[number]): GameTemplate {
  const meta = GENRE_META[scene.genre] ?? GENRE_META.adventure;
  return {
    id: scene.id,
    name: scene.title,
    description: scene.hook,
    longDescription: scene.openingNarration,
    icon: scene.icon,
    category: meta.category,
    tags: meta.tags,
    players: "1 + AI",
    duration: "20-40 min",
    style: meta.style,
    color: scene.color,
    badge: undefined,
    features: scene.characters.map((c) => `${c.name} — ${c.personality.split(",")[0].trim()}`),
    rules: `${scene.hook}\n\n${scene.openingNarration}`,
    templateId: "scene",
    playerCount: 1,
  };
}

const ADVENTURES: GameTemplate[] = SCENES.map(sceneToTemplate);

export const FEATURED_TEMPLATE: GameTemplate = ADVENTURES[0];

// ── Aggregated ──────────────────────────────────────────────────────────────

export const ALL_PRESETS: GameTemplate[] = ADVENTURES;

export function getPresetById(presetId: string | null): DiscoverPreset | null {
  if (!presetId) return null;
  const t = ALL_PRESETS.find((g) => g.id === presetId);
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: t.templateId ?? "scene",
    playerCount: t.playerCount,
  };
}

export const CATEGORIES = [
  { id: "all",       label: "All Adventures",  icon: Compass },
  { id: "mystery",   label: "Mystery",         icon: Search },
  { id: "survival",  label: "Survival",        icon: Skull },
  { id: "adventure", label: "Adventure",       icon: Gem },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  mystery:   ADVENTURES.filter((a) => a.category === "Mystery"),
  survival:  ADVENTURES.filter((a) => a.category === "Survival"),
  adventure: ADVENTURES.filter((a) => a.category === "Adventure" || a.category === "Heist"),
};

// Legacy exports for backward compatibility
export const CORE_TEMPLATES: GameTemplate[] = [];
export const SOCIAL_DEDUCTION: GameTemplate[] = [];
export const PARTY_GAMES: GameTemplate[] = [];
export const MYSTERY_GAMES: GameTemplate[] = [];
export const ROLEPLAY_GAMES: GameTemplate[] = [];
export const EDUCATIONAL_GAMES: GameTemplate[] = [];
export const EXTRA_GAMES: GameTemplate[] = [];
