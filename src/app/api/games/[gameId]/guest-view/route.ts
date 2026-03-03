import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/guest-view?guestId=...
 *
 * Returns game metadata + config for a verified guest member.
 * No auth token required — identity is verified via guest_id membership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const guestId = request.nextUrl.searchParams.get("guestId");
  if (!guestId) return NextResponse.json({ error: "guestId required" }, { status: 400 });

  // Verify this guestId is actually a member of the game
  const { data: member, error: memberErr } = await supabaseAdmin
    .from("game_members")
    .select("id, nickname, is_owner")
    .eq("game_id", gameId)
    .eq("guest_id", guestId)
    .single();

  if (memberErr || !member) {
    return NextResponse.json({ error: "Not a member of this game" }, { status: 403 });
  }

  // Fetch game data (config, name, icon, etc.)
  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("id, name, icon, color, config, updated_at")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: game.id,
    name: game.name,
    icon: game.icon,
    color: game.color,
    config: game.config ?? {},
    updated_at: game.updated_at,
  });
}
