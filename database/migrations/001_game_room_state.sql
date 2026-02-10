-- Migration: Create game_room_state table
-- Run this in Supabase Dashboard → SQL Editor if the table is missing.
-- Requires: public.games table must exist (game_room_state.game_id references games.id).

-- Table: one row per game, stores in-game chat messages + players + phase
CREATE TABLE IF NOT EXISTS game_room_state (
  game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_room_state_user_id ON game_room_state(user_id);

-- Trigger function (idempotent; may already exist from other tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_game_room_state_updated_at ON game_room_state;
CREATE TRIGGER update_game_room_state_updated_at
  BEFORE UPDATE ON game_room_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE game_room_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game room state" ON game_room_state;
CREATE POLICY "Users can view own game room state"
  ON game_room_state FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert own game room state" ON game_room_state;
CREATE POLICY "Users can insert own game room state"
  ON game_room_state FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update own game room state" ON game_room_state;
CREATE POLICY "Users can update own game room state"
  ON game_room_state FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can delete own game room state" ON game_room_state;
CREATE POLICY "Users can delete own game room state"
  ON game_room_state FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));
