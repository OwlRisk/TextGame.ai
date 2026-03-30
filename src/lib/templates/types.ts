/** Standardised action categories — drives UI color hints and Host interpretation. */
export type ActionType =
  | "attack"       // negative effect on target (damage, poison, eliminate)
  | "defend"       // protect self or ally
  | "support"      // positive effect (heal, buff, trade)
  | "investigate"  // gather information (search, detect, inspect)
  | "move"         // scene / location transition
  | "social"       // persuasion, accusation, negotiation
  | "vote"         // formal vote / decision
  | "use"          // use item, cast spell, play card
  | "meta";        // inventory check, rest, ask for hint

/** What kind of target the action picker should present. */
export type TargetType =
  | "player"       // pick from alive player list
  | "enemy"        // pick from Host-announced enemies (future)
  | "location"     // pick from available locations (future)
  | "item"         // pick from inventory (future)
  | "none";        // no target needed

export interface QuickAction {
  label: string;
  /** Message template — `{player}` gets replaced with a picked target */
  template: string;
  icon: string;
  needsTarget?: boolean;
  /** Only show during this phase (day/night/vote/combat/exploration/rest/social). Omit = always show. */
  phase?: string;
  /** Only show for this role (lowercase). Omit = show for all roles. */
  role?: string;
  /** Standardised action category for UI styling and Host interpretation. */
  actionType?: ActionType;
  /** What target picker to show. Defaults to "player" when needsTarget is true, "none" otherwise. */
  targetType?: TargetType;
}

export interface TemplateChannel {
  id: string;
  name: string;
  roomType: "public" | "private_ai" | "decision" | "broadcast";
  /** Roles (lowercase) that can see this channel. Omit = public. */
  accessByRole?: string[];
  /** If set, automatically run AI private conversation when this channel becomes active. */
  autoConverse?: {
    goal: string;
    maxRounds?: number;
  };
}

/** Well-known channel ID for eliminated-player chat */
export const AFTERLIFE_CHANNEL_ID = "afterlife";

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultRules: string;
  roles?: string[];
  icon: string;
  /** Image URL for the template icon (used in UI cards, sidebar, etc.) */
  iconUrl: string;
  color: string;
  estimatedTime: string;
  recommendedAICount: number;
  hasHiddenRoles: boolean;
  hasElimination: boolean;
  category: "deduction" | "quiz" | "cooperative" | "party" | "open";

  hasVotingPhase: boolean;
  hasNightPhase: boolean;
  /** Host must directly answer yes/no questions from players (e.g. 20 Questions) */
  hostAnswersQuestions: boolean;
  /** Players carry a secret word in stats (e.g. Undercover) */
  hasSecretWord: boolean;

  hostVoice: {
    maxSentences: number;
    silentByDefault: boolean;
    drama: "low" | "medium" | "high";
  };

  speakerMode: "round-table" | "selective";

  playerLimits: {
    tokenLimit: number;
    sentenceMax: number;
    sentencePreferred: number;
    charLimit: number;
    mustContribute: boolean;
  };

  pacing: {
    progressionThreshold: number;
    maxRounds?: number;
    hint: string;
  };

  mechanicsPrompt: string;

  playerPrompts: {
    default: string;
    byRole?: Record<string, string>;
  };

  quickActions: QuickAction[];

  /** Template-defined game channels (faction rooms, dead chat, etc.). */
  channels?: TemplateChannel[];
}

type CategoryDefaults = Pick<
  GameTemplate,
  "hasVotingPhase" | "hasNightPhase" | "hostVoice" | "speakerMode" | "playerLimits" | "pacing"
> & { quickActions: QuickAction[] };

