"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/** 登录状态不过期，由 Supabase 的 refresh token 持续刷新 */

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

  const doSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    router.push('/');
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }, [router]);

  useEffect(() => {
    // Check active session and sync user from server (avatar is persisted in callback via admin API)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session);
      let sessionToSet = session;
      let userToSet = session?.user ?? null;
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        try {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed?.user && (refreshed.user.user_metadata?.avatar_url || refreshed.user.user_metadata?.picture)) {
            userToSet = refreshed.user;
            sessionToSet = refreshed;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        } catch (_) {
          const { data: { user: freshUser } } = await supabase.auth.getUser();
          if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
            userToSet = freshUser;
          }
        }
      }
      setSession(sessionToSet);
      setUser(userToSet);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      let sessionToSet = session;
      let userToSet = session?.user ?? null;
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        try {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed?.user && (refreshed.user.user_metadata?.avatar_url || refreshed.user.user_metadata?.picture)) {
            userToSet = refreshed.user;
            sessionToSet = refreshed;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        } catch (_) {
          const { data: { user: freshUser } } = await supabase.auth.getUser();
          if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
            userToSet = freshUser;
          }
        }
      }
      setSession(sessionToSet);
      setUser(userToSet);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [doSignOut]);

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
      setUser(null);
      setSession(null);
      router.push('/');
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
