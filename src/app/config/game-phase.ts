/**
 * Universal game phase state — driven by the AI Game Master via directives.
 * No game-specific logic here; the GM decides phases, moods, votes, and timers.
 */

export type GamePhaseKind = "waiting" | "lobby" | "active" | "ended";

export type GameMood = "neutral" | "dark" | "light";

export interface ActiveVote {
  question: string;
  /** Explicit options (e.g. ["Approve","Reject"]), or "players" to auto-use alive non-GM players */
  options: string[] | "players";
}

export interface QuestState {
  id: string;
  name: string;
  status: "active" | "completed" | "failed";
  description?: string;
}

export interface GamePhaseState {
  phase: GamePhaseKind;
  /** GM-set label shown in the channel header (e.g. "Night · Round 2", "Puzzle 3") */
  phaseLabel: string;
  /** Visual mood for the chat area background */
  mood: GameMood;
  /** Structured vote initiated by GM */
  activeVote: ActiveVote | null;
  /** Countdown timer end timestamp (Date.now() based), null = no timer */
  timerEndsAt: number | null;
  /** Summary text from GAME_OVER directive */
  gameOverSummary: string;

  // ── RPG / Exploration state ───────────────────────────────────────────
  /** Current scene/location ID the party is in. */
  currentScene?: string;
  /** Display name of the current scene. */
  currentSceneName?: string;
  /** Set of scene IDs the party has visited. */
  visitedScenes?: string[];
  /** Whether a combat encounter is currently active. */
  inCombat?: boolean;
  /** Name of the current combat enemy. */
  combatEnemy?: string;
  /** Active and completed quests. */
  quests?: QuestState[];
}

export const DEFAULT_GAME_PHASE: GamePhaseState = {
  phase: "waiting",
  phaseLabel: "",
  mood: "neutral",
  activeVote: null,
  timerEndsAt: null,
  gameOverSummary: "",
};
