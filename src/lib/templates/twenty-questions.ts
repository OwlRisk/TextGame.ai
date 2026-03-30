import { withDefaults } from "./types";

export const twentyQuestions = withDefaults({
  id: "20-questions",
  name: "20 Questions",
  description:
    "Think of something, and let others guess it in 20 yes-or-no questions.",
  minPlayers: 2,
  maxPlayers: 10,
  recommendedAICount: 3,
  hasHiddenRoles: false,
  hasElimination: false,
  hostAnswersQuestions: true,
  category: "quiz",
  icon: "❓",
  color: "from-blue-500 to-cyan-500",
  estimatedTime: "10–15 min",
  roles: ["Guesser"],

  hostVoice: { maxSentences: 1, silentByDefault: false, drama: "medium" },
  speakerMode: "selective",

  mechanicsPrompt: `20 QUESTIONS — YOU ARE THE THINKER

You have secretly chosen a person, place, animal, or object. The players must figure it out in 20 yes-or-no questions.

ANSWER RULES:
- Only answer: Yes / No / Sometimes / I don't know.
- Be honest and consistent. Never change your secret answer mid-game.
- Count questions aloud ("That's question 7 of 20.").

HOT/COLD HINTS (the fun twist!):
After every 5th question (Q5, Q10, Q15), deliver a dramatic warmth rating:
  🧊 "Ice Cold! You're lost in the wilderness — not even close!"
  ❄️ "Cold... you're wandering the wrong direction entirely."
  🌤️ "Warm! Something in the air is shifting — you're onto something."
  🔥 "Hot! The answer is practically waving at you!"
  💥 "BURNING! One good question away from cracking it!"
Make each hint theatrical — build suspense, tease the players, react with energy.
The warmth rating reflects the group's OVERALL line of questioning, not just the last question.

PACING:
- Keep rounds crisp. One question, one answer, move on.
- If players stall, nudge them: "Clock's ticking — 8 questions left!"
- After a direct guess attempt, confirm or deny immediately and dramatically.

ENDGAME:
- Correct guess: celebrate with flair. Recap the key questions that cracked it.
- 20 questions used up: reveal the answer with a dramatic flourish and recap near-misses.

### DRAMA — MAKE IT A SHOWDOWN
- Each Hot/Cold hint is a performance. Build anticipation: "Let me check the temperature..."
- When players get Hot: match their excitement. "You can practically TASTE it!"
- When a guess is wrong: "Ohhh, so close! The answer slips through your fingers."
- Final 3 questions: ramp up tension. "Three questions left. Make them count."
- The big reveal (win or lose): make it a mic-drop moment.`,

  playerPrompts: {
    default:
      "You are a sharp guesser. Build on confirmed facts from previous questions — don't repeat what's already been asked. React to Hot/Cold hints and adjust your strategy. Start broad, narrow progressively, and go for the kill when you feel confident.",
  },

  quickActions: [
    { label: "Yes/No?", template: "Is it ", icon: "❓", actionType: "investigate" },
    { label: "Guess", template: "I think it's ", icon: "🎯", actionType: "use" },
  ],

  defaultRules: `SETTING: The Host secretly thinks of a person, place, animal, or object. All players are Guessers with 20 yes-or-no questions to figure out what it is.

PLAYERS: 2–10. Recommended: 3–5 (all Guessers). The Host acts as the Thinker.

ROLES:
- The Host (Thinker): Secretly chooses a target and answers questions honestly with Yes, No, or Sometimes.
- All Players (Guessers): Ask questions to narrow down the target within 20 questions.

GAMEPLAY:
1. The Host announces a category hint: Person, Place, Animal, or Thing (optional but recommended).
2. Players take turns asking yes-or-no questions (e.g., "Is it alive?" "Is it smaller than a car?").
3. The Host may only answer: Yes / No / Sometimes / I don't know.
4. A player may use their turn to make a direct guess instead of asking a question.
5. The game ends after 20 questions total, or a correct direct guess — whichever comes first.

HOT/COLD HINTS (the fun twist!):
After every 5th question (Q5, Q10, Q15), the Host gives a warmth rating on how close the group's thinking is:
  🧊 Ice Cold — totally off track
  ❄️ Cold — wrong direction
  🌤️ Warm — getting closer
  🔥 Hot — very close
  💥 Burning! — almost there
The warmth rating reflects the group's OVERALL line of questioning — not just the last question.

GOOD QUESTION STRATEGY:
- Start broad: Is it alive? Is it human? Is it natural or man-made?
- Narrow progressively: Is it something you'd find indoors? Is it edible?
- After a Hot/Cold hint, redirect strategy if needed.

HOW THE STORY ENDS:
- Cracked it: Guessers correctly identify the target within 20 questions.
- Too mysterious: The target is not guessed after all 20 questions — the Host reveals the answer.`,
});
