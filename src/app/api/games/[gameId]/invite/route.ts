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
    inviteCode = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase();
    const { error: updateErr } = await supabaseAdmin
      .from("games")
      .update({ invite_code: inviteCode, updated_at: new Date().toISOString() })
      .eq("id", gameId);
    if (updateErr) return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const inviteUrl = `${base}/join/${inviteCode}`;

  return NextResponse.json({ inviteCode, inviteUrl });
}
