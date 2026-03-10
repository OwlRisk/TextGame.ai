import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

function isSafeReturnUrl(path: string | null): path is string {
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
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message, error.status);
      return NextResponse.redirect(new URL("/signin?error=auth_error", origin));
    }

    // Persist provider avatar into user_metadata so it survives session refresh and is
    // returned by getUser() on the client (callback does not set browser session/cookies).
    const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
    let avatarUrl: string | undefined;
    if (meta) {
      if (typeof meta.avatar_url === "string" && meta.avatar_url) {
        avatarUrl = meta.avatar_url;
      } else if (typeof meta.picture === "string" && meta.picture) {
        avatarUrl = meta.picture;
      } else if (meta.picture && typeof meta.picture === "object") {
        // Facebook returns picture as { data: { url: "..." } }
        const picData = (meta.picture as Record<string, unknown>).data as Record<string, unknown> | undefined;
        if (picData && typeof picData.url === "string") avatarUrl = picData.url;
      }
    }
    if (session?.user?.id && avatarUrl && typeof avatarUrl === "string") {
      const merged = { ...meta, avatar_url: avatarUrl, picture: avatarUrl };
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
          user_metadata: merged,
        });
      } else {
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl, picture: avatarUrl },
        });
      }
    }
  }

  const returnUrl = isSafeReturnUrl(state) ? state : "/";
  return NextResponse.redirect(new URL(returnUrl, origin));
}
