"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import { PlayerPanel } from "@/app/components/player-panel";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";

export default function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { session } = useAuth();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
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
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const { gameId } = use(params);

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  useEffect(() => {
    selectGame(gameId);
  }, [gameId, selectGame]);

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
      gender: config.generatedHost?.gender as "male" | "female" | "other" | undefined,
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
    // Create user player (use userId so host-assigned "NEXT_SPEAKER: You" enables this player)
    const userPlayer = {
      id: userId,
      name: userName,
      avatar: "#6366f1",
      role: config.template === "werewolf" ? "Villager" : "Civilian",
      stats: config.template === "werewolf" || config.template === "mafia" ? { Status: "Alive" } : undefined,
      isAI: false,
      isMuted: false,
      status: "online" as const,
    };

    setPlayers([gameMaster, ...aiPlayers, userPlayer]);

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    addMessage(
      {
        senderId: "gm-1",
        senderName: hostName,
        senderAvatar: hostColor,
        content: `Hey everyone, ${hostName} here. Rules are in the Rules section—ready when you are, let's go!`,
        isAI: true,
      },
      defaultChannelId
    );

    // No speaker assigned yet: anyone can speak until host assigns with NEXT_SPEAKER in their reply
    setCurrentSpeakerId(null);
    setGamePhase("intro");
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
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are the in-game host (moderator) for ${currentGame?.name}. The game is already created and configured—you have NO authority to change the rules or ask for setup. Your only job is to run the game: run night/day phases, moderate voting, announce results. Keep replies short and in character.

When the user says things like "Continue", "What's next?", or "Ready", advance the plot: announce the next phase (e.g. Night falls, Day breaks, time to vote), narrate briefly, and assign the next speaker with NEXT_SPEAKER.

You decide who may speak next. At the end of EVERY reply, add exactly one line (no other text after it):
NEXT_SPEAKER: <name>
Use the exact player names: ${players.filter((p) => !p.isGameMaster).map((p) => p.name).join(", ")}. For the human player use: NEXT_SPEAKER: You. To allow anyone to speak (free discussion), use: NEXT_SPEAKER: Everyone.

IMPORTANT — Get AI players talking: Often assign an AI player to speak (e.g. NEXT_SPEAKER: Maya Patel, NEXT_SPEAKER: Jordan Reyes) so the discussion feels alive. Don't always say NEXT_SPEAKER: You or NEXT_SPEAKER: Everyone; rotate between the human and the AI players so everyone participates.

