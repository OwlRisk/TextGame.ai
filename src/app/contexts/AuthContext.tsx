"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (returnUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session and sync user from server (avatar is persisted in callback via admin API)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session);
      setSession(session);
      let userToSet = session?.user ?? null;
      // Always refetch user from server when we have a session but no avatar, so we pick up
      // the avatar saved in /auth/callback (client does not receive the new session from server).
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
          userToSet = freshUser;
        }
      }
      setUser(userToSet);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session);
      let userToSet = session?.user ?? null;
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
          userToSet = freshUser;
        }
      }
      setSession(session);
      setUser(userToSet);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (returnUrl?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          ...(returnUrl && { state: returnUrl }),
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      
      console.log("Sign out successful, clearing state");
      // Clear user state immediately
      setUser(null);
      setSession(null);
      
      // Redirect and refresh
      router.push('/');
      
      // Force a hard refresh after a short delay to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
