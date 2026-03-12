export interface Player {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  stats?: Record<string, string | number>;
  isMuted?: boolean;
  isGameMaster?: boolean;
  isAI: boolean;
  isOnline?: boolean;
  /** AI-only: short personality tag (e.g. "Skeptical and analytical") */
  personality?: string;
  /** AI-only: backstory / context (e.g. "Former debate champion") */
  background?: string;
  /** Player gender (male, female, other) - used for avatar generation and TTS voice matching */
  gender?: string;
  /** Whether this player's role has been publicly revealed by the Host (via REVEAL_ROLE directive). */
  roleRevealed?: boolean;
  /** Persistent TTS voice ID (Inworld). Assigned at player creation so each character keeps a stable voice. */
  voiceId?: string;
  /** Pre-generated voice greeting sample URL (Supabase Storage). Used for instant lobby voice preview. */
  voiceSampleUrl?: string;
}
