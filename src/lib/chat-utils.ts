/**
 * Pure utility functions extracted from chat-area.tsx for testability.
 */
import { EMOTION_EMOJI } from "./format-message";

/**
 * Returns a human-readable timestamp for a chat message (24-hour format).
 * - Today      → "19:29"
 * - Yesterday  → "Yesterday 19:29"
 * - Older      → "Mar 1, 19:29"
 */
export function formatMessageTime(date: Date, now: Date = new Date()): string {
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }).replace(/^24:/, "00:");
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return timeStr;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

/**
 * Replace Inworld emotion/sound tags with their corresponding emoji.
 * Handles both underscore-form [clear_throat] and space-form [clears throat].
 * Unknown tags (no matching emoji) are stripped entirely.
 */
export function stripEmotionTags(text: string): string {
  return text
    .replace(/\[([a-z][a-z _]*)\](?!\()/gi, (_, tag: string) => {
      const key = tag.toLowerCase();
      const emoji = EMOTION_EMOJI[key] ?? EMOTION_EMOJI[key.replace(/ /g, "_")];
      return emoji ?? "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Max characters TTS will read for the Host narrator (~2-3 sentences, ~20-30s). */
export const MAX_TTS_CHARS_HOST = 300;
/** Max characters TTS will read for AI players (~1 sentence, ~10s). */
export const MAX_TTS_CHARS_PLAYER = 150;

/**
 * Split `text` into TTS-ready sentences starting at `fromChar`.
 * Returns completed sentences (ending in . ! ?) and the new char offset.
 * Sentences shorter than 8 chars are skipped to avoid tiny audio fragments.
 */
export function extractTTSSentences(
  text: string,
  fromChar: number,
  maxChars: number = MAX_TTS_CHARS_HOST,
): { sentences: string[]; newOffset: number } {
  const cappedText = text.slice(0, maxChars);
  const slice = cappedText.slice(fromChar);
  const sentences: string[] = [];
  const re = /[^.!?]*[.!?]+(?:\s+|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(slice)) !== null) {
    const s = match[0].trim();
    if (s.length >= 8) sentences.push(s);
    lastIndex = match.index + match[0].length;
  }
  return { sentences, newOffset: fromChar + lastIndex };
}
