import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isSafeReturnUrl(path: string | null): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  try {
    new URL(trimmed, "http://localhost");
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state"); // returnUrl passed from sign-in
  const errorParam = requestUrl.searchParams.get("error"); // e.g. access_denied from Google
  const origin = requestUrl.origin;

  // OAuth provider returned an error (e.g. user cancelled)
  if (errorParam) {
    console.error("OAuth error in callback:", errorParam, requestUrl.searchParams.get("error_description"));
    return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Auth callback: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
  }

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message, error.status);
      return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
    }
  }

  const returnUrl = isSafeReturnUrl(state) ? state : "/";
  return NextResponse.redirect(new URL(returnUrl, origin));
}
