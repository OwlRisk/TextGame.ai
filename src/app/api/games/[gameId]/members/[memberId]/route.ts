import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * PATCH /api/games/[gameId]/members/[memberId]
 * Assign (or unassign) a game player slot to a member row.
 *
 * Auth: owner of the game only.
 * Body: { playerId: string | null }
 *   - playerId: the Player.id from the game's players array to bind this member to,
 *               or null to unassign.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; memberId: string }> }
) {
  const { gameId, memberId } = await params;
  if (!gameId || !memberId) {
    return NextResponse.json({ error: "gameId and memberId required" }, { status: 400 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const user = await getAuthUserFromRequest(request).catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is the game owner
  const { data: game } = await supabaseAdmin
    .from("games")
    .select("user_id")
    .eq("id", gameId)
    .maybeSingle();

  if (!game || game.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { playerId?: string | null };
  const playerId = body.playerId ?? null;

  const { error } = await supabaseAdmin
    .from("game_members")
    .update({ player_id: playerId })
    .eq("id", memberId)
    .eq("game_id", gameId);

  if (error) {
    console.error("[members/patch] update error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, memberId, playerId });
}
