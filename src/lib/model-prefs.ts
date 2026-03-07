/**
 * Returns the user's preferred AI model from localStorage, falling back to the default.
 * Safe to call on the server (returns default) or before hydration.
 */
export const DEFAULT_AI_MODEL = 'gpt-5.2';

export const ALLOWED_MODELS = [
  'gpt-5.4',
  'gpt-5.2', 'gpt-5.2-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
  'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o4-mini',
];

export function sanitizeModel(preferred?: string): string {
  if (!preferred) return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
  if (ALLOWED_MODELS.includes(preferred)) return preferred;
  return process.env.OPENAI_CHAT_MODEL || DEFAULT_AI_MODEL;
}

export function getPreferredModel(): string {
  if (typeof window === 'undefined') return DEFAULT_AI_MODEL;
  return localStorage.getItem('ai_model') || DEFAULT_AI_MODEL;
}
