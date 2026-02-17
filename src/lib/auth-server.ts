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
  let token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || null;
  if (!token) {
    const rawFromRequest = request.cookies?.get?.(AUTH_COOKIE_NAME)?.value;
    token = parseTokenFromCookie(rawFromRequest ?? undefined);
  }
  if (!token) {
    const cookieStore = await cookies();
    const rawFromHeaders = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    token = parseTokenFromCookie(rawFromHeaders);
  }
  if (!token) return null;
  return getAuthUserFromToken(token);
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
