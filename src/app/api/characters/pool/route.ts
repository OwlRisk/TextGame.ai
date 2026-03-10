import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/characters/pool?count=5&exclude=Name1,Name2
 *
 * Returns `count` random system characters (is_system=true) that have both
 * an avatar_url and a voice_id pre-assigned, ready to drop into a game room.
 *
 * This endpoint is public (no auth required) so it can be called during game
 * setup without needing the user's session token.
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const count = Math.min(Math.max(parseInt(searchParams.get("count") ?? "6", 10), 1), 20);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excludeNames = excludeParam
    ? excludeParam.split(",").map((n) => n.trim()).filter(Boolean)
    : [];

  // Fetch a larger batch so we can shuffle and pick `count` without bias.
  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .select("id, name, gender, personality, background, avatar_url, voice_id")
    .eq("is_system", true)
    .not("avatar_url", "is", null)
    .not("voice_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[pool] query error:", error);
    return NextResponse.json({ error: "Failed to load character pool" }, { status: 500 });
  }

  const available = (data ?? []).filter(
    (c) => !excludeNames.includes(c.name)
  );

  // Fisher-Yates shuffle for random selection
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const selected = available.slice(0, count);

  return NextResponse.json({ characters: selected });
}
