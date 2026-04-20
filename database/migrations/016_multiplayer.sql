-- Multiplayer support migration
-- Run this in the Supabase Dashboard → SQL Editor

-- 1. Add invite_code column to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS invite_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS games_invite_code_idx ON games(invite_code) WHERE invite_code IS NOT NULL;

-- 2. Create game_members table
CREATE TABLE IF NOT EXISTS game_members (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id      UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id     TEXT,                              -- random UUID for anonymous players
  nickname     TEXT NOT NULL,
  player_id    TEXT,                              -- maps to Player.id inside the game room
  is_owner     BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT game_members_user_unique  UNIQUE (game_id, user_id),
  CONSTRAINT game_members_guest_unique UNIQUE (game_id, guest_id),
  CONSTRAINT game_members_identity_required CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- 3. Enable Realtime on game_room_state
-- (Also run: Dashboard → Database → Replication → enable game_room_state)
ALTER TABLE game_room_state REPLICA IDENTITY FULL;

-- 4. RLS on game_members
ALTER TABLE game_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read members of a game they're in
CREATE POLICY "Members can view game members"
  ON game_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR game_id IN (
      SELECT gm.game_id FROM game_members gm WHERE gm.user_id = auth.uid()
    )
  );

-- Authenticated users can insert themselves
CREATE POLICY "Users can join games"
  ON game_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. Allow anon/members to READ game_room_state (needed for Realtime postgres_changes)
-- The existing write policy stays (only owner can write via upsert)
DROP POLICY IF EXISTS "Allow read for realtime" ON game_room_state;
CREATE POLICY "Allow read for realtime"
  ON game_room_state FOR SELECT
  USING (true);
