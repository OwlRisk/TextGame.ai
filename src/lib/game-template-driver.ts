/**
 * @deprecated — Template mechanics now live in src/lib/templates/<template>.ts.
 * This file exists only for backward-compatible test imports.
 */

import { getGameTemplate } from "./game-templates";
import type { GameTemplate } from "./templates/types";

export type TemplateControlMode = "deduction" | "quiz" | "cooperative" | "party" | "open";

export function getTemplateControlMode(templateId?: string): TemplateControlMode {
  if (!templateId) return "open";
  const t = getGameTemplate(templateId);
  return t?.category ?? "open";
}

/**
 * @deprecated — Use `getGameTemplate(id)?.mechanicsPrompt` directly.
 */
export function buildTemplateMechanics(templateId?: string): string {
  if (!templateId) return "";
  return getGameTemplate(templateId)?.mechanicsPrompt ?? "";
}

const CATEGORY_PACING: Record<string, string> = {
  deduction: "Force state changes (vote / phase transition) after a few discussion turns. Prefer directives over more chatter.",
  quiz: "Keep rounds crisp. Adjudicate quickly, then next question. No open-ended drift.",
  cooperative: "Nudge with clues or consequences if stalled. Rotate speakers. Inject obstacles if pace drops.",
  party: "Energy high, rounds snappy. Next round quickly after each answer/vote. Inject variety.",
  open: "Creative freedom, but no dead air. Drop a concrete hook if momentum fades.",
};

/**
 * @deprecated — Progression logic now lives in host-prompt-builder.ts.
 */
export function buildProgressionPolicy(templateId?: string, recentNonHostTurns?: number): string {
  const tmpl: GameTemplate | undefined = templateId ? getGameTemplate(templateId) : undefined;
  const turns = recentNonHostTurns ?? 0;

  const lines: string[] = [
    'On "Continue"/"Ready"/"What\'s next?": advance in ONE sentence, assign next speaker.',
    "Never dwell on the same beat twice. Never re-explain rules. Never re-confirm established facts.",
  ];

  const category = tmpl?.category ?? "open";
  lines.push(CATEGORY_PACING[category] ?? CATEGORY_PACING.open);

  if (tmpl?.pacing.hint) {
    lines.push(tmpl.pacing.hint);
  }

  const threshold = tmpl?.pacing.progressionThreshold ?? 5;
  if (turns >= threshold) {
    lines.push(`⚠️ PROGRESSION ALERT: ${turns} player turns since your last action. Advance NOW.`);
  }

  return lines.join("\n");
}
