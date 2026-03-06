"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { trackEvent } from "@/lib/analytics";

const GameMasterChat = dynamic(
  () => import("@/app/components/game-master-chat").then((m) => ({ default: m.GameMasterChat })),
  { ssr: false }
);
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { getPresetById } from "@/data/discover-templates";
import { ProtectedRoute } from "@/app/components/protected-route";
import { GAME_TEMPLATES } from "@/lib/game-templates";

export default function CreateGamePage() {
  return (
    <ProtectedRoute>
      <CreateGamePageContent />
    </ProtectedRoute>
  );
}

const TAILWIND_TO_HEX: Record<string, string> = {
  purple: "#9333ea", indigo: "#4f46e5", red: "#dc2626", pink: "#ec4899",
  blue: "#2563eb", cyan: "#06b6d4", amber: "#d97706", yellow: "#ca8a04",
  orange: "#ea580c", gray: "#4b5563", green: "#16a34a", teal: "#0d9488",
  violet: "#7c3aed", fuchsia: "#c026d3", emerald: "#059669", rose: "#e11d48",
  slate: "#475569",
};

function templateToHex(templateId: string | undefined): string {
  if (!templateId) return "#8b5cf6";
  const tmpl = GAME_TEMPLATES.find(t => t.id === templateId);
  if (!tmpl) return "#8b5cf6";
  const match = tmpl.color.match(/from-(\w+)-/);
  return (match && TAILWIND_TO_HEX[match[1]]) || "#8b5cf6";
}

function CreateGamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectGame, addGame } = useGameContext();

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
              minPlayers: GAME_TEMPLATES.find(t => t.id === config.template)?.minPlayers ?? 2,
              maxPlayers: GAME_TEMPLATES.find(t => t.id === config.template)?.maxPlayers ?? 20,
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
        color: templateToHex(config.template),
        config: finalConfig,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      addGame(newGame);
      selectGame(newGame.id);
      trackEvent("game_created", {
        template: config.template || "custom",
        player_count: finalConfig.playerCount || 0,
        game_name: config.name,
      });
      toast.success(`"${config.name}" is ready!`, { id: toastId });

      // Navigate to the game room
      router.push(`/game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game", { id: toastId });
    }
  };

  return (
    <>
      <GameMasterChat
        initialPreset={initialPreset}
        onCreateGame={handleCreateGame}
        onBack={() => router.back()}
        onPresetApplied={() => {
          if (presetId) router.replace("/create", { scroll: false });
        }}
      />
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
    </>
  );
}
