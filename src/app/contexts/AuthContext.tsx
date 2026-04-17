"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setAuthCookie } from '@/lib/auth-cookie';

/** Auth state never expires; kept alive by Supabase refresh tokens */

/** Extract avatar URL from user metadata, handling Facebook's nested { data: { url } } format. */
export function getUserAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined;
  const meta = user.user_metadata;
  if (!meta) return undefined;
  if (typeof meta.avatar_url === "string" && meta.avatar_url) return meta.avatar_url;
  if (typeof meta.picture === "string" && meta.picture) return meta.picture;
  if (meta.picture && typeof meta.picture === "object") {
    const picData = (meta.picture as Record<string, unknown>).data as Record<string, unknown> | undefined;
    if (picData && typeof picData.url === "string") return picData.url;
  }
  return undefined;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (returnUrl?: string) => Promise<void>;
  signInWithFacebook: (returnUrl?: string) => Promise<void>;
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
  // When true, onAuthStateChange must NOT update React state because we are
  // about to do a full page reload. Updating state triggers re-renders with
  // user=null which crashes downstream components before the reload fires.
  const signingOutRef = React.useRef(false);

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
    if (!user) return;
    fetch("/api/user/settings", { headers: { "Content-Type": "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((prefs) => {
        if (prefs?.content_language) {
          import("@/lib/i18n").then(({ setAppLanguage }) => {
            setAppLanguage(prefs.content_language);
          });
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const prevUserRef = { current: null as User | null };
    const applySession = (sessionToSet: Session | null, userToSet: User | null) => {
      if (!prevUserRef.current && userToSet) {
        const isNewUser = userToSet.created_at
          && (Date.now() - new Date(userToSet.created_at).getTime()) < 60_000;
        const provider = userToSet.app_metadata?.provider || "unknown";
        import("@/lib/analytics").then(({ trackEvent }) => {
          trackEvent(isNewUser ? "sign_up" : "login", { method: provider });
        });
      }
      prevUserRef.current = userToSet;
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
        if (userToSet && !getUserAvatarUrl(userToSet)) {
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
            if (refreshed?.user && getUserAvatarUrl(refreshed.user)) {
              userToSet = refreshed.user;
              sessionToSet = refreshed;
            } else {
              const { data: { user: freshUser } } = await supabase.auth.getUser();
              if (freshUser && getUserAvatarUrl(freshUser)) {
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
                if (freshUser && getUserAvatarUrl(freshUser)) {
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
      if (signingOutRef.current) return;
      let sessionToSet = session;
      let userToSet = session?.user ?? null;
      if (userToSet && !getUserAvatarUrl(userToSet)) {
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
          if (refreshed?.user && getUserAvatarUrl(refreshed.user)) {
            userToSet = refreshed.user;
            sessionToSet = refreshed;
          } else {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser && getUserAvatarUrl(freshUser)) {
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
              if (freshUser && getUserAvatarUrl(freshUser)) {
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

  const signInWithFacebook = async (returnUrl?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(returnUrl && { state: returnUrl }),
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      throw error;
    }
  };

  const signOut = async () => {
    signingOutRef.current = true;
    setAuthCookie(null);
    // Do NOT clear React state (setUser/setSession) here — doing so
    // triggers ProtectedRoute's redirect to /signin before the hard
    // navigation below has a chance to fire, causing a visible
    // /signin → / flash.  The full page reload makes React state moot.
    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort: session may already be gone server-side
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* storage access may fail */ }
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithFacebook, signOut }}>
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