const CATEGORY_DEFAULTS: Record<GameTemplate["category"], CategoryDefaults> = {
  deduction: {
    hasVotingPhase: true,
    hasNightPhase: false,
    hostVoice: { maxSentences: 2, silentByDefault: false, drama: "high" },
    speakerMode: "round-table",
    playerLimits: { tokenLimit: 220, sentenceMax: 3, sentencePreferred: 2, charLimit: 280, mustContribute: true },
    pacing: { progressionThreshold: 3, hint: "Force state changes (vote / phase transition) after a few discussion turns." },
    quickActions: [
      { label: "Accuse", template: "I think {player} is suspicious — ", needsTarget: true, icon: "🔍", phase: "day", actionType: "social" },
      { label: "Defend", template: "I'm innocent, here's why: ", icon: "🛡️", phase: "day", actionType: "defend" },
      { label: "Question", template: "{player}, what do you think about ", needsTarget: true, icon: "❓", phase: "day", actionType: "social" },
      { label: "Vote", template: "I vote for {player}", needsTarget: true, icon: "🗳️", phase: "vote", actionType: "vote" },
    ],
  },
  quiz: {
    hasVotingPhase: false,
    hasNightPhase: false,
    hostVoice: { maxSentences: 1, silentByDefault: false, drama: "medium" },
    speakerMode: "round-table",
    playerLimits: { tokenLimit: 180, sentenceMax: 2, sentencePreferred: 1, charLimit: 180, mustContribute: true },
    pacing: { progressionThreshold: 2, hint: "Keep rounds crisp. Adjudicate quickly, then next question." },
    quickActions: [
      { label: "Answer", template: "My answer is ", icon: "✋", actionType: "use" },
      { label: "Guess", template: "I'll guess ", icon: "🤔", actionType: "use" },
    ],
  },
  cooperative: {
    hasVotingPhase: false,
    hasNightPhase: false,
    hostVoice: { maxSentences: 3, silentByDefault: false, drama: "medium" },
    speakerMode: "selective",
    playerLimits: { tokenLimit: 300, sentenceMax: 4, sentencePreferred: 2, charLimit: 350, mustContribute: false },
    pacing: { progressionThreshold: 4, hint: "Nudge with clues or consequences if stalled. Inject obstacles if pace drops." },
    quickActions: [
      { label: "Suggest", template: "What if we try ", icon: "💡", actionType: "social" },
      { label: "Examine", template: "Let me look at ", icon: "🔍", actionType: "investigate" },
    ],
  },
  party: {
    hasVotingPhase: false,
    hasNightPhase: false,
    hostVoice: { maxSentences: 1, silentByDefault: false, drama: "medium" },
    speakerMode: "round-table",
    playerLimits: { tokenLimit: 220, sentenceMax: 3, sentencePreferred: 1, charLimit: 250, mustContribute: true },
    pacing: { progressionThreshold: 3, hint: "Energy high, rounds snappy. Next round quickly after each answer/vote." },
    quickActions: [
      { label: "Respond", template: "@{player} ", needsTarget: true, icon: "💬", actionType: "social" },
      { label: "React", template: "That's ", icon: "😮", actionType: "social" },
    ],
  },
  open: {
    hasVotingPhase: false,
    hasNightPhase: false,
    hostVoice: { maxSentences: 3, silentByDefault: false, drama: "medium" },
    speakerMode: "selective",
    playerLimits: { tokenLimit: 300, sentenceMax: 4, sentencePreferred: 2, charLimit: 350, mustContribute: false },
    pacing: { progressionThreshold: 6, hint: "Creative freedom, but no dead air. Drop a hook if momentum fades." },
    quickActions: [
      { label: "Continue", template: "Let's keep going — ", icon: "▶️", actionType: "meta" },
      { label: "React", template: "That's ", icon: "😮", actionType: "social" },
    ],
  },
};

export type PartialTemplate = Omit<GameTemplate,
  "hasVotingPhase" | "hasNightPhase" | "hostAnswersQuestions" | "hasSecretWord" |
  "hostVoice" | "speakerMode" |
  "playerLimits" | "pacing" | "mechanicsPrompt" | "playerPrompts" | "quickActions" | "iconUrl" | "channels"
> & Partial<Pick<GameTemplate,
  "hasVotingPhase" | "hasNightPhase" | "hostAnswersQuestions" | "hasSecretWord" |
  "hostVoice" | "speakerMode" |
  "playerLimits" | "pacing" | "mechanicsPrompt" | "playerPrompts" | "quickActions" | "iconUrl" | "channels"
>>;

const ICON_URLS: Record<string, string> = {
  werewolf: "/games/sidebar-icon-werewolf.webp",
  mafia: "/games/sidebar-icon-mafia.webp",
  undercover: "/games/sidebar-icon-undercover.webp",
  tarot: "/games/sidebar-icon-tarot.webp",
  codenames: "/games/sidebar-icon-codenames.webp",
  avalon: "/games/sidebar-icon-avalon.webp",
  spyfall: "/games/sidebar-icon-spyfall.webp",
  "detective-mystery": "/games/sidebar-icon-detective.webp",
  "escape-room": "/games/sidebar-icon-escape-room.webp",
  trivia: "/games/sidebar-icon-trivia.webp",
  debate: "/games/sidebar-icon-debate.webp",
  storyteller: "/games/sidebar-icon-storyteller.webp",
  "20-questions": "/games/sidebar-icon-20-questions.webp",
  "two-truths-lie": "/games/sidebar-icon-two-truths.webp",
  "rpg-dungeon": "/games/game-cover-rpg-dungeon.webp",
  custom: "/games/sidebar-icon-custom.webp",
};

/**
 * Fill behavioral fields from category-based defaults.
 * Template-specific overrides take precedence.
 */
export function withDefaults(partial: PartialTemplate): GameTemplate {
  const catDef = CATEGORY_DEFAULTS[partial.category];
  return {
    ...partial,
    iconUrl: partial.iconUrl ?? ICON_URLS[partial.id] ?? "/games/sidebar-icon-custom.webp",
    hasVotingPhase: partial.hasVotingPhase ?? catDef.hasVotingPhase,
    hasNightPhase: partial.hasNightPhase ?? catDef.hasNightPhase,
    hostAnswersQuestions: partial.hostAnswersQuestions ?? false,
    hasSecretWord: partial.hasSecretWord ?? false,
    hostVoice: { ...catDef.hostVoice, ...partial.hostVoice },
    speakerMode: partial.speakerMode ?? catDef.speakerMode,
    playerLimits: { ...catDef.playerLimits, ...partial.playerLimits },
    pacing: { ...catDef.pacing, ...partial.pacing },
    mechanicsPrompt: partial.mechanicsPrompt ?? "",
    playerPrompts: partial.playerPrompts ?? { default: "" },
    quickActions: partial.quickActions ?? catDef.quickActions,
    channels: partial.channels,
  };
}
