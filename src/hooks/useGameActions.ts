import { useMemo } from "react";
import type { Player } from "@/types/player";

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

const DEDUCTION_TEMPLATES = ["werewolf", "mafia", "undercover", "avalon", "spyfall"];

function getPhaseType(phaseLabel: string): "day" | "night" | "vote" | "unknown" {
  const lower = phaseLabel.toLowerCase();
  if (/vote|voting|trial/i.test(lower)) return "vote";
  if (/night/i.test(lower)) return "night";
  if (/day|discussion|dawn/i.test(lower)) return "day";
  return "unknown";
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
    const isDeduction = gameTemplate && DEDUCTION_TEMPLATES.includes(gameTemplate);
    const roleLower = (humanRole ?? "").toLowerCase();
    const actions: GameAction[] = [];

    if (isDeduction) {
      if (phase === "day" || phase === "unknown") {
        actions.push(
          { label: "Accuse", template: "I think {player} is suspicious — ", needsTarget: true, icon: "🔍" },
          { label: "Defend", template: "I'm innocent, here's why: ", icon: "🛡️" },
          { label: "Question", template: "{player}, what do you think about ", needsTarget: true, icon: "❓" },
          { label: "Agree", template: "I agree, {player} has been acting weird", needsTarget: true, icon: "👍" },
        );
      }
      if (phase === "vote") {
        actions.push(
          { label: "Vote", template: "I vote for {player}", needsTarget: true, icon: "🗳️" },
          { label: "Abstain", template: "I'm not sure yet, I'll abstain for now", icon: "🤷" },
        );
      }
      if (phase === "night") {
        if (roleLower === "seer" || roleLower === "detective") {
          actions.push({ label: "Investigate", template: "I want to investigate {player}", needsTarget: true, icon: "🔮" });
        } else if (roleLower === "doctor" || roleLower === "bodyguard" || roleLower === "protector") {
          actions.push({ label: "Protect", template: "I choose to protect {player}", needsTarget: true, icon: "🛡️" });
        } else if (roleLower === "werewolf" || roleLower === "mafia" || roleLower === "killer") {
          actions.push({ label: "Target", template: "Let's target {player} tonight", needsTarget: true, icon: "🎯" });
        }
      }
    }

    switch (gameTemplate) {
      case "20-questions":
        actions.push(
          { label: "Yes/No?", template: "Is it ", icon: "❓" },
          { label: "Guess", template: "I think it's ", icon: "💡" },
        );
        break;
      case "debate":
        actions.push(
          { label: "Argue", template: "I disagree because ", icon: "⚔️" },
          { label: "Support", template: "Good point — and also ", icon: "💪" },
          { label: "Challenge", template: "{player}, but what about ", needsTarget: true, icon: "🎯" },
        );
        break;
      case "trivia":
      case "quiz":
        actions.push(
          { label: "Answer", template: "My answer is ", icon: "✋" },
          { label: "Guess", template: "I'll guess ", icon: "🤔" },
        );
        break;
      case "detective-mystery":
        if (roleLower === "detective") {
          actions.push(
            { label: "Ask", template: "{player}, where were you when ", needsTarget: true, icon: "🔍" },
            { label: "Accuse", template: "I believe {player} is the culprit because ", needsTarget: true, icon: "⚖️" },
          );
        } else {
          actions.push(
            { label: "Alibi", template: "I was ", icon: "🗣️" },
            { label: "Point out", template: "I noticed something about {player} — ", needsTarget: true, icon: "👀" },
          );
        }
        break;
      case "escape-room":
        actions.push(
          { label: "Examine", template: "Let me look at ", icon: "🔍" },
          { label: "Try", template: "What if we try ", icon: "💡" },
          { label: "Combine", template: "Maybe we can combine this with ", icon: "🔗" },
        );
        break;
    }

    if (actions.length === 0) {
      actions.push(
        { label: "Respond", template: "@{player} ", needsTarget: true, icon: "💬" },
        { label: "React", template: "That's ", icon: "😮" },
      );
    }

    return actions;
  }, [gameTemplate, gamePhase, phaseLabel, players, userId, humanRole]);
}
