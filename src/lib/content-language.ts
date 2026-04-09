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
  { code: "ru",    label: "Русский" },
  { code: "it",    label: "Italiano" },
  { code: "nl",    label: "Nederlands" },
  { code: "pl",    label: "Polski" },
  { code: "tr",    label: "Türkçe" },
  { code: "ar",    label: "العربية" },
  { code: "hi",    label: "हिन्दी" },
  { code: "th",    label: "ไทย" },
  { code: "vi",    label: "Tiếng Việt" },
  { code: "id",    label: "Bahasa Indonesia" },
  { code: "ms",    label: "Bahasa Melayu" },
  { code: "uk",    label: "Українська" },
  { code: "cs",    label: "Čeština" },
  { code: "ro",    label: "Română" },
  { code: "sv",    label: "Svenska" },
  { code: "da",    label: "Dansk" },
  { code: "fi",    label: "Suomi" },
  { code: "no",    label: "Norsk" },
  { code: "el",    label: "Ελληνικά" },
  { code: "he",    label: "עברית" },
  { code: "hu",    label: "Magyar" },
  { code: "bn",    label: "বাংলা" },
  { code: "fil",   label: "Filipino" },
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
  "ru":    "Russian (Русский)",
  "it":    "Italian (Italiano)",
  "nl":    "Dutch (Nederlands)",
  "pl":    "Polish (Polski)",
  "tr":    "Turkish (Türkçe)",
  "ar":    "Arabic (العربية)",
  "hi":    "Hindi (हिन्दी)",
  "th":    "Thai (ไทย)",
  "vi":    "Vietnamese (Tiếng Việt)",
  "id":    "Indonesian (Bahasa Indonesia)",
  "ms":    "Malay (Bahasa Melayu)",
  "uk":    "Ukrainian (Українська)",
  "cs":    "Czech (Čeština)",
  "ro":    "Romanian (Română)",
  "sv":    "Swedish (Svenska)",
  "da":    "Danish (Dansk)",
  "fi":    "Finnish (Suomi)",
  "no":    "Norwegian (Norsk)",
  "el":    "Greek (Ελληνικά)",
  "he":    "Hebrew (עברית)",
  "hu":    "Hungarian (Magyar)",
  "bn":    "Bengali (বাংলা)",
  "fil":   "Filipino",
};

/** Detect language from browser settings. */
export function detectBrowserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.language || "").toLowerCase();
  if (raw.startsWith("zh-tw") || raw.startsWith("zh-hant")) return "zh-TW";
  if (raw.startsWith("zh")) return "zh-CN";
  const PREFIX_MAP: Record<string, string> = {
    ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de", pt: "pt",
    ru: "ru", it: "it", nl: "nl", pl: "pl", tr: "tr", ar: "ar",
    hi: "hi", th: "th", vi: "vi", id: "id", ms: "ms", uk: "uk",
    cs: "cs", ro: "ro", sv: "sv", da: "da", fi: "fi", no: "no",
    nb: "no", nn: "no", el: "el", he: "he", hu: "hu", bn: "bn",
    fil: "fil", tl: "fil",
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
    : `\nLANGUAGE: Respond in ${langName}. ALL narration, dialogue, phase labels (PHASE directive values), announcements (ANNOUNCE text), and spoken content MUST be in ${langName}. Only directive keywords themselves (NEXT_SPEAKER, RECORD_EVENT, etc.) stay in English.`;

  const adapt = `\nLANGUAGE ADAPTATION: If the human player writes in a different language, switch to THEIR language immediately and continue in that language. Directive keywords (NEXT_SPEAKER, RECORD_EVENT, PHASE, ASSIGN_ROLE, etc.) always remain in English — but the VALUES of PHASE and ANNOUNCE should be in the player's language.`;

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
