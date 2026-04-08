/**
 * Content language detection and prompt instruction builder.
 *
 * Priority (highest first):
 *   1. User's message language (AI auto-adapts via prompt rule)
 *   2. Profile explicit setting (content_language preference)
 *   3. navigator.language (auto-detected on first visit)
 */

export const SUPPORTED_LANGUAGES = [
  { code: "en",    label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja",    label: "日本語" },
  { code: "ko",    label: "한국어" },
  { code: "es",    label: "Español" },
  { code: "fr",    label: "Français" },
  { code: "de",    label: "Deutsch" },
  { code: "pt",    label: "Português" },
  { code: "auto",  label: "Auto (match my messages)" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const LANG_NAMES: Record<string, string> = {
  "en":    "English",
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  "ja":    "Japanese (日本語)",
  "ko":    "Korean (한국어)",
  "es":    "Spanish (Español)",
  "fr":    "French (Français)",
  "de":    "German (Deutsch)",
  "pt":    "Portuguese (Português)",
};

/** Detect language from browser settings. */
export function detectBrowserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.language || "").toLowerCase();
  if (raw.startsWith("zh-tw") || raw.startsWith("zh-hant")) return "zh-TW";
  if (raw.startsWith("zh")) return "zh-CN";
  if (raw.startsWith("ja")) return "ja";
  if (raw.startsWith("ko")) return "ko";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("de")) return "de";
  if (raw.startsWith("pt")) return "pt";
  return "en";
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

  if (lang === "auto") {
    return `\n\nLANGUAGE: Detect the human player's language from their messages and respond in the same language. Default to English if unclear.`;
  }

  const langName = LANG_NAMES[lang] || lang;
  const isEnglish = lang === "en";

  const initial = isEnglish
    ? ""
    : `\nLANGUAGE: Respond in ${langName}. All narration, dialogue, and spoken content must be in ${langName}.`;

  const adapt = `\nLANGUAGE ADAPTATION: If the human player writes in a different language, switch to THEIR language immediately and continue in that language. Directive keywords (NEXT_SPEAKER, RECORD_EVENT, PHASE, ASSIGN_ROLE, etc.) always remain in English.`;

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
