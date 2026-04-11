/**
 * Content language detection and prompt instruction builder.
 *
 * Priority (highest first):
 *   1. User's message language (AI auto-adapts via prompt rule)
 *   2. Profile explicit setting (content_language preference)
 *   3. navigator.language (auto-detected on first visit)
 */

export const SUPPORTED_LANGUAGES = [
  // Sorted: English first, then Chinese, then by global speaker population (descending)
  { code: "en",    label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "hi",    label: "हिन्दी" },
  { code: "es",    label: "Español" },
  { code: "ar",    label: "العربية" },
  { code: "pt",    label: "Português" },
  { code: "id",    label: "Bahasa Indonesia" },
  { code: "fr",    label: "Français" },
  { code: "ja",    label: "日本語" },
  { code: "ru",    label: "Русский" },
  { code: "de",    label: "Deutsch" },
  { code: "ko",    label: "한국어" },
  { code: "vi",    label: "Tiếng Việt" },
  { code: "tr",    label: "Türkçe" },
  { code: "it",    label: "Italiano" },
  { code: "th",    label: "ไทย" },
  { code: "pl",    label: "Polski" },
  { code: "nl",    label: "Nederlands" },
  { code: "uk",    label: "Українська" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const LANG_NAMES: Record<string, string> = {
  "en":    "English",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  "hi":    "Hindi (हिन्दी)",
  "es":    "Spanish (Español)",
  "ar":    "Arabic (العربية)",
  "pt":    "Portuguese (Português)",
  "id":    "Indonesian (Bahasa Indonesia)",
  "fr":    "French (Français)",
  "ja":    "Japanese (日本語)",
  "ru":    "Russian (Русский)",
  "de":    "German (Deutsch)",
  "ko":    "Korean (한국어)",
  "vi":    "Vietnamese (Tiếng Việt)",
  "tr":    "Turkish (Türkçe)",
  "it":    "Italian (Italiano)",
  "th":    "Thai (ไทย)",
  "pl":    "Polish (Polski)",
  "nl":    "Dutch (Nederlands)",
  "uk":    "Ukrainian (Українська)",
};

/** Detect language from browser settings. */
export function detectBrowserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.language || "").toLowerCase();
  if (raw.startsWith("zh-tw") || raw.startsWith("zh-hant")) return "zh-TW";
  if (raw.startsWith("zh")) return "zh-CN";
  const PREFIX_MAP: Record<string, string> = {
    hi: "hi", es: "es", ar: "ar", pt: "pt", id: "id", fr: "fr",
    ja: "ja", ru: "ru", de: "de", ko: "ko", vi: "vi", tr: "tr",
    it: "it", th: "th", pl: "pl", nl: "nl", uk: "uk",
  };
  const base = raw.split("-")[0];
  return PREFIX_MAP[base] || "en";
}

/**
 * Build the language instruction to append to AI system prompts.
 *
 * Returns two parts:
 * - Initial language rule (from profile / browser detection)
 * - Auto-adaptation rule (always present — highest priority)
 */
export function buildLanguageInstruction(contentLanguage?: string): string {
  const lang = contentLanguage || "en";
  const langName = LANG_NAMES[lang] || lang;
  const isEnglish = lang === "en";

  const initial = isEnglish
    ? ""
    : `\nLANGUAGE: You MUST respond entirely in ${langName}.
This applies to ALL player-visible content without exception:
- Narration, scene descriptions, dialogue, character speech
- PHASE label values (translate them — do NOT keep English like "Act 1 — Crime Scene")
- ANNOUNCE text, evidence descriptions, board content ([BOARD:...])
- [SECTION:...] titles and content
- Questions-remaining indicators, character introductions, role descriptions
- Game-over summaries and scores
The ONLY English allowed: directive KEYWORDS themselves (NEXT_SPEAKER, ASSIGN_ROLE, PHASE, BOARD, SECTION, GAME_OVER, etc.) and player names.
Even though the game rules/instructions below are written in English, you must translate ALL output for the player into ${langName}.`;

  const adapt = `\nLANGUAGE ADAPTATION: If the human player writes in a different language, switch to THEIR language immediately and continue in that language. Directive keywords always remain in English — but ALL values and player-visible text must be in the player's language.`;

  return `\n${initial}${adapt}`;
}

/**
 * Extract a natural short name from a full display name.
 *
 * Examples:
 *   "Ye Ma (Brook)" -> "Brook"       (parenthesized nickname)
 *   "John Smith"     -> "John"        (first name)
 *   "小明"           -> "小明"         (single-token name kept as-is)
 *   "Brook"          -> "Brook"       (already short)
 */
export function extractPreferredName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Player";

  // Parenthesized nickname: "Ye Ma (Brook)" -> "Brook"
  const paren = trimmed.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim();

  // If the name contains CJK characters, keep it whole (Chinese/Japanese/Korean names are short)
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(trimmed)) {
    return trimmed.replace(/\s*\(.*\)/, "").trim();
  }

  // Western name: use the first name
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return parts[0];

  return trimmed;
}
