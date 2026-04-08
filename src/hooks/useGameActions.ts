import { useMemo } from "react";
import type { Player } from "@/types/player";
import { getGameTemplate } from "@/lib/game-templates";
import type { QuickAction } from "@/lib/templates/types";

export interface GameAction {
  label: string;
  /** The message template — `{player}` gets replaced with a picked target */
  template: string;
  needsTarget?: boolean;
  icon?: string;
  actionType?: string;
  targetType?: string;
}

/** Serialisable subset stored in GameConfig.quickActions */
export type ConfigQuickAction = {
  label: string;
  template: string;
  icon: string;
  needsTarget?: boolean;
  phase?: string;
  role?: string;
  actionType?: string;
  targetType?: string;
};

interface UseGameActionsParams {
  gameTemplate?: string;
  gamePhase: string;
  phaseLabel: string;
  players: Player[];
  userId: string;
  humanRole?: string;
  /** Custom actions from GameConfig (overrides template when present). */
  configQuickActions?: ConfigQuickAction[];
}

function getSceneQuickActions(phase: string): GameAction[] {
  const base: GameAction[] = [
    { label: "Look around", template: "*looks around carefully* What is this place?", icon: "👀" },
    { label: "Let's go", template: "Let's keep moving. Stay close.", icon: "🚶" },
    { label: "Wait", template: "Hold on. Did you hear that?", icon: "✋" },
  ];

  if (phase === "combat" || phase === "unknown") {
    base.push({ label: "Run", template: "*backs away* We need to get out of here. NOW.", icon: "🏃" });
  }
  if (phase === "exploration" || phase === "unknown") {
    base.push({ label: "Investigate", template: "*moves closer to examine it* Let me see...", icon: "🔍" });
  }
  if (phase === "social") {
    base.push({ label: "Ask", template: "Who are you? What do you want?", icon: "❓" });
  }

  return base.slice(0, 4);
}

function getPhaseType(phaseLabel: string): string {
  const lower = phaseLabel.toLowerCase();
  if (/combat|battle|fight|encounter/i.test(lower)) return "combat";
  if (/explor|search|dungeon|travel|room/i.test(lower)) return "exploration";
  if (/rest|camp|town|shop|tavern/i.test(lower)) return "rest";
  if (/social|negotiat|dialogue|persuad|talk/i.test(lower)) return "social";
  if (/vote|voting|trial/i.test(lower)) return "vote";
  if (/night/i.test(lower)) return "night";
  if (/day|discussion|dawn/i.test(lower)) return "day";
  return "unknown";
}

function matchesPhase(qa: Pick<QuickAction, "phase">, currentPhase: string): boolean {
  if (!qa.phase) return true;
  if (qa.phase === currentPhase) return true;
  if (currentPhase === "unknown" && qa.phase === "day") return true;
  if (currentPhase === "unknown" && qa.phase === "exploration") return true;
  return false;
}

function matchesRole(qa: Pick<QuickAction, "role">, roleLower: string): boolean {
  if (!qa.role) return true;
  return qa.role === roleLower;
}

export function useGameActions({
  gameTemplate,
  gamePhase,
  phaseLabel,
  players,
  userId,
  humanRole,
  configQuickActions,
}: UseGameActionsParams): GameAction[] {
  return useMemo(() => {
    if (gamePhase !== "active") return [];

    const alive = players.filter(
      (p) =>
        !p.isGameMaster &&
        p.id !== userId &&
        (p.stats?.Status as string | undefined) !== "eliminated",
    );
    if (alive.length === 0) return [];

    const phase = getPhaseType(phaseLabel);
    const roleLower = (humanRole ?? "").toLowerCase();

    // Config-level actions (from GM) take priority over template-level
    const sourceActions: Array<Pick<QuickAction, "label" | "template" | "icon" | "needsTarget" | "phase" | "role"> & { actionType?: string; targetType?: string }> =
      configQuickActions && configQuickActions.length > 0
        ? configQuickActions
        : (gameTemplate ? getGameTemplate(gameTemplate)?.quickActions ?? [] : []);

    const actions: GameAction[] = sourceActions
      .filter((qa) => matchesPhase(qa, phase) && matchesRole(qa, roleLower))
      .map((qa) => ({
        label: qa.label,
        template: qa.template,
        needsTarget: qa.needsTarget,
        icon: qa.icon,
        actionType: qa.actionType,
        targetType: qa.targetType,
      }));

    if (actions.length === 0) {
      if (gameTemplate === "scene") {
        const sceneActions = getSceneQuickActions(phase);
        actions.push(...sceneActions);
      } else {
        actions.push(
          { label: "Respond", template: "@{player} ", needsTarget: true, icon: "💬", actionType: "social" },
          { label: "React", template: "That's ", icon: "😮", actionType: "social" },
        );
      }
    }

    return actions;
  }, [gameTemplate, gamePhase, phaseLabel, players, userId, humanRole, configQuickActions]);
}
