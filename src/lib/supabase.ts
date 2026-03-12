import { createClient } from '@supabase/supabase-js';

// Extract Supabase URL from DATABASE_URL if NEXT_PUBLIC_SUPABASE_URL is not set
function getSupabaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  
  // Try to extract from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('supabase.com')) {
    const match = dbUrl.match(/postgres\.([^.]+)\.supabase\.com/);
    if (match) {
      return `https://${match[1]}.supabase.co`;
    }
  }
  
  return '';
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase client
// Note: If supabaseUrl or supabaseAnonKey is empty, operations will fail
// Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key'); // Placeholder to prevent errors

// Server-side Supabase client (with service role key for admin operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          game_name: string;
          template_id: string;
          host_id: string;
          player_count: number;
          custom_rules: string | null;
          conversation_state: string;
          messages: any; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          game_name: string;
          template_id: string;
          host_id: string;
          player_count: number;
          custom_rules?: string | null;
          conversation_state: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          game_name?: string;
          template_id?: string;
          host_id?: string;
          player_count?: number;
          custom_rules?: string | null;
          conversation_state?: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          config: any; // JSON
          is_active: boolean;
          created_at: string;
          updated_at: string;
          share_token: string | null;
          world_id: string | null;
          room_type: string | null;
          room_connections: any | null;
          room_description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          config: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          share_token?: string | null;
          world_id?: string | null;
          room_type?: string | null;
          room_connections?: any | null;
          room_description?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          color?: string;
          config?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          share_token?: string | null;
          world_id?: string | null;
          room_type?: string | null;
          room_connections?: any | null;
          room_description?: string | null;
        };
      };
      game_drafts: {
        Row: {
          id: string;
          user_id: string;
          config: any; // JSON GameConfig
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_room_state: {
        Row: {
          game_id: string;
          user_id: string;
          state: any; // JSON: messages, players, gamePhase, etc.
          updated_at: string;
        };
        Insert: {
          game_id: string;
          user_id: string;
          state?: any;
          updated_at?: string;
        };
        Update: {
          game_id?: string;
          user_id?: string;
          state?: any;
          updated_at?: string;
        };
      };
      worlds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          theme: string;
          icon: string;
          color: string;
          config: any;
          party_state: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          theme: string;
          icon?: string;
          color?: string;
          config?: any;
          party_state?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          theme?: string;
          icon?: string;
          color?: string;
          config?: any;
          party_state?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_members: {
        Row: {
          id: string;
          game_id: string;
          user_id: string | null;
          guest_id: string | null;
          nickname: string;
          player_id: string | null;
          is_owner: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id?: string | null;
          guest_id?: string | null;
          nickname: string;
          player_id?: string | null;
          is_owner?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          nickname?: string;
          player_id?: string | null;
          is_owner?: boolean;
          joined_at?: string;
        };
      };
    };
  };
}
