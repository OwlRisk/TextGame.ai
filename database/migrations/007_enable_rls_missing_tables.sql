-- Fix all Supabase Security Advisor warnings and info items
-- Run in Supabase Dashboard → SQL Editor or via psql/node

-- ============================================================
-- 1. Enable RLS + service_role policies on PascalCase tables
-- ============================================================

ALTER TABLE IF EXISTS "Room"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RulesContract"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Player"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Message"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Action"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Event"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Snapshot"        ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['Room','RulesContract','Player','Message','Action','Event','Snapshot']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl AND schemaname = 'public') THEN
      EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', tbl);
      EXECUTE format('CREATE POLICY "Service role full access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 2. app_cache — RLS + service_role policy
-- ============================================================

ALTER TABLE IF EXISTS app_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to app_cache" ON app_cache;
CREATE POLICY "Service role full access to app_cache"
  ON app_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. Fix Function Search Path Mutable warnings
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_sufficient_tokens(p_user_id text, p_required_tokens integer)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_subscription_status TEXT;
  v_tokens INTEGER;
BEGIN
  SELECT subscription_status, tokens INTO v_subscription_status, v_tokens
  FROM user_profiles
  WHERE user_id = p_user_id;
  IF v_subscription_status = 'pro' THEN
    RETURN TRUE;
  END IF;
  RETURN v_tokens >= p_required_tokens;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_game_message(p_game_id text, p_message jsonb, p_owner_uid text, p_max_msgs integer DEFAULT 60)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state       JSONB;
  v_messages    JSONB;
  v_trimmed     JSONB;
  v_new_state   JSONB;
BEGIN
  SELECT state INTO v_state
  FROM game_room_state
  WHERE game_id = p_game_id
  FOR UPDATE;

  v_messages := COALESCE(v_state -> 'messages', '[]'::JSONB);

  SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB) INTO v_trimmed
  FROM (
    SELECT elem
    FROM jsonb_array_elements(v_messages) AS elem
    LIMIT p_max_msgs - 1
    OFFSET GREATEST(0, jsonb_array_length(v_messages) - (p_max_msgs - 1))
  ) sub;

  v_trimmed := v_trimmed || jsonb_build_array(p_message);

  v_new_state := COALESCE(v_state, '{}'::JSONB)
    || jsonb_build_object(
        'messages', v_trimmed,
        'savedAt',  to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'clientId', 'guest_write'
       );

  INSERT INTO game_room_state (game_id, user_id, state, updated_at)
  VALUES (p_game_id, p_owner_uid, v_new_state, now())
  ON CONFLICT (game_id) DO UPDATE
    SET state      = EXCLUDED.state,
        updated_at = now();

  RETURN p_message;
END;
$$;

-- ============================================================
-- 4. Fix feedback RLS Policy Always True
-- ============================================================

DROP POLICY IF EXISTS "service role full access" ON feedback;

CREATE POLICY "Service role full access on feedback"
  ON feedback FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
