/** Fallback AI count when GM/API hasn't decided—based on template midpoint */
export function getDefaultAICountForTemplate(template?: string): number {
  switch (template) {
    case "werewolf":
      return 7;
    case "undercover":
      return 6;
    case "mafia":
      return 9;
    default:
      return 6;
  }
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
