export interface SeedPlayerInfo {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  stats?: Record<string, string | number>;
  personality?: string;
  background?: string;
}

export interface SeedInitialRepliesOpts {
  channelId: string;
  hostName: string;
  hostContent: string;
  aiPlayers: SeedPlayerInfo[];
  humanPlayerName?: string;
  gameTemplate?: string;
  gameName: string;
  rules?: string;
  playerNotesById?: Record<string, string>;
  addStreamingMessage: (msg: { senderId: string; senderName: string; senderAvatar: string; isAI: boolean }, channelId?: string) => string;
  updateStreamingMessage: (messageId: string, content: string, isComplete?: boolean) => void;
  setTypingUsers?: (users: { name: string; avatar: string }[]) => void;
  sessionToken: string | undefined;
  isCancelled?: () => boolean;
}

/** No-op: seed chatter is disabled — the host auto-continues immediately after the greeting. */
export async function seedInitialPlayerReplies(_opts: SeedInitialRepliesOpts) {
  return;
}
