-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  game_name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 6,
  custom_rules TEXT,
  conversation_state TEXT NOT NULL DEFAULT 'greeting',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game room state: in-game chat messages + players + phase (one row per game)
CREATE TABLE IF NOT EXISTS game_room_state (
  game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game drafts: saved configs not yet created as games
CREATE TABLE IF NOT EXISTS game_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share: optional token on games for public/share links
ALTER TABLE games ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- App cache (e.g. Inworld voices list), refreshed periodically
CREATE TABLE IF NOT EXISTS app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_cache_updated_at ON app_cache(updated_at);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_room_state_user_id ON game_room_state(user_id);
CREATE INDEX IF NOT EXISTS idx_game_drafts_user_id ON game_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_drafts_updated_at ON game_drafts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_share_token ON games(share_token) WHERE share_token IS NOT NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop first so schema is re-runnable)
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_room_state_updated_at ON game_room_state;
CREATE TRIGGER update_game_room_state_updated_at BEFORE UPDATE ON game_room_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_drafts_updated_at ON game_drafts;
CREATE TRIGGER update_game_drafts_updated_at BEFORE UPDATE ON game_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_room_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Drop first so schema is re-runnable
-- Game Sessions policies
DROP POLICY IF EXISTS "Users can view their own game sessions" ON game_sessions;
CREATE POLICY "Users can view their own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert their own game sessions" ON game_sessions;
CREATE POLICY "Users can insert their own game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update their own game sessions" ON game_sessions;
CREATE POLICY "Users can update their own game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can delete their own game sessions" ON game_sessions;
CREATE POLICY "Users can delete their own game sessions"
  ON game_sessions FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Games policies
DROP POLICY IF EXISTS "Users can view their own games" ON games;
CREATE POLICY "Users can view their own games"
  ON games FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert their own games" ON games;
CREATE POLICY "Users can insert their own games"
  ON games FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update their own games" ON games;
CREATE POLICY "Users can update their own games"
  ON games FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can delete their own games" ON games;
CREATE POLICY "Users can delete their own games"
  ON games FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Game drafts: only own drafts
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

-- User preferences: stored as JSONB in user_profiles (add column if not exists)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Game room state: only for games owned by the user (user_id on row must match auth)
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
