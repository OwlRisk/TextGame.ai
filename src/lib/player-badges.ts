// ─── Shared player badge enums and helpers ────────────────────────────────────
// Single source of truth for badge labels, player status values, and
// the pure logic functions that resolve which badge each player receives.
// Used by player-panel-with-board.tsx, channel-list.tsx, and tests.

// ── Players Online sidebar (channel-list.tsx) ─────────────────────────────────

/** Badge shown next to each entry in the "Players Online" section. */
export enum OnlineBadge {
  You   = "You",
  Host  = "Host",
  Guest = "Guest",
}

export interface RoomMember {
  id: string;
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
}

/**
 * Resolve which badge to show for a room member row.
 *
 * viewerMemberId present  → compare by ID to identify the viewer
 * viewerMemberId absent   → fall back to is_owner flag (owner views their room)
 */
export function resolveOnlineBadge(
  m: RoomMember,
  viewerMemberId: string | undefined
): OnlineBadge {
  const isViewer = viewerMemberId ? m.id === viewerMemberId : m.is_owner;
  if (isViewer) return OnlineBadge.You;
  if (m.is_owner) return OnlineBadge.Host;
  return OnlineBadge.Guest;
}

// ── Player panel right-side (player-panel-with-board.tsx) ─────────────────────

/** Badge shown on individual player cards in the right-side player panel. */
export enum PlayerCardBadge {
  You = "YOU",
  GM  = "GM",
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
 *  - currentUserId must be a non-empty string (guests have userId = "")
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
