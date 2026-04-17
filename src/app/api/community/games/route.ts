import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Public list of community-published games for the Discover page.
 *
 * Query params:
 *   - sort  : "trending" (default, by play_count desc) | "new" (published_at desc)
 *   - limit : 1..50, default 20
 */
export async function GET(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const sort = (request.nextUrl.searchParams.get("sort") || "trending").toLowerCase();
  const limitRaw = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
  const limit = Math.min(50, Math.max(1, isNaN(limitRaw) ? 20 : limitRaw));

  const orderColumn = sort === "new" ? "published_at" : "play_count";

  // Select only fields safe for public display. Notably we DO NOT expose
  // `user_id`, `share_token`, or the full `is_active` state — recipients use
  // the `share_token` indirectly through /play/[token] when opening.
  const { data, error } = await supabaseAdmin
    .from("games")
    .select(
      "id, name, icon, color, config, share_token, play_count, published_at"
    )
    .not("published_at", "is", null)
    .order(orderColumn, { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load community games" }, { status: 500 });
  }

  // Strip overly long config payloads from the list response — Discover only
  // needs name/icon/color + a short rules teaser. Full config is loaded on
  // clone (server-side) so we can keep this endpoint cheap.
  const games = (data ?? []).map((row) => {
    const cfg = (row.config ?? {}) as Record<string, unknown>;
    const rules = typeof cfg.rules === "string" ? cfg.rules.slice(0, 280) : "";
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      shareToken: row.share_token,
      playCount: row.play_count ?? 0,
      publishedAt: row.published_at,
      rulesTeaser: rules,
      template: typeof cfg.template === "string" ? cfg.template : "custom",
      rpgWorldId: typeof cfg.rpgWorldId === "string" ? cfg.rpgWorldId : null,
    };
  });

  return NextResponse.json({ games, sort, limit });
}
