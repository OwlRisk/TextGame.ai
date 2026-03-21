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

  if (templateId === "werewolf" || templateId === "mafia") {
    const label = templateId === "werewolf" ? "WEREWOLF" : "MAFIA";
    return `
## ${label} — DAY DISCUSSION & SPEAKER ORDER (CRITICAL)

### DAY DISCUSSION — EVERYONE SPEAKS IN ORDER
During the Day discussion phase, ALL living players must speak **one by one**.
List every living player in NEXT_SPEAKER so each person gets a turn before voting.
Order: pick a starting player (rotate each day), then go around the table.
Example for 6 alive players: NEXT_SPEAKER: Aria, Cedric, Mira, ${label === "WEREWOLF" ? "Brennan" : "Tommy"}, Elara, HumanPlayer

Rules:
- Every living player MUST be included — do NOT skip anyone.
- The human player should appear in the list at a natural position (not always last).
- After all players have spoken, transition to the Vote phase.
- Do NOT use "Everyone" during Day discussion — list names explicitly for ordered turns.

### NIGHT PHASE
Night actions are private. Use AUTO_CHANNEL for wolf/mafia decisions.
List only the roles that act at night in NEXT_SPEAKER (e.g. Seer, Doctor).

### VOTING
When calling a vote, list ALL living AI players plus the human in NEXT_SPEAKER.
`.trim();
  }

  if (templateId === "undercover") {
    return `
## UNDERCOVER — WORD ASSIGNMENT & ROUND-ROBIN DESCRIPTION (CRITICAL)

### GAME START
1. Choose two similar but distinct words (e.g. "Coffee" vs "Tea", "Guitar" vs "Violin").
2. Assign roles: ASSIGN_ROLE: <name> -> Civilian / Undercover / Mr. White.
3. Send words via private boards:
   - Civilians: [BOARD:Name] Your secret word is: <common word>. You are a Civilian. [/BOARD]
   - Undercover: [BOARD:Name] Your secret word is: <similar word>. You are Undercover. [/BOARD]
   - Mr. White (if any): [BOARD:Name] You have NO word. You are Mr. White — bluff based on others' descriptions. [/BOARD]
4. Store solution: [BOARD:You]\\nCommon word: <word>, Similar word: <word>, Undercover: <name>, Mr. White: <name>\\n[/BOARD]

### DESCRIPTION ROUND — EVERYONE SPEAKS IN ORDER
Each round, ALL living players describe their word **one by one** in order.
List every living player in NEXT_SPEAKER so each person gets exactly one turn.
Example: NEXT_SPEAKER: Aria, Cedric, Mira, Brennan, HumanPlayer

Rules:
- Every living player MUST be included — do NOT skip anyone.
- Rotate the starting player each round.
- After all descriptions are done, transition to the Vote phase.

### VOTING
After descriptions, call a vote. List ALL living players in NEXT_SPEAKER for voting.
Reveal the eliminated player's role and word.
If Mr. White is eliminated, they get ONE chance to guess the Civilians' word before the reveal.

### GAME END
- Undercover found: Civilians win.
- Undercover survives to final 3: Undercover wins.
- Mr. White correctly guesses the Civilians' word when eliminated: Mr. White wins.
`.trim();
  }

  if (templateId === "avalon") {
    return `
## AVALON — QUEST MANAGEMENT & SPEAKER ORDER (CRITICAL)

### GAME START
1. Assign roles secretly via ASSIGN_ROLE and private boards.
2. Evil players (except Mordred) are revealed to each other via [BOARD:EvilPlayer].
3. Merlin sees all Evil players (except Mordred) via [BOARD:Merlin].
4. Percival sees Merlin (and Morgana if present) via [BOARD:Percival].
5. Announce the first Quest Leader.

### TEAM NOMINATION
1. The Quest Leader proposes a team of the required size.
2. ALL players discuss the proposal — list ALL living players in NEXT_SPEAKER for round-table discussion.
   Example: NEXT_SPEAKER: Aria, Cedric, Mira, Brennan, Elara, HumanPlayer
3. After discussion, ALL players vote Approve or Reject.
   List ALL players in NEXT_SPEAKER for the vote.

Rules for discussion:
- Every player MUST speak before the vote — do NOT skip anyone.
- Rotate the starting speaker each round.

### QUEST EXECUTION
If team is approved, quest members secretly play Success or Fail.
Use AUTO_CHANNEL or private boards for quest votes.
Announce results: "X Fail cards found" without revealing who played what.

### TEAM REJECTION
If rejected, pass leadership clockwise. Track rejection count (5 consecutive = Evil wins).

### ASSASSINATION (if Good wins 3 quests)
The Assassin gets one guess to identify Merlin. List the Assassin in NEXT_SPEAKER.
Correct = Evil wins. Wrong = Good wins.
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

  if (templateId === "escape-room") {
    return `
## ESCAPE ROOM — PUZZLE & ROOM MANAGEMENT (CRITICAL)

### GAME START
1. Design the room with 3–5 interconnected puzzles that must be solved in a partially ordered sequence.
2. Store the full solution chain: [BOARD:You]\\nPuzzle solutions and item locations...\\n[/BOARD]
3. Describe the room's initial appearance, visible objects, and atmosphere.
4. Start a timer (track in [SECTION:Timer]).

### EXPLORATION
When a player examines something:
1. Describe what they find in vivid detail.
2. If it reveals a clue or item, announce it and update [SECTION:Inventory].
3. If it triggers a puzzle, present it clearly.

### SPEAKER CONTROL
After each Host response, pick 1–2 players to act next via NEXT_SPEAKER.
Rotate fairly. Include the human at natural decision points.
Encourage collaboration — players can discuss freely before acting.

### HINTS
If players ask for a hint or seem stuck (3+ turns with no progress):
- Hint 1: Vague nudge ("Have you looked more carefully at the bookshelf?")
- Hint 2: Specific direction ("The numbers on the painting might relate to the lock.")
- Hint 3: Direct answer if still stuck.

### GAME END
- Escaped: All puzzles solved → GAME_OVER with celebration and time taken.
- Trapped: Timer expires → GAME_OVER, reveal remaining solutions.
`.trim();
  }

  if (templateId === "trivia") {
    return `
## TRIVIA — QUESTION & SCORING MANAGEMENT (CRITICAL)

### GAME START
1. Ask players for preferred topics and difficulty, or choose a mix.
2. Prepare questions internally. Track scores on [SECTION:Scoreboard].
3. Announce the rules: number of rounds, scoring system.

### QUESTION FLOW
Each round:
1. Ask ONE question to all players.
2. List ALL players in NEXT_SPEAKER so everyone can answer.
   Example: NEXT_SPEAKER: Aria, Cedric, Mira, HumanPlayer
3. After all answers are in, reveal the correct answer.
4. Award points: first correct = 2 pts, other correct = 1 pt. Update [SECTION:Scoreboard].
5. Optionally share a fun fact about the answer.

### SPEAKER CONTROL
- For standard rounds: list ALL players in NEXT_SPEAKER each question.
- For speed rounds: list one player at a time in rapid succession.
- Every player MUST get a chance to answer before scoring.

### GAME END
After all rounds, announce the final leaderboard and crown the champion. GAME_OVER.
Tiebreaker: one sudden-death question between tied players.
`.trim();
  }

  if (templateId === "debate") {
    return `
## DEBATE — STRUCTURED ROUND MANAGEMENT (CRITICAL)

### GAME START
1. Announce the debate topic.
2. Assign positions via ASSIGN_ROLE: <name> -> For / Against (or specific stances).
3. Send each player their assigned position via [BOARD:Name].

### ROUND STRUCTURE — EVERYONE SPEAKS IN ORDER
Each phase requires ALL assigned speakers to speak one by one.

**Phase 1 — Opening Statements:**
List ALL debaters in NEXT_SPEAKER (For side first, then Against).
Example: NEXT_SPEAKER: Aria, Cedric, Mira, Brennan, HumanPlayer

**Phase 2 — Rebuttals:**
List ALL debaters again. Each must directly address the opposing argument.
NEXT_SPEAKER: Mira, Brennan, HumanPlayer, Aria, Cedric (reverse order for variety)

**Phase 3 — Cross-Examination:**
Pair opponents. List pairs in NEXT_SPEAKER so each asks and answers.

**Phase 4 — Closing Statements:**
List ALL debaters one final time.

### SPEAKER CONTROL
- Every debater MUST speak in each phase — do NOT skip anyone.
- Rotate the starting speaker between phases.
- Include the human at a natural position in each phase.

### JUDGING & GAME END
After closing statements, evaluate all arguments on: logic, evidence, persuasiveness, rebuttal quality.
Announce rankings and reasoning. GAME_OVER.
`.trim();
  }

  if (templateId === "storyteller") {
    return `
## EPIC STORYTELLER — COLLABORATIVE NARRATIVE MANAGEMENT (CRITICAL)

### GAME START
1. Ask players for a genre/theme or pick one.
2. Set the opening scene with 2–3 vivid sentences.
3. Optionally assign secret keywords to each player via [BOARD:Name].

### STORY TURNS — EVERYONE CONTRIBUTES IN ORDER
Each round, ALL players add to the story one by one.
List every player in NEXT_SPEAKER so each gets exactly one turn.
Example: NEXT_SPEAKER: Aria, Cedric, Mira, HumanPlayer

Rules:
- Every player MUST contribute each round — do NOT skip anyone.
- Rotate the starting player each round.
- After all players have spoken, the Host introduces a twist or advances the plot.

### HOST INTERVENTIONS
Between rounds (after all players have spoken), the Host should:
- Introduce a plot twist, obstacle, or new character every 2–3 rounds.
- Gently redirect if the story goes off track.
- Skip forward in time if the pace drags.
- Reward creative keyword usage if keywords were assigned.

### GAME END
After 5–8 rounds (or when the story reaches a natural climax):
1. Announce the final round — each player wraps up their thread.
2. The Host delivers the epilogue.
3. Optionally vote on: Best Plot Twist, Most Memorable Line, Character of the Story.
GAME_OVER.
`.trim();
  }

  if (templateId === "two-truths-lie") {
    return `
## TWO TRUTHS AND A LIE — ROUND MANAGEMENT (CRITICAL)

### GAME START
1. Explain the rules briefly and pick the first active player.
2. Track scores on [SECTION:Scoreboard].

### EACH ROUND
1. The active player shares three statements (two truths, one lie).
   Put the active player in NEXT_SPEAKER first.
2. After the statements, ALL other players discuss and vote on which is the lie.
   List ALL other players in NEXT_SPEAKER for discussion/voting.
   Example: NEXT_SPEAKER: Cedric, Mira, Brennan, HumanPlayer
3. After all votes are in, the active player reveals the lie.
4. Score: each correct guesser gets 1 pt; active player gets 1 pt per person fooled.
5. Update [SECTION:Scoreboard] and pass to the next active player.

### SPEAKER CONTROL
- The active player ALWAYS speaks first (to share their statements).
- Then ALL other players vote — do NOT skip anyone.
- Rotate active player each round so everyone gets a turn.
- Include the human as active player at a natural point in the rotation.

### GAME END
After all players have been the active player once, announce final scores and winner. GAME_OVER.
`.trim();
  }

  if (templateId === "tarot") {
    return `
## TAROT READING — SESSION FLOW (CRITICAL)

### SESSION START
1. Set a reflective, mystical atmosphere. Introduce yourself as the reader.
2. Ask the Querent for their question or intention. A general reading is also welcome.
3. Based on the question, choose an appropriate spread (Single Card, Three Cards, Celtic Cross, or custom).

### CARD DRAWING
1. "Shuffle" and draw cards one by one. For each card:
   - Name the card and its orientation (upright or reversed).
   - Place it in its spread position (e.g. "Past", "Present", "Future").
   - Interpret it in relation to the Querent's question with depth and nuance.
2. After all cards are drawn, weave them into a cohesive narrative.

### SPEAKER CONTROL
This is a 1-on-1 session. After each interpretation or natural pause:
NEXT_SPEAKER: <HumanPlayer>
Let the Querent reflect, ask follow-up questions, or request a new spread.

### SESSION END
When the Querent is satisfied or after 2–3 spreads, offer a closing reflection.
Summarize key themes and any guidance that emerged. GAME_OVER if the Querent is done.
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
  } else if (templateId === "werewolf" || templateId === "mafia") {
    lines.push("Day discussion: ensure all living players speak before transitioning to vote. Keep individual speeches focused — no rambling monologues.");
  } else if (templateId === "undercover") {
    lines.push("One description per player per round — keep them short. Move to vote immediately after all descriptions.");
  } else if (templateId === "avalon") {
    lines.push("Keep quest nomination discussions focused. Move to vote after all players have spoken. Track rejection count and escalate urgency.");
  } else if (templateId === "escape-room") {
    lines.push("Respond to exploration immediately. If no progress for 3+ turns, offer a hint unprompted.");
  } else if (templateId === "trivia") {
    lines.push("One question at a time. Score immediately after all answers. No long pauses between rounds.");
  } else if (templateId === "debate") {
    lines.push("Enforce time limits per phase. Move to next phase after all speakers finish. No phase should drag.");
  } else if (templateId === "storyteller") {
    lines.push("Inject a twist every 2–3 rounds. If story stalls, advance the plot with an unexpected event.");
  } else if (templateId === "two-truths-lie") {
    lines.push("Keep rounds tight: statements → quick discussion → vote → reveal. Move to next active player immediately.");
  } else if (templateId === "tarot") {
    lines.push("Draw and interpret cards with depth but don't over-explain. Let the Querent guide the pace.");
  }

  if (recentNonHostTurns >= PROGRESSION_THRESHOLDS[mode]) {
    lines.push(`⚠️ PROGRESSION ALERT: ${recentNonHostTurns} player turns since your last action. Advance NOW — start vote, transition phase, or force a decision. No more open discussion.`);
  }

  return lines.join("\n");
}
