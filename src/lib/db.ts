import { supabase } from './supabase';
import type { Database } from './supabase';

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
    console.error('Error fetching game sessions:', error);
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
    console.error('Error fetching game session:', error);
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
    console.error('Error creating game session:', error);
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
    console.error('Error updating game session:', error);
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
    console.error('Error deleting game session:', error);
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
    console.error('Error fetching games:', error);
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
    console.error('Error fetching game:', error);
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
    console.error('Error creating game:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateGame(gameId: string, updates: GameUpdate) {
  const { data, error } = await supabase
    .from('games')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    console.error('Error updating game:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function deleteGame(gameId: string, userId: string) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting game:', error);
    return { error };
  }

  return { error: null };
}
