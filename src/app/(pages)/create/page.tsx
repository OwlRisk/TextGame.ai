"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { GameConfig } from "@/types/game-config";
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

  useEffect(() => {
    selectGame("create");
    trackEvent("gm_chat_started", { preset: presetId || "none" });
  }, [selectGame, presetId]);

  const handleCreateGame = async (config: GameConfig) => {
    const toastId = "create-game";
    toast.loading("Creating game...", { id: toastId });

    try {
      const tmpl = GAME_TEMPLATES.find(t => t.id === config.template);
      const gameIcon = initialPreset?.cover ?? tmpl?.iconUrl ?? tmpl?.icon ?? "🎮";

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
              ...(config.rpgWorldId && { rpgWorldId: config.rpgWorldId }),
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

      if (!finalConfig.channels && tmpl?.channels) {
        finalConfig = {
          ...finalConfig,
          channels: tmpl.channels.map(c => ({ id: c.id, name: c.name, roomType: c.roomType })),
        };
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
        onBack={() => router.push("/discover")}
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
