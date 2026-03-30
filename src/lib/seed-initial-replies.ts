import { getGameTemplate } from "./game-templates";

export interface SeedPlayerInfo {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  stats?: Record<string, string | number>;
  personality?: string;
  background?: string;
  speechStyle?: string;
  quirk?: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * After the host greeting, pick 2-3 random AI players to send a brief
 * social reaction, setting the conversational tone before the game begins.
 */
export async function seedInitialPlayerReplies(opts: SeedInitialRepliesOpts) {
  const {
    channelId, hostName, hostContent, aiPlayers, humanPlayerName,
    gameTemplate, gameName, rules,
    addStreamingMessage, updateStreamingMessage, setTypingUsers,
    sessionToken, isCancelled,
  } = opts;

  if (aiPlayers.length === 0) return;

  const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;

  // Solo games (e.g. tarot) or games with 0 AI skip seeding
  if (tmpl && tmpl.maxPlayers <= 1) return;

  const seedCount = Math.min(aiPlayers.length, aiPlayers.length <= 3 ? 2 : 3);
  const chosen = shuffle(aiPlayers).slice(0, seedCount);

  const recentMessages = [{ senderName: hostName, content: hostContent }];

  for (const player of chosen) {
    if (isCancelled?.()) return;

    // Show typing indicator
    setTypingUsers?.(
      chosen
        .filter((c) => c.id === player.id || chosen.indexOf(c) > chosen.indexOf(player))
        .map((c) => ({ name: c.name, avatar: c.avatar ?? "#8b5cf6" })),
    );

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

      const res = await fetch("/api/chat/player-speak", {
        method: "POST",
        headers,
        body: JSON.stringify({
          gameName,
          gameTemplate,
          rules,
          gamePhase: "active",
          player: {
            name: player.name,
            role: player.role,
            personality: player.personality,
            background: player.background,
            speechStyle: player.speechStyle,
            quirk: player.quirk,
          },
          recentMessages,
          playerRoster: aiPlayers.map((p) => ({ name: p.name, isHuman: false }))
            .concat(humanPlayerName ? [{ name: humanPlayerName, isHuman: true }] : []),
          isSeedGreeting: true,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const content = (data.message || "").trim();
      if (!content || /^\.{1,5}$|^\u2026$/.test(content)) continue;

      if (isCancelled?.()) return;

      const msgId = addStreamingMessage(
        { senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", isAI: true },
        channelId,
      );
      updateStreamingMessage(msgId, content, true);

      recentMessages.push({ senderName: player.name, content });

      // Brief pause between replies for natural pacing
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    } catch {
      // Silently skip failed seed replies
    }
  }

  setTypingUsers?.([]);
}
