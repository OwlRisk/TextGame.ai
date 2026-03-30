"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { LandingPage } from "@/app/components/landing-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getPresetById } from "@/data/discover-templates";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import { getDefaultHostForTemplate } from "@/app/config/host-config";

const TAILWIND_TO_HEX: Record<string, string> = {
  purple: "#9333ea", indigo: "#4f46e5", red: "#dc2626", pink: "#ec4899",
  blue: "#2563eb", cyan: "#06b6d4", amber: "#d97706", orange: "#ea580c",
  violet: "#7c3aed", emerald: "#059669", green: "#16a34a", teal: "#0d9488",
};

function templateToHex(templateId: string | undefined): string {
  if (!templateId) return "#8b5cf6";
  const tmpl = GAME_TEMPLATES.find(t => t.id === templateId);
  if (!tmpl) return "#8b5cf6";
  const match = tmpl.color.match(/from-(\w+)-/);
  return (match && TAILWIND_TO_HEX[match[1]]) || "#8b5cf6";
}

export default function HomeClient({ heroHeadline }: { heroHeadline?: React.ReactNode }) {
  const router = useRouter();
  const { selectGame, games, updateGame, addGame } = useGameContext();
  const { user, loading, signInWithGoogle, signInWithFacebook } = useAuth();
  const creatingRef = useRef(false);

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setHidden(true);
      router.replace("/create");
      return;
    }
    selectGame("home");
  }, [loading, user, router, selectGame]);

  const createGameFromPreset = async (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) { router.push("/discover"); return; }
    if (creatingRef.current) return;
    creatingRef.current = true;
    const toastId = "landing-create";
    toast.loading("Creating game...", { id: toastId });
    try {
      trackEvent("template_selected", { template: preset.id, source: "landing" });
      const tmpl = GAME_TEMPLATES.find(t => t.id === preset.templateId);
      const host = getDefaultHostForTemplate(preset.templateId);
      let configuredPlayers: { name: string; gender?: string; personality?: string; background?: string; role?: string }[] = [];
      let humanRole: string | undefined;
      try {
        const res = await fetch("/api/generate-players", {
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
        if (res.ok) {
          const data = await res.json();
          if (data.players) configuredPlayers = data.players;
          if (data.humanRole) humanRole = data.humanRole;
        }
      } catch {}
      const newGame = {
        id: crypto.randomUUID(),
        name: preset.name,
        icon: tmpl?.iconUrl ?? tmpl?.icon ?? "🎮",
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
      trackEvent("game_created", { template: preset.templateId || "custom", player_count: configuredPlayers.length, game_name: preset.name });
      toast.success(`"${preset.name}" is ready!`, { id: toastId });
      router.push(`/game/${newGame.id}`);
    } catch {
      toast.error("Failed to create game", { id: toastId });
      router.push("/discover");
    } finally {
      creatingRef.current = false;
    }
  };

  const handleCreateGame = (presetId?: string) => {
    trackEvent("cta_click", { label: presetId ? `play_${presetId}` : "create_game", source: "landing" });
    if (!user && !loading) {
      const returnUrl = presetId ? `/discover?preset=${presetId}` : "/discover";
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else if (presetId) {
      createGameFromPreset(presetId);
    } else {
      router.push("/discover");
    }
  };

  const handleExploreGames = () => {
    trackEvent("cta_click", { label: "explore_games", source: "landing" });
    router.push("/discover");
  };

  const handleSignIn = async () => {
    trackEvent("cta_click", { label: "sign_in", source: "landing" });
    try {
      await signInWithGoogle("/discover");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  const handleSignInFacebook = async () => {
    trackEvent("cta_click", { label: "sign_in_facebook", source: "landing" });
    try {
      await signInWithFacebook("/discover");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  return (
    <AppLayoutWithSidebar
      mobileTitle="Home"
      games={games}
      selectedGameId="home"
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={handleCreateGame}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      {!hidden && (
        <LandingPage
          onSignIn={handleSignIn}
          onSignInFacebook={handleSignInFacebook}
          onCreateGame={handleCreateGame}
          onExploreGames={handleExploreGames}
          heroHeadline={heroHeadline}
        />
      )}

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
    </AppLayoutWithSidebar>
  );
}
