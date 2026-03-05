-- User-owned AI character collection.
-- Characters can be reused across games and managed from a "My Characters" library.
CREATE TABLE IF NOT EXISTS ai_characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  gender      TEXT DEFAULT 'other',
  personality TEXT,
  background  TEXT,
  avatar_color TEXT DEFAULT '#8b5cf6',
  source_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_characters_user ON ai_characters(user_id);

-- RLS: users can only read/write their own characters
ALTER TABLE ai_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_characters_select ON ai_characters
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY ai_characters_insert ON ai_characters
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY ai_characters_delete ON ai_characters
  FOR DELETE USING (auth.uid()::text = user_id);
