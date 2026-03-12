import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });

  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const { data: game, error } = await db
    .from("games")
    .select("*")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single();

  if (error || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  return NextResponse.json(game);
}
