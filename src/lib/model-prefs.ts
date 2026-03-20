/**
 * Returns the user's preferred AI model from localStorage, falling back to the default.
 * Safe to call on the server (returns default) or before hydration.
 */
export const DEFAULT_AI_MODEL = 'gpt-5.3-chat-latest';

export const ALLOWED_MODELS = [
  'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano',
  'gpt-5.3-chat-latest', 'gpt-5.2-chat-latest', 'gpt-5.1-chat-latest',
  'gpt-5.2', 'gpt-5.2-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
  'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o4-mini',
];

export function sanitizeModel(preferred?: string): string {
  if (!preferred) return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
  if (ALLOWED_MODELS.includes(preferred)) return preferred;
  return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
}

export function getPreferredModel(): string {
  return DEFAULT_AI_MODEL;
}
