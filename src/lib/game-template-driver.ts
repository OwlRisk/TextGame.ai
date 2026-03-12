import { getGameTemplate, type GameTemplate } from "./game-templates";

export type TemplateControlMode = "deduction" | "quiz" | "cooperative" | "party" | "open";

export function getTemplateControlMode(templateId?: string): TemplateControlMode {
  if (!templateId) return "open";
  const t = getGameTemplate(templateId);
  return t?.category ?? "open";
}

export function buildTemplatePromptPolicy(templateId?: string): string {
  const mode = getTemplateControlMode(templateId);

  if (mode === "deduction") {
    return `
## PROGRESSION GUARANTEE (HARD RULE FOR DEDUCTION GAMES)
Do NOT wait for players to ask you to continue. You must proactively move the game forward.
- If table discussion has run for a few turns, force a state change: start vote, resolve vote, or move to next phase.
- Never keep the game in "open discussion" for too long without mechanical progress.
- If a player asks for "more discussion", allow one short extension only, then still transition.
- Prefer concrete progression directives over more chatter: START_VOTE / PHASE / ANNOUNCE / NEXT_SPEAKER.
- If uncertain, choose momentum over delay.
`.trim();
  }

  if (mode === "quiz") {
    return `
## PROGRESSION GUARANTEE (QUIZ / Q&A GAMES)
Keep rounds crisp and objective.
- After short discussion, force adjudication: confirm answer quality, then move to the next question/guess.
- Avoid prolonged social chatter between prompts.
- Prefer concrete directives: PHASE / ANNOUNCE / NEXT_SPEAKER / TIMER.
- If players stall, immediately restate the active question and push for a final answer.
`.trim();
  }

  if (mode === "cooperative") {
    return `
## MOMENTUM RULE (COOPERATIVE GAMES)
Keep the team moving toward the objective.
- Nudge with clues or consequences if players stall.
- Rotate speaker turns so everyone contributes; avoid one player dominating.
- Inject time pressure or new obstacles if pace drops.
`.trim();
  }

  if (mode === "party") {
    return `
## MOMENTUM RULE (PARTY GAMES)
Keep energy high and rounds snappy.
- Move to the next prompt or round quickly after each vote or answer.
- Do not over-moderate; let natural group dynamics flow.
- Inject variety — change topics, formats, or speakers to prevent monotony.
`.trim();
  }

  return `
## MOMENTUM RULE (OPEN / CUSTOM GAMES)
Preserve creative freedom, but avoid dead air.
- Do not over-constrain with rigid phase logic.
- If momentum drops, inject one concrete hook (choice, obstacle, reveal, or consequence) and assign a speaker.
- Keep mechanics lightweight; prioritize roleplay flow.
`.trim();
}

export function buildRuntimeProgressionGuard(
  templateId: string | undefined,
  recentNonHostTurns: number,
): string {
  const mode = getTemplateControlMode(templateId);
  if (mode === "deduction" && recentNonHostTurns >= 5) {
    return "[System progression guard: deduction game pacing is lagging. Advance to a concrete next state NOW (start vote / resolve result / phase transition). Do not ask for more discussion and do not re-explain rules.]";
  }
  if (mode === "quiz" && recentNonHostTurns >= 3) {
    return "[System progression guard: quiz pacing is lagging. Force adjudication or ask the next question NOW. Do not drift into open-ended discussion.]";
  }
  if ((mode === "cooperative" || mode === "party") && recentNonHostTurns >= 6) {
    return "[System progression guard: momentum is stalling. Transition to a concrete next beat now.]";
  }
  return "";
}
