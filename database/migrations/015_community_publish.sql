-- Community publishing: lets a game owner mark a game as discoverable in the
-- public Discover feed and tracks how often it's been cloned by others.
--
-- A game is "in the community" iff `published_at` is not null. A `share_token`
-- is also required (for the /play/[token] preview surface) and is auto-issued
-- by the publish endpoint when missing.
--
-- `play_count` is incremented every time the clone endpoint copies the game
-- into a new account, providing a simple "trending" signal for sorting.

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS play_count   INTEGER NOT NULL DEFAULT 0;

-- Sort the community feed efficiently by recency-of-publish or popularity.
CREATE INDEX IF NOT EXISTS idx_games_published_at_desc
  ON games (published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_published_play_count_desc
  ON games (play_count DESC)
  WHERE published_at IS NOT NULL;

-- Public-read RLS policy so unauthenticated visitors of /discover (and the
-- shared-game preview) can read just the columns the community endpoint
-- returns. The endpoint itself uses supabaseAdmin and selects an explicit
-- column list, but having this policy lets anon-key Realtime / future
-- read-only clients use the same path safely.
DROP POLICY IF EXISTS "Public can view published games" ON games;
CREATE POLICY "Public can view published games"
  ON games FOR SELECT
  USING (published_at IS NOT NULL);
