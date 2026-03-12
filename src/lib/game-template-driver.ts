export type TemplateControlMode = "deduction" | "quiz" | "open" | "hybrid";

const DEDUCTION_TEMPLATES = new Set([
  "werewolf",
  "mafia",
  "undercover",
  "avalon",
  "secret-hitler",
  "spyfall",
  "resistance",
  "clue",
  "detective-mystery",
  "vampire-court",
  "space-mutiny",
  "kingdom-intrigue",
  "two-rooms",
]);

const QUIZ_TEMPLATES = new Set([
  "trivia",
  "20-questions",
]);

const OPEN_TEMPLATES = new Set([
  "tarot",
  "storyteller",
  "improv-comedy",
  "custom",
]);

function normalize(templateId?: string): string {
  return (templateId ?? "").trim().toLowerCase();
}

export function getTemplateControlMode(templateId?: string): TemplateControlMode {
  const id = normalize(templateId);
  if (!id) return "hybrid";
  if (DEDUCTION_TEMPLATES.has(id)) return "deduction";
  if (QUIZ_TEMPLATES.has(id)) return "quiz";
  if (OPEN_TEMPLATES.has(id)) return "open";
  return "hybrid";
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

  if (mode === "open") {
    return `
## MOMENTUM RULE (OPEN NARRATIVE GAMES)
Preserve creative freedom, but avoid dead air.
- Do not over-constrain with rigid phase logic.
- If momentum drops, inject one concrete hook (choice, obstacle, reveal, or consequence) and assign a speaker.
- Keep mechanics lightweight; prioritize roleplay flow.
`.trim();
  }

  return `
## MOMENTUM RULE (HYBRID GAMES)
Balance freedom with progression.
- Let players explore briefly, then convert to a concrete next step.
- If conversation loops, transition with one clear host action.
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
  if (mode === "hybrid" && recentNonHostTurns >= 6) {
    return "[System progression guard: momentum is stalling. Transition to a concrete next beat now.]";
  }
  return "";
}
