-- Add avatar_styles JSONB to store per-style URLs (semi-realistic, anime, painted, pixel)
ALTER TABLE ai_characters ADD COLUMN IF NOT EXISTS avatar_styles JSONB DEFAULT '{}';

-- Index for pool queries
CREATE INDEX IF NOT EXISTS idx_ai_characters_styles ON ai_characters USING gin(avatar_styles)
  WHERE is_system = true;
