/**
 * Utility functions for avatar generation to ensure consistency across all components.
 * Role design: see docs/ROLES.md (Game Master, Host, AI Player, User).
 */

import { Player } from "@/app/components/player-panel";
import { AvatarStyle } from "./avatar-style-constants";

/**
 * Get standardized avatar props for a player.
 * - User (!isAI): "You", type "player".
 * - Host (isGameMaster): type "host"; identity from Host selector or generated Host.
 * - AI Player (isAI && !isGameMaster): type "player".
 * Use getAvatarPropsForPlayer + gameId when rendering GeneratedAvatar.
 *
 * Pass `style` to include it in the returned props so callers can forward it
 * directly to <GeneratedAvatar style={...}> without reading localStorage themselves.
 */
export function getAvatarPropsForPlayer(
  player: Player | undefined | null,
  style?: AvatarStyle,
) {
  if (!player) {
    return {
      name: undefined,
      type: "player" as const,
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
      style,
    };
  }

  // Current user: use player.name (game identity when set, e.g. "Evelyn Hart") so chat and panel show the same avatar
  if (!player.isAI) {
    const name = (player.name && player.name.trim() && player.name !== "You") ? player.name.trim() : "You";
    return {
      name,
      type: "player" as const,
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
      style,
    };
  }

  // Host vs AI Player: Host uses background if provided; AI Player uses role-based default
  // Avoid "game", "player" plural to reduce multi-face avatar output
  const normalizedBackground = player.background?.trim() || undefined;
  const background = player.isGameMaster
    ? (normalizedBackground ?? `Professional presenter, charismatic host.`)
    : (normalizedBackground ?? `Avatar portrait. Role: ${player.role ?? "Player"}.`);

  // Normalize role, personality, gender for consistency
  const normalizedRole = player.role?.trim() || undefined;
  const normalizedPersonality = player.personality?.trim() || undefined;
  const normalizedGender = player.gender?.trim().toLowerCase() || undefined;
  const gender = normalizedGender === 'male' || normalizedGender === 'female' || normalizedGender === 'other'
    ? normalizedGender
    : undefined;

  return {
    name: player.name,
    type: (player.isGameMaster ? "host" : "player") as "host" | "player",
    background,
    personality: normalizedPersonality,
    role: normalizedRole,
    gender,
    style,
  };
}
