import { withDefaults } from "./types";

export const spyfall = withDefaults({
  id: "spyfall",
  name: "Spyfall",
  description: "One player is the Spy and doesn't know the secret location. Ask clever questions, give vague answers, and figure out who's bluffing.",
  minPlayers: 4,
  maxPlayers: 8,
  roles: ["Spy", "Player"],
  icon: "🕵️",
  color: "from-green-600 to-teal-600",
  estimatedTime: "15–20 min",
  recommendedAICount: 4,
  hasHiddenRoles: true,
  hasElimination: false,
  category: "deduction",

  hasVotingPhase: true,
  hasNightPhase: false,

  pacing: {
    progressionThreshold: 3,
    maxRounds: 3,
    hint: "After 6–8 question rounds, nudge players toward making accusations. If nobody has accused yet, raise the pressure — 'Time is running out, the Spy might escape!'",
  },

  mechanicsPrompt: `SPYFALL — LOCATION & SPY MANAGEMENT

SETUP:
- Pick a secret location from the location deck (e.g., Casino, Space Station, School, Pirate Ship).
- One player is randomly assigned the Spy role — they do NOT learn the location.
- All other players see the location and receive a role at that location (e.g., "Casino — Dealer").

QUESTIONING:
- The starting player picks someone and asks a question about the location.
- Questions should be subtle enough to test knowledge without giving the location away to the Spy.
- The questioned player answers, then picks the next person to question. No asking back-to-back.
- Players may NOT refuse to answer.

ACCUSATIONS:
- At any point, a player may pause questioning and accuse someone of being the Spy.
- If a second player seconds the accusation, all players vote.
- Majority vote → the accused is revealed. If they were the Spy, players win. If innocent, the Spy wins.
- Only one accusation allowed per round. Failed accusation = round continues.

SPY GUESSING:
- At any time, the Spy may reveal themselves and guess the location.
- Correct guess → Spy wins. Incorrect → players win.

TIMER:
- Each round lasts ~8 minutes of in-game discussion. After 3 rounds, if no one is caught, the Spy escapes and wins.

DRAMA:
- When accusations start flying, let the tension build — don't rush the vote.
- If the Spy reveals, make it a dramatic moment: "Wait… I know exactly where we are."
- Play up the awkwardness of vague answers — they're either clever deflections or Spy panic.`,

  playerPrompts: {
    default: "You know the secret location. Ask questions that prove others know the location too, but be careful — overly specific questions give the Spy free information. Stay vague enough to protect the secret, specific enough to catch the Spy.",
    byRole: {
      spy: "You are the Spy. You do NOT know the location. Listen carefully to every question and answer for clues. Blend in by giving answers that sound plausible for any location. If you figure out the location, you can reveal yourself and guess to win instantly. If you're accused, deny everything.",
    },
  },

  quickActions: [
    { label: "Ask question", template: "Ask {player} a question about the location", icon: "❓", needsTarget: true, phase: "day", actionType: "investigate" },
    { label: "Accuse", template: "I accuse {player} of being the Spy!", icon: "🔍", needsTarget: true, phase: "day", actionType: "social" },
    { label: "Second", template: "I second that accusation!", icon: "✋", phase: "day", actionType: "social" },
    { label: "Guess location", template: "I think the location is ", icon: "📍", role: "spy", actionType: "investigate" },
    { label: "Vote guilty", template: "I vote that they ARE the Spy.", icon: "✅", phase: "vote", actionType: "vote" },
    { label: "Vote innocent", template: "I vote that they are NOT the Spy.", icon: "❌", phase: "vote", actionType: "vote" },
  ],

  defaultRules: `SETTING: A secret location has been chosen — everyone knows it except the Spy. Ask questions, give careful answers, and figure out who's faking it.

PLAYERS: 4–8. Recommended: 5–7.

ROLES:
- Spy (1 player): Does NOT know the location. Must bluff their way through questions or correctly guess the location to win.
- Players (everyone else): Know the location and have a role at that location. Must identify the Spy without giving away too much information.

LOCATIONS (examples — Host picks one per game):
Casino, Space Station, Pirate Ship, School, Hospital, Movie Studio, Submarine, Circus, Beach Resort, Police Station, Restaurant, Museum, Library, Airport, Train, Supermarket.

PHASES:
1. QUESTIONING: Starting player picks someone and asks a question related to the location (e.g., "How did you get here today?"). The questioned player answers, then picks the next person to question. You cannot question the person who just questioned you.
2. ACCUSATION: Any player may stop questioning and accuse someone of being the Spy. If another player seconds the accusation, everyone votes. Majority = accused is revealed. One accusation per round.
3. SPY GUESS: At any point, the Spy may reveal and guess the location. Correct = Spy wins.

STRATEGY TIPS:
- Players: Ask questions specific enough to test knowledge, vague enough not to help the Spy. "What's the dress code?" is better than "What color are the casino chips?"
- Spy: Mirror the confidence of other players. Ask questions that work for many locations. Listen for repeated themes in answers.

HOW THE GAME ENDS:
- Players win: Correctly identify and vote out the Spy, OR the Spy guesses the wrong location.
- Spy wins: Survives all 3 rounds without being caught, OR correctly guesses the location.`,
});
