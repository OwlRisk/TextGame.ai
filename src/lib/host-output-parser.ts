import type { Player } from "@/types/player";
import { resolveChannelByName as resolveChannelByNameUtil } from "@/lib/game-host-utils";

// ─── SpeakerQueueItem ──────────────────────────────────────────────────────
export type SpeakerQueueItem =
  | { type: "human" }
  | { type: "everyone" }
  | { type: "ai"; player: Player };

// ─── applyHostRoleAssignments (pure) ───────────────────────────────────────

export interface RoleAssignmentActions {
  cleanedContent: string;
  roleUpdates: { playerId: string; role: string }[];
  revealIds: string[];
  eliminateIds: string[];
  newEvents: string[];
  isGameOver: boolean;
  gameOverSummary: string | null;
}

/**
 * Parse role-related directives from the host output and return the actions
 * that should be applied by the caller. Does NOT mutate any state directly.
 */
export function parseRoleAssignments(
  content: string,
  players: Player[],
  userId: string,
  humanName: string | null,
  humanGameIdentityName: string | null,
): RoleAssignmentActions {
  const assignLineRegex = /^\s*ASSIGN_ROLE:\s*(.+?)\s*->\s*(.+?)\s*$/im;
  const revealLineRegex = /^\s*REVEAL_ROLE:\s*(.+?)\s*$/im;
  const gameOverLineRegex = /^\s*GAME_OVER:\s*(.+?)\s*$/im;
  const recordEventRegex = /^\s*RECORD_EVENT:\s*(.+?)\s*$/im;
  const eliminateRegex = /^\s*ELIMINATE:\s*(.+?)\s*$/im;

  const roleUpdates: { playerId: string; role: string }[] = [];
  const revealIds: string[] = [];
  const newEvents: string[] = [];
  const eliminateIds: string[] = [];
  let isGameOver = false;
  let gameOverSummary: string | null = null;

  const lines = content.split(/\r?\n/);
  const keptLines: string[] = [];

  for (const line of lines) {
    const assignMatch = line.match(assignLineRegex);
    const revealMatch = line.match(revealLineRegex);
    const gameOverMatch = line.match(gameOverLineRegex);
    const recordEventMatch = line.match(recordEventRegex);
    const eliminateMatch = line.match(eliminateRegex);

    if (gameOverMatch) {
      isGameOver = true;
      const summary = gameOverMatch[1].trim();
      gameOverSummary = summary || "Game over!";
      newEvents.push(`GAME OVER — ${summary}`);
    } else if (recordEventMatch) {
      newEvents.push(recordEventMatch[1].trim());
    } else if (eliminateMatch) {
      const namePart = eliminateMatch[1].trim();
      const nameBase = namePart.split(",")[0].trim();
      const target = players.find((p) =>
        !p.isGameMaster && (p.name === namePart || p.name === nameBase)
      );
      if (target) {
        eliminateIds.push(target.id);
        newEvents.push(`${target.name} was eliminated (role: ${target.role ?? "unknown"})`);
      }
    } else if (assignMatch) {
      const namePart = assignMatch[1].trim();
      const rolePart = assignMatch[2].trim();
      if (!rolePart) continue;
      const isYou = namePart.toLowerCase() === "you";
      const nameBase = namePart.split(",")[0].trim();
      const player = isYou
        ? players.find((p) => p.id === userId)
        : players.find((p) =>
            p.name === namePart ||
            p.name === nameBase ||
            (p.id === userId && (humanGameIdentityName ?? "").trim() === namePart) ||
            (p.id === userId && (humanGameIdentityName ?? "").trim() === nameBase)
          );
      const targetId = isYou ? userId : player?.id;
      if (targetId) roleUpdates.push({ playerId: targetId, role: rolePart });
    } else if (revealMatch) {
      const namePart = revealMatch[1].trim();
      const isAll = namePart.toLowerCase() === "all" || namePart.toLowerCase() === "everyone";
      if (isAll) {
        players.forEach((p) => { if (!p.isGameMaster) revealIds.push(p.id); });
      } else {
        const isYou = namePart.toLowerCase() === "you" || namePart.toLowerCase() === (humanName ?? "").toLowerCase();
        const nameBase = namePart.split(",")[0].trim();
        const target = isYou
          ? players.find((p) => p.id === userId)
          : players.find((p) => p.name === namePart || p.name === nameBase);
        if (target) revealIds.push(target.id);
      }
    } else {
      keptLines.push(line);
    }
  }

  return {
    cleanedContent: keptLines.join("\n").replace(/\n{2,}/g, "\n\n").trim(),
    roleUpdates,
    revealIds,
    eliminateIds,
    newEvents,
    isGameOver,
    gameOverSummary,
  };
}

