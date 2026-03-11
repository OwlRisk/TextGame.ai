-- Add voice_sample_url to store pre-generated TTS greeting audio (Supabase Storage public URL).
ALTER TABLE ai_characters ADD COLUMN IF NOT EXISTS voice_sample_url TEXT;
