-- Migration: game_drafts table + games.share_token for sharing
-- Run in Supabase Dashboard → SQL Editor. Requires: public.games exists.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Game drafts: user's saved configs (not yet created as games)
CREATE TABLE IF NOT EXISTS game_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_drafts_user_id ON game_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_drafts_updated_at ON game_drafts(updated_at DESC);

DROP TRIGGER IF EXISTS update_game_drafts_updated_at ON game_drafts;
CREATE TRIGGER update_game_drafts_updated_at
  BEFORE UPDATE ON game_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE game_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own drafts" ON game_drafts;
CREATE POLICY "Users can view own drafts"
  ON game_drafts FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert own drafts" ON game_drafts;
CREATE POLICY "Users can insert own drafts"
  ON game_drafts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update own drafts" ON game_drafts;
CREATE POLICY "Users can update own drafts"
  ON game_drafts FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can delete own drafts" ON game_drafts;
CREATE POLICY "Users can delete own drafts"
  ON game_drafts FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Share: optional token on games for public/share links
ALTER TABLE games ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_games_share_token ON games(share_token) WHERE share_token IS NOT NULL;
