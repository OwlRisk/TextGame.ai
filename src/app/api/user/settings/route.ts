import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { pool } from '@/lib/pg-pool';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const DB_NOT_CONFIGURED = { error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' };
const DB_UNAVAILABLE = { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' };

/** GET /api/user/settings — return stored user preferences */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(DB_NOT_CONFIGURED, { status: 503 });
  }
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      'SELECT preferences FROM user_profiles WHERE user_id = $1',
      [user.id]
    );
    const preferences = result.rows[0]?.preferences ?? {};
    return NextResponse.json(preferences);
  } catch (error) {
    if (isDatabaseError(error)) return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/** PUT /api/user/settings — merge-update user preferences */
export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(DB_NOT_CONFIGURED, { status: 503 });
  }
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_RE.test(user.id)) return NextResponse.json({ error: 'Invalid user' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Allowlist the keys that can be stored
  const allowed = ['ai_model', 'image_gen_enabled', 'avatar_style_pack', 'tts_model', 'tts_enabled', 'tts_temperature', 'tts_speed', 'content_language'];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  try {
    await pool.query(
      `INSERT INTO user_profiles (user_id, preferences)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = COALESCE(user_profiles.preferences, '{}'::jsonb) || $2::jsonb`,
      [user.id, JSON.stringify(patch)]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseError(error)) return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
    console.error('[settings] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
