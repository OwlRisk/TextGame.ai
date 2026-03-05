import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/games/[gameId]/join
 * Join a game as authenticated user or anonymous guest.
 *
 * Body: { inviteCode: string; nickname: string; guestId?: string }
 *   - guestId: client-generated UUID for anonymous players (stored in localStorage)
 *
 * Returns: { memberId, gameId, nickname, isOwner }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const body = await request.json().catch(() => ({})) as {
    inviteCode?: string;
    nickname?: string;
    guestId?: string;
  };

  const { inviteCode, nickname, guestId } = body;
  if (!inviteCode) return NextResponse.json({ error: "inviteCode required" }, { status: 400 });
  if (!nickname?.trim()) return NextResponse.json({ error: "nickname required" }, { status: 400 });

  // Validate invite code against game
  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("id, user_id, invite_code, name")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.invite_code !== inviteCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
  }

  // Block joining after game has started (only lobby/waiting phases allow new players)
  const { data: roomState } = await supabaseAdmin
    .from("game_room_state")
    .select("state")
    .eq("game_id", gameId)
    .maybeSingle();

  const gamePhase = (roomState?.state as Record<string, unknown>)?.gamePhase as string | undefined;
  if (gamePhase === "active" || gamePhase === "ended") {
    return NextResponse.json(
      { error: "Game has already started. New players cannot join." },
      { status: 403 }
    );
  }

  // Check if authenticated user
  const user = await getAuthUserFromRequest(request).catch(() => null);

  // Determine identity
  const isOwner = !!(user && user.id === game.user_id);
  const effectiveUserId = user?.id ?? null;
  const effectiveGuestId = !user ? (guestId ?? crypto.randomUUID()) : null;

  if (!effectiveUserId && !effectiveGuestId) {
    return NextResponse.json({ error: "No identity provided" }, { status: 400 });
  }

  // Upsert member record
  const memberPayload = {
    game_id: gameId,
    user_id: effectiveUserId,
    guest_id: effectiveGuestId,
    nickname: nickname.trim().slice(0, 30),
    is_owner: isOwner,
  };

  const { data: member, error: memberErr } = await supabaseAdmin
    .from("game_members")
    .upsert(memberPayload, {
      onConflict: effectiveUserId ? "game_id,user_id" : "game_id,guest_id",
    })
    .select("id, is_owner, nickname, player_id")
    .single();

  if (memberErr || !member) {
    console.error("[join] member upsert error:", memberErr);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }

  // Dedup: remove stale ghost rows that share the same nickname in this game
  // but have a different guest_id. This cleans up duplicate records created
  // by the pre-C-6 global "guestId" key vs. the new scoped key migration.
  if (effectiveGuestId) {
    await supabaseAdmin
      .from("game_members")
      .delete()
      .eq("game_id", gameId)
      .eq("nickname", memberPayload.nickname)
      .eq("is_owner", false)
      .neq("id", member.id)
      .is("user_id", null); // only clean up anonymous rows
  }

  return NextResponse.json({
    memberId: member.id,
    gameId,
    gameName: game.name,
    nickname: member.nickname,
    isOwner: member.is_owner,
    playerId: member.player_id,
    guestId: effectiveGuestId,
  });
}
