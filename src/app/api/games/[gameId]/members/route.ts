import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/games/[gameId]/members
 * Returns the member list for a game.
 *
 * Auth: requires either a valid Bearer token (authenticated user) OR
 *       a ?guestId=<uuid> query param that is a verified member of the game.
 *       This prevents arbitrary enumeration of players in rooms the caller
 *       has no connection to.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  // ── Verify caller is a member of this game ─────────────────────────────────
  const user = await getAuthUserFromRequest(request).catch(() => null);
  const guestId = request.nextUrl.searchParams.get("guestId");

  if (!user && !guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Game owners are allowed even if they have no row in game_members yet
  // (they may not have gone through the explicit join flow).
  let callerIsAuthorized = false;

  if (user) {
    const { data: game } = await supabaseAdmin
      .from("games")
      .select("user_id")
      .eq("id", gameId)
      .maybeSingle();
    if (game?.user_id === user.id) callerIsAuthorized = true;
  }

  if (!callerIsAuthorized) {
    // Verify membership via game_members
    let memberQuery = supabaseAdmin
      .from("game_members")
      .select("id")
      .eq("game_id", gameId);

    if (user) {
      memberQuery = memberQuery.eq("user_id", user.id);
    } else {
      memberQuery = memberQuery.eq("guest_id", guestId!);
    }

    const { data: membership, error: memberErr } = await memberQuery.maybeSingle();
    if (memberErr || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Fetch all members ──────────────────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from("game_members")
    .select("id, game_id, nickname, player_id, is_owner, joined_at, guest_id")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });

  return NextResponse.json({ members: data ?? [] });
}
