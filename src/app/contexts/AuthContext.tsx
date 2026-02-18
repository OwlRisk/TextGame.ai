"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setAuthCookie } from '@/lib/auth-cookie';
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
    setAuthCookie(null);
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

  const isInvalidRefreshToken = useCallback((err: unknown) => {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
    return /refresh token|Refresh Token|refresh_token/i.test(msg) && /not found|invalid|expired/i.test(msg);
  }, []);

  const clearSessionAndCookie = useCallback(() => {
    setAuthCookie(null);
    setUser(null);
    setSession(null);
  }, []);

  useEffect(() => {
    // Check active session and sync user from server (avatar is persisted in callback via admin API)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Refresh Token Not Found 等：服务端已失效，本地视为未登录
      if (error && isInvalidRefreshToken(error)) {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        clearSessionAndCookie();
        setLoading(false);
        return;
      }
      let sessionToSet = session;
      let userToSet = session?.user ?? null;
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        try {
          const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError && isInvalidRefreshToken(refreshError)) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            clearSessionAndCookie();
            setLoading(false);
            return;
          }
          if (refreshed?.user && (refreshed.user.user_metadata?.avatar_url || refreshed.user.user_metadata?.picture)) {
            userToSet = refreshed.user;
            sessionToSet = refreshed;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        } catch (e) {
          if (isInvalidRefreshToken(e)) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            sessionToSet = null;
            userToSet = null;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        }
      }
      setAuthCookie(sessionToSet?.access_token ?? null);
      setSession(sessionToSet);
      setUser(userToSet);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      let sessionToSet = session;
      let userToSet = session?.user ?? null;
      if (userToSet && (!userToSet.user_metadata?.avatar_url && !userToSet.user_metadata?.picture)) {
        try {
          const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError && isInvalidRefreshToken(refreshError)) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            clearSessionAndCookie();
            setLoading(false);
            return;
          }
          if (refreshed?.user && (refreshed.user.user_metadata?.avatar_url || refreshed.user.user_metadata?.picture)) {
            userToSet = refreshed.user;
            sessionToSet = refreshed;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        } catch (e) {
          if (isInvalidRefreshToken(e)) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            sessionToSet = null;
            userToSet = null;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
              userToSet = freshUser;
            }
          }
        }
      }
      setAuthCookie(sessionToSet?.access_token ?? null);
      setSession(sessionToSet);
      setUser(userToSet);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isInvalidRefreshToken, clearSessionAndCookie]);

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
    setAuthCookie(null);
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
