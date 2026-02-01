/**
 * Utility functions for avatar generation to ensure consistency across all components.
 * Role design: see docs/ROLES.md (Game Master, Host, AI Player, User).
 */

import { Player } from "@/app/components/player-panel";

/**
 * Get standardized avatar props for a player.
 * - User (!isAI): "You", type "player".
 * - Host (isGameMaster): type "host"; identity from Host selector or generated Host.
 * - AI Player (isAI && !isGameMaster): type "player".
 * Use getAvatarPropsForPlayer + gameId when rendering GeneratedAvatar.
 */
export function getAvatarPropsForPlayer(player: Player | undefined | null) {
  if (!player) {
    return {
      name: undefined,
      type: "player" as const,
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
    };
  }

  // Current user ("You"): use minimal props so sidebar and chat share the same avatar cache key
  if (!player.isAI) {
    return {
      name: "You",
      type: "player" as const,
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
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
  };
}
