import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Public: get game by id only if it has a share_token (shared). No auth. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });

  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data: game, error } = await supabaseAdmin
    .from("games")
    .select("id, name, icon, color, config")
    .eq("id", gameId)
    .not("share_token", "is", null)
    .single();

  if (error || !game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(game);
}
