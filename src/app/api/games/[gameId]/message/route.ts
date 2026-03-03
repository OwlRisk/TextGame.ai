import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/games/[gameId]/message
 * Send a message as a guest player (or authenticated non-owner player).
 *
 * Uses a Postgres RPC (`append_game_message`) to atomically append the message
 * to game_room_state, preventing the read-modify-write race condition that
 * could cause concurrent messages to overwrite each other.
 *
 * Body: { guestId?: string; content: string; nickname: string; playerId?: string; messageId?: string }
 */

/** Patterns that could inject AI directives into the prompt. Strip these lines. */
const DIRECTIVE_REGEX =
  /^(ASSIGN_ROLE|REVEAL_ROLE|ELIMINATE|RECORD_EVENT|GAME_OVER|MY_BOARD_FOR|MY_NOTES|ACCESS|CHANNEL_SUMMARY)\s*:/i;

/**
 * Sanitize user-supplied content before it is injected into the AI prompt.
 * Removes lines that match known directive keywords so guests cannot
 * trigger game-logic commands (prompt injection).
 */
function sanitizeContent(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !DIRECTIVE_REGEX.test(line.trim()))
    .join("\n")
    .trim();
}

// ─── Simple in-process rate limiter ─────────────────────────────────────────
// Tracks the last send time per (gameId + memberId) pair.
// This is per-instance (serverless-friendly: prevents bursts within a single
// cold-start window); persistent rate-limiting requires Redis or Supabase.
const lastSentAt = new Map<string, number>();
const RATE_LIMIT_MS = 1_000; // minimum gap between messages per member

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
    channelId?: string;
    messageId?: string;
  };

  const { guestId, content, channelId = "game-room", messageId } = body;
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  // ── Identify the sender ────────────────────────────────────────────────────
  const user = await getAuthUserFromRequest(request).catch(() => null);
  const effectiveUserId = user?.id ?? null;
  const effectiveGuestId = !user ? guestId : null;

  if (!effectiveUserId && !effectiveGuestId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Validate membership ────────────────────────────────────────────────────
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

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rateLimitKey = `${gameId}:${member.id}`;
  const now = Date.now();
  const last = lastSentAt.get(rateLimitKey) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  lastSentAt.set(rateLimitKey, now);
  // Prune old entries to prevent unbounded growth
  if (lastSentAt.size > 10_000) {
    const cutoff = now - 60_000;
    for (const [k, t] of lastSentAt) {
      if (t < cutoff) lastSentAt.delete(k);
    }
  }

  // ── Content sanitization (prevent prompt injection) ───────────────────────
  const safeContent = sanitizeContent(content);
  if (!safeContent) {
    return NextResponse.json({ error: "Message content is empty after sanitization" }, { status: 400 });
  }

  // ── Build message object ───────────────────────────────────────────────────
  const newMessage = {
    id: messageId ?? `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    senderId: member.player_id ?? (effectiveGuestId ?? effectiveUserId ?? "unknown"),
    senderName: member.nickname,
    senderAvatar: "#6366f1",
    content: safeContent,
    timestamp: new Date().toISOString(),
    isAI: false,
    channelId,
    isGuestMessage: true,
    guestMemberId: member.id,
  };

  // ── Fetch owner userId for the upsert fallback ────────────────────────────
  const { data: gameRow } = await supabaseAdmin
    .from("games")
    .select("user_id")
    .eq("id", gameId)
    .single();

  const ownerUserId = gameRow?.user_id ?? effectiveUserId ?? "unknown";

  // ── Atomically append message via Postgres RPC (fixes race condition) ─────
  const { error: rpcErr } = await supabaseAdmin.rpc("append_game_message", {
    p_game_id:   gameId,
    p_message:   newMessage,
    p_owner_uid: ownerUserId,
    p_max_msgs:  60,
  });

  if (rpcErr) {
    // Log the full error for debugging (visible in Vercel logs).
    console.error("[message/route] RPC error:", rpcErr.code, rpcErr.message, rpcErr.details);

    // Fallback: direct read-modify-write upsert.
    // Slightly less safe under extreme concurrency, but avoids a hard 500 when
    // the append_game_message function is not yet deployed in this environment
    // (migration 003 not yet run).
    console.warn("[message/route] Falling back to direct upsert for game", gameId);

    const { data: currentRow } = await supabaseAdmin
      .from("game_room_state")
      .select("state")
      .eq("game_id", gameId)
      .maybeSingle();

    const currentState = (currentRow?.state as Record<string, unknown>) ?? {};
    const existingMessages = (currentState.messages as unknown[]) ?? [];
    const trimmedMessages = existingMessages.slice(-59); // keep room for the new one

    const fallbackState = {
      ...currentState,
      messages:  [...trimmedMessages, newMessage],
      savedAt:   new Date().toISOString(),
      clientId:  "guest_write",
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("game_room_state")
      .upsert(
        { game_id: gameId, user_id: ownerUserId, state: fallbackState, updated_at: new Date().toISOString() },
        { onConflict: "game_id" }
      );

    if (upsertErr) {
      console.error("[message/route] Fallback upsert error:", upsertErr);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, message: newMessage });
}
