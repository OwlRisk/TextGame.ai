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
}

interface UseGameActionsParams {
  gameTemplate?: string;
  gamePhase: string;
  phaseLabel: string;
  players: Player[];
  userId: string;
  humanRole?: string;
}

function getPhaseType(phaseLabel: string): string {
  const lower = phaseLabel.toLowerCase();
  if (/vote|voting|trial/i.test(lower)) return "vote";
  if (/night/i.test(lower)) return "night";
  if (/day|discussion|dawn/i.test(lower)) return "day";
  return "unknown";
}

function matchesPhase(qa: QuickAction, currentPhase: string): boolean {
  if (!qa.phase) return true;
  if (qa.phase === currentPhase) return true;
  if (currentPhase === "unknown" && qa.phase === "day") return true;
  return false;
}

function matchesRole(qa: QuickAction, roleLower: string): boolean {
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

    const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;
    const quickActions = tmpl?.quickActions ?? [];

    const actions: GameAction[] = quickActions
      .filter((qa) => matchesPhase(qa, phase) && matchesRole(qa, roleLower))
      .map((qa) => ({
        label: qa.label,
        template: qa.template,
        needsTarget: qa.needsTarget,
        icon: qa.icon,
      }));

    if (actions.length === 0) {
      actions.push(
        { label: "Respond", template: "@{player} ", needsTarget: true, icon: "💬" },
        { label: "React", template: "That's ", icon: "😮" },
      );
    }

    return actions;
  }, [gameTemplate, gamePhase, phaseLabel, players, userId, humanRole]);
}
