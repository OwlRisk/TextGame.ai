import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Publish a game to the community Discover feed.
 *
 * - Auth required, owner only.
 * - Sets `published_at = now()` on the game row.
 * - Ensures a `share_token` exists (so /play/[token] works for unauth visitors).
 *
 * Idempotent: re-publishing an already-published game just refreshes
 * `published_at` so it bubbles back to the top of the "new" sort.
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

  const { data: game, error: fetchErr } = await supabaseAdmin
    .from("games")
    .select("id, user_id, share_token")
    .eq("id", gameId)
    .single();

  if (fetchErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let shareToken = game.share_token;
  if (!shareToken) {
    shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  const { error: updateErr } = await supabaseAdmin
    .from("games")
    .update({
      share_token: shareToken,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    shareToken,
    shareUrl: `${base}/play/${shareToken}`,
    publishedAt: new Date().toISOString(),
  });
}

/**
 * Unpublish a game from the community Discover feed.
 *
 * Sets `published_at = null` but keeps `share_token` (so existing share
 * links continue to work for the recipient who already has them).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });

  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data: game, error: fetchErr } = await supabaseAdmin
    .from("games")
    .select("id, user_id")
    .eq("id", gameId)
    .single();

  if (fetchErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error: updateErr } = await supabaseAdmin
    .from("games")
    .update({ published_at: null, updated_at: new Date().toISOString() })
    .eq("id", gameId);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to unpublish" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
