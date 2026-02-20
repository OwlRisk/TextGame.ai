"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import { PlayerPanel } from "@/app/components/player-panel";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { Menu, Hash, Users } from "lucide-react";
import { UsageDisplay } from "@/app/components/usage-display";

/** Delay (ms) between Host/AI messages so the pace feels human, not instant AI. */
const HOST_PACE_MS = 2200;
const hostPace = () => new Promise<void>((r) => setTimeout(r, HOST_PACE_MS));

/** Number of AI players to reply right after the host's initial greeting */
const INITIAL_PLAYER_REPLIES = 3;

/** After host greeting, have a few AI players reply so the room feels active from the start. */
async function seedInitialPlayerReplies(
  opts: {
    channelId: string;
    hostName: string;
    hostContent: string;
    aiPlayers: Array<{ id: string; name: string; avatar?: string; role?: string; personality?: string; background?: string }>;
    gameName: string;
    rules?: string;
    addMessage: (msg: { senderId: string; senderName: string; senderAvatar: string; content: string; isAI: boolean }, channelId: string) => void;
    sessionToken: string | undefined;
  }
) {
  const { channelId, hostName, hostContent, aiPlayers, gameName, rules, addMessage, sessionToken } = opts;
  if (!sessionToken || aiPlayers.length === 0) return;
  const toReply = aiPlayers.slice(0, INITIAL_PLAYER_REPLIES);
  const recent = [{ senderName: hostName, content: hostContent }];
  for (const player of toReply) {
    try {
      const res = await fetch("/api/chat/player-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          gameName,
          rules: rules ?? "",
          player: { name: player.name, role: player.role, personality: player.personality, background: player.background },
          recentMessages: recent,
        }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { message?: string };
      const text = (data.message ?? "").trim();
      if (text) {
        addMessage(
          { senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", content: text, isAI: true },
          channelId
        );
        recent.push({ senderName: player.name, content: text });
        await hostPace();
      }
    } catch (e) {
      console.warn("[seedInitialReplies]", e);
    }
  }
}

export default function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { session } = useAuth();
  const { games, selectedGameId, selectGame, updateGame, addGame, gamesLoading } = useGameContext();
  const {
    messages,
    players,
    addMessage,
    setPlayers,
    gamePhase,
    setGamePhase,
    selectedChannelId,
    setSelectedChannelId,
    gameProgress,
    userId,
    currentSpeakerId,
    setCurrentSpeakerId,
    humanGameIdentity,
    setHumanGameIdentity,
    avatarImageUrls,
    onAvatarUrlLoaded,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  /** True while Host + AI replies are being generated (prevents double-send and shows loading) */
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const { gameId } = use(params);
  const pathname = usePathname();

  /** 移动端左侧抽屉：'app' 应用导航 | 'channels' 频道列表 */
  const [mobileLeftDrawer, setMobileLeftDrawer] = useState<"app" | "channels" | null>(null);
  const [mobileRightDrawer, setMobileRightDrawer] = useState(false);

  useEffect(() => {
    setMobileLeftDrawer(null);
    setMobileRightDrawer(false);
  }, [pathname]);

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  useEffect(() => {
    selectGame(gameId);
  }, [gameId, selectGame]);

  // If game is not in my list but has a share link, load it so "Open in GameMaster" from /play/[token] works
  const [sharedLoadPending, setSharedLoadPending] = useState(false);
  const sharedLoadTriedRef = useRef(false);
  useEffect(() => {
    if (gamesLoading || currentGame || !gameId || sharedLoadTriedRef.current) return;
    sharedLoadTriedRef.current = true;
    setSharedLoadPending(true);
    fetch(`/api/games/${gameId}/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => {
        if (row?.id) {
          addGame({
            id: row.id,
            name: row.name,
            icon: row.icon,
            color: row.color,
            config: row.config ?? {},
            isActive: true,
          });
        }
      })
      .catch(() => {})
      .finally(() => setSharedLoadPending(false));
  }, [gamesLoading, currentGame, gameId, addGame]);

  // When game has GM-defined channels and context still has legacy "game-room", switch to first channel
  useEffect(() => {
    if (selectedChannelId === "game-room" && currentGame?.config?.channels?.length && currentGame.config.channels[0].id !== "game-room") {
      setSelectedChannelId(currentGame.config.channels[0].id);
    }
  }, [currentGame?.config?.channels, selectedChannelId, setSelectedChannelId]);

  // Initialize game room only if there's no saved state
  useEffect(() => {
    // Check if we have a saved game room in localStorage
    const hasSavedState = (() => {
      try {
        const saved = localStorage.getItem(`gameRoom_${gameId}`);
        if (saved) {
          const state = JSON.parse(saved);
          return state.players && state.players.length > 0;
        }
      } catch (e) {
        console.error("Error checking saved state:", e);
      }
      return false;
    })();

    // Only initialize if no saved state and no players loaded yet
    if (!isInitialized && currentGame && players.length === 0 && !hasSavedState) {
      initializeGame();
      setIsInitialized(true);
    } else if (!isInitialized && players.length > 0) {
      // If players loaded from saved state, mark as initialized
      setIsInitialized(true);
    }
  }, [currentGame, isInitialized, players.length, gameId]);

  // Fetch human in-game identity when missing (persisted with room state)
  useEffect(() => {
    if (!currentGame?.config || !session?.access_token || humanGameIdentity !== null) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["Authorization"] = `Bearer ${session.access_token}`;
    fetch("/api/generate-human-game-identity", {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data: { name?: string }) => {
        const name = (data.name && data.name.trim()) ? data.name.trim().slice(0, 40) : "Player";
        setHumanGameIdentity({ name });
      })
      .catch(() => setHumanGameIdentity({ name: "Player" }));
  }, [currentGame?.id, currentGame?.name, currentGame?.config?.rules, session?.access_token, humanGameIdentity, setHumanGameIdentity]);

  // When humanGameIdentity or session changes, sync human player display name
  useEffect(() => {
    if (players.length === 0) return;
    const name = humanGameIdentity?.name || (session?.user ? (session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0])?.trim() : null) || "You";
    setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, name } : p)));
  }, [humanGameIdentity?.name, session?.user, players.length, userId, setPlayers]);

  const initializeGame = () => {
    if (!currentGame || !currentGame.config) return;

    const config = currentGame.config;
    const AI_COLORS = [
      "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", 
      "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
    ];

    // Host: use AI-generated name, avatar (same pipeline as AI players), and color/personality/gender from generate-host
    const hostColor = config.generatedHost?.color || (config.template === "werewolf"
      ? "#7c3aed"
      : config.template === "undercover"
      ? "#0ea5e9"
      : config.template === "tarot"
      ? "#b45309"
      : "#ec4899");
    const hostName = (config.generatedHost?.name || "Game Master").trim() || "Game Master";
    const hostPersonality = config.generatedHost?.personality || "A mysterious game master";

    const gameMaster = {
      id: "gm-1",
      name: hostName,
      avatar: hostColor,
      role: "Host",
      status: config.generatedHost?.voiceStyle || "Host",
      isGameMaster: true,
      isAI: true,
      isMuted: false,
      background: hostPersonality,
      personality: config.generatedHost?.voiceStyle || config.generatedHost?.personality,
      gender: (config.generatedHost as any)?.gender as "male" | "female" | "other" | undefined,
    };

    // Create AI players from configured players
    const aiPlayers = (config.configuredPlayers || []).map((configPlayer: any, i: number) => {
      const role = configPlayer.role || undefined;
      const stats: Record<string, string | number> = {};
      
      if (role && (config.template === "werewolf" || config.template === "mafia")) {
        stats.Status = "Alive";
      }
      if (configPlayer.word && config.template === "undercover") {
        stats.Word = configPlayer.word;
      }

      return {
        id: `ai-${i + 1}`,
        name: configPlayer.name,
        avatar: AI_COLORS[i % AI_COLORS.length],
        role: role || undefined,
        stats,
        isAI: true,
        isMuted: false,
        personality: configPlayer.personality || "Friendly and observant",
        background: configPlayer.background || "A game enthusiast",
        gender: configPlayer.gender as "male" | "female" | "other" | undefined,
        status: "online" as const,
      };
    });

    const userName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "You";
    // Create user player (use userId so host-assigned "NEXT_SPEAKER: You" enables this player). Role is left unset; Host assigns it via ASSIGN_ROLE in a message.
    const userPlayer = {
      id: userId,
      name: userName,
      avatar: "#6366f1",
      role: undefined as string | undefined,
      stats: config.template === "werewolf" || config.template === "mafia" ? { Status: "Alive" } : undefined,
      isAI: false,
      isMuted: false,
      status: "online" as const,
    };

    setPlayers([gameMaster, ...aiPlayers, userPlayer]);

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    const hostGreeting = config.template === "tarot"
      ? `Welcome. I'm ${hostName}, your reader today. Take a moment, then share a question or an area of your life you'd like insight on—or say you'd like a general reading. The cards are ready when you are.`
      : `Hey everyone, ${hostName} here. Rules are in the Rules section—ready when you are, let's go!`;
    addMessage(
      {
        senderId: "gm-1",
        senderName: hostName,
        senderAvatar: hostColor,
        content: hostGreeting,
        isAI: true,
      },
      defaultChannelId
    );

    // No speaker assigned yet: anyone can speak until host assigns with NEXT_SPEAKER in their reply
    setCurrentSpeakerId(null);
    setGamePhase("intro");

    // Let a few AI players reply to the host so the room feels active from the start
    seedInitialPlayerReplies({
      channelId: defaultChannelId,
      hostName,
      hostContent: hostGreeting,
      aiPlayers,
      gameName: currentGame.name,
      rules: config.rules,
      addMessage,
      sessionToken: session?.access_token,
    }).catch((e) => console.warn("Initial player replies failed", e));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const cfgChannels = currentGame?.config?.channels;
    const roomIds = cfgChannels?.length ? new Set(cfgChannels.map((c) => c.id)) : new Set(["game-room"]);
    const channelId = selectedChannelId && roomIds.has(selectedChannelId) ? selectedChannelId : (cfgChannels?.[0]?.id ?? "game-room");

    addMessage(
      {
        senderId: userId,
        senderName: humanGameIdentity?.name || "You",
        senderAvatar: "#6366f1",
        content,
        isAI: false,
      },
      channelId
    );

    // Get AI response (host reply in same channel)
    setLastFailedSendContent(null);
    setIsRoundInProgress(true);
    try {
      // Build recent context so Host can choose next speaker based on current discussion
      const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentSlice = channelMessages.slice(-12);
      const recentContext =
        recentSlice.length === 0
          ? "(No prior messages in this channel.)"
          : recentSlice
              .map((m) => `- ${m.senderName}: ${m.content}`)
              .join("\n");

      const gmName = currentGame?.config?.generatedHost?.name || "Game Master";
      const gmColor = currentGame?.config?.template === "werewolf"
        ? "#7c3aed"
        : currentGame?.config?.template === "undercover"
          ? "#0ea5e9"
          : "#ec4899";
      const aiOnly = players.filter((p) => p.isAI && !p.isGameMaster);
      const hostSystemPrompt = `You are the in-game host (moderator) for ${currentGame?.name}. The game is already created and configured—you have NO authority to change the rules or ask for setup. Your only job is to run the game: run night/day phases, moderate voting, announce results. Keep replies short and in character.

When the user says things like "Continue", "What's next?", or "Ready", advance the plot: announce the next phase (e.g. Night falls, Day breaks, time to vote), narrate briefly, and assign the next speaker with NEXT_SPEAKER.

You decide who may speak next based on the current discussion (who just spoke, who was suggested, what was said). At the end of EVERY reply, add exactly one line (no other text after it):
NEXT_SPEAKER: <name>

All non-host player names (use exactly as written): ${players.filter((p) => !p.isGameMaster).map((p) => p.name).join(", ")}. For the human player use: NEXT_SPEAKER: You. To allow anyone to speak (free discussion), use: NEXT_SPEAKER: Everyone.

CRITICAL — Keep the discussion going among players: Most of the time assign an AI to speak (NEXT_SPEAKER: <AI name>) so the conversation flows without always waiting for the human. Only occasionally use NEXT_SPEAKER: You to give the human player a turn. Rotate among AI players so different names speak; do NOT keep choosing the same 1–2. Prefer NEXT_SPEAKER: <an AI who has spoken less recently>. When someone suggests a specific person, prefer that choice when appropriate.

Game Rules (do not modify, only enforce):
${currentGame?.config?.rules || "No specific rules defined."}

Role assignment: You assign each player's role (including the human). When you assign or reveal a role, add one line per assignment (no other text on that line):
ASSIGN_ROLE: <player name> -> <role>
Use the exact player name from the list above; for the human player use: ASSIGN_ROLE: You -> <role>. Example: ASSIGN_ROLE: You -> Civilian. These lines are hidden from the chat and applied by the game. Assign the human's role when appropriate (e.g. at game start or when they need to know).

Optional — Reply with an image: When a scene, card, map, or moment would be better shown than told, you may reply with an image. Output exactly these tags on their own lines:
<REPLY_TYPE>image</REPLY_TYPE>
<IMAGE_SIZE>square|portrait|landscape</IMAGE_SIZE>
<IMAGE_PROMPT>detailed DALL-E image description in English: describe subject, lighting, mood, style, and composition (e.g. "A dramatic tarot card design, golden edges, mystical fog, candlelit atmosphere, rich colors, fantasy art style, no text")</IMAGE_PROMPT>
<CAPTION>optional short caption for the image</CAPTION>
Choose IMAGE_SIZE by content: square (1:1, general); portrait (tall, e.g. card, character, full-body); landscape (wide, e.g. scene, map, horizon). Write IMAGE_PROMPT with enough detail so the image looks rich; no text inside the image. After the tags you may still add NEXT_SPEAKER and ASSIGN_ROLE lines.`;

      const applyHostRoleAssignments = (content: string): string => {
        const assignLineRegex = /^\s*ASSIGN_ROLE:\s*(.+?)\s*->\s*(.+?)\s*$/im;
        const updates: { playerId: string; role: string }[] = [];
        const lines = content.split(/\r?\n/);
        const keptLines: string[] = [];
        for (const line of lines) {
          const match = line.match(assignLineRegex);
          if (match) {
            const namePart = match[1].trim();
            const rolePart = match[2].trim();
            if (!rolePart) continue;
            const isYou = namePart.toLowerCase() === "you";
            const player = isYou
              ? players.find((p) => p.id === userId)
              : players.find((p) => p.name === namePart || (p.id === userId && (humanGameIdentity?.name ?? "").trim() === namePart));
            const targetId = isYou ? userId : player?.id;
            if (targetId) updates.push({ playerId: targetId, role: rolePart });
          } else {
            keptLines.push(line);
          }
        }
        if (updates.length > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              const u = updates.find((r) => r.playerId === p.id);
              return u ? { ...p, role: u.role } : p;
            })
          );
        }
        return keptLines.join("\n").replace(/\n{2,}/g, "\n\n").trim();
      };

      const callHost = async (userContent: string): Promise<{ hostContent: string; who: string | null; nextSpeakerPlayer: typeof players[0] | null; imageUrl?: string }> => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({
            messages: [
              { role: "system", content: hostSystemPrompt },
              { role: "user", content: userContent },
            ],
          }),
        });
        if (!res.ok) return { hostContent: "", who: null, nextSpeakerPlayer: null };
        const data = await res.json();
        let hostContent = (data.message || "").trim();
        const nextSpeakerMatch = hostContent.match(/\nNEXT_SPEAKER:\s*(.+?)\s*$/im);
        let who: string | null = null;
        let nextSpeakerPlayer: typeof players[0] | null = null;
        if (nextSpeakerMatch) {
          who = nextSpeakerMatch[1].trim();
          hostContent = hostContent.replace(/\nNEXT_SPEAKER:\s*.+?\s*$/im, "").trim();
          if (who && who.toLowerCase() === "you") {
            nextSpeakerPlayer = null; // human's turn
          } else if (who && who.toLowerCase() === "everyone") {
            if (aiOnly.length > 0) nextSpeakerPlayer = aiOnly[Math.floor(Math.random() * aiOnly.length)];
          } else {
            const player = players.find((p) => !p.isGameMaster && p.name === who);
            nextSpeakerPlayer = player ?? null;
          }
        }
        return { hostContent, who, nextSpeakerPlayer, imageUrl: data.imageUrl };
      };

      const runPlayerSpeak = async (speaker: typeof players[0], recent: Array<{ senderName: string; content: string }>): Promise<string | null> => {
        try {
          const res = await fetch("/api/chat/player-speak", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            body: JSON.stringify({
              gameName: currentGame?.name,
              rules: currentGame?.config?.rules,
              player: { name: speaker.name, role: speaker.role, personality: speaker.personality, background: speaker.background },
              recentMessages: recent,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return (data.message || "").trim() || null;
        } catch (err) {
          console.error("Error generating AI player reply:", err);
          return null;
        }
      };

      const channelMessagesForRecent = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const firstUserContent = `Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, nextSpeakerPlayer, imageUrl: firstImageUrl } = await callHost(firstUserContent);
      if (!hostContent && !firstImageUrl) {
        setIsRoundInProgress(false);
        return;
      }
      hostContent = applyHostRoleAssignments(hostContent);

      if (who?.toLowerCase() === "you") setCurrentSpeakerId(userId);
      else if (who?.toLowerCase() === "everyone") setCurrentSpeakerId(null);
      else if (nextSpeakerPlayer) setCurrentSpeakerId(nextSpeakerPlayer.id);

      addMessage({ senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, content: hostContent || " ", isAI: true, ...(firstImageUrl && { imageUrl: firstImageUrl }) }, channelId);
      await hostPace();
      let recentForNext = [
        ...channelMessagesForRecent.slice(-10).map((m) => ({ senderName: m.senderName, content: m.content })),
        { senderName: "You", content },
        { senderName: gmName, content: hostContent },
      ] as Array<{ senderName: string; content: string }>;

      const runAiThenMaybeSecond = async (firstSpeaker: typeof players[0]): Promise<void> => {
        const firstContent = await runPlayerSpeak(firstSpeaker, recentForNext);
        if (firstContent) {
          addMessage({ senderId: firstSpeaker.id, senderName: firstSpeaker.name, senderAvatar: firstSpeaker.avatar ?? "#8b5cf6", content: firstContent, isAI: true }, channelId);
          await hostPace();
          recentForNext = [...recentForNext, { senderName: firstSpeaker.name, content: firstContent }];
          const others = aiOnly.filter((p) => p.id !== firstSpeaker.id);
          if (others.length > 0) {
            const secondSpeaker = others[Math.floor(Math.random() * others.length)];
            const secondContent = await runPlayerSpeak(secondSpeaker, recentForNext);
            if (secondContent) {
              addMessage({ senderId: secondSpeaker.id, senderName: secondSpeaker.name, senderAvatar: secondSpeaker.avatar ?? "#8b5cf6", content: secondContent, isAI: true }, channelId);
              await hostPace();
              recentForNext = [...recentForNext, { senderName: secondSpeaker.name, content: secondContent }];
            }
          }
        }
      };

      if (nextSpeakerPlayer?.isAI && !nextSpeakerPlayer.isGameMaster) {
        await runAiThenMaybeSecond(nextSpeakerPlayer);
      } else if (who?.toLowerCase() === "everyone" && nextSpeakerPlayer?.isAI) {
        const txt = await runPlayerSpeak(nextSpeakerPlayer, recentForNext);
        if (txt) {
          addMessage({ senderId: nextSpeakerPlayer.id, senderName: nextSpeakerPlayer.name, senderAvatar: nextSpeakerPlayer.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
          await hostPace();
          recentForNext = [...recentForNext, { senderName: nextSpeakerPlayer.name, content: txt }];
        }
      }

      const MAX_CONTINUATION_ROUNDS = 0;
      for (let r = 0; r < MAX_CONTINUATION_ROUNDS; r++) {
        const continuationUserContent = `The discussion continues. Latest messages:\n${recentForNext.slice(-14).map((m) => `${m.senderName}: ${m.content}`).join("\n")}\n\nAs host, briefly respond to what was just said (or move the phase). Then assign NEXT_SPEAKER. Prefer an AI name so the discussion keeps going; use NEXT_SPEAKER: You only when it's a natural moment for the human to speak.`;
        const next = await callHost(continuationUserContent);
        if (!next.hostContent && !next.imageUrl) break;
        const nextWho = next.who?.toLowerCase();
        const nextHostContent = applyHostRoleAssignments(next.hostContent || "");
        addMessage({ senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, content: nextHostContent || " ", isAI: true, ...(next.imageUrl && { imageUrl: next.imageUrl }) }, channelId);
        await hostPace();
        recentForNext = [...recentForNext, { senderName: gmName, content: nextHostContent }];
        if (nextWho === "you") {
          setCurrentSpeakerId(userId);
          break;
        }
        if (nextWho === "everyone") {
          setCurrentSpeakerId(null);
          if (next.nextSpeakerPlayer?.isAI) {
            const txt = await runPlayerSpeak(next.nextSpeakerPlayer, recentForNext);
            if (txt) {
              addMessage({ senderId: next.nextSpeakerPlayer.id, senderName: next.nextSpeakerPlayer.name, senderAvatar: next.nextSpeakerPlayer.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
              await hostPace();
              recentForNext = [...recentForNext, { senderName: next.nextSpeakerPlayer.name, content: txt }];
            }
          }
          break;
        }
        if (next.nextSpeakerPlayer?.isAI && !next.nextSpeakerPlayer.isGameMaster) {
          await runAiThenMaybeSecond(next.nextSpeakerPlayer);
        } else {
          break;
        }
      }

      setCurrentSpeakerId((id) => (id === userId ? id : null));
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
      setLastFailedSendContent(content);
    } finally {
      setIsRoundInProgress(false);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastFailedSendContent) {
      handleSendMessage(lastFailedSendContent);
      setLastFailedSendContent(null);
    }
  };

  // GM-defined game rooms (always compute so hook order is stable; safe when currentGame is null)
  const configChannels = currentGame?.config?.channels;
  const gameRoomEntries = configChannels?.length
    ? configChannels.map((c) => ({ id: c.id, name: c.name, type: "game" as const }))
    : [{ id: "game-room", name: "game-room", type: "game" as const }];
  const defaultGameChannelId = gameRoomEntries[0].id;
  const gameChannels = [
    { id: "rules", name: "Rules", type: "text" as const },
    { id: "progress", name: "Progress", type: "text" as const },
    ...gameRoomEntries,
  ];
  const gameRoomIds = new Set(gameRoomEntries.map((c) => c.id));
  const isGameChannel = selectedChannelId != null && gameRoomIds.has(selectedChannelId);
  const messagesForChannel = isGameChannel
    ? messages.filter((m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId)
    : messages;

  // Quick reply: only update when it's "user's turn" (round just ended, last message from Host/AI).
  // Do not refetch when the user just sent a message — keep current suggestions until Host/AI reply again.
  useEffect(() => {
    if (!currentGame?.config || !isGameChannel) {
      setQuickRepliesLoading(false);
      setQuickReplies([]);
      return;
    }
    if (messagesForChannel.length === 0) {
      setQuickReplies([]);
      setQuickRepliesLoading(false);
      return;
    }
    if (isRoundInProgress) {
      setQuickRepliesLoading(false);
      return;
    }
    const lastMessage = messagesForChannel[messagesForChannel.length - 1];
    if (lastMessage?.senderId === userId) {
      setQuickRepliesLoading(false);
      return;
    }
    const abort = new AbortController();
    setQuickRepliesLoading(true);
    const recent = messagesForChannel.slice(-8).map((m) => ({ senderName: m.senderName, content: m.content }));
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    fetch("/api/suggest-quick-replies", {
      method: "POST",
      headers,
      signal: abort.signal,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
        recentMessages: recent,
        gamePhase,
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((data: { suggestions?: string[] }) => {
        const list = Array.isArray(data.suggestions) ? data.suggestions.filter((s) => s && s.length <= 120).slice(0, 3) : [];
        setQuickReplies(list.length > 0 ? list : []);
      })
      .catch(() => setQuickReplies([]))
      .finally(() => setQuickRepliesLoading(false));
    return () => {
      abort.abort();
      setQuickRepliesLoading(false);
    };
  }, [
    isGameChannel,
    selectedChannelId ?? null,
    currentGame?.id ?? null,
    gamePhase,
    isRoundInProgress,
    userId,
    messagesForChannel.length,
    session?.access_token ?? null,
  ]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const directUrl = `${origin}/game/${gameId}`;
    const showCopied = () => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    };

    if (!session?.access_token) {
      const ok = await copyToClipboard(directUrl);
      toast.success(ok ? "Link copied (sign in to create a share link others can open)" : "Copy link: " + directUrl);
      showCopied();
      return;
    }
    try {
      const res = await fetch(`/api/games/${gameId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const ok = await copyToClipboard(directUrl);
        toast.info(ok ? "Game not found in cloud; direct link copied. Save the game first if you need a share link." : "Game not in cloud. Save first. Link: " + directUrl);
        showCopied();
        return;
      }
      const data = (await res.json()) as { shareUrl: string };
      const ok = await copyToClipboard(data.shareUrl ?? directUrl);
      toast.success(ok ? "Share link copied! Anyone with the link can view this game." : "Share link: " + (data.shareUrl ?? directUrl));
      showCopied();
    } catch (e) {
      console.error("Share failed", e);
      const ok = await copyToClipboard(directUrl);
      toast.error(ok ? "Link copied to clipboard" : "Share failed. Link: " + directUrl);
      showCopied();
    }
  };

  if (!currentGame) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          {gamesLoading || sharedLoadPending ? (
            <>
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-4" aria-hidden />
              <p className="text-zinc-400">Loading game…</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Game not found</h1>
              <p className="text-zinc-400 text-sm mb-4">This game may have been deleted or the link is invalid.</p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const sidebarCommon = {
    games,
    selectedGameId,
    onSelectGame: (id: string) => selectGame(id),
    onCreateGame: () => router.push("/create"),
    onOpenProfile: () => router.push("/profile"),
    onUpdateGame: updateGame,
  };
  const channelListCommon = {
    gameName: currentGame?.name ?? "Game",
    channels: gameChannels,
    selectedChannelId,
    onShare: handleShare,
    shareJustCopied: shareCopied,
    textSectionLabel: "Sections",
    gameSectionLabel: "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    onDeleteChannel: (id: string | undefined) => {
      if (id === "rules" || id === "progress") {
        toast.info("Sections cannot be removed");
        return;
      }
      if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
    },
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      {/* 移动端顶栏：仅小屏显示 */}
      <header className="md:hidden flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "app" ? null : "app"))} aria-label="打开菜单">
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 truncate max-w-[40%]">{currentGame?.name ?? "Game"}</span>
        <div className="flex items-center gap-1.5">
          <UsageDisplay compact />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "channels" ? null : "channels"))} aria-label="频道与规则">
            <Hash className="size-5 text-zinc-300" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileRightDrawer((v) => !v)} aria-label="玩家列表">
            <Users className="size-5 text-zinc-300" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left app sidebar: 桌面显示，移动端在 Sheet 中 */}
      <div className="hidden md:flex flex-shrink-0 z-10">
        <GameSidebar {...sidebarCommon} />
      </div>

      {/* 移动端左侧抽屉：应用导航 */}
      <Sheet open={mobileLeftDrawer === "app"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Menu" className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950">
          <GameSidebar {...sidebarCommon} onNavigate={() => setMobileLeftDrawer(null)} />
        </SheetContent>
      </Sheet>

      {/* 移动端左侧抽屉：频道与规则 */}
      <Sheet open={mobileLeftDrawer === "channels"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Channels and rules" className="w-64 max-w-[85vw] p-0 bg-zinc-800 border-r border-zinc-700">
          <ChannelList
            {...channelListCommon}
            selectedChannelId={selectedChannelId}
            onSelectChannel={(id) => { setSelectedChannelId(id); setMobileLeftDrawer(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Game sidebar: 桌面显示，移动端在 Sheet 中 */}
      <div className="hidden md:block flex-shrink-0">
        <ChannelList
          {...channelListCommon}
          onSelectChannel={(id) => setSelectedChannelId(id)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedChannelId === "rules" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              {(currentGame?.config?.rules ?? "").trim() ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  {currentGame?.config?.rules}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">No rules defined for this game.</p>
                  <p className="text-xs mt-1">The Game Master can add rules when creating the game.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : selectedChannelId === "progress" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              {(gameProgress ?? "").trim() ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  {gameProgress}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">No progress yet.</p>
                  <p className="text-xs mt-1">Game progress will appear here as the host runs the game.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : isGameChannel ? (
          <ChatArea
            channelName={gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? "game-room"}
            messages={messagesForChannel}
            players={players}
            onSendMessage={handleSendMessage}
            isGameActive={gamePhase !== "ended"}
            currentSpeakerId={currentSpeakerId}
            userId={userId}
            gameId={gameId}
            quickReplies={quickReplies}
            quickRepliesLoading={quickRepliesLoading}
            lastFailedSendContent={lastFailedSendContent}
            onRetryLastMessage={handleRetryLastMessage}
            isRoundInProgress={isRoundInProgress}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
          />
        ) : null}
      </div>

      {/* 玩家面板：桌面显示，移动端在右侧 Sheet */}
      <div className="hidden md:block flex-shrink-0">
        <PlayerPanel
          players={players}
          gameId={gameId}
          humanGameIdentity={humanGameIdentity}
          avatarImageUrls={avatarImageUrls}
          onAvatarUrlLoaded={onAvatarUrlLoaded}
        />
      </div>

      <Sheet open={mobileRightDrawer} onOpenChange={setMobileRightDrawer}>
        <SheetContent side="right" title="Players" className="w-64 max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700">
          <PlayerPanel
            players={players}
            gameId={gameId}
            humanGameIdentity={humanGameIdentity}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
          />
        </SheetContent>
      </Sheet>
      </div>

      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        offset={{ top: "72px", right: "20px" }}
        gap={12}
        toastOptions={{
          style: { zIndex: 9999 },
          duration: 4000,
        }}
      />
    </div>
  );
}
