import { getGameTemplate } from "./game-templates";

/** Fallback AI count when GM/API hasn't decided — uses the template's recommendedAICount. */
export function getDefaultAICountForTemplate(template?: string): number {
  if (!template) return 4;
  const t = getGameTemplate(template);
  return t?.recommendedAICount ?? 4;
}

export const AI_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#a855f7",
];
