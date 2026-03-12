-- Worlds: groups of game rooms forming an open-world RPG experience.
-- Each world has a theme, shared party state, and multiple rooms (games).

CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚔️',
  color TEXT NOT NULL DEFAULT '#7c2d12',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  party_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worlds_user_id ON worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_worlds_updated_at ON worlds(updated_at DESC);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_worlds_updated_at ON worlds;
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own worlds" ON worlds;
CREATE POLICY "Users can view their own worlds"
  ON worlds FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert their own worlds" ON worlds;
CREATE POLICY "Users can insert their own worlds"
  ON worlds FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update their own worlds" ON worlds;
CREATE POLICY "Users can update their own worlds"
  ON worlds FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can delete their own worlds" ON worlds;
CREATE POLICY "Users can delete their own worlds"
  ON worlds FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Extend games table with world-related columns
ALTER TABLE games ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES worlds(id) ON DELETE CASCADE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS room_type TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS room_connections JSONB;
ALTER TABLE games ADD COLUMN IF NOT EXISTS room_description TEXT;

CREATE INDEX IF NOT EXISTS idx_games_world_id ON games(world_id) WHERE world_id IS NOT NULL;
