import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { pool } from '@/lib/pg-pool';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';

const DB_NOT_CONFIGURED = { error: 'Database not configured.' };
const DB_UNAVAILABLE = { error: 'Database unavailable.' };

/** POST /api/game-stats — record a game completion */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json(DB_NOT_CONFIGURED, { status: 503 });
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { gameId, template, result, role, durationSeconds, messageCount, playerCount, summary } = body as {
    gameId?: string; template?: string; result?: string; role?: string;
    durationSeconds?: number; messageCount?: number; playerCount?: number; summary?: string;
  };

  if (!gameId || typeof gameId !== 'string') {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM game_stats WHERE game_id = $1 AND user_id = $2 LIMIT 1',
      [gameId, user.id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await pool.query(
      `INSERT INTO game_stats (game_id, user_id, template, result, role, duration_seconds, message_count, player_count, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [gameId, user.id, template || 'custom', result || null, role || null,
       durationSeconds ?? null, messageCount ?? null, playerCount ?? null, summary || null]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseError(error)) return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
    console.error('[game-stats] POST error:', error);
    return NextResponse.json({ error: 'Failed to save stats' }, { status: 500 });
  }
}

/** GET /api/game-stats — return aggregate stats for current user */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json(DB_NOT_CONFIGURED, { status: 503 });
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agg = await pool.query(
      `SELECT
         COUNT(*)::int AS total_games,
         COALESCE(SUM(duration_seconds), 0)::int AS total_seconds,
         COUNT(*) FILTER (WHERE result = 'win')::int AS wins,
         COUNT(*) FILTER (WHERE result = 'loss')::int AS losses,
         MODE() WITHIN GROUP (ORDER BY template) AS favorite_template
       FROM game_stats
       WHERE user_id = $1`,
      [user.id]
    );

    const byTemplate = await pool.query(
      `SELECT template, COUNT(*)::int AS count
       FROM game_stats WHERE user_id = $1
       GROUP BY template ORDER BY count DESC LIMIT 10`,
      [user.id]
    );

    const recent = await pool.query(
      `SELECT gs.game_id, gs.template, gs.result, gs.role, gs.duration_seconds,
              gs.message_count, gs.player_count, gs.summary, gs.ended_at,
              g.name AS game_name
       FROM game_stats gs
       LEFT JOIN games g ON g.id = gs.game_id
       WHERE gs.user_id = $1
       ORDER BY gs.ended_at DESC
       LIMIT 20`,
      [user.id]
    );

    const row = agg.rows[0] || {};
    return NextResponse.json({
      totalGames: row.total_games || 0,
      totalSeconds: row.total_seconds || 0,
      wins: row.wins || 0,
      losses: row.losses || 0,
      favoriteTemplate: row.favorite_template || null,
      byTemplate: byTemplate.rows,
      recent: recent.rows,
    });
  } catch (error) {
    if (isDatabaseError(error)) return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
    console.error('[game-stats] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
