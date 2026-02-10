import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Public: get game by share token (for /play/[token] page). Returns basic game info only. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data: game, error } = await supabaseAdmin
    .from("games")
    .select("id, name, icon, color, config")
    .eq("share_token", token)
    .single();

  if (error || !game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: game.id,
    name: game.name,
    icon: game.icon,
    color: game.color,
    config: game.config,
  });
}
