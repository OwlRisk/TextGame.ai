import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  // Handle successful auth callback
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Exchange error:", exchangeError);
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent("Failed to exchange code for session")}`, requestUrl.origin)
        );
      }

      // Redirect to home page on success
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    } catch (err) {
      console.error("Auth callback error:", err);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent("Authentication failed")}`, requestUrl.origin)
      );
    }
  }

  // No code provided
  return NextResponse.redirect(new URL("/?error=No+auth+code", requestUrl.origin));
}
