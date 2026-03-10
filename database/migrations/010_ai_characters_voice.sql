-- Add voice_id to ai_characters so each pooled character has a stable voice assignment.
ALTER TABLE ai_characters ADD COLUMN IF NOT EXISTS voice_id TEXT;

-- Index for pool queries (system characters with avatar + voice)
CREATE INDEX IF NOT EXISTS idx_ai_characters_pool
  ON ai_characters(gender, is_system)
  WHERE is_system = true AND avatar_url IS NOT NULL AND voice_id IS NOT NULL;
