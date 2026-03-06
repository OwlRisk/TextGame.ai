import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./auth-cookie";

function parseTokenFromCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Get the authenticated user from the request.
 * Tries: (1) Authorization: Bearer <token>, (2) request.cookies, (3) next/headers cookies().
 * Returns null if no token, invalid token, or missing Supabase config.
 */
export async function getAuthUserFromRequest(request: NextRequest): Promise<User | null> {
  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || null;

  // Collect candidate tokens: header first, then cookies as fallback.
  const rawFromRequest = request.cookies?.get?.(AUTH_COOKIE_NAME)?.value;
  const cookieToken1 = parseTokenFromCookie(rawFromRequest ?? undefined);
  const cookieStore = await cookies();
  const rawFromHeaders = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const cookieToken2 = parseTokenFromCookie(rawFromHeaders);

  // Try each token source in priority order.  If the header token is expired
  // but a fresher cookie token exists (e.g. auto-refreshed by the Supabase
  // client), we fall through instead of returning null immediately.
  const candidates = [headerToken, cookieToken1, cookieToken2].filter(Boolean) as string[];
  // Deduplicate so we don't verify the same JWT twice.
  const seen = new Set<string>();
  for (const t of candidates) {
    if (seen.has(t)) continue;
    seen.add(t);
    const user = await getAuthUserFromToken(t);
    if (user) return user;
  }
  return null;
}

/**
 * Get user from a raw access token (e.g. from request body).
 * Use when header/cookie may be stripped (e.g. by browser extensions).
 */
export async function getAuthUserFromToken(token: string): Promise<User | null> {
  if (!token || typeof token !== 'string') return null;
  const t = token.trim();
  if (!t) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data: { user }, error } = await supabase.auth.getUser(t);
  if (error || !user) return null;
  return user;
}
