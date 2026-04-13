import type { RpgCharacter } from "./rpg";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  stats?: Record<string, string | number>;
  /** RPG character sheet — level, HP/MP, skills, equipment, inventory */
  rpg?: RpgCharacter;
  isMuted?: boolean;
  isGameMaster?: boolean;
  isAI: boolean;
  isOnline?: boolean;
  /** AI-only: short personality tag (e.g. "Skeptical and analytical") */
  personality?: string;
  /** AI-only: backstory / context (e.g. "Former debate champion") */
  background?: string;
  /** AI-only: how this character talks (e.g. "blunt and sarcastic", "poetic and flowery") */
  speechStyle?: string;
  /** AI-only: behavioral quirk (e.g. "always uses food metaphors", "gets paranoid easily") */
  quirk?: string;
  /** AI-only: character motivation (e.g. "Find the legendary sword of her ancestors") */
  goal?: string;
  /** AI-only: character fear (e.g. "Being trapped underground with no way out") */
  fear?: string;
  /** AI-only: how this character relates to the human player (e.g. "Loyal but sometimes overprotective") */
  attitudeToPlayer?: string;
  /** Player gender (male, female, other) - used for avatar generation and TTS voice matching */
  gender?: string;
  /** Whether this player's role has been publicly revealed by the Host (via REVEAL_ROLE directive). */
  roleRevealed?: boolean;
  /** Persistent TTS voice ID (Inworld). Assigned at player creation so each character keeps a stable voice. */
  voiceId?: string;
  /** Pre-generated voice greeting sample URL (Supabase Storage). Used for instant lobby voice preview. */
  voiceSampleUrl?: string;
}
