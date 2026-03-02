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

/**
 * Read the Supabase session from localStorage synchronously so the first
 * render already knows whether the user is signed in. This eliminates the
 * "login page flash" that occurs while the async getSession() call is in-flight.
 */
function getLocalCachedSession(): { user: User | null; session: Session | null } {
  if (typeof window === 'undefined') return { user: null, session: null };
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!key) return { user: null, session: null };
    const raw = localStorage.getItem(key);
    if (!raw) return { user: null, session: null };
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.user) return { user: null, session: null };
    // expires_at is Unix seconds; treat as expired if within 60s to avoid edge cases
    if (parsed.expires_at && parsed.expires_at < Date.now() / 1000 + 60) {
      return { user: null, session: null };
    }
    return { user: parsed.user as User, session: parsed as Session };
  } catch {
    return { user: null, session: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start with server-compatible initial values to avoid React hydration
  // mismatch (#418). localStorage is only accessible on the client, so reading it
  // during the initial render would produce different values on server vs client.
  // We apply the cached session in a useEffect (runs only on client, after hydration).
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
    window.location.replace('/');
  }, []);

  const isInvalidRefreshToken = useCallback((err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const name = 'name' in err ? String((err as { name?: string }).name) : '';
    const msg = 'message' in err ? String((err as { message?: string }).message) : '';
    if (name === 'AuthApiError' && /refresh token|Refresh Token|refresh_token/i.test(msg)) return true;
    return /refresh token|Refresh Token|refresh_token/i.test(msg) && /not found|invalid|expired/i.test(msg);
  }, []);

  const isSessionMissingError = useCallback((err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const name = 'name' in err ? String((err as { name: string }).name) : '';
    const msg = 'message' in err ? String((err as { message: string }).message) : '';
    return name === 'AuthSessionMissingError' || /auth session missing/i.test(msg);
  }, []);

  const clearSessionAndCookie = useCallback(() => {
    setAuthCookie(null);
    setUser(null);
    setSession(null);
  }, []);

  useEffect(() => {
    // Apply the localStorage cache immediately on mount (client-only) so the UI
    // doesn't show a loading spinner for users who already have a valid session.
    // This runs after hydration so it never causes a server/client HTML mismatch.
    const cached = getLocalCachedSession();
    if (cached.user) {
      setUser(cached.user);
      setSession(cached.session);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const applySession = (sessionToSet: Session | null, userToSet: User | null) => {
      setAuthCookie(sessionToSet?.access_token ?? null);
      setSession(sessionToSet);
      setUser(userToSet);
      setLoading(false);
    };

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (isSessionMissingError(error)) {
          clearSessionAndCookie();
          setLoading(false);
          return;
        }
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
            if (isSessionMissingError(e) || isInvalidRefreshToken(e)) {
              try {
                await supabase.auth.signOut();
              } catch {
                // ignore
              }
              sessionToSet = null;
              userToSet = null;
            } else {
              try {
                const { data: { user: freshUser } } = await supabase.auth.getUser();
                if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
                  userToSet = freshUser;
                }
              } catch {
                // ignore
              }
            }
          }
        }
        applySession(sessionToSet, userToSet);
      })
      .catch((e) => {
        if (isSessionMissingError(e) || isInvalidRefreshToken(e)) {
          clearSessionAndCookie();
          try {
            supabase.auth.signOut();
          } catch {
            // ignore
          }
        }
        setLoading(false);
      });

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
          if (isSessionMissingError(e) || isInvalidRefreshToken(e)) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            sessionToSet = null;
            userToSet = null;
          } else {
            try {
              const { data: { user: freshUser } } = await supabase.auth.getUser();
              if (freshUser && (freshUser.user_metadata?.avatar_url || freshUser.user_metadata?.picture)) {
                userToSet = freshUser;
              }
            } catch {
              // ignore
            }
          }
        }
      }
      applySession(sessionToSet, userToSet);
    });

    return () => subscription.unsubscribe();
  }, [isInvalidRefreshToken, isSessionMissingError, clearSessionAndCookie]);

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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      setUser(null);
      setSession(null);
      // Hard redirect after Supabase has cleared the localStorage token,
      // so the root page always starts fresh with no stale auth state.
      window.location.replace('/');
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
