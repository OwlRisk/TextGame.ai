/**
 * Utility functions for avatar generation to ensure consistency across all components
 */

import { Player } from "@/app/components/player-panel";

/**
 * Get standardized avatar props for a player
 * This ensures all components use the same parameters for avatar generation,
 * resulting in consistent avatars across the UI (chat, player panel, etc.)
 * 
 * IMPORTANT: All components should use this function to ensure avatar consistency.
 * The gameId should be passed separately to GeneratedAvatar component.
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

  // Standardized background generation logic
  // For hosts: use background if provided and not empty, otherwise undefined
  // For players: use background if provided, otherwise generate default with role
  const normalizedBackground = player.background?.trim() || undefined;
  const background = player.isGameMaster
    ? normalizedBackground
    : (normalizedBackground ?? `Social deduction game player. Role: ${player.role ?? "Player"}.`);

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
