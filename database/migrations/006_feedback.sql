-- Feedback table: stores user-submitted feedback from Help & Support page
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT,
  type        TEXT        DEFAULT 'general',
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_type_idx       ON feedback (type);

-- RLS: only service role can read; users can insert their own rows
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON feedback
  USING (true)
  WITH CHECK (true);
