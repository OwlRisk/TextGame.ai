import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/games/:gameId/messages?before=<iso>&limit=50
 * Paginated message history (cursor-based, newest first).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { gameId } = await params;
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let query = supabaseAdmin
    .from("game_messages")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (data || []).map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderAvatar: r.sender_avatar,
    content: r.content,
    timestamp: r.created_at,
    channelId: r.channel_id,
    isAI: r.is_ai,
    isSystemMessage: r.is_system_message,
    isPrivate: r.is_private,
    isAnnouncement: r.is_announcement,
    imageUrl: r.image_url,
    reactions: r.reactions,
  }));

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore: (data || []).length === limit,
  });
}

/**
 * POST /api/games/:gameId/messages
 * Batch upsert messages (idempotent via ON CONFLICT).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const { gameId } = await params;
  const body = await request.json();
  const messages: any[] = body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = messages.map((m) => ({
    id: m.id,
    game_id: gameId,
    sender_id: m.senderId || "",
    sender_name: m.senderName || "",
    sender_avatar: m.senderAvatar || "",
    content: m.content || "",
    channel_id: m.channelId || null,
    is_ai: m.isAI ?? false,
    is_system_message: m.isSystemMessage ?? false,
    is_private: m.isPrivate ?? false,
    is_announcement: m.isAnnouncement ?? false,
    image_url: m.imageUrl || null,
    reactions: m.reactions || [],
  }));

  const { error } = await supabaseAdmin
    .from("game_messages")
    .upsert(rows, { onConflict: "game_id,id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saved: messages.length });
}
