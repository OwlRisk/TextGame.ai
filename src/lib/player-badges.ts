// ─── Shared player badge enums and helpers ────────────────────────────────────
// Single source of truth for badge labels, player status values, and
// the pure logic functions that resolve which badge each player receives.

// ── Player panel right-side (player-panel-with-board.tsx) ─────────────────────

/** Badge shown on individual player cards in the right-side player panel. */
export enum PlayerCardBadge {
  You = "YOU",
  GM  = "HOST",
}

/** Status values that indicate a player has been removed from active play. */
export enum OutStatus {
  Eliminated   = "eliminated",
  Dead         = "dead",
  Out          = "out",
  Exiled       = "exiled",
  Banished     = "banished",
  Retired      = "retired",
  Spectating   = "spectating",
  Removed      = "removed",
  Disqualified = "disqualified",
  VotedOut     = "voted out",
}

export const OUT_STATUS_VALUES = Object.values(OutStatus) as string[];

interface PlayerLike {
  stats?: Record<string, string | number>;
  status?: string;
}

/** Returns true when a player's Status indicates they are out of the game. */
export function isPlayerEliminated(player: PlayerLike): boolean {
  const raw = ((player.stats?.Status as string | undefined) ?? player.status ?? "").toLowerCase();
  return OUT_STATUS_VALUES.some((s) => raw.includes(s));
}

/**
 * Resolve the YOU badge for a player card.
 *
 * Rules:
 *  - currentUserId must be a non-empty string
 *  - player.id must match currentUserId exactly
 *  - player must not be an AI
 *  - player must not be eliminated
 */
export function resolveYouBadge(
  player: { id: string; isAI: boolean } & PlayerLike,
  currentUserId: string | undefined
): boolean {
  return (
    !player.isAI &&
    !isPlayerEliminated(player) &&
    !!currentUserId &&
    player.id === currentUserId
  );
}
