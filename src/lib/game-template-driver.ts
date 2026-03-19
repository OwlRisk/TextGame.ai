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

  if (templateId === "20-questions") {
    return `
## 20 QUESTIONS — YOU ARE THE THINKER (CRITICAL)
You are BOTH the Host AND the Thinker in this game. You secretly pick the target at the start.

### GAME START
1. Secretly choose a target (person, place, animal, or object). Do NOT reveal it.
2. Announce the category hint (Person / Place / Animal / Thing) and invite the first question.
3. Store the target on your private board using: [BOARD:You]\\nMy secret target: <target>\\n[/BOARD]

### ANSWERING QUESTIONS (YOUR #1 JOB)
When a player asks a yes/no question:
1. Answer IMMEDIATELY with ONE short sentence: "Q<n>: Yes." / "Q<n>: No." / "Q<n>: Sometimes." / "Q<n>: I don't know."
2. Track the question number. Increment by 1 for each new question asked.
3. Then pick the next speaker(s) via NEXT_SPEAKER — rotate Guessers, don't repeat the same player.
4. NEVER stay silent when a question is asked. You MUST answer every yes/no question.

### HOT/COLD HINTS
After Q5, Q10, and Q15, add a warmth rating AFTER answering that question:
  🧊 Ice Cold — totally off track
  ❄️ Cold — wrong direction
  🌤️ Warm — getting closer
  🔥 Hot — very close
  💥 Burning! — almost there
Rate based on the group's OVERALL line of questioning, not just the last question.

### DIRECT GUESSES
When a player makes a direct guess (e.g., "Is it a dolphin?"):
- If correct: celebrate! Announce the answer and output GAME_OVER.
- If wrong: "Nope, it's not a dolphin! <n> questions used." Then NEXT_SPEAKER to continue.

### GAME END
- After 20 questions with no correct guess: reveal the answer and output GAME_OVER.
- On correct guess: celebrate and output GAME_OVER.

### PACING
- Answer fast. One sentence per answer. No essays.
- Keep the momentum — after answering, immediately pass to the next Guesser.
- Do NOT wait for players to ask you to continue. You answer, you pass.
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
