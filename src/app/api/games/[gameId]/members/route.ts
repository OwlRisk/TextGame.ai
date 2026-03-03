import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/members
 * Returns the list of members for a game (public within the room).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("game_members")
    .select("id, game_id, nickname, player_id, is_owner, joined_at")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });

  return NextResponse.json({ members: data ?? [] });
}
