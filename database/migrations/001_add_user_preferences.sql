-- Migration 001: Add preferences column to user_profiles
-- Run this on any existing production database that was created before this migration.
-- schema.sql already contains this change (ALTER TABLE ... ADD COLUMN IF NOT EXISTS),
-- so re-running schema.sql is also safe. This file exists for explicit tracking.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_profiles.preferences IS
  'User-configurable preferences (ai_model, tts_model, image_gen_enabled, etc.)';
