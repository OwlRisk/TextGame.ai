import { getGameTemplate, type GameTemplate } from "./game-templates";

export type TemplateControlMode = "deduction" | "quiz" | "cooperative" | "party" | "open";

export function getTemplateControlMode(templateId?: string): TemplateControlMode {
  if (!templateId) return "open";
  const t = getGameTemplate(templateId);
  return t?.category ?? "open";
}

export function buildTemplatePromptPolicy(templateId?: string): string {
  const mode = getTemplateControlMode(templateId);

  /* ── Template-specific policies (checked before category fallbacks) ── */

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

### PACING
- Keep rounds moving. After 6–8 rounds of Q&A, nudge toward accusations if no one has called a vote.
- NEVER reveal the location in public messages. It's the Spy's job to figure it out.
`.trim();
  }

  if (templateId === "clue") {
    return `
## CLUE — CARD DEALING & SUGGESTION MANAGEMENT (CRITICAL)

### GAME START
1. Secretly pick the solution: 1 Suspect, 1 Room, 1 Weapon. Store it: [BOARD:You]\\nSolution: <Suspect>, <Room>, <Weapon>\\n[/BOARD]
2. SUSPECTS: Colonel Mustard, Miss Scarlet, Reverend Green, Mrs. Peacock, Dr. Orchid, Professor Plum.
   ROOMS: Kitchen, Ballroom, Conservatory, Billiard Room, Library, Study, Hall, Lounge, Dining Room.
   WEAPONS: Candlestick, Knife, Lead Pipe, Revolver, Rope, Wrench.
3. Shuffle the remaining 18 cards and deal them as evenly as possible to all players via [BOARD:PlayerName]: "Your cards: <card1>, <card2>, ..."
4. Display a summary of card counts per player using [SECTION:Case File].

### TURN FLOW
1. Active player moves to a room (they announce it) and makes a Suggestion: Suspect + current Room + Weapon.
2. Check players CLOCKWISE from the active player: the FIRST player who holds ANY of the three named cards must privately show ONE to the active player.
   - Use [BOARD:ActivePlayer] to privately tell them: "<PlayerName> showed you: <card>"
   - Announce publicly: "<PlayerName> was able to disprove the suggestion." (do NOT reveal the card publicly)
   - If NO player can disprove → announce: "No one could disprove the suggestion!" (this is a big clue)
3. Move to the next player's turn via NEXT_SPEAKER.

### ACCUSATIONS
When a player makes a formal ACCUSATION (Suspect + Room + Weapon):
- Check against the solution.
- Correct → celebrate, announce the win, GAME_OVER with REVEAL_ROLE: All.
- Wrong → announce: "Wrong accusation!" Use ELIMINATE on that player. They can no longer make suggestions or accusations, but still show cards to disprove others.

### TRACKING
Update [SECTION:Case File] each turn showing: whose turn it is, how many suggestions made, which cards have been publicly revealed.
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

### PACING
- Keep investigation rounds brisk — 2–3 questions per round, then move on.
- Drop new evidence between rounds to keep momentum.
- Do NOT let the investigation stall in open discussion for more than a few turns.
`.trim();
  }

  /* ── Category fallbacks ── */

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
