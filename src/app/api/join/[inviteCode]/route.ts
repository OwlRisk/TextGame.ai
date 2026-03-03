import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/join/[inviteCode]
 * Public: look up game info by invite code (no auth required).
 * Returns game name and icon so the join page can display them before the user submits.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;
  if (!inviteCode) return NextResponse.json({ error: "inviteCode required" }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data: game, error } = await supabaseAdmin
    .from("games")
    .select("id, name, icon")
    .eq("invite_code", inviteCode)
    .single();

  if (error || !game) return NextResponse.json({ error: "Invite link not found" }, { status: 404 });

  return NextResponse.json({
    gameId: game.id,
    gameName: game.name,
    gameIcon: game.icon,
  });
}
