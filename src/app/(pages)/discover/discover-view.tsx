"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import { getPresetById } from "@/data/discover-templates";
import { buildScriptKillGame } from "@/lib/script-kill-setup";
import { getAppLanguage, t } from "@/lib/i18n";
import { getScene } from "@/lib/scenes";
import { Loader2 } from "lucide-react";

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

function DiscoverViewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectGame, addGame } = useGameContext();
  const { user, loading } = useAuth();
  const [creating, setCreating] = useState(false);
  const autoCreateFiredRef = useRef(false);

  useEffect(() => {
    selectGame("discover");
  }, [selectGame]);

  const handleCreateGame = async (preset: DiscoverPreset) => {
    const lang = getAppLanguage();
    if (!user && !loading) {
      const returnUrl = `/discover`;
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      toast.info(t("toast.sign_in_required", lang));
      return;
    }
    if (creating) return;
    setCreating(true);

    const toastId = "create-game";
    toast.loading(t("toast.creating_game", lang), { id: toastId });

    try {
      trackEvent("template_selected", { template: preset.id, source: "discover" });

      const tmpl = GAME_TEMPLATES.find(t => t.id === preset.templateId);
      const gameIcon = tmpl?.iconUrl ?? tmpl?.icon ?? "🎮";
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
      }

      // For scene-mode games, use the scene's predefined characters
      // so they match directorNotes and openingSequence
      const sceneData = preset.templateId === "scene" ? getScene(preset.id) : null;

      if (sceneData) {
        configuredPlayers = sceneData.characters.map((c) => ({
          name: c.name,
          gender: c.gender,
          personality: c.personality,
          background: c.background,
          speechStyle: c.speechStyle,
          quirk: c.quirk,
        }));
      } else if (!scriptKillSetup) {
        toast.loading(t("toast.setting_up_players", lang), { id: toastId });
        try {
          const res = await fetch("/api/generate-players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerCount: preset.playerCount ?? tmpl?.recommendedAICount ?? 4,
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
            toast.warning(t("toast.players_fallback", lang), { id: toastId });
          }
        } catch {
          toast.warning(t("toast.players_fallback", lang), { id: toastId });
        }
      }

      const generatedHost = {
        name: "Narrator",
        personality: "Invisible storyteller and director",
        voiceStyle: "atmospheric",
        systemPrompt: "",
        icon: "",
        color: "#52525b",
        gender: "other" as 'male' | 'female' | 'other',
      };

      const newGame = {
        id: crypto.randomUUID(),
        name: preset.name,
        icon: sceneData?.icon ?? gameIcon,
        color: sceneData ? "#7c3aed" : templateToHex(preset.templateId),
        config: {
          name: preset.name,
          template: preset.templateId || "custom",
          ...(sceneData && { sceneId: sceneData.id }),
          playerCount: configuredPlayers.length || (preset.playerCount ?? tmpl?.recommendedAICount ?? 4),
          rules: gameRules,
          ...(gamePlayerRules && { playerRules: gamePlayerRules }),
          hostId: "narrator",
          hideRolesInPlayerList: tmpl?.hasHiddenRoles ?? false,
          configuredPlayers,
          humanRole,
          ...(caseId && { caseId }),
          ...(tmpl?.channels && {
            channels: tmpl.channels.map(c => ({ id: c.id, name: c.name, roomType: c.roomType })),
          }),
          generatedHost,
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
      toast.success(`"${preset.name}" ${t("toast.game_ready", lang)}`, { id: toastId });
      router.push(`/game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error(t("toast.game_failed", lang), { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (autoCreateFiredRef.current || loading || !user || creating) return;
    const presetParam = searchParams.get("preset");
    if (!presetParam) return;
    const preset = getPresetById(presetParam);
    if (!preset) return;
    autoCreateFiredRef.current = true;
    handleCreateGame(preset);
  }, [loading, user, creating, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <DiscoverPage onCreateGame={handleCreateGame} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </>
  );
}

export default function DiscoverView() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      }
    >
      <DiscoverViewInner />
    </Suspense>
  );
}
