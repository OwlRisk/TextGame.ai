/**
 * Client-side only: set/clear the auth cookie so API routes can read it
 * when Authorization header is stripped (e.g. by extensions).
 */
export const AUTH_COOKIE_NAME = 'sb-access-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookie(accessToken: string | null): void {
  if (typeof document === 'undefined') return;
  if (!accessToken) {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    return;
  }
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}
