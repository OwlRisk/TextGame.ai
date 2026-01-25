/**
 * Game phase and state for Host-driven flow.
 * Tracks round, phase (night/day/voting/etc.), and eliminated players.
 */

export type GamePhaseKind =
  | "intro"
  | "night"
  | "day"
  | "discussion"
  | "voting"
  | "elimination"
  | "game-over";

export interface GamePhaseState {
  round: number;
  phase: GamePhaseKind;
  eliminatedPlayerIds: string[];
  /** For werewolf: who was eliminated last night (to announce at day start) */
  lastNightVictimId: string | null;
  /** For voting: who was just eliminated (to reveal role) */
  lastVotedOutId: string | null;
}

export const DEFAULT_GAME_PHASE: GamePhaseState = {
  round: 1,
  phase: "intro",
  eliminatedPlayerIds: [],
  lastNightVictimId: null,
  lastVotedOutId: null,
};

export function nextPhaseForWerewolf(
  current: GamePhaseState
): GamePhaseKind | null {
  switch (current.phase) {
    case "intro":
      return "night";
    case "night":
      return "day";
    case "day":
      return "discussion";
    case "discussion":
      return "voting";
    case "voting":
      return "elimination";
    case "elimination":
      return "night"; // next round
    case "game-over":
      return null;
    default:
      return "night";
  }
}

export function phaseLabel(phase: GamePhaseKind, round: number): string {
  const r = `Round ${round}`;
  switch (phase) {
    case "intro":
      return "Intro";
    case "night":
      return `${r} · Night`;
    case "day":
      return `${r} · Day`;
    case "discussion":
      return `${r} · Discussion`;
    case "voting":
      return `${r} · Voting`;
    case "elimination":
      return `${r} · Elimination`;
    case "game-over":
      return "Game Over";
    default:
      return r;
  }
}
