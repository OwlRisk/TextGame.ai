/**
 * Returns the user's preferred AI model from localStorage, falling back to the default.
 * Safe to call on the server (returns default) or before hydration.
 */
export const DEFAULT_AI_MODEL = 'gpt-5.2';

export function getPreferredModel(): string {
  if (typeof window === 'undefined') return DEFAULT_AI_MODEL;
  return localStorage.getItem('ai_model') || DEFAULT_AI_MODEL;
}
