import { withDefaults } from "./types";

export const undercover = withDefaults({
  id: "undercover",
  name: "Undercover",
  description: "Everyone describes their secret word — but one player has a different word. Find the spy before they blend in.",
  minPlayers: 4,
  maxPlayers: 10,
  recommendedAICount: 5,
  hasHiddenRoles: true,
  hasElimination: true,
  hasSecretWord: true,
  category: "deduction",
  icon: "🕵️",
  color: "from-blue-600 to-cyan-600",
  estimatedTime: "15–20 min",
  roles: ["Civilian", "Undercover", "Mr. White"],
  defaultRules: `SETTING: Everyone has a secret word — but one player has a subtly different word and is trying to blend in without getting caught.

PLAYERS: 4–10. Recommended: 5–7.
- 4–6 players: 1 Undercover, rest Civilians. Mr. White optional for 5+.
- 7–10 players: 1–2 Undercover, 1 Mr. White (optional), rest Civilians.

ROLES:
- Civilian: Receives the common word. Describe it clearly enough to prove you belong — but not so obviously you give the Undercover a free pass.
- Undercover: Receives a similar but different word. Describe vaguely to avoid detection. Survive to the final round to win.
- Mr. White (optional): Has no word at all. Listen carefully and bluff. Can win by guessing the Civilians' word when eliminated.

GAMEPLAY:
1. Starting with a random player, each person gives one sentence describing their word — without saying the word itself.
2. After all descriptions, players vote to eliminate the most suspicious player.
3. The eliminated player's role and word are revealed.
4. Repeat until the Undercover is found, or the Undercover wins.

DESCRIPTION RULES:
- One sentence per turn. No follow-up clues.
- You may not say the word directly or rhyme it.
- Describe a related concept, feeling, or use case.

HOW THE STORY ENDS:
- Spy uncovered: The Undercover is found and eliminated before the final 3 players remain.
- Spy escapes: The Undercover is still among the last 3 standing.
- Mr. White's gambit: Mr. White correctly guesses the Civilians' word when eliminated.`,

  hasNightPhase: false,

  hostVoice: {
    maxSentences: 2, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like a psychological thriller. Everyone is smiling, but someone is lying. Focus on micro-expressions and word choices — the slight hesitation, the too-eager agreement, the answer that is almost right but not quite. Voting moments should feel like a jury deliberation where no one trusts anyone. When an undercover agent is caught, describe the mask slipping.`,
  },

  pacing: {
    progressionThreshold: 3,
    maxRounds: 5,
    hint: "Keep rounds snappy — each player gives ONE description sentence, then vote immediately. Don't let discussion drag between rounds.",
  },

  mechanicsPrompt: `## UNDERCOVER — WORD ASSIGNMENT & ROUND-ROBIN DESCRIPTION

### SETUP — WORD PAIRS
Pick a pair of similar words (e.g., "Coffee / Tea", "Guitar / Ukulele", "Mars / Moon").
- Civilians receive the common word.
- Undercover receives the similar word.
- Mr. White receives NO word (just told they're Mr. White).
Use [BOARD:PlayerName] to privately send each player's word at game start.

### DESCRIPTION ROUNDS
Each round, ALL living players give ONE sentence describing their word.
Use NEXT_SPEAKER to list every living player in order (rotate the starting player each round).
Example: NEXT_SPEAKER: Lila, Kai, Mira, HumanPlayer, Zara

Rules:
- Exactly ONE sentence per player. Enforce this strictly.
- Players must NOT say their word, rhyme it, or spell it.
- After all players describe, immediately transition to voting.

### VOTING
After descriptions, list ALL living players in NEXT_SPEAKER for voting.
Each player names who they want to eliminate. Majority decides; tie = no elimination.
When eliminated, reveal the player's role and their word.

### MR. WHITE'S LAST CHANCE
If Mr. White is eliminated, they get ONE guess at the Civilians' word before the game moves on.
Correct guess = Mr. White wins. Wrong guess = game continues.

### DRAMA — BUILD SUSPICION BETWEEN ROUNDS
- After each description round: "Interesting... some of those descriptions felt a little... off."
- Before votes: "Someone here is hiding. You all heard the same descriptions — who didn't belong?"
- When descriptions are very similar: "Almost too similar... is someone copying?"
- When eliminating: pause before the reveal. "Let's see who {name} really is..."
- Final 3 alive: "This is it. One more wrong vote and the spy walks free."
- Use ANNOUNCE between phases. Keep energy high — this is a fast game.`,

  playerPrompts: {
    default: `You're playing Undercover, a word description game. You have a secret word.

HOW TO PLAY:
- Describe your word indirectly in ONE sentence. Be specific enough to prove you belong, vague enough to not give it away.
- Good: describe a feeling, use case, memory, or association. Bad: dictionary definitions.
- Watch for descriptions that feel slightly off — they might have a different word.
- Vote for whoever seems most out of place.`,
    byRole: {
      undercover: `You're the Undercover agent. Your word is SIMILAR but DIFFERENT from everyone else's.

HOW TO PLAY:
- Listen carefully to others' descriptions before committing to yours.
- Mirror the vibe of civilian descriptions — match their energy and specificity level.
- Don't describe too precisely (your word is different!) but don't be suspiciously vague.
- Redirect suspicion subtly: "That was a weird description, {name}..."
- Survive to the final 3 and you win.`,
      "mr. white": `You're Mr. White. You have NO word at all. Total bluff mode.

HOW TO PLAY:
- Listen to others' descriptions and piece together what the word might be.
- Give a description that sounds plausible based on what you've heard.
- Stay generic enough to not contradict anyone, specific enough to not seem clueless.
- If caught: you get ONE guess at the Civilians' word. Nail it and you win anyway.`,
    },
  },

  quickActions: [
    { label: "Describe", template: "My word makes me think of ", icon: "💬", phase: "day", actionType: "social" },
    { label: "Suspect", template: "I think {player} has a different word because ", needsTarget: true, icon: "🔍", phase: "day", actionType: "social" },
    { label: "Vote", template: "I vote to eliminate {player}", needsTarget: true, icon: "🗳️", phase: "vote", actionType: "vote" },
  ],
});
