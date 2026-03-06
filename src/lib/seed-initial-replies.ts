import { getPreferredModel } from "@/lib/model-prefs";
import {
  thinkingDelay,
  getTypewriterSpeed,
  typewriterReveal,
  dynamicPace,
} from "@/lib/game-pace";

export interface SeedPlayerInfo {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  personality?: string;
  background?: string;
}

export interface SeedInitialRepliesOpts {
  channelId: string;
  hostName: string;
  hostContent: string;
  aiPlayers: SeedPlayerInfo[];
  gameName: string;
  rules?: string;
  addStreamingMessage: (msg: { senderId: string; senderName: string; senderAvatar: string; isAI: boolean }, channelId?: string) => string;
  updateStreamingMessage: (messageId: string, content: string, isComplete?: boolean) => void;
  setTypingUsers?: (users: { name: string; avatar: string }[]) => void;
  sessionToken: string | undefined;
  isCancelled?: () => boolean;
}

/** After host greeting, have a few AI players reply so the room feels active from the start. */
export async function seedInitialPlayerReplies(opts: SeedInitialRepliesOpts) {
  const {
    channelId, hostName, hostContent, aiPlayers, gameName, rules,
    addStreamingMessage: addStream, updateStreamingMessage: updateStream,
    setTypingUsers, sessionToken, isCancelled,
  } = opts;
  if (!sessionToken || aiPlayers.length === 0) return;

  const shuffled = [...aiPlayers].sort(() => Math.random() - 0.5);
  const count = Math.min(shuffled.length, 2 + Math.floor(Math.random() * 3));
  const toReply = shuffled.slice(0, count);
  const recent = [{ senderName: hostName, content: hostContent }];

  const toTypingEntry = (p: SeedPlayerInfo) => ({ name: p.name, avatar: p.avatar ?? "#8b5cf6" });

  const upcomingTypers = toReply.slice(0, Math.min(3, toReply.length)).map(toTypingEntry);
  setTypingUsers?.(upcomingTypers);

  for (let i = 0; i < toReply.length; i++) {
    const player = toReply[i];
    if (isCancelled?.()) return;
    try {
      await thinkingDelay(i, "freeform");
      if (isCancelled?.()) return;

      const remaining = toReply.slice(i).slice(0, 3).map(toTypingEntry);
      setTypingUsers?.(remaining);

      const res = await fetch("/api/chat/player-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          gameName,
          rules: rules ?? "",
          player: { name: player.name, role: player.role, personality: player.personality, background: player.background },
          recentMessages: recent,
          preferredModel: getPreferredModel(),
          isSeedGreeting: true,
        }),
      });

      if (!res.ok || isCancelled?.()) {
        const after = toReply.slice(i + 1).slice(0, 3).map(toTypingEntry);
        setTypingUsers?.(after);
        continue;
      }
      const data = (await res.json()) as { message?: string };
      const text = (data.message ?? "").trim();
      if (text && !isCancelled?.()) {
        const after = toReply.slice(i + 1).slice(0, 3).map(toTypingEntry);
        setTypingUsers?.(after);
        const speed = getTypewriterSpeed(player.personality);
        await typewriterReveal(text, addStream, updateStream, { senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", isAI: true }, channelId, speed);
        recent.push({ senderName: player.name, content: text });
        await dynamicPace(text.length, player.personality, "freeform");
      }
    } catch (e) {
      setTypingUsers?.([]);
      console.warn("[seedInitialReplies]", e);
    }
  }
  setTypingUsers?.([]);
}