Game Rules (do not modify, only enforce):
${currentGame?.config?.rules || "No specific rules defined."}`,
            },
            {
              role: "user",
              content,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let hostContent = (data.message || "").trim();
        let nextSpeakerPlayer: typeof players[0] | null = null;
        const nextSpeakerMatch = hostContent.match(/\nNEXT_SPEAKER:\s*(.+?)\s*$/im);
        if (nextSpeakerMatch) {
          const who = nextSpeakerMatch[1].trim();
          hostContent = hostContent.replace(/\nNEXT_SPEAKER:\s*.+?\s*$/im, "").trim();
          if (who.toLowerCase() === "you") {
            setCurrentSpeakerId(userId);
          } else if (who.toLowerCase() === "everyone") {
            setCurrentSpeakerId(null);
            // Have one random AI player speak during "Everyone" so the discussion feels active
            const aiOnly = players.filter((p) => p.isAI && !p.isGameMaster);
            if (aiOnly.length > 0) {
              nextSpeakerPlayer = aiOnly[Math.floor(Math.random() * aiOnly.length)];
            }
          } else {
            const player = players.find((p) => !p.isGameMaster && p.name === who);
            nextSpeakerPlayer = player ?? null;
            setCurrentSpeakerId(player ? player.id : null);
          }
        }

        const gmName = currentGame?.config?.generatedHost?.name || "Game Master";
        const gmColor = currentGame?.config?.template === "werewolf" 
          ? "#7c3aed" 
          : currentGame?.config?.template === "undercover" 
          ? "#0ea5e9" 
          : "#ec4899";

        addMessage(
          {
            senderId: "gm-1",
            senderName: gmName,
            senderAvatar: gmColor,
            content: hostContent,
            isAI: true,
          },
          channelId
        );

        // If Host assigned an AI player to speak, generate that player's message so they participate in the discussion
        if (nextSpeakerPlayer?.isAI && !nextSpeakerPlayer.isGameMaster) {
          const nextSpeaker = nextSpeakerPlayer;
          try {
            const cfgChannels = currentGame?.config?.channels;
            const roomIds = cfgChannels?.length ? new Set(cfgChannels.map((c) => c.id)) : new Set(["game-room"]);
            const chId = selectedChannelId && roomIds.has(selectedChannelId) ? selectedChannelId : (cfgChannels?.[0]?.id ?? "game-room");
            const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === chId);
            const recentWithNew = [
              ...channelMessages.slice(-10).map((m) => ({ senderName: m.senderName, content: m.content })),
              { senderName: "You", content },
              { senderName: gmName, content: hostContent },
            ];
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
            const playerRes = await fetch("/api/chat/player-speak", {
              method: "POST",
              headers,
              body: JSON.stringify({
                gameName: currentGame?.name,
                rules: currentGame?.config?.rules,
                player: {
                  name: nextSpeaker.name,
                  role: nextSpeaker.role,
                  personality: nextSpeaker.personality,
                  background: nextSpeaker.background,
                },
                recentMessages: recentWithNew,
              }),
            });
            if (playerRes.ok) {
              const data = await playerRes.json();
              const aiContent = (data.message || "").trim();
              if (aiContent) {
                addMessage(
                  {
                    senderId: nextSpeaker.id,
                    senderName: nextSpeaker.name,
                    senderAvatar: nextSpeaker.avatar ?? "#8b5cf6",
                    content: aiContent,
                    isAI: true,
                  },
                  channelId
                );
              }
            }
          } catch (err) {
            console.error("Error generating AI player reply:", err);
          }
          setCurrentSpeakerId(null);
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
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

  // AI-generated quick replies (max 3). Run unconditionally so hook order is stable.
  useEffect(() => {
    if (!currentGame?.config || !isGameChannel) return;
    const abort = new AbortController();
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
      .catch(() => setQuickReplies([]));
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fixed 6 items: no rules/name to avoid deps array size changing
  }, [
    isGameChannel,
    selectedChannelId ?? null,
    currentGame?.id ?? null,
    gamePhase,
    messagesForChannel.length,
    session?.access_token ?? null,
  ]);

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/game/${gameId}` : "";
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  if (!currentGame) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game not found</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      {/* Left app sidebar: Home, My games, Discover, game list */}
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId: string) => {
          if (gameId === "home") {
            router.push("/create");
          } else if (gameId === "discover") {
            router.push("/discover");
          } else if (gameId === "my-games") {
            router.push("/my-games");
          } else {
            selectGame(gameId);
            router.push(`/game/${gameId}`);
          }
        }}
        onCreateGame={() => router.push("/create")}
        onOpenProfile={() => router.push("/profile")}
        onUpdateGame={updateGame}
      />

      {/* Game sidebar: # Rules, # Progress, # game-room */}
      <ChannelList
        gameName={currentGame?.name ?? "Game"}
        channels={gameChannels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(id) => setSelectedChannelId(id)}
        onShare={handleShare}
        onSettings={() => toast.info("Settings coming soon")}
        textSectionLabel="Sections"
        gameSectionLabel="Game Rooms"
        userDisplayName={session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null}
        gameUserDisplayName={humanGameIdentity?.name || null}
        gameId={gameId}
        onDeleteChannel={(id) => {
          if (id === "rules" || id === "progress") {
            toast.info("Sections cannot be removed");
            return;
          }
          if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedChannelId === "rules" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                {currentGame?.config?.rules ?? "No rules defined for this game."}
              </pre>
            </div>
          </ScrollArea>
        ) : selectedChannelId === "progress" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                {gameProgress || "Game progress will appear here as the game unfolds."}
              </pre>
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
          />
        ) : null}
      </div>

      <PlayerPanel players={players} gameId={gameId} humanGameIdentity={humanGameIdentity} />

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
