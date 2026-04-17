/**
 * Shared game-config types.
 * Migrated out of `app/components/game-setup-dialog.tsx` so the obsolete
 * dialog/form components could be deleted while keeping the type stable.
 */

export type { GameTemplate } from "@/lib/game-templates";

export interface ConfiguredPlayer {
  name: string;
  gender?: string;
  personality?: string;
  background?: string;
  /** Role assigned by GM/LLM based on rules. Mostly used by legacy
   *  hidden-role templates; RPG worlds derive class info elsewhere. */
  role?: string;
  /** Word-pair for the dropped Undercover template. Kept optional for
   *  backward compatibility with old saved games; new flows do not set it. */
  word?: string;
}

export interface GameConfig {
  name: string;
  template: string;
  playerCount: number;
  rules: string;
  /** Player-facing rules summary — shown in the Rules panel. If absent, the
   *  Rules tab is hidden. */
  playerRules?: string;
  /** Game background — merged into Rules (deprecated, kept for backward
   *  compatibility with rows persisted before the unification). */
  intro?: string;
  customRoles?: string[];
  hostId: string;
  tone?: string;
  /** When true, only each player sees their own role in the player list. */
  hideRolesInPlayerList?: boolean;
  configuredPlayers?: ConfiguredPlayer[];
  /** Role pre-assigned to the human player (legacy hidden-role games). */
  humanRole?: string;
  /** Script-Kill case identifier (legacy). */
  caseId?: string;
  generatedHost?: {
    name: string;
    personality: string;
    voiceStyle: string;
    systemPrompt: string;
    icon: string;
    color: string;
    gender?: "male" | "female" | "other";
  };
  /** GM-defined game rooms; each has its own chat. */
  channels?: {
    id: string;
    name: string;
    /**
     * public      – everyone can see and speak (default)
     * private_ai  – restricted AI members hold free discussion
     * decision    – restricted AI members confer until consensus; the
     *               summary is injected into the HOST's next turn context
     * broadcast   – host-only announcements; players read-only
     */
    roomType?: "public" | "private_ai" | "decision" | "broadcast";
  }[];
  /** Custom label for the player's private board tab. */
  playerBoardLabel?: string;
  /** GM-defined action buttons. Overrides template quickActions when present. */
  quickActions?: Array<{
    label: string;
    template: string;
    icon: string;
    needsTarget?: boolean;
    phase?: string;
    role?: string;
    actionType?: string;
    targetType?: string;
  }>;
  /** RPG world identifier — when set, enables RPG mode with class-based
   *  characters (see `lib/rpg-worlds`). */
  rpgWorldId?: string;
  /** Optional GM notes for the RPG adventure (long-form story brief). */
  rpgAdventureNotes?: string;
}
