"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import { getDefaultHostForTemplate } from "@/app/config/host-config";

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

export default function DiscoverView() {
  const router = useRouter();
  const { selectGame, addGame } = useGameContext();
  const { user, loading } = useAuth();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    selectGame("discover");
  }, [selectGame]);

  const handleCreateGame = async (preset: DiscoverPreset) => {
    if (!user && !loading) {
      const returnUrl = `/discover`;
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      toast.info("Sign in to create this game");
      return;
    }
    if (creating) return;
    setCreating(true);

    const toastId = "create-game";
    toast.loading("Creating game...", { id: toastId });

    try {
      trackEvent("template_selected", { template: preset.id, source: "discover" });

      const tmpl = GAME_TEMPLATES.find(t => t.id === preset.templateId);
      const gameIcon = tmpl?.icon ?? "🎮";
      const host = getDefaultHostForTemplate(preset.templateId);

      let configuredPlayers: { name: string; gender?: string; personality?: string; background?: string; role?: string }[] = [];
      let humanRole: string | undefined;
      try {
        toast.loading("Setting up players...", { id: toastId });
        const playersRes = await fetch("/api/generate-players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerCount: preset.playerCount || tmpl?.recommendedAICount || 4,
            gameTemplate: preset.templateId,
            rules: preset.rules,
            minPlayers: tmpl?.minPlayers ?? 2,
            maxPlayers: tmpl?.maxPlayers ?? 20,
          }),
        });
        if (playersRes.ok) {
          const data = await playersRes.json();
          if (data.players) configuredPlayers = data.players;
          if (data.humanRole) humanRole = data.humanRole;
        }
      } catch (err) {
        console.warn("Failed to generate players:", err);
      }

      const newGame = {
        id: crypto.randomUUID(),
        name: preset.name,
        icon: gameIcon,
        color: templateToHex(preset.templateId),
        config: {
          name: preset.name,
          template: preset.templateId || "custom",
          playerCount: configuredPlayers.length || preset.playerCount || tmpl?.recommendedAICount || 4,
          rules: preset.rules,
          hostId: host.id,
          hideRolesInPlayerList: tmpl?.hasHiddenRoles ?? false,
          configuredPlayers,
          humanRole,
          generatedHost: {
            name: host.name,
            personality: host.personality || host.description || "",
            voiceStyle: host.voiceStyle,
            systemPrompt: host.systemPrompt,
            icon: host.icon,
            color: host.color,
            gender: host.gender,
          },
        },
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      addGame(newGame);
      selectGame(newGame.id);
      trackEvent("game_created", {
        template: preset.templateId || "custom",
        player_count: configuredPlayers.length,
        game_name: preset.name,
      });
      toast.success(`"${preset.name}" is ready!`, { id: toastId });
      router.push(`/game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game", { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <DiscoverPage onCreateGame={handleCreateGame} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </>
  );
}
