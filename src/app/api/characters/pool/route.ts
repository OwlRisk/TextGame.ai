import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_STYLES = ["semi-realistic", "anime", "painted", "pixel"] as const;
type AvatarStyle = (typeof VALID_STYLES)[number];

/**
 * GET /api/characters/pool?count=5&exclude=Name1,Name2&style=semi-realistic
 *
 * Returns `count` random system characters with a voice_id and avatar_url
 * resolved for the requested style pack. Falls back to `semi-realistic` if
 * the requested style image hasn't been generated yet for a given character.
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
  const rawStyle = searchParams.get("style") ?? "semi-realistic";
  const style: AvatarStyle = VALID_STYLES.includes(rawStyle as AvatarStyle)
    ? (rawStyle as AvatarStyle)
    : "semi-realistic";

  // Fetch a larger batch so we can shuffle and pick `count` without bias.
  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .select("id, name, gender, personality, background, avatar_url, avatar_styles, voice_id")
    .eq("is_system", true)
    .not("voice_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[pool] query error:", error);
    return NextResponse.json({ error: "Failed to load character pool" }, { status: 500 });
  }

  // Resolve avatar_url for the requested style; fall back to avatar_url (semi-realistic default)
  const resolved = (data ?? [])
    .filter((c) => !excludeNames.includes(c.name))
    .map((c) => {
      const styles = (c.avatar_styles ?? {}) as Record<string, string>;
      const avatarUrl = styles[style] ?? styles["semi-realistic"] ?? c.avatar_url ?? null;
      return {
        id: c.id,
        name: c.name,
        gender: c.gender,
        personality: c.personality,
        background: c.background,
        avatar_url: avatarUrl,
        voice_id: c.voice_id,
      };
    })
    // Only include characters that have at least one avatar
    .filter((c) => !!c.avatar_url);

  // Fisher-Yates shuffle
  for (let i = resolved.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resolved[i], resolved[j]] = [resolved[j], resolved[i]];
  }

  const selected = resolved.slice(0, count);

  return NextResponse.json({ characters: selected, style });
}