// ─── parseHostResult ───────────────────────────────────────────────────────

export interface ParseHostResultOutput {
  hostContent: string;
  who: string | null;
  speakerQueue: SpeakerQueueItem[];
  autoChannelId: string | null;
  autoChannelGoal: string | null;
  /** Current room / scene task from `CHANNEL_GOAL:` (shown to the player in the input area). */
  channelGoal: string | null;
  /** Dynamic quick actions from `QUICK_ACTIONS:` directive. */
  quickActions: string[] | null;
}

export function parseHostResult(
  raw: string,
  players: Player[],
  humanName: string | null,
  gameRoomEntries: { id: string; name: string }[],
): ParseHostResultOutput {
  let hostContent = raw.trim();

  const nextSpeakerMatch = hostContent.match(/(?:^|\n)NEXT_SPEAKER:\s*(.+?)\s*$/im);
  let who: string | null = null;
  const speakerQueue: SpeakerQueueItem[] = [];
  if (nextSpeakerMatch) {
    who = nextSpeakerMatch[1].trim();
    hostContent = hostContent.replace(/(?:^|\n)NEXT_SPEAKER:\s*.+?\s*$/im, "").trim();
    const names = who.split(",").map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      const nameLower = name.toLowerCase();
      if (nameLower === "everyone") {
        speakerQueue.push({ type: "everyone" });
        break;
      } else if (nameLower === "you" || (humanName && nameLower === humanName.toLowerCase())) {
        speakerQueue.push({ type: "human" });
      } else {
        const player = players.find((p) => !p.isGameMaster &&
          (p.name === name || p.name.toLowerCase() === name.toLowerCase()));
        if (player?.isAI) speakerQueue.push({ type: "ai", player });
      }
    }
  }

  const autoChannelMatch = hostContent.match(/(?:^|\n)AUTO_CHANNEL:\s*(.+?)\s*$/im);
  let autoChannelId: string | null = null;
  let autoChannelGoal: string | null = null;
  if (autoChannelMatch) {
    const rawVal = autoChannelMatch[1].trim();
    const pipeIdx = rawVal.indexOf("|");
    const channelName = pipeIdx >= 0 ? rawVal.slice(0, pipeIdx).trim() : rawVal;
    autoChannelGoal = pipeIdx >= 0 ? rawVal.slice(pipeIdx + 1).trim() : null;
    autoChannelId = resolveChannelByNameUtil(channelName, gameRoomEntries);
    hostContent = hostContent.replace(/(?:^|\n)AUTO_CHANNEL:\s*.+?\s*$/im, "").trim();
  }

  let channelGoal: string | null = null;
  hostContent = hostContent.replace(/^\s*CHANNEL_GOAL:\s*(.+)$/gim, (_, g: string) => {
    const t = g.trim();
    if (t) channelGoal = t;
    return "";
  });

  let quickActions: string[] | null = null;
  hostContent = hostContent.replace(/^\s*QUICK_ACTIONS:\s*(.+)$/gim, (_, g: string) => {
    const items = g.split("|").map((s: string) => s.trim()).filter(Boolean);
    if (items.length > 0) quickActions = items.slice(0, 5);
    return "";
  });

  hostContent = hostContent.replace(/\n{3,}/g, "\n\n").trim();

  return { hostContent, who, speakerQueue, autoChannelId, autoChannelGoal, channelGoal, quickActions };
}
