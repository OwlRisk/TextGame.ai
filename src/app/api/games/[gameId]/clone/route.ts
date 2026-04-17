import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Clone a shared game into the calling user's account so the recipient of a
 * share link gets their own playable copy (own DB row, own messages, own
 * progress). The source game must be marked shareable (has a `share_token`).
 *
 * Required: auth. Returns `{ id }` of the newly created game.
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

  const { data: source, error: fetchErr } = await supabaseAdmin
    .from("games")
    .select("id, user_id, name, icon, color, config, share_token, play_count")
    .eq("id", gameId)
    .not("share_token", "is", null)
    .single();

  if (fetchErr || !source) {
    return NextResponse.json({ error: "Shared game not found" }, { status: 404 });
  }

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `game-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const { error: insertErr } = await supabaseAdmin.from("games").insert({
    id: newId,
    user_id: user.id,
    name: source.name,
    icon: source.icon,
    color: source.color,
    config: source.config,
    is_active: true,
  });

  if (insertErr) {
    return NextResponse.json({ error: "Failed to clone game" }, { status: 500 });
  }

  // Bump the play counter on the source game so the community Discover feed
  // can sort by popularity. Failure is non-critical — the clone already
  // succeeded; we just lose one increment.
  if (source.user_id !== user.id) {
    await supabaseAdmin
      .from("games")
      .update({ play_count: (source.play_count ?? 0) + 1 })
      .eq("id", gameId);
  }

  return NextResponse.json({ id: newId });
}
