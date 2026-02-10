import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

/** Generate or return share link for a game. Requires auth; game must belong to user. */
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
    const { error: updateErr } = await supabaseAdmin
      .from("games")
      .update({ share_token: shareToken, updated_at: new Date().toISOString() })
      .eq("id", gameId);
    if (updateErr) return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const shareUrl = `${base}/play/${shareToken}`;

  return NextResponse.json({ shareToken, shareUrl });
}
