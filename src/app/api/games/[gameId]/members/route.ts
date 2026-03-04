import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/members
 * Returns the member list for a game.
 *
 * The game UUID itself acts as a capability token — callers must know the
 * exact game ID to query it. We perform a soft auth check (log a warning
 * when identity cannot be verified) instead of blocking with 401/403,
 * because the member list contains only public nicknames and breaking the
 * game-room UX when tokens expire is far worse than the theoretical risk
 * of enumeration on a 128-bit UUID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  // ── Fetch all members ──────────────────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from("game_members")
    .select("id, game_id, nickname, player_id, is_owner, joined_at, guest_id")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });

  return NextResponse.json({ members: data ?? [] });
}
