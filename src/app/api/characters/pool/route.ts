import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

import { VALID_STYLES, isValidStyle, DEFAULT_STYLE, type AvatarStyle } from "@/lib/avatar-style-constants";

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
  const rawCount = parseInt(searchParams.get("count") ?? "6", 10);
  const count = Math.min(Math.max(Number.isNaN(rawCount) ? 6 : rawCount, 1), 200);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excludeNames = excludeParam
    ? excludeParam.split(",").map((n) => n.trim()).filter(Boolean)
    : [];
  const rawStyle = searchParams.get("style") ?? "semi-realistic";
  const style: AvatarStyle = isValidStyle(rawStyle) ? rawStyle : DEFAULT_STYLE;

  // Fetch all system characters (no hard limit — we have ~130 and want full coverage).
  const { data, error } = await supabaseAdmin
    .from("ai_characters")
    .select("id, name, gender, personality, background, avatar_url, avatar_styles, voice_id, voice_sample_url")
    .eq("is_system", true)
    .not("voice_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[pool] query error:", error);
    return NextResponse.json({ error: "Failed to load character pool" }, { status: 500 });
  }

  const allChars = (data ?? []).filter((c) => !excludeNames.includes(c.name));

  // Separate characters into those that have the requested style vs fallbacks.
  // Prioritise exact-style matches so we don't return a mix of styles when
  // the pool contains characters without all variants generated.
  const withStyle: typeof allChars = [];
  const withFallback: typeof allChars = [];
  for (const c of allChars) {
    const styles = (c.avatar_styles ?? {}) as Record<string, string>;
    if (styles[style]) {
      withStyle.push(c);
    } else if (styles["semi-realistic"] || c.avatar_url) {
      withFallback.push(c);
    }
  }

  const sortMode = searchParams.get("sort") ?? "random";

  if (sortMode === "random") {
    const shuffle = <T>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    shuffle(withStyle);
    shuffle(withFallback);
  }

  // Fill `count` from exact-style matches first, pad with fallbacks only if needed
  const prioritised = [...withStyle, ...withFallback].slice(0, count);

  if (sortMode === "name") {
    prioritised.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Resolve avatar_url for each selected character
  const resolved = prioritised.map((c) => {
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
      voice_sample_url: c.voice_sample_url ?? null,
    };
  }).filter((c) => !!c.avatar_url);

  const selected = resolved.slice(0, count);

  return NextResponse.json({ characters: selected, style });
}
