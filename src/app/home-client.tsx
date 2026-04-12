"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { LandingPage } from "@/app/components/landing-page";
import { DashboardHome } from "@/app/components/dashboard-home";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getPresetById } from "@/data/discover-templates";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import { buildScriptKillGame } from "@/lib/script-kill-setup";
import { getAppLanguage, t } from "@/lib/i18n";
import { getScene } from "@/lib/scenes";

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

  useEffect(() => {
    selectGame("home");
  }, [selectGame]);

  const createGameFromPreset = async (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) { router.push("/discover"); return; }
    if (creatingRef.current) return;
    creatingRef.current = true;
    const toastId = "landing-create";
    const lang = getAppLanguage();
    toast.loading(t("toast.creating_game", lang), { id: toastId });
    try {
      trackEvent("template_selected", { template: preset.id, source: "landing" });
      const tmpl = GAME_TEMPLATES.find(t => t.id === preset.templateId);
      const scriptKillSetup = preset.templateId === "script-kill" ? buildScriptKillGame(preset.id, getAppLanguage()) : null;

      let configuredPlayers: { name: string; gender?: string; personality?: string; background?: string; role?: string }[] = [];
      let humanRole: string | undefined;
      let gameRules = preset.rules;
      let gamePlayerRules: string | undefined;
      let caseId: string | undefined;

      if (scriptKillSetup) {
        configuredPlayers = scriptKillSetup.configuredPlayers;
        humanRole = scriptKillSetup.humanRole;
        gameRules = scriptKillSetup.rules;
        gamePlayerRules = scriptKillSetup.playerRules;
        caseId = scriptKillSetup.caseId;
      } else {
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
          } else {
            toast.warning(t("toast.players_fallback", lang));
          }
        } catch {
          toast.warning(t("toast.players_fallback", lang));
        }
      }
      const newGame = {
        id: crypto.randomUUID(),
        name: preset.name,
        icon: tmpl?.iconUrl ?? tmpl?.icon ?? "🎮",
        color: templateToHex(preset.templateId),
        config: {
          name: preset.name,
          template: preset.templateId || "custom",
          playerCount: configuredPlayers.length || preset.playerCount || tmpl?.recommendedAICount || 4,
          rules: gameRules,
          ...(gamePlayerRules && { playerRules: gamePlayerRules }),
          hostId: "narrator",
          hideRolesInPlayerList: tmpl?.hasHiddenRoles ?? false,
          configuredPlayers,
          humanRole,
          ...(caseId && { caseId }),
          generatedHost: {
            name: "Narrator",
            personality: "Invisible storyteller and director",
            voiceStyle: "atmospheric",
            systemPrompt: "",
            icon: "",
            color: "#52525b",
            gender: "other" as const,
          },
        },
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
      addGame(newGame);
      selectGame(newGame.id);
      trackEvent("game_created", { template: preset.templateId || "custom", player_count: configuredPlayers.length, game_name: preset.name });
      toast.success(`"${preset.name}" ${t("toast.game_ready", lang)}`, { id: toastId });
      router.push(`/game/${newGame.id}`);
    } catch {
      toast.error(t("toast.game_failed", lang), { id: toastId });
      router.push("/discover");
    } finally {
      creatingRef.current = false;
    }
  };

  const createSceneGame = async (sceneId: string) => {
    const scene = getScene(sceneId);
    if (!scene) return;
    if (creatingRef.current) return;
    creatingRef.current = true;
    const toastId = "scene-create";
    const sLang = getAppLanguage();
    toast.loading(t("toast.gathering_crew", sLang), { id: toastId });
    try {
      trackEvent("scene_selected", { scene: scene.id, source: "home" });
      const configuredPlayers = scene.characters.map((c) => ({
        name: c.name,
        gender: c.gender,
        personality: c.personality,
        background: c.background,
        speechStyle: c.speechStyle,
        quirk: c.quirk,
      }));
      const newGame = {
        id: crypto.randomUUID(),
        name: scene.title,
        icon: scene.icon,
        color: "#7c3aed",
        config: {
          name: scene.title,
          template: "scene",
          sceneId: scene.id,
          playerCount: configuredPlayers.length,
          rules: "",
          hostId: "narrator",
          hideRolesInPlayerList: false,
          configuredPlayers,
          generatedHost: {
            name: "Narrator",
            personality: "Invisible storyteller and director",
            voiceStyle: "atmospheric",
            systemPrompt: "",
            icon: "",
            color: "#52525b",
            gender: "other" as const,
          },
        },
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
      addGame(newGame);
      selectGame(newGame.id);
      trackEvent("game_created", { template: "scene", scene: scene.id, player_count: configuredPlayers.length, game_name: scene.title });
      toast.success(t("toast.lets_go", sLang), { id: toastId });
      router.push(`/game/${newGame.id}`);
    } catch {
      toast.error(t("toast.adventure_failed", sLang), { id: toastId });
    } finally {
      creatingRef.current = false;
    }
  };

  const handleCreateGame = (presetId?: string) => {
    trackEvent("cta_click", { label: presetId ? `play_${presetId}` : "create_game", source: "landing" });
    if (!user && !loading) {
      router.push(`/signin?returnUrl=${encodeURIComponent("/")}`);
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
      await signInWithGoogle("/");
    } catch {
      toast.error(t("toast.signin_failed", getAppLanguage()));
    }
  };

  const handleSignInFacebook = async () => {
    trackEvent("cta_click", { label: "sign_in_facebook", source: "landing" });
    try {
      await signInWithFacebook("/");
    } catch {
      toast.error(t("toast.signin_failed", getAppLanguage()));
    }
  };

  const isLoggedIn = !!user && !loading;

  const userName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split("@")[0]
    || "Player";

  return (
    <AppLayoutWithSidebar
      mobileTitle="Home"
      games={games}
      selectedGameId="home"
      onSelectGame={(gameId) => selectGame(gameId)}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      {isLoggedIn ? (
        <DashboardHome
          userName={userName}
          games={games}
          onCreateGame={(presetId) => createGameFromPreset(presetId)}
          onNavigateToDiscover={handleExploreGames}
          onSelectGame={(gameId) => selectGame(gameId)}
        />
      ) : (
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
