import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("ai_characters")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[characters] delete error:", error);
    return NextResponse.json({ error: "Failed to delete character" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
