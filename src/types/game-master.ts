import type { GameTemplate } from "@/lib/game-templates";
import type { GameConfig } from "@/types/game-config";
import type { DiscoverPreset } from "@/data/discover-templates";

export interface ChatMessage {
  id: string;
  role: "gm" | "user";
  content: string;
  timestamp: Date;
}

export interface GameSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  conversationState: ConversationState;
  selectedTemplate: GameTemplate | null;
  playerCount: number;
  customRules: string;
  gameName: string;
  selectedHostId: string;
  generatedHost?: {
    name: string;
    personality: string;
    voiceStyle: string;
    systemPrompt: string;
    icon: string;
    color: string;
    gender?: 'male' | 'female' | 'other';
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationState = "greeting" | "game-type" | "player-count" | "rules-discussion" | "confirmation" | "completed";

export interface GameMasterChatProps {
  onBack: () => void;
  onCreateGame: (config: GameConfig) => void;
  initialPreset?: DiscoverPreset | null;
  onPresetApplied?: () => void;
}

export type ChannelRoomType = "public" | "private_ai" | "decision" | "broadcast";
