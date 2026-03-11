import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const STYLES = ["semi-realistic", "anime", "painted", "pixel", "cyberpunk"] as const;

/**
 * GET /api/characters/style-preview
 *
 * Returns one system character that has avatars for all (or most) style packs.
 * Used by the Settings page to show real character previews per style.
 */
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .select("id, name, gender, avatar_url, avatar_styles")
    .eq("is_system", true)
    .not("avatar_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    return NextResponse.json({ error: "No characters found" }, { status: 404 });
  }

  // Pick the character with the most style variants available
  let best: (typeof data)[number] | null = null;
  let bestCount = 0;

  for (const c of data) {
    const styles = (c.avatar_styles ?? {}) as Record<string, string>;
    const count = STYLES.filter((s) => !!styles[s]).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
      if (count === STYLES.length) break;
    }
  }

  if (!best) {
    return NextResponse.json({ error: "No styled characters found" }, { status: 404 });
  }

  const styles = (best.avatar_styles ?? {}) as Record<string, string>;
  const previews: Record<string, string | null> = {};
  for (const s of STYLES) {
    previews[s] = styles[s] ?? (s === "semi-realistic" ? best.avatar_url : null);
  }

  return NextResponse.json({
    characterName: best.name,
    gender: best.gender,
    previews,
  });
}
