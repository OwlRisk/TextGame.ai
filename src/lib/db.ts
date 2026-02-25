import { supabase } from './supabase';
import type { Database } from './supabase';

/** Log Supabase/PostgREST error with message, code, details (avoids empty {} in console). */
function logDbError(context: string, err: unknown) {
  const e = err as { message?: string; code?: string; details?: string };
  const msg = e?.message ?? (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err));
  console.error(`[db] ${context}:`, msg);
  if (e?.code) console.error('[db] code:', e.code);
  if (e?.details) console.error('[db] details:', e.details);
  if (msg === 'Failed to fetch' || (typeof msg === 'string' && msg.includes('Failed to fetch'))) {
    console.error(
      '[db] Hint: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env, and that Supabase is reachable.'
    );
  }
}

type GameSession = Database['public']['Tables']['game_sessions']['Row'];
type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];
type GameSessionUpdate = Database['public']['Tables']['game_sessions']['Update'];

type Game = Database['public']['Tables']['games']['Row'];
type GameInsert = Database['public']['Tables']['games']['Insert'];
type GameUpdate = Database['public']['Tables']['games']['Update'];

// Game Sessions
export async function getGameSessions(userId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logDbError('getGameSessions', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getGameSession(sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    logDbError('getGameSession', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function createGameSession(session: GameSessionInsert) {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    logDbError('createGameSession', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateGameSession(sessionId: string, updates: GameSessionUpdate) {
  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    logDbError('updateGameSession', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function deleteGameSession(sessionId: string, userId: string) {
  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    logDbError('deleteGameSession', error);
    return { error };
  }

  return { error: null };
}

// Games
export async function getGames(userId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logDbError('getGames', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getGame(gameId: string, userId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .eq('user_id', userId)
    .single();

  if (error) {
    logDbError('getGame', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function createGame(game: GameInsert) {
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single();

  if (error) {
    logDbError('createGame', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateGame(gameId: string, updates: GameUpdate) {
  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    logDbError('updateGame', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/** Only bumps updated_at — used when the player sends a message so the game rises in sidebar order. */
export async function touchGame(gameId: string) {
  const { error } = await supabase
    .from('games')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', gameId);

  if (error) logDbError('touchGame', error);
  return { error: error ?? null };
}

export async function deleteGame(gameId: string, userId: string) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)
    .eq('user_id', userId);

  if (error) {
    logDbError('deleteGame', error);
    return { error };
  }

  return { error: null };
}

// Game room state (chat messages + players + phase, etc.) — one row per game per user
type GameRoomStateInsert = Database['public']['Tables']['game_room_state']['Insert'];

export async function getGameRoomState(gameId: string) {
  const { data, error } = await supabase
    .from('game_room_state')
    .select('state')
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    logDbError('getGameRoomState', error);
    return { data: null, error };
  }
  return { data: data?.state ?? null, error: null };
}

export async function saveGameRoomState(
  gameId: string,
  userId: string,
  state: GameRoomStateInsert['state']
) {
  const { error } = await supabase.from('game_room_state').upsert(
    {
      game_id: gameId,
      user_id: userId,
      state: state ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'game_id' }
  );

  if (error) {
    logDbError('saveGameRoomState', error);
    return { error };
  }
  return { error: null };
}

// Game drafts (saved configs not yet created as games)
type GameDraftInsert = Database['public']['Tables']['game_drafts']['Insert'];
type GameDraftUpdate = Database['public']['Tables']['game_drafts']['Update'];

export async function getDrafts(userId: string) {
  const { data, error } = await supabase
    .from('game_drafts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logDbError('getDrafts', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function createDraft(userId: string, config: GameDraftInsert['config']) {
  const { data, error } = await supabase
    .from('game_drafts')
    .insert({ user_id: userId, config: config ?? {} })
    .select()
    .single();

  if (error) {
    logDbError('createDraft', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function updateDraft(draftId: string, userId: string, config: GameDraftUpdate['config']) {
  const { data, error } = await supabase
    .from('game_drafts')
    .update({ config: config ?? {}, updated_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logDbError('updateDraft', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function deleteDraft(draftId: string, userId: string) {
  const { error } = await supabase
    .from('game_drafts')
    .delete()
    .eq('id', draftId)
    .eq('user_id', userId);

  if (error) {
    logDbError('deleteDraft', error);
    return { error };
  }
  return { error: null };
}
