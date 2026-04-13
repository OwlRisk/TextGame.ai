/**
 * Returns the user's preferred AI model from localStorage, falling back to the default.
 * Safe to call on the server (returns default) or before hydration.
 */
export const DEFAULT_AI_MODEL = 'gpt-5.3-chat-latest';

/**
 * Cheapest model for low-stakes generation: player JSON, reply suggestions, tool calls.
 * gpt-5.4-nano: extremely fast and cheap.
 */
export const CHEAP_AI_MODEL = 'gpt-5.4-nano';

/** Mid-tier model for story summarization — good quality at lower cost than flagship. */
export const SUMMARY_AI_MODEL = 'gpt-5.4-mini';

/** Scene narrator: flagship GPT for strong instruction-following and creative writing. */
export const SCENE_NARRATOR_MODEL = 'gpt-5.4';


export const ALLOWED_MODELS = [
  'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano',
  'gpt-5.3-chat-latest', 'gpt-5.2-chat-latest', 'gpt-5.1-chat-latest',
  'gpt-5.2', 'gpt-5.2-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
  'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o4-mini',
  'gemini-2.5-pro', 'gemini-2.5-flash',
];

export function sanitizeModel(preferred?: string): string {
  if (!preferred) return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
  if (ALLOWED_MODELS.includes(preferred)) return preferred;
  return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
}

/** Whether the model string points to Google Gemini (routed via OpenAI-compat endpoint). */
export function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini-');
}

const STORAGE_KEY = 'tg_preferred_model';

export function getPreferredModel(): string {
  if (typeof window === 'undefined') return DEFAULT_AI_MODEL;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ALLOWED_MODELS.includes(stored)) return stored;
  } catch {}
  return DEFAULT_AI_MODEL;
}

export function setPreferredModel(model: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (ALLOWED_MODELS.includes(model)) {
      localStorage.setItem(STORAGE_KEY, model);
    }
  } catch {}
}
