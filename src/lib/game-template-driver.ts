import { getGameTemplate } from "./game-templates";

export type TemplateControlMode = "deduction" | "quiz" | "cooperative" | "party" | "open";

export function getTemplateControlMode(templateId?: string): TemplateControlMode {
  if (!templateId) return "open";
  const t = getGameTemplate(templateId);
  return t?.category ?? "open";
}

/**
 * Game-specific mechanics only (no pacing rules).
 * Returns empty string for templates without special mechanics.
 */
export function buildTemplateMechanics(templateId?: string): string {
  if (templateId === "20-questions") {
    return `
## 20 QUESTIONS — YOU ARE THE THINKER (CRITICAL)
You are BOTH the Host AND the Thinker in this game. You secretly pick the target at the start.

### GAME START
1. Secretly choose a target (person, place, animal, or object). Do NOT reveal it.
2. Announce the category hint (Person / Place / Animal / Thing) and invite the first question.
3. Store the target on your private board using: [BOARD:You]\\nMy secret target: <target>\\n[/BOARD]

### ANSWERING QUESTIONS (YOUR #1 JOB — NEVER SKIP THIS)
When a player asks a yes/no question:
1. Answer IMMEDIATELY with ONE short sentence: "Q<n>: Yes." / "Q<n>: No." / "Q<n>: Sometimes." / "Q<n>: I don't know."
2. Track the question number. Increment by 1 for each new question asked.
3. Then pick exactly ONE Guesser in NEXT_SPEAKER. Rotate — don't repeat the same player.
4. NEVER stay silent when a question is asked. You MUST answer every yes/no question.
5. If multiple questions were asked at once, answer ALL of them in order (Q<n>, Q<n+1>, etc.).

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

### SPEAKER CONTROL (CRITICAL FOR 20Q)
- After each answer, put exactly ONE Guesser in NEXT_SPEAKER. NEVER list multiple Guessers.
- This ensures you answer each question before the next one is asked.
- Rotate through all Guessers fairly. End with the human player at natural pause points.
- Example: NEXT_SPEAKER: Lena Brooks (just one name — not "Lena Brooks, Diego Alvarez")
`.trim();
  }

  if (templateId === "codenames") {
    return `
## CODENAMES — GRID & TURN MANAGEMENT (CRITICAL)
You manage the 5×5 word grid and the secret key map.

### GAME START
1. Generate 25 random, interesting words for the grid. Display them in a 5×5 grid using [SECTION:Word Grid].
2. Secretly assign: 9 words to the starting team, 8 to the other team, 7 bystanders, 1 Assassin.
3. Send the FULL key map to each Spymaster via [BOARD:SpymasterName] — clearly mark which words are theirs, opponent's, bystanders, and the Assassin.
4. Operatives only see the word grid — no colors.
5. Use ASSIGN_ROLE for each player: Spymaster or Field Operative, split into two teams.

### TURN FLOW
1. Announce which team is active. The active Spymaster gives a clue.
2. Validate the clue: must be ONE word + a number. The word must NOT be any word on the board.
3. Active team's Operatives discuss and guess ONE word at a time.
4. For each guess, reveal the result immediately:
   - Team's word: "✅ WHALE is [Team]'s agent!" — update the grid, team may continue guessing (up to clue number + 1 total).
   - Opponent's word: "❌ WHALE belongs to [Other Team]! Turn ends." — update grid, switch teams.
   - Bystander: "⬜ WHALE is a bystander. Turn ends." — switch teams.
   - Assassin: "💀 WHALE is the ASSASSIN! [Team] loses!" → GAME_OVER.
5. Update [SECTION:Word Grid] after each reveal to show which words are taken and by whom.
6. After the turn ends, switch to the other team's Spymaster.

### GAME END
- A team contacts all their agents → GAME_OVER (that team wins).
- Assassin guessed → GAME_OVER (guessing team loses instantly).
`.trim();
  }

  if (templateId === "spyfall") {
    return `
## SPYFALL — LOCATION & SPY MANAGEMENT (CRITICAL)

### GAME START
1. Secretly pick a location from: Hospital, Space Station, Beach Resort, Casino, Movie Studio, Pirate Ship, School, Circus, Bank, Submarine, Supermarket, Police Station, University, Airport, Cruise Ship, Restaurant, Museum, Theater, Library, Amusement Park.
2. Store it: [BOARD:You]\\nSecret location: <location>\\n[/BOARD]
3. Assign ONE random player as Spy: ASSIGN_ROLE: <name> -> Spy. All others: ASSIGN_ROLE: <name> -> Regular Player.
4. Send the location to EVERY non-Spy player via [BOARD:PlayerName]: "The secret location is: <location>. You are NOT the Spy."
5. The Spy's board says only: "You are the Spy. You do NOT know the location. Figure it out from others' answers."
6. Announce the game has started, pick the first questioner.

### TURN FLOW
1. Active player asks ANY other player a question related to the "location" — nothing too direct.
2. That player answers (subtly proving knowledge or bluffing if they're the Spy).
3. Pass to the next player as questioner via NEXT_SPEAKER.
4. Any player may call an accusation vote at any time — handle it immediately.

### ACCUSATION & SPY GUESS
- If a vote is called: all players vote. Majority = accused is revealed.
  - Accused WAS the Spy → Spy gets one chance to name the location. Correct = Spy wins. Wrong = group wins.
  - Accused was NOT the Spy → Spy wins immediately (wrong accusation).
- The Spy can voluntarily reveal and guess the location at any time.
- NEVER reveal the location in public messages. It's the Spy's job to figure it out.
`.trim();
  }

  if (templateId === "detective-mystery") {
    return `
## DETECTIVE MYSTERY — CASE MANAGEMENT (CRITICAL)

### GAME START
1. Generate a unique case with:
   - A victim (who was killed, how they were found)
   - 3–5 suspects with distinct names, backstories, relationships to the victim, and possible motives
   - ONE culprit with a specific Motive and Method
   - Physical evidence (3–5 clues spread across locations)
   - Witness observations and alibi information
2. Store the solution: [BOARD:You]\\nCulprit: <name>, Motive: <motive>, Method: <method>\\n[/BOARD]
3. Assign roles via ASSIGN_ROLE: Detectives, Suspects, Witnesses.
4. Send each Suspect their character backstory and secrets via [BOARD:SuspectName] — the guilty one knows they did it and why.
5. Send each Witness what they saw/heard via [BOARD:WitnessName].
6. Announce the crime scene, describe the victim, and introduce all suspects.

### INVESTIGATION (3 rounds)
Each round:
1. Each Detective may ask ONE character ONE question. Prompt them via NEXT_SPEAKER.
2. The questioned character answers based on their backstory (AI players do this automatically; for NPC suspects, answer in character yourself).
3. After each round, reveal a new piece of evidence to all players.
4. Use [SECTION:Evidence Board] to track all discovered clues.

### ACCUSATION PHASE
1. Announce the Accusation Phase. Each Detective submits: Culprit + Motive + Method.
2. After all accusations are in, reveal the correct answers.
3. Announce who solved it (if anyone). GAME_OVER with full reveal.
`.trim();
  }

  return "";
}

