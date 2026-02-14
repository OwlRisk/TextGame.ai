"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { GameMasterChat } from "@/app/components/game-master-chat";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { getDefaultAICountForTemplate } from "@/lib/game-utils";
import { getPresetById, type DiscoverPreset } from "@/app/components/discover-page";
import { ProtectedRoute } from "@/app/components/protected-route";
import { Menu } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const sidebarProps = {
    games,
    selectedGameId,
    onSelectGame: (gameId: string) => selectGame(gameId),
    onCreateGame: () => router.push("/create"),
    onOpenProfile: () => router.push("/profile"),
    onUpdateGame: updateGame,
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      <header className="md:hidden flex-shrink-0 h-12 px-3 flex items-center border-b border-zinc-800 bg-zinc-900/95">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileMenuOpen(true)} aria-label="打开菜单">
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 ml-2">Create Game</span>
      </header>
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="hidden md:flex flex-shrink-0 z-10">
          <GameSidebar {...sidebarProps} />
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" title="Menu" className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950">
            <GameSidebar {...sidebarProps} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <GameMasterChat
          initialPreset={initialPreset}
          onCreateGame={handleCreateGame}
          onBack={() => router.back()}
        />
      </div>
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
