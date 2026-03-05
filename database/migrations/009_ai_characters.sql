-- AI character collection: user-owned + system-generated (from game sessions).
-- Characters can be reused across games, managed from a "My Characters" library,
-- and system characters form the foundation of a future community/character square.
CREATE TABLE IF NOT EXISTS ai_characters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,                              -- 'system' for auto-generated characters
  name           TEXT NOT NULL,
  gender         TEXT DEFAULT 'other',
  personality    TEXT,
  background     TEXT,
  avatar_url     TEXT,                                       -- Supabase Storage public URL
  avatar_color   TEXT DEFAULT '#8b5cf6',
  is_system      BOOLEAN DEFAULT false,                      -- true = generated during gameplay, globally visible
  source_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_characters_user ON ai_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_characters_system ON ai_characters(is_system) WHERE is_system = true;

ALTER TABLE ai_characters ENABLE ROW LEVEL SECURITY;

-- Users can read their own characters
CREATE POLICY ai_characters_select_own ON ai_characters
  FOR SELECT USING (auth.uid()::text = user_id);

-- Everyone can read system-generated characters (future community feature)
CREATE POLICY ai_characters_select_system ON ai_characters
  FOR SELECT USING (is_system = true);

-- Users can insert their own characters
CREATE POLICY ai_characters_insert ON ai_characters
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own characters
CREATE POLICY ai_characters_delete ON ai_characters
  FOR DELETE USING (auth.uid()::text = user_id);

-- Service role can insert system characters (bypasses RLS via supabaseAdmin)
