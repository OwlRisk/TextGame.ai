"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChatArea } from "@/app/components/chat-area";
import { PlayerPanel } from "@/app/components/player-panel";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";

export default function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { games, selectedGameId, selectGame } = useGameContext();
  const {
    messages,
    players,
    addMessage,
    setPlayers,
    gamePhase,
    setGamePhase,
    selectedChannelId,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const { gameId } = use(params);

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  useEffect(() => {
    selectGame(gameId);
  }, [gameId, selectGame]);

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

    // Add welcome messages
    addMessage({
      senderId: "system",
      senderName: "System",
      senderAvatar: hostColor,
      content: `Welcome to ${config.name}! ${hostName} will guide you through the game.`,
      isAI: false,
    });

    addMessage({
      senderId: "gm-1",
      senderName: hostName,
      senderAvatar: hostColor,
      content: `Hey everyone, ${hostName} here. Here's how we'll play ${config.name}:\n\n${config.rules || "Let's have fun!"}\n\nReady when you are - let's go!`,
      isAI: true,
    });

    // Initialize game phase
    setGamePhase("intro");
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    addMessage({
      senderId: "user-1",
      senderName: "You",
      senderAvatar: "#6366f1",
      content,
      isAI: false,
    });

    // Get AI response
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are ${currentGame?.config?.generatedHost?.name || "the Game Master"} for ${currentGame?.name}. 

Game Rules:
${currentGame?.config?.rules || "No specific rules defined."}

Guide the player through the game. Be engaging and maintain the game atmosphere. Keep responses concise and relevant to the game.`,
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

        addMessage({
          senderId: "gm-1",
          senderName: gmName,
          senderAvatar: gmColor,
          content: data.message,
          isAI: true,
        });
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

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId: string) => {
          if (gameId === "home") {
            router.push("/");
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
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatArea
          channelName="General"
          messages={messages}
          players={players}
          onSendMessage={handleSendMessage}
          isGameActive={gamePhase !== "ended"}
          userId="user-1"
        />
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
