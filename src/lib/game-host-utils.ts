/**
 * Pure utility functions extracted from game/[gameId]/page.tsx for testability.
 */

import type { TemplateChannel } from "./templates/types";

/**
 * Fuzzy channel name resolver: exact match first, then partial containment.
 * Prevents AUTO_CHANNEL / ACCESS directives from silently failing when the
 * HOST slightly misspells a room name.
 */
export function resolveChannelByName(
  name: string,
  channels: Array<{ id: string; name: string }>,
): string | null {
  const n = name.toLowerCase().trim();
  const exact = channels.find((c) => c.name.toLowerCase() === n);
  if (exact) return exact.id;
  const channelContainsSearch = channels.find(
    (c) => c.name.toLowerCase().includes(n),
  );
  if (channelContainsSearch) return channelContainsSearch.id;
  const searchContainsChannel = channels.find(
    (c) => n.includes(c.name.toLowerCase()),
  );
  return searchContainsChannel?.id ?? null;
}

/**
 * All host directive prefixes used by the system.
 * Includes core game directives + RPG/dungeon-specific ones (ROOM_UPDATE, COMBAT_*, PLAYER_UPDATE, QUICK_ACTIONS, etc.)
 * so they don't leak into streaming UI as raw JSON before "---" arrives.
 */
const DIR_PREFIXES_STR = [
  "NEXT_SPEAKER", "ASSIGN_ROLE", "AUTO_CHANNEL", "CHANNEL_GOAL", "IMAGE_PROMPT",
  "MY_NOTES", "GAME_PHASE", "SECTION", "START_VOTE", "END_VOTE", "ELIMINATE",
  "REVEAL_ROLE", "GAME_OVER", "RECORD_EVENT", "ANNOUNCE", "MOOD", "REACT",
  "TIMER", "PHASE", "GM_STATE", "CHARACTER_DIRECTION", "ENGAGEMENT", "BEGIN_GAME",
  "ROOM_UPDATE", "PLAYER_UPDATE", "COMBAT_START", "COMBAT_END", "QUICK_ACTIONS",
  "BOSS_PHASE", "MAP_UPDATE", "INVENTORY_UPDATE", "QUEST_UPDATE", "DICE_ROLL",
  "SKILL_CHECK", "LOOT", "XP_GAIN", "LEVEL_UP", "STAT_CHANGE",
].join("|");

/**
 * Match a single directive line (line-based). Used as a safety net during
 * rendering to drop directive lines that may have leaked into the message body.
 */
const DIRECTIVE_PREFIXES_RE = new RegExp(`^(${DIR_PREFIXES_STR})(:.*)?$`, "gm");

/**
 * Extract the public message portion from the accumulated stream.
 * With the --- separator format: everything before --- is the public message.
 * Handles both mid-text separators (\n---) and start-of-string separators
 * (silent turns where the GM outputs only directives).
 * Fallback (no --- yet): strip any partial/complete [BOARD:...] blocks and
 * known directive prefixes (so RPG ROOM_UPDATE JSON etc. doesn't flash before
 * the separator arrives).
 */
export function getStreamingDisplay(raw: string): string {
  // Match --- at start of string (optional leading whitespace/newline) or after a newline
  const sepMatch = raw.match(/(^|\n)---\s*(\n|$)/);
  if (sepMatch && sepMatch.index != null) {
    return raw.slice(0, sepMatch.index).trim();
  }
  let cleaned = raw.replace(/\[(BOARD|SECTION|ACCESS):[^\]]*\][\s\S]*?\[\/\1\]/gi, "");
  cleaned = cleaned.replace(/\[GAME_OVER\][\s\S]*?\[\/GAME_OVER\]/gi, "");
  cleaned = cleaned.replace(/\[(BOARD|SECTION|ACCESS):[^\]]*\][\s\S]*$/gi, "");
  cleaned = cleaned.replace(new RegExp(`^(${DIR_PREFIXES_STR})(:.*)?$`, "gm"), "");
  cleaned = cleaned.replace(new RegExp(`^(${DIR_PREFIXES_STR}):[\\s\\S]*$`, "i"), "");
  return cleaned.replace(/\n{2,}/g, "\n\n").trim();
}

/**
 * Split host output at --- into (message, directives).
 * Handles --- at the very start of the string (silent turns) as well as
 * mid-text separators. If no separator is found, treat the entire content
 * as directives (fallback).
 */
export function splitHostOutput(raw: string): { message: string; directives: string } {
  const sepMatch = raw.match(/(^|\n)---\s*(\n|$)/);
  if (sepMatch && sepMatch.index != null) {
    const message = raw.slice(0, sepMatch.index).trim();
    const afterSep = sepMatch.index + sepMatch[0].length;
    const directives = raw.slice(afterSep).trim();
    return { message, directives };
  }
  return { message: "", directives: raw };
}

/**
 * Strip any host directive lines from content. Safe to call on already-clean
 * strings (no-op). Used as a rendering-layer safety net to catch directives
 * that leaked through streaming or DB persistence race conditions.
 */
export function stripDirectiveLines(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/\[(BOARD|SECTION|ACCESS):[^\]]*\][\s\S]*?\[\/\1\]/gi, "");
  cleaned = cleaned.replace(/\[GAME_OVER\][\s\S]*?\[\/GAME_OVER\]/gi, "");
  cleaned = cleaned.replace(DIRECTIVE_PREFIXES_RE, "");
  // Strip XML-style internal tags that AI sometimes leaks into public output
  cleaned = cleaned.replace(/<commentary>[\s\S]*?<\/commentary>/gi, "");
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  cleaned = cleaned.replace(/<\/(commentary|thinking)>/gi, "");
  cleaned = cleaned.replace(/<commentary>[\s\S]*$/i, "");
  cleaned = cleaned.replace(/<thinking>[\s\S]*$/i, "");
  return cleaned.replace(/\n{2,}/g, "\n\n").trim();
}

/**
 * Generate a stable section ID from a title string.
 */
export function sectionId(title: string): string {
  return "section-" + title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Build initial channel permissions from template channel definitions
 * and the current player roster (after roles have been assigned).
 * Returns a map of channelId -> list of player IDs who can see that channel.
 *
 * Non-public channels that nobody can access yet are initialized with `[]`
 * so they stay hidden (useGameChannels treats missing perms as "public").
 */
export function buildInitialChannelPermissions(
  templateChannels: ReadonlyArray<Pick<TemplateChannel, "id" | "roomType" | "accessByRole">> | undefined,
  players: Array<{ id: string; role?: string; isGameMaster?: boolean }>,
): Record<string, string[]> {
  if (!templateChannels) return {};

  const perms: Record<string, string[]> = {};
  for (const ch of templateChannels) {
    if (ch.roomType === "public") continue;

    if (ch.accessByRole && ch.accessByRole.length > 0) {
      const allowedRoles = new Set(ch.accessByRole.map(r => r.toLowerCase()));
      const allowedPlayerIds = players
        .filter(p => !p.isGameMaster && p.role && allowedRoles.has(p.role.toLowerCase()))
        .map(p => p.id);
      perms[ch.id] = allowedPlayerIds;
    } else {
      perms[ch.id] = [];
    }
  }
  return perms;
}
