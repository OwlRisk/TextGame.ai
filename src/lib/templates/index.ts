export type { GameTemplate, QuickAction, PartialTemplate, TemplateChannel, ActionType, TargetType } from "./types";
export { withDefaults, AFTERLIFE_CHANNEL_ID } from "./types";

import type { GameTemplate } from "./types";

/**
 * No game templates in narrative-focus mode.
 * Scene mode (adventures) is the primary experience.
 */
export const GAME_TEMPLATES: GameTemplate[] = [];

export function getGameTemplate(_id: string): GameTemplate | undefined {
  return undefined;
}

const TAILWIND_HEX: Record<string, string> = {
  purple: "#9333ea", indigo: "#4f46e5", red: "#dc2626", pink: "#ec4899",
  blue: "#2563eb", cyan: "#06b6d4", amber: "#d97706", yellow: "#ca8a04",
  green: "#16a34a", teal: "#14b8a6", orange: "#ea580c", emerald: "#059669",
  violet: "#7c3aed", fuchsia: "#d946ef", rose: "#f43f5e", gray: "#6b7280",
  slate: "#64748b",
};

export function getTemplateHexColor(_templateId: string): string {
  return "#7c3aed";
}

export function getAvatarStyleForTemplate(_templateId?: string): "valorant" | "semi-realistic" | "toon3d" {
  return "semi-realistic";
}
