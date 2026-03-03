-- Migration 003: atomic message append RPC
-- Fixes the read-modify-write race condition in /api/games/[gameId]/message
-- where two concurrent guest messages could overwrite each other.
-- This function uses FOR UPDATE to lock the row before modifying it.

CREATE OR REPLACE FUNCTION append_game_message(
  p_game_id    TEXT,
  p_message    JSONB,
  p_owner_uid  TEXT,
  p_max_msgs   INTEGER DEFAULT 60
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state       JSONB;
  v_messages    JSONB;
  v_trimmed     JSONB;
  v_new_state   JSONB;
BEGIN
  -- Lock existing row (or prepare for INSERT)
  SELECT state INTO v_state
  FROM game_room_state
  WHERE game_id = p_game_id
  FOR UPDATE;

  v_messages := COALESCE(v_state -> 'messages', '[]'::JSONB);

  -- Trim to last (p_max_msgs - 1) entries so there is room for the new message
  SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB) INTO v_trimmed
  FROM (
    SELECT elem
    FROM jsonb_array_elements(v_messages) AS elem
    LIMIT p_max_msgs - 1
    OFFSET GREATEST(0, jsonb_array_length(v_messages) - (p_max_msgs - 1))
  ) sub;

  -- Append new message
  v_trimmed := v_trimmed || jsonb_build_array(p_message);

  -- Build new state: preserve all existing fields, only overwrite messages + metadata
  v_new_state := COALESCE(v_state, '{}'::JSONB)
    || jsonb_build_object(
        'messages', v_trimmed,
        'savedAt',  to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'clientId', 'guest_write'
       );

  -- Upsert (INSERT if no row yet, UPDATE otherwise)
  INSERT INTO game_room_state (game_id, user_id, state, updated_at)
  VALUES (p_game_id, p_owner_uid, v_new_state, now())
  ON CONFLICT (game_id) DO UPDATE
    SET state      = EXCLUDED.state,
        updated_at = now();

  RETURN p_message;
END;
$$;

-- Grant execution to the service_role (used by supabaseAdmin)
GRANT EXECUTE ON FUNCTION append_game_message(TEXT, JSONB, TEXT, INTEGER) TO service_role;
