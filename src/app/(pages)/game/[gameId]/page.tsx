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
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
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

  const initializeGame = () => {
    if (!currentGame || !currentGame.config) return;

    const config = currentGame.config;
    const AI_COLORS = [
      "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", 
      "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
    ];

    // Create Game Master from host config
    const hostColor = config.template === "werewolf" 
      ? "#7c3aed" 
      : config.template === "undercover" 
      ? "#0ea5e9" 
      : "#ec4899";

    const hostName = config.generatedHost?.name || "Game Master";
    const hostPersonality = config.generatedHost?.personality || "A mysterious game master";

    const gameMaster = {
      id: "gm-1",
      name: hostName,
      avatar: hostColor,
      role: hostName,
      status: config.generatedHost?.voiceStyle || "Game Master",
      isGameMaster: true,
      isAI: true,
      isMuted: false,
      background: hostPersonality,
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

    // Create user player
    const userPlayer = {
      id: "user-1",
      name: "You",
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
        senderId: "system",
        senderName: "System",
        senderAvatar: hostColor,
        content: `Welcome to ${config.name}! ${hostName} will guide you through the game.`,
        isAI: false,
      },
      defaultChannelId
    );
    addMessage(
      {
        senderId: "gm-1",
        senderName: hostName,
        senderAvatar: hostColor,
        content: `Hey everyone, ${hostName} here. Here's how we'll play ${config.name}:\n\n${config.rules || "Let's have fun!"}\n\nReady when you are - let's go!`,
        isAI: true,
      },
      defaultChannelId
    );

    // Initialize game phase
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
        senderName: "You",
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
              content: `You are the in-game host (moderator) for ${currentGame?.name}. The game is already created and configured—you have NO authority to change the rules or ask for setup. Do NOT ask for player count, options like Mayor, or say "Create Game". Your only job is to run the game as written: run night/day phases, moderate voting, announce results. If players ask to change rules, say the rules are fixed for this game. Keep replies short and in character.

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
            content: data.message,
            isAI: true,
          },
          channelId
        );
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
    }
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

  // GM-defined game rooms from config (e.g. General, Mafia only, Werewolves only); fallback to single room for old games
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

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/game/${gameId}` : "";
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

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
            userId={userId}
            gameId={gameId}
          />
        ) : null}
      </div>

      <PlayerPanel players={players} />

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
