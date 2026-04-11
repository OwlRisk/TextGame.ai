-- Game stats: per-game-per-user completion record
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'custom',
  result TEXT,
  role TEXT,
  duration_seconds INT,
  message_count INT,
  player_count INT,
  summary TEXT,
  ended_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_stats_user ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game ON game_stats(game_id);

-- RLS
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game stats" ON game_stats;
CREATE POLICY "Users can view own game stats"
  ON game_stats FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert own game stats" ON game_stats;
CREATE POLICY "Users can insert own game stats"
  ON game_stats FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));
