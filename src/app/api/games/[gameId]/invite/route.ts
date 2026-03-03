import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/games/[gameId]/invite
 * Generate (or return) an invite code for a game. Owner only.
 * Returns { inviteCode, inviteUrl }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  // Verify ownership
  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("id, user_id, invite_code")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let inviteCode = game.invite_code;
  if (!inviteCode) {
    const candidate = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase();
    // Use a conditional update that only applies when invite_code is still NULL.
    // This prevents a race condition where two concurrent requests both see
    // invite_code=null and generate different codes; the second write is a no-op
    // and we re-fetch to get whichever code won.
    const { error: updateErr } = await supabaseAdmin
      .from("games")
      .update({ invite_code: candidate, updated_at: new Date().toISOString() })
      .eq("id", gameId)
      .is("invite_code", null); // only set if not already set
    if (updateErr) return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });

    // Re-read to get the code that actually won (ours or a concurrent request's)
    const { data: refreshed } = await supabaseAdmin
      .from("games")
      .select("invite_code")
      .eq("id", gameId)
      .single();
    inviteCode = refreshed?.invite_code ?? candidate;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const inviteUrl = `${base}/join/${inviteCode}`;

  return NextResponse.json({ inviteCode, inviteUrl });
}
