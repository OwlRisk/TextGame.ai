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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at DESC);

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

-- Enable Row Level Security (RLS)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

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
