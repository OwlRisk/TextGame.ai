import { withDefaults } from "./types";

export const trivia = withDefaults({
  id: "trivia",
  name: "Trivia Championship",
  description: "Test your knowledge across history, science, pop culture, and more.",
  minPlayers: 2,
  maxPlayers: 10,
  roles: ["Contestant"],
  icon: "💡",
  color: "from-yellow-600 to-orange-600",
  estimatedTime: "20–30 min",
  recommendedAICount: 3,
  hasHiddenRoles: false,
  hasElimination: false,
  category: "quiz",

  hostVoice: { maxSentences: 1, silentByDefault: false, drama: "medium" },
  speakerMode: "round-table",

  pacing: {
    progressionThreshold: 2,
    hint: "Keep rounds crisp — reveal the answer within 2 turns of the question. If nobody answers, give a hint then move on. Never let a single question drag.",
  },

  mechanicsPrompt: `TRIVIA — QUESTION & SCORING MANAGEMENT

SETUP:
- Host prepares 10–20 questions across 3–5 categories (e.g., Science, Pop Culture, History, Geography, Wildcard).
- Questions should vary in difficulty: easy (1 pt), medium (2 pts), hard (3 pts).
- Announce the category before each question. Optionally let players pick the next category.

QUESTION FLOW:
- Host reads the question clearly. All players answer simultaneously (or in turn order for tiebreakers).
- Accept answers that are substantively correct even if not word-perfect.
- Reveal the correct answer with a brief fun fact or context.
- Update the scoreboard after every question.

SCORING:
- Correct answer: points based on difficulty.
- Speed bonus: first correct answer gets +1 bonus point.
- Streak bonus: 3 correct in a row = +2 bonus on the third.
- Wrong answer: 0 points (no penalty).

SPECIAL ROUNDS:
- Double or Nothing (round 3): Players can wager their points on a single question.
- Lightning Round (final): Rapid-fire 5 questions, 1 point each, 10-second timer per question.
- Steal: If a player answers wrong, the next player can "steal" for half points.

SCOREBOARD:
- Display running scores after every 3 questions minimum.
- Announce the leader and any close races to maintain competitive energy.

DRAMA:
- Build excitement around close scores and lead changes.
- Hype up the final round — "It all comes down to this!"
- Celebrate impressive answers and playfully roast funny wrong ones.`,

  playerPrompts: {
    default: "You're in a competitive pub quiz. Answer fast and confidently — first correct answer gets bonus points. If you're not sure, guess anyway — there's no penalty for being wrong. Trash talk is encouraged. Keep the energy high and have fun with it.",
  },

  quickActions: [
    { label: "Answer", template: "My answer is ", icon: "✋" },
    { label: "Guess", template: "I'll guess ", icon: "🤔" },
    { label: "Steal", template: "I'll steal — my answer is ", icon: "🏴‍☠️" },
    { label: "Wager", template: "I wager ", icon: "🎰" },
    { label: "Pick category", template: "I want the category: ", icon: "📂" },
  ],

  defaultRules: `SETTING: Welcome to Trivia Night! Grab a drink, rally your brain cells, and compete for the title of Quiz Champion.

PLAYERS: 2–10. Recommended: 4–6.
- All players are Contestants competing individually. No teams, no alliances — just you and your knowledge.

HOW IT WORKS:
- The Host asks questions from rotating categories.
- Everyone answers. First correct answer gets a speed bonus.
- Points vary by difficulty: Easy (1 pt), Medium (2 pts), Hard (3 pts).
- The scoreboard updates after every question.

SCORING:
- Correct answer: points based on difficulty level.
- Speed bonus: +1 point for the first correct answer.
- Streak bonus: 3 correct in a row = +2 bonus points.
- Wrong answer: 0 points (no penalty — always guess!).
- Steal: If someone gets it wrong, the next player can steal for half points.

CATEGORIES (Host picks 3–5 per game):
Science & Nature, History, Pop Culture, Geography, Sports, Literature, Music, Food & Drink, Movies & TV, Technology, Wildcard (anything goes).

SPECIAL ROUNDS:
- Double or Nothing (Round 3): Wager some or all of your points on a single question.
- Lightning Round (Final): 5 rapid-fire questions, 1 point each, quick timer.

HOUSE RULES:
- Accept answers that are close enough (e.g., "Einstein" counts for "Albert Einstein").
- Spelling doesn't matter as long as intent is clear.
- The Host's ruling is final.

HOW THE GAME ENDS:
- After all questions are answered, the player with the most points wins.
- Tiebreaker: sudden-death question between tied players.
- Everyone gets bragging rights (or shame) based on their final ranking.`,
});
