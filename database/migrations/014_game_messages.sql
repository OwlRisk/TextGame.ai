-- Full message history for RPG games (append-only)
-- The game_room_state blob keeps last 60 messages for fast initial load;
-- this table stores the complete history for scroll-back and session resume.

CREATE TABLE IF NOT EXISTS game_messages (
  id TEXT NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  channel_id TEXT,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  reactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, id)
);

CREATE INDEX IF NOT EXISTS idx_game_messages_created
  ON game_messages(game_id, created_at DESC);

-- RLS: users can only access messages for games they own
ALTER TABLE game_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for own games" ON game_messages;
CREATE POLICY "Users can view messages for own games"
  ON game_messages FOR SELECT
  USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid()::text)
    OR game_id IN (SELECT id FROM games WHERE user_id = current_setting('app.user_id', true))
  );

DROP POLICY IF EXISTS "Users can insert messages for own games" ON game_messages;
CREATE POLICY "Users can insert messages for own games"
  ON game_messages FOR INSERT
  WITH CHECK (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid()::text)
    OR game_id IN (SELECT id FROM games WHERE user_id = current_setting('app.user_id', true))
  );

DROP POLICY IF EXISTS "Users can delete messages for own games" ON game_messages;
CREATE POLICY "Users can delete messages for own games"
  ON game_messages FOR DELETE
  USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid()::text)
    OR game_id IN (SELECT id FROM games WHERE user_id = current_setting('app.user_id', true))
  );
