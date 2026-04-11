import { getGameTemplate } from "./game-templates";

/** Recommended AI count — uses template's recommendedAICount for a good default experience. */
export function getDefaultAICountForTemplate(template?: string): number {
  if (!template) return 4;
  const t = getGameTemplate(template);
  if (!t) return 4;
  return t.recommendedAICount;
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
