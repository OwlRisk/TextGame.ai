"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { GameMasterChat } from "@/app/components/game-master-chat";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { getDefaultAICountForTemplate } from "@/lib/game-utils";
import { getPresetById, type DiscoverPreset } from "@/app/components/discover-page";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function CreateGamePage() {
  return (
    <ProtectedRoute>
      <CreateGamePageContent />
    </ProtectedRoute>
  );
}

function CreateGamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { games, selectedGameId, selectGame, addGame, updateGame } = useGameContext();

  const presetId = searchParams.get("preset");
  const initialPreset = presetId ? getPresetById(presetId) : null;

  // When on /create (Game Master chat), highlight "Home" in sidebar
  useEffect(() => {
    selectGame("home");
  }, [selectGame]);

  const handleCreateGame = async (config: GameConfig) => {
    const toastId = "create-game";
    toast.loading("Creating game...", { id: toastId });

    try {
      // Generate game icon
      let gameIcon = "🎮";
      try {
        toast.loading("Generating icon...", { id: toastId });
        const iconResponse = await fetch("/api/generate-game-icon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: config.name,
            gameTemplate: config.template,
            rules: config.rules,
          }),
        });

        if (iconResponse.ok) {
          const iconData = await iconResponse.json();
          gameIcon = iconData.icon;
        } else {
          gameIcon =
            config.template === "werewolf"
              ? "🐺"
              : config.template === "undercover"
              ? "🕵️"
              : config.template === "mafia"
              ? "🎭"
              : config.template === "tarot"
              ? "🃏"
              : "🎮";
        }
      } catch (error) {
        console.error("Error generating game icon:", error);
        gameIcon =
          config.template === "werewolf"
            ? "🐺"
            : config.template === "undercover"
            ? "🕵️"
            : "🎮";
      }

      // Generate players via LLM if not configured
      let finalConfig = config;
      if (!config.configuredPlayers || config.configuredPlayers.length === 0) {
        try {
          toast.loading("Setting up players...", { id: toastId });
          const playersRes = await fetch("/api/generate-players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerCount: config.playerCount || 0,
              gameTemplate: config.template,
              rules: config.rules,
              minPlayers:
                config.template === "werewolf"
                  ? 5
                  : config.template === "undercover"
                  ? 4
                  : config.template === "mafia"
                  ? 6
                  : 2,
              maxPlayers:
                config.template === "werewolf"
                  ? 12
                  : config.template === "undercover"
                  ? 10
                  : config.template === "mafia"
                  ? 15
                  : 20,
            }),
          });
          if (playersRes.ok) {
            const data = await playersRes.json();
            const aiCount = data.players?.length ?? config.playerCount;
            finalConfig = { ...config, playerCount: aiCount, configuredPlayers: data.players };
          }
        } catch (err) {
          console.warn("Failed to generate players:", err);
        }
      }

      const newGame = {
        id: crypto.randomUUID(),
        name: config.name,
        icon: gameIcon,
        color:
          config.template === "werewolf"
            ? "#7c3aed"
            : config.template === "undercover"
            ? "#0ea5e9"
            : "#ec4899",
        config: finalConfig,
        isActive: false,
      };

      addGame(newGame);
      selectGame(newGame.id);
      toast.success(`"${config.name}" is ready!`, { id: toastId });

      // Navigate to the game room
      router.push(`/game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game", { id: toastId });
    }
  };

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId) => selectGame(gameId)}
        onCreateGame={() => router.push("/create")}
        onOpenProfile={() => router.push("/profile")}
        onUpdateGame={updateGame}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <GameMasterChat
          initialPreset={initialPreset}
          onCreateGame={handleCreateGame}
          onBack={() => router.back()}
        />
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
