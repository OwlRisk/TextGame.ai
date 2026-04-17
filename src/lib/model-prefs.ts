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

/**
 * RPG Game Master (Host) model — needs strong instruction-following + format
 * compliance + creative writing. We pin to the flagship regardless of the
 * user's preferred model so directives don't degrade when they pick mini/nano
 * to save credits on AI player chatter.
 */
export const HOST_MODEL = 'gpt-5.4';

/**
 * Default model for AI Players (NPCs / companions).
 * They produce short in-character dialogue, so a small/cheap model is plenty
 * and saves a lot of tokens in multi-AI rooms.
 */
export const PLAYER_MODEL = 'gpt-5.4-mini';

/**
 * Resolve the model used for a Host/GM call.
 * Honors the env override if set, otherwise pins to HOST_MODEL.
 */
export function getHostModel(): string {
  return process.env.OPENAI_CHAT_MODEL || HOST_MODEL;
}

/**
 * Resolve the model used for an AI Player call.
 * Stays cheap by default. Users can still escalate via OPENAI_CHAT_MODEL if
 * they want everyone on the flagship.
 */
export function getPlayerModel(): string {
  return process.env.OPENAI_PLAYER_MODEL || PLAYER_MODEL;
}


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
