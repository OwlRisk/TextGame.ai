/**
 * Pure utility functions extracted from game/[gameId]/page.tsx for testability.
 */

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
  const partial = channels.find(
    (c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()),
  );
  return partial?.id ?? null;
}

/**
 * Extract the public message portion from the accumulated stream.
 * With the --- separator format: everything before --- is the public message.
 * Handles both mid-text separators (\n---) and start-of-string separators
 * (silent turns where the GM outputs only directives).
 * Fallback (no --- yet): strip any partial/complete [BOARD:...] blocks.
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
  // Strip directive lines that may leak when --- hasn't arrived yet.
  // Also strip lines that are just a directive prefix without ':' (token still streaming).
  const DIR_PREFIXES = "NEXT_SPEAKER|ASSIGN_ROLE|AUTO_CHANNEL|CHANNEL_GOAL|IMAGE_PROMPT|MY_NOTES|GAME_PHASE|SECTION|START_VOTE|END_VOTE|ELIMINATE|REVEAL_ROLE|GAME_OVER|RECORD_EVENT|ANNOUNCE|MOOD";
  cleaned = cleaned.replace(new RegExp(`^(${DIR_PREFIXES})(:.*)?$`, "gm"), "");
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

/** Known host directive prefixes — used to strip leaked directives from display. */
const DIRECTIVE_PREFIXES_RE = /^(NEXT_SPEAKER|ASSIGN_ROLE|AUTO_CHANNEL|CHANNEL_GOAL|IMAGE_PROMPT|MY_NOTES|GAME_PHASE|SECTION|START_VOTE|END_VOTE|ELIMINATE|REVEAL_ROLE|GAME_OVER|RECORD_EVENT|ANNOUNCE|MOOD)(:.*)?$/gm;

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
