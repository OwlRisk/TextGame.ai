-- Add optional attachment URLs for feedback (e.g. screenshots)
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN feedback.attachment_urls IS 'Public URLs of uploaded images (e.g. from Supabase Storage), each up to 10MB.';
