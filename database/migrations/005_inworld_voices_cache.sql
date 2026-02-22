-- Inworld voices cache: avoid calling Inworld API on every game creation.
-- Refresh periodically (e.g. daily) or when ?refresh=1.
CREATE TABLE IF NOT EXISTS app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_cache_updated_at ON app_cache(updated_at);

COMMENT ON TABLE app_cache IS 'Server-side key-value cache (e.g. inworld_voices). Not user-specific.';
