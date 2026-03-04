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
 * Fallback (no --- yet): strip any partial/complete [BOARD:...] blocks.
 */
export function getStreamingDisplay(raw: string): string {
  const sepIdx = raw.search(/\n---\s*(\n|$)/);
  if (sepIdx >= 0) return raw.slice(0, sepIdx).trim();
  let cleaned = raw.replace(/\[BOARD:[^\]]*\][\s\S]*?\[\/BOARD\]/gi, "");
  cleaned = cleaned.replace(/\[BOARD:[^\]]*\][\s\S]*$/gi, "");
  return cleaned.replace(/\n{2,}/g, "\n\n").trim();
}

/**
 * Split host output at --- into (message, directives).
 * If no separator is found, treat the entire content as directives (fallback).
 */
export function splitHostOutput(raw: string): { message: string; directives: string } {
  const sepIdx = raw.search(/\n---\s*(\n|$)/);
  if (sepIdx >= 0) {
    const message = raw.slice(0, sepIdx).trim();
    const directives = raw.slice(raw.indexOf("\n", sepIdx + 1) + 1).trim();
    return { message, directives };
  }
  return { message: "", directives: raw };
}

/**
 * Generate a stable section ID from a title string.
 */
export function sectionId(title: string): string {
  return "section-" + title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
