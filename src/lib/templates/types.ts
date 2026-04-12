/** Standardised action categories — drives UI color hints. */
export type ActionType =
  | "attack" | "defend" | "support" | "investigate"
  | "move" | "social" | "vote" | "use" | "meta";

export type TargetType = "player" | "enemy" | "location" | "item" | "none";

export interface QuickAction {
  label: string;
  template: string;
  icon: string;
  needsTarget?: boolean;
  phase?: string;
  role?: string;
  actionType?: ActionType;
  targetType?: TargetType;
}

export interface DialogueChip {
  label: string;
  starter: string;
  icon?: string;
}

export interface TemplateChannel {
  id: string;
  name: string;
  roomType: "public" | "private_ai" | "decision" | "broadcast";
  accessByRole?: string[];
  autoConverse?: { goal: string; maxRounds?: number };
}

export const AFTERLIFE_CHANNEL_ID = "afterlife";

/**
 * Minimal GameTemplate — kept for backward compatibility.
 * With the narrative-focus refactor, Scene mode is the primary experience.
 * Most fields here are vestigial and will be removed over time.
 */
export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultRules: string;
  roles?: string[];
  icon: string;
  iconUrl: string;
  color: string;
  estimatedTime: string;
  recommendedAICount: number;
  hasHiddenRoles: boolean;
  hasElimination: boolean;
  category: "deduction" | "quiz" | "cooperative" | "party" | "open";
  hasVotingPhase: boolean;
  hasNightPhase: boolean;
  hostAnswersQuestions: boolean;
  hasSecretWord: boolean;
  hostVoice: {
    maxSentences: number;
    silentByDefault: boolean;
    drama: "low" | "medium" | "high";
    narrativeStyle?: string;
  };
  speakerMode: "round-table" | "selective";
  playerLimits: {
    tokenLimit: number;
    sentenceMax: number;
    sentencePreferred: number;
    charLimit: number;
    mustContribute: boolean;
  };
  pacing: { progressionThreshold: number; maxRounds?: number; hint: string };
  mechanicsPrompt: string;
  playerPrompts: { default: string; byRole?: Record<string, string> };
  quickActions: QuickAction[];
  dialogueChips?: DialogueChip[];
  channels?: TemplateChannel[];
}

export type PartialTemplate = Omit<GameTemplate,
  "hasVotingPhase" | "hasNightPhase" | "hostAnswersQuestions" | "hasSecretWord" |
  "hostVoice" | "speakerMode" |
  "playerLimits" | "pacing" | "mechanicsPrompt" | "playerPrompts" | "quickActions" | "dialogueChips" | "iconUrl" | "channels"
> & Partial<Pick<GameTemplate,
  "hasVotingPhase" | "hasNightPhase" | "hostAnswersQuestions" | "hasSecretWord" |
  "hostVoice" | "speakerMode" |
  "playerLimits" | "pacing" | "mechanicsPrompt" | "playerPrompts" | "quickActions" | "dialogueChips" | "iconUrl" | "channels"
>>;

/** No-op in narrative-focus mode. Kept for type compatibility. */
export function withDefaults(partial: PartialTemplate): GameTemplate {
  const fallback = {
    hasVotingPhase: false,
    hasNightPhase: false,
    hostVoice: { maxSentences: 10, silentByDefault: false, drama: "medium" as const },
    speakerMode: "selective" as const,
    playerLimits: { tokenLimit: 600, sentenceMax: 10, sentencePreferred: 5, charLimit: 800, mustContribute: false },
    pacing: { progressionThreshold: 10, hint: "" },
  };
  return {
    ...partial,
    iconUrl: partial.iconUrl ?? "/games/sidebar-icon-custom.webp",
    hasVotingPhase: partial.hasVotingPhase ?? fallback.hasVotingPhase,
    hasNightPhase: partial.hasNightPhase ?? fallback.hasNightPhase,
    hostAnswersQuestions: partial.hostAnswersQuestions ?? false,
    hasSecretWord: partial.hasSecretWord ?? false,
    hostVoice: { ...fallback.hostVoice, ...partial.hostVoice },
    speakerMode: partial.speakerMode ?? fallback.speakerMode,
    playerLimits: { ...fallback.playerLimits, ...partial.playerLimits },
    pacing: { ...fallback.pacing, ...partial.pacing },
    mechanicsPrompt: partial.mechanicsPrompt ?? "",
    playerPrompts: partial.playerPrompts ?? { default: "" },
    quickActions: partial.quickActions ?? [],
    dialogueChips: partial.dialogueChips,
    channels: partial.channels,
  };
}
