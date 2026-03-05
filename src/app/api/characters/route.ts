import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[characters] list error:", error);
    return NextResponse.json({ error: "Failed to load characters" }, { status: 500 });
  }

  return NextResponse.json({ characters: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const record = {
    user_id: user.id,
    name: body.name.trim(),
    gender: body.gender || "other",
    personality: body.personality?.trim() || null,
    background: body.background?.trim() || null,
    avatar_color: body.avatar_color || "#8b5cf6",
    source_game_id: body.source_game_id || null,
  };

  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("[characters] create error:", error);
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
  }

  return NextResponse.json({ character: data }, { status: 201 });
}
