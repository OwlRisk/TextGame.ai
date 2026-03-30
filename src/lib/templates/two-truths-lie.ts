import { withDefaults } from "./types";

export const twoTruthsLie = withDefaults({
  id: "two-truths-lie",
  name: "Two Truths and a Lie",
  description:
    "Share three statements about yourself. Others guess which one is false.",
  minPlayers: 3,
  maxPlayers: 12,
  recommendedAICount: 4,
  hasHiddenRoles: false,
  hasElimination: false,
  category: "party",
  icon: "🤥",
  color: "from-green-500 to-emerald-500",
  estimatedTime: "15–25 min",
  roles: ["Player"],

  hostVoice: { maxSentences: 1, silentByDefault: false, drama: "medium" },
  speakerMode: "round-table",

  mechanicsPrompt: `TWO TRUTHS AND A LIE — ROUND MANAGEMENT

You are the Host of Two Truths and a Lie. Manage the flow and keep energy high.

ROUND FLOW:
1. Announce the active player: "It's {player}'s turn — give us two truths and one lie!"
2. After statements are shared, open the floor for one optional follow-up question per guesser.
3. Call for votes: "Lock in your guesses — which statement is the lie?"
4. Collect all votes, then cue the reveal.

THE REVEAL — build anticipation:
- Pause dramatically before the answer. ("The moment of truth...")
- Reveal one statement at a time: confirm truths first, then unveil the lie last.
- React to surprising truths with genuine excitement ("Wait — you actually did that?!").

DRAMA:
- Build anticipation before the reveal ("Three statements. One lie. Who's sharp enough to spot it?").
- React to surprising truths ("That's REAL?! I would have bet money that was the lie!").
- Celebrate clever lies ("Masterfully crafted — almost everyone fell for it.").
- Track and announce running scores between rounds.

SCORING:
- Each correct guesser: 1 point.
- Active player: 1 point per person fooled.
- Announce updated leaderboard after each round.`,

  playerPrompts: {
    default:
      "You are a creative player in Two Truths and a Lie. Craft statements that are surprising yet believable — your truths should sound like lies, and your lie should sound like truth. When guessing, pay attention to how specific or vague statements are, and whether details feel rehearsed. React to reveals with genuine surprise or playful suspicion.",
  },

  quickActions: [
    { label: "Lie is #", template: "I think the lie is #", icon: "🎯" },
    {
      label: "Suspicious!",
      template: "That one sounds suspicious! ",
      icon: "🤔",
    },
    { label: "Tell more", template: "Tell us more about #", icon: "🔍" },
  ],

  defaultRules: `SETTING: A social icebreaker where players share personal statements — two true, one false — and the group tries to spot the lie.

PLAYERS: 3–12. Recommended: 4–6 (all Players).

GAMEPLAY:
1. The active player prepares two true facts about themselves and one believable lie.
2. They share all three statements in any order — without revealing which is the lie.
3. Other players may ask one follow-up question each (optional, for a more interactive round).
4. All players simultaneously vote on which statement they believe is the lie.
5. The active player reveals the truth.
   - Each correct guesser earns 1 point.
   - The active player earns 1 point for each person they fooled.
6. Rotate to the next player.

CRAFTING GOOD STATEMENTS:
- The best lies are close to the truth — plausible, specific, and hard to disprove.
- The best truths are surprising — things others would never guess.
- Avoid obvious lies and boring truths.

HOW THE STORY ENDS: Most points after all players have taken a turn. Or play cooperatively for fun — no scoring needed.`,
});
