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
  const origin = requestUrl.origin;

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
    }
  }

  const returnUrl = isSafeReturnUrl(state) ? state : "/";
  return NextResponse.redirect(new URL(returnUrl, origin));
}