const PROGRESSION_THRESHOLDS: Record<TemplateControlMode, number> = {
  deduction: 5,
  quiz: 3,
  cooperative: 6,
  party: 6,
  open: 8,
};

/**
 * Unified pacing & progression policy.
 * Replaces the old three-layer system: template pacing sections,
 * category fallback blocks, and buildRuntimeProgressionGuard.
 */
export function buildProgressionPolicy(
  templateId: string | undefined,
  recentNonHostTurns: number = 0,
): string {
  const mode = getTemplateControlMode(templateId);

  const lines: string[] = [
    'On "Continue"/"Ready"/"What\'s next?": advance in ONE sentence, assign next speaker.',
    "Never dwell on the same beat twice. Never re-explain rules. Never re-confirm established facts.",
  ];

  const modePacing: Record<TemplateControlMode, string> = {
    deduction: "Force state changes (vote / phase transition) after a few discussion turns. Prefer directives (START_VOTE / PHASE) over more chatter.",
    quiz: "Keep rounds crisp. Adjudicate quickly, then next question. No open-ended drift between prompts.",
    cooperative: "Nudge with clues or consequences if stalled. Rotate speakers. Inject obstacles if pace drops.",
    party: "Energy high, rounds snappy. Next prompt/round quickly after each answer/vote. Inject variety.",
    open: "Creative freedom, but no dead air. Drop a concrete hook (choice, obstacle, reveal, consequence) if momentum fades.",
  };
  lines.push(modePacing[mode]);

  if (templateId === "20-questions") {
    lines.push("Answer fast — one sentence per answer, then pass to next Guesser immediately.");
  } else if (templateId === "spyfall") {
    lines.push("After 6–8 Q&A rounds, nudge toward accusations if no vote called.");
  } else if (templateId === "detective-mystery") {
    lines.push("Investigation rounds: 2–3 questions, then move on. New evidence between rounds.");
  }

  if (recentNonHostTurns >= PROGRESSION_THRESHOLDS[mode]) {
    lines.push(`⚠️ PROGRESSION ALERT: ${recentNonHostTurns} player turns since your last action. Advance NOW — start vote, transition phase, or force a decision. No more open discussion.`);
  }

  return lines.join("\n");
}
