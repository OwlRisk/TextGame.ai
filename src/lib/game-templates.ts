/**
 * Shared game template definitions.
 *
 * WHAT belongs here (user-editable content rules):
 *   - Setting / atmosphere description
 *   - Role list and each role's abilities
 *   - Game phases and what players do in each phase
 *   - Win conditions
 *   - Player-facing mechanics (how to vote, describe, etc.)
 *
 * What does NOT belong here (AI system-prompt instructions, kept in code):
 *   - "Host runs phases in order" — Host system prompt handles this
 *   - "Once rules are set they cannot change" — meta-instruction, not game content
 *   - "Keep replies under 80 words" — AI behavior constraint
 *   - NEXT_SPEAKER / ASSIGN_ROLE directives — code-side mechanics
 */

export interface GameTemplate {
  /** Unique identifier — matches config.template */
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  /** Default content rules shown to users; they can freely edit these. */
  defaultRules: string;
  /** Available roles for this template (used in setup UI). */
  roles?: string[];
  /** Emoji icon shown in UI selection screens. */
  icon: string;
  /** Tailwind gradient class for card color. */
  color: string;
  /** Estimated session duration shown in UI. */
  estimatedTime: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: "werewolf",
    name: "Werewolf",
    description: "A classic social deduction game where villagers try to find the werewolves among them.",
    minPlayers: 5,
    maxPlayers: 12,
    icon: "🐺",
    color: "from-purple-600 to-indigo-600",
    estimatedTime: "30–45 min",
    roles: ["Villager", "Werewolf", "Seer", "Doctor"],
    defaultRules: `SETTING: A village is plagued by werewolves. By day you are neighbors; by night the wolves hunt. Find them before they devour the town.

OBJECTIVE: Villagers must eliminate all Werewolves through day votes. Werewolves must eliminate enough Villagers at night until they equal or outnumber the town.

ROLES:
- Villager: Innocent; no special power. Discuss and vote by day.
- Werewolf: Each night, secretly choose one player to eliminate.
- Seer: Each night, learn one player's true role (Villager or Werewolf).
- Doctor: Each night, protect one player from elimination (may protect self once per game).

PHASES:
1. Night — Werewolves choose a victim; Seer investigates one player; Doctor protects one player.
2. Day — All living players discuss, then vote to eliminate one suspect. A tied vote results in no elimination.

WIN CONDITIONS:
- Villagers win when all Werewolves are eliminated.
- Werewolves win when they equal or outnumber the remaining Villagers.`,
  },

  {
    id: "mafia",
    name: "Mafia",
    description: "An intense game of lies and deception. Can the town survive the Mafia?",
    minPlayers: 6,
    maxPlayers: 15,
    icon: "🎭",
    color: "from-red-600 to-pink-600",
    estimatedTime: "45–60 min",
    roles: ["Town Member", "Mafia", "Detective", "Doctor"],
    defaultRules: `SETTING: A small town is infiltrated by the Mafia. By day the town debates and votes; by night the Mafia strikes. Trust no one until the last bullet flies.

OBJECTIVE: Town must eliminate all Mafia through day votes. Mafia must eliminate enough Town members at night until they equal or outnumber the living Town.

ROLES:
- Town Member: Innocent citizen; no special power. Discuss and vote by day.
- Mafia: Each night, secretly choose one player to eliminate.
- Detective: Each night, investigate one player and learn their true alignment (Town or Mafia).
- Doctor: Each night, protect one player from elimination (may protect self once per game).

PHASES:
1. Night — Mafia choose a victim; Detective investigates one player; Doctor protects one player.
2. Day — All living players discuss, then vote to eliminate one suspect. A tied vote results in no elimination.

WIN CONDITIONS:
- Town wins when all Mafia are eliminated.
- Mafia wins when they equal or outnumber the remaining Town members.`,
  },

  {
    id: "undercover",
    name: "Undercover (Who's the Spy)",
    description: "Find the undercover agent who has a different word while blending in with the group.",
    minPlayers: 4,
    maxPlayers: 10,
    icon: "🕵️",
    color: "from-blue-600 to-cyan-600",
    estimatedTime: "15–20 min",
    roles: ["Civilian", "Undercover", "Mr. White"],
    defaultRules: `SETTING: Everyone is given a secret word — except one Undercover agent with a different but related word, and optionally one Mr. White with no word at all. Describe your word without saying it; find the spy before they blend in.

OBJECTIVE: Civilians must identify and vote out the Undercover. The Undercover must blend in and survive until the final round.

ROLES:
- Civilian: Receives the common word. Describe it to blend in while helping expose the Undercover.
- Undercover: Receives a similar but different word. Describe it vaguely enough to avoid detection.
- Mr. White (optional): Has no word. Listen carefully and bluff your way through.

GAMEPLAY:
1. Each player gives a one-sentence description of their word (without saying the word itself).
2. After all players describe, everyone votes to eliminate one player. The player with the most votes is eliminated and their role revealed.
3. Repeat until the Undercover is eliminated or the Undercover wins.

WIN CONDITIONS:
- Civilians win if the Undercover is eliminated before the final round.
- Undercover wins if still alive when only 3 or fewer players remain.
- Mr. White (if in game) wins by correctly guessing the Civilians' word when eliminated.`,
  },

  {
    id: "tarot",
    name: "Tarot Reading",
    description: "A reflective Tarot reading with the Host as reader. Ask a question and receive card-based guidance.",
    minPlayers: 1,
    maxPlayers: 1,
    icon: "🃏",
    color: "from-amber-700 to-yellow-600",
    estimatedTime: "10–20 min",
    roles: ["Querent"],
    defaultRules: `SETTING: A calm, reflective space. The Host acts as the Tarot reader. The human is the Querent — the one asking the question and receiving the reading.

DECK: Standard 78-card Tarot deck: 22 Major Arcana (The Fool through The World) and 56 Minor Arcana in four suits (Wands, Cups, Swords, Pentacles).

SPREADS:
- Single card: One card for a quick insight or daily draw.
- Three cards: Past / Present / Future, or Situation / Action / Outcome.
- Celtic Cross (10 cards): Full spread for deeper, complex questions.
- Custom: Host may propose other spreads as appropriate.

SESSION FLOW:
1. Host sets the mood and invites the Querent to share a question or intention (or requests a general reading).
2. Host draws and names each card (noting if upright or reversed).
3. Host interprets each card in relation to the question — thoughtful, encouraging, never harsh or deterministic.
4. Host offers a closing summary when the reading feels complete.

TONE: Reflective and slightly mystical. This is a tool for perspective and self-reflection, not literal prediction.`,
  },

  {
    id: "custom",
    name: "Custom Game",
    description: "Create your own game with custom rules and roles.",
    minPlayers: 2,
    maxPlayers: 20,
    icon: "✨",
    color: "from-violet-600 to-fuchsia-600",
    estimatedTime: "Varies",
    roles: [],
    defaultRules: "",
  },
];

/**
 * Default slash commands injected at game creation (editable afterwards in-game).
 * These are player-facing shortcuts, not AI instructions.
 */
export const DEFAULT_SLASH_COMMANDS: Record<string, Array<{ cmd: string; hint: string }>> = {
  werewolf: [
    { cmd: "/vote",  hint: "Vote to eliminate a player" },
    { cmd: "/role",  hint: "Check your current role"    },
    { cmd: "/rules", hint: "Display game rules"         },
  ],
  mafia: [
    { cmd: "/vote",  hint: "Vote to eliminate a player" },
    { cmd: "/role",  hint: "Check your current role"    },
    { cmd: "/rules", hint: "Display game rules"         },
  ],
  undercover: [
    { cmd: "/vote",  hint: "Vote to eliminate a player" },
    { cmd: "/rules", hint: "Display game rules"         },
  ],
  tarot: [
    { cmd: "/draw",  hint: "Draw a tarot card"          },
    { cmd: "/rules", hint: "Display game rules"         },
  ],
  custom: [],
};

/** Helper: look up a template by id (returns undefined if not found). */
export function getGameTemplate(id: string): GameTemplate | undefined {
  return GAME_TEMPLATES.find((t) => t.id === id);
}
