import { withDefaults } from "./types";

export const codenames = withDefaults({
  id: "codenames",
  name: "Codenames",
  description: "Two teams race to contact all their agents using one-word clues.",
  minPlayers: 4,
  maxPlayers: 12,
  recommendedAICount: 5,
  hasHiddenRoles: false,
  hasElimination: false,
  category: "deduction",
  icon: "🔍",
  color: "from-orange-600 to-red-600",
  estimatedTime: "15–25 min",
  roles: ["Spymaster", "Field Operative"],
  defaultRules: `SETTING: Two spy agencies race to contact all their field agents hidden among 25 code words — before the other team does.

PLAYERS: 4–12. Recommended: 6–8 (split evenly into two teams, each with 1 Spymaster + Operatives).

SETUP:
- 25 word cards are laid out in a 5×5 grid.
- Each Spymaster secretly knows which words belong to their team (8–9 words), the location of bystanders, and 1 Assassin.

ROLES:
- Spymaster: Knows the secret grid. Gives one-word clues to guide their team.
- Field Operative: Discusses with teammates and guesses which cards match the Spymaster's clue.

GAMEPLAY:
1. Spymaster gives a one-word clue and a number — e.g., "Ocean: 3" means 3 of your cards relate to "ocean."
2. Operatives discuss and guess cards one at a time.
   - Correct guess: agent contacted — team may keep guessing (up to clue number + 1 total).
   - Wrong guess (bystander): turn ends immediately.
   - Wrong guess (opponent's agent): that card flips for the enemy — turn ends.
   - Assassin card guessed: that team loses immediately.
3. Teams alternate turns until one team contacts all their agents.

CLUE RULES:
- One word only. Cannot be any form of a word currently on the board.
- The number only indicates how many cards relate to the clue — not additional hints.

HOW THE STORY ENDS:
- Mission complete: First team to contact all their agents closes the operation.
- Assassin triggered: The team that guesses the Assassin card is exposed and the game ends immediately.`,

  hasVotingPhase: false,
  hasNightPhase: false,
  speakerMode: "selective",

  hostVoice: {
    maxSentences: 2, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like a spy thriller briefing. Cold War tension — every word is a code, every guess could blow a cover. When agents are contacted, describe the thrill of connection. When the Assassin looms, build dread. Correct guesses feel like a heist going right; wrong guesses feel like an alarm tripped. Keep it crisp and urgent, like intercepted radio transmissions.`,
  },

  pacing: {
    progressionThreshold: 3,
    maxRounds: 8,
    hint: "Alternate between teams crisply. During operative discussion, let 2–3 exchanges happen then nudge toward a guess. Don't let analysis paralysis set in.",
  },

  mechanicsPrompt: `## CODENAMES — GRID & TURN MANAGEMENT

### SETUP — GENERATE THE BOARD
Create a 5×5 grid of 25 common English words (nouns preferred, varied topics).
Secretly assign: 9 words to Team Red, 8 to Team Blue, 7 bystanders, 1 Assassin.
Display the grid to all players using ANNOUNCE (words only, no color coding).
Send the secret key map to each Spymaster via [BOARD:SpymasterName].

### TEAM ASSIGNMENT
Split players into two teams. Each team has exactly 1 Spymaster and 1+ Field Operatives.
Team Red goes first (they have 9 words to compensate).

### TURN STRUCTURE
Each turn:
1. **Spymaster gives clue**: Put the active Spymaster in NEXT_SPEAKER. They say ONE word + a number.
   - Validate: clue cannot be a word on the board, cannot be multiple words, number must be ≥ 1.
2. **Operatives discuss**: Put the active team's Field Operatives in NEXT_SPEAKER.
   - Let them discuss for 2–3 exchanges, then prompt for a guess.
3. **Guess resolution**: When an operative names a card:
   - ✅ Correct (team's word): Mark it, team may guess again (up to number + 1 total guesses).
   - ⬜ Bystander: Mark it, turn ends immediately.
   - 🔴/🔵 Opponent's word: Mark it for the opponent, turn ends.
   - ☠️ Assassin: Game over — that team loses instantly.
4. **Pass**: Team may choose to stop guessing and end their turn.
5. Switch to the other team.

### BOARD DISPLAY
After each guess, re-display the updated grid with revealed words marked.
Use color indicators: [RED], [BLUE], [---] for bystander, [☠️] for assassin.
Unrevealed words show normally.

### WIN DETECTION
After each guess, check: has either team contacted all their words? If yes, announce the winner.
If the Assassin is revealed, the guessing team loses immediately — make it dramatic.

### DRAMA — MAKE IT EXCITING
- When a team is one word away from winning: "One word left. One guess. The mission hangs in the balance."
- Assassin near-miss (guessing a word adjacent to the Assassin on the board): "That was close... dangerously close."
- When a clue is brilliant (connects 3+ words): let the operatives react — "Wait... Ocean could mean..."
- Wrong guess hitting opponent's word: "The card flips... and it's not yours. The enemy thanks you for the intel."
- Assassin hit: "The card turns over. A skull stares back. Mission compromised. Game over."
- Use ANNOUNCE for board updates. Keep energy competitive between teams.`,

  playerPrompts: {
    default: `You're playing Codenames on a team. Work with your teammates to find your agents.

HOW TO PLAY:
- Discuss your Spymaster's clue with your team. Think about which words on the board connect.
- Be decisive — overthinking loses turns. Share your reasoning briefly.
- If unsure, it's okay to stop guessing and save a risky pick for later.`,
    byRole: {
      spymaster: `You're the Spymaster. You see the secret grid and must guide your team with one-word clues.

HOW TO PLAY:
- Study the grid. Find connections between YOUR team's words that don't overlap with the opponent's or the Assassin.
- Give clues that link multiple words: "Ocean: 3" if three of your words relate to the ocean.
- AVOID clues that could lead to the Assassin — that's an instant loss.
- Think about how your team will interpret the clue, not just how you see it.
- Higher numbers are riskier but catch you up faster. Play it safe when ahead.`,
      "field operative": `You're a Field Operative. Your Spymaster gives clues — you and your team guess which words they mean.

HOW TO PLAY:
- When you hear the clue, brainstorm which board words connect to it.
- Discuss with teammates: "I think 'Ocean' points to WAVE and SHIP..."
- Start with your most confident guess. Save uncertain ones for later.
- You can always stop guessing to avoid hitting the Assassin.
- Pay attention to the opponent's Spymaster clues too — they reveal which words to avoid.`,
    },
  },

  quickActions: [
    { label: "Give clue", template: "My clue is: ", icon: "🔑", role: "spymaster" },
    { label: "Guess", template: "I want to guess: ", icon: "🎯", role: "field operative" },
    { label: "Discuss", template: "I think the clue connects to ", icon: "💬", role: "field operative" },
    { label: "Stop guessing", template: "Let's stop here and pass the turn.", icon: "✋", role: "field operative" },
  ],
});
