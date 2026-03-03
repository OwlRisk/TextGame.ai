import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/games/[gameId]/message
 * Send a message as a guest player (or authenticated non-owner player).
 * The server writes the message into game_room_state and triggers a DB change
 * that Realtime subscribers (including the owner) will receive.
 *
 * Body: { guestId?: string; content: string; nickname: string; playerId?: string }
 * Auth: Bearer token (if logged in) OR guestId in body (if anonymous)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const body = await request.json().catch(() => ({})) as {
    guestId?: string;
    content?: string;
    nickname?: string;
    playerId?: string;
    channelId?: string;
  };

  const { guestId, content, nickname, playerId, channelId = "game-room" } = body;
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Identify the sender
  const user = await getAuthUserFromRequest(request).catch(() => null);
  const effectiveUserId = user?.id ?? null;
  const effectiveGuestId = !user ? guestId : null;

  if (!effectiveUserId && !effectiveGuestId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate membership
  let memberQuery = supabaseAdmin
    .from("game_members")
    .select("id, nickname, player_id, is_owner")
    .eq("game_id", gameId);

  if (effectiveUserId) {
    memberQuery = memberQuery.eq("user_id", effectiveUserId);
  } else {
    memberQuery = memberQuery.eq("guest_id", effectiveGuestId!);
  }

  const { data: member, error: memberErr } = await memberQuery.single();
  if (memberErr || !member) {
    return NextResponse.json({ error: "Not a member of this game" }, { status: 403 });
  }

  // Fetch current game_room_state
  const { data: roomRow, error: roomErr } = await supabaseAdmin
    .from("game_room_state")
    .select("state")
    .eq("game_id", gameId)
    .maybeSingle();

  if (roomErr) return NextResponse.json({ error: "Failed to read game state" }, { status: 500 });

  const currentState = (roomRow?.state ?? {}) as Record<string, unknown>;
  const existingMessages = Array.isArray(currentState.messages) ? currentState.messages : [];

  const newMessage = {
    id: `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    senderId: playerId ?? member.player_id ?? (effectiveGuestId ?? effectiveUserId ?? "unknown"),
    senderName: nickname ?? member.nickname,
    senderAvatar: "#6366f1",
    content: content.trim(),
    timestamp: new Date().toISOString(),
    isAI: false,
    channelId,
    // Tag as guest message so owner's client can trigger AI response
    isGuestMessage: true,
    guestMemberId: member.id,
  };

  // Append message and upsert state (owner's user_id stays as-is, we update the state JSON)
  const { data: gameRow } = await supabaseAdmin
    .from("games")
    .select("user_id")
    .eq("id", gameId)
    .single();

  const ownerUserId = gameRow?.user_id ?? effectiveUserId ?? "unknown";

  const updatedMessages = [...existingMessages.slice(-59), newMessage];
  const newState = {
    ...currentState,
    messages: updatedMessages,
    savedAt: new Date().toISOString(),
    clientId: `guest_${member.id}`, // non-owner clientId so owner doesn't skip it
  };

  const { error: upsertErr } = await supabaseAdmin
    .from("game_room_state")
    .upsert(
      { game_id: gameId, user_id: ownerUserId, state: newState, updated_at: new Date().toISOString() },
      { onConflict: "game_id" }
    );

  if (upsertErr) return NextResponse.json({ error: "Failed to save message" }, { status: 500 });

  return NextResponse.json({ ok: true, message: newMessage });
}
