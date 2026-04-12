export type { GameTemplate, QuickAction, PartialTemplate, TemplateChannel, ActionType, TargetType } from "./types";
export { withDefaults, AFTERLIFE_CHANNEL_ID } from "./types";

import { werewolf } from "./werewolf";
import { mafia } from "./mafia";
import { undercover } from "./undercover";
import { tarot } from "./tarot";
import { codenames } from "./codenames";
import { avalon } from "./avalon";
import { spyfall } from "./spyfall";
import { detectiveMystery } from "./detective-mystery";
import { escapeRoom } from "./escape-room";
import { trivia } from "./trivia";
import { debate } from "./debate";
import { storyteller } from "./storyteller";
import { twentyQuestions } from "./twenty-questions";
import { twoTruthsLie } from "./two-truths-lie";
import { rpgDungeon } from "./rpg-dungeon";
import { scriptKill } from "./script-kill";
import { custom } from "./custom";
import type { GameTemplate } from "./types";

export const GAME_TEMPLATES: GameTemplate[] = [
  werewolf,
  mafia,
  undercover,
  tarot,
  codenames,
  avalon,
  spyfall,
  detectiveMystery,
  escapeRoom,
  trivia,
  debate,
  storyteller,
  twentyQuestions,
  twoTruthsLie,
  rpgDungeon,
  scriptKill,
  custom,
];

export function getGameTemplate(id: string): GameTemplate | undefined {
  return GAME_TEMPLATES.find((t) => t.id === id);
}

const TAILWIND_HEX: Record<string, string> = {
  purple: "#9333ea", indigo: "#4f46e5", red: "#dc2626", pink: "#ec4899",
  blue: "#2563eb", cyan: "#06b6d4", amber: "#d97706", yellow: "#ca8a04",
  green: "#16a34a", teal: "#14b8a6", orange: "#ea580c", emerald: "#059669",
  violet: "#7c3aed", fuchsia: "#d946ef", rose: "#f43f5e", gray: "#6b7280",
  slate: "#64748b",
};

export function getTemplateHexColor(templateId: string): string {
  const t = getGameTemplate(templateId);
  if (!t) return "#7c3aed";
  const m = t.color.match(/from-(\w+)/);
  return (m && TAILWIND_HEX[m[1]]) || "#7c3aed";
}

export function getAvatarStyleForTemplate(templateId?: string, rpgWorldId?: string): "valorant" | "semi-realistic" | "toon3d" | "anime" {
  if (rpgWorldId) return "anime";
  return "semi-realistic";
}
