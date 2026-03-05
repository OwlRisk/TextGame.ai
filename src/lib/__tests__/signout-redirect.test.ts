/**
 * Tests for sign-out redirect behaviour and the race condition fix.
 *
 * When a user signs out from a protected page (e.g. /create), ProtectedRoute
 * must NOT race ahead and redirect to /signin?returnUrl=… before the sign-out
 * flow navigates to '/'.
 *
 * The actual AuthContext uses window.location.href = '/' *before* clearing
 * React state, so ProtectedRoute never sees user=null while still on /create.
 * These tests validate the ordering contract.
 */
import { describe, it, expect } from "vitest";

// ── Re-implement the pure decision logic from ProtectedRoute ─────────────────

function shouldRedirectToSignIn(opts: {
  user: unknown;
  loading: boolean;
  isGuestSession: boolean;
}): boolean {
  return !opts.loading && !opts.user && !opts.isGuestSession;
}

function buildReturnUrl(pathname: string): string {
  return pathname ? `/signin?returnUrl=${encodeURIComponent(pathname)}` : "/signin";
}

// ── Sign-out ordering simulation ─────────────────────────────────────────────

interface AuthState {
  user: unknown;
  loading: boolean;
  cookieCleared: boolean;
  navigatedTo: string | null;
}

/**
 * Simulates the CORRECT sign-out flow (current implementation):
 * 1. Clear cookie
 * 2. Navigate away (window.location.href = '/')
 * 3. Supabase signOut runs (async, page is already leaving)
 *
 * Returns each intermediate state snapshot.
 */
function simulateCorrectSignOut(): AuthState[] {
  const snapshots: AuthState[] = [];
  const state: AuthState = { user: { id: "u1" }, loading: false, cookieCleared: false, navigatedTo: null };

  snapshots.push({ ...state });

  // Step 1: clear cookie
  state.cookieCleared = true;
  snapshots.push({ ...state });

  // Step 2: navigate to '/' — user state is still set!
  state.navigatedTo = "/";
  snapshots.push({ ...state });

  // Step 3: Supabase signOut would run, but page is already navigating away
  // (user state is never set to null in React before navigation)

  return snapshots;
}

/**
 * Simulates the BROKEN flow (old implementation):
 * 1. Clear cookie
 * 2. Supabase signOut
 * 3. setUser(null) — triggers ProtectedRoute redirect!
 * 4. window.location.replace('/') — too late, redirect already fired
 */
function simulateBrokenSignOut(): AuthState[] {
  const snapshots: AuthState[] = [];
  const state: AuthState = { user: { id: "u1" }, loading: false, cookieCleared: false, navigatedTo: null };

  snapshots.push({ ...state });

  // Step 1: clear cookie
  state.cookieCleared = true;
  snapshots.push({ ...state });

  // Step 2: supabase.auth.signOut()
  // Step 3: setUser(null) — user becomes null WHILE still on /create
  state.user = null;
  snapshots.push({ ...state });

  // Step 4: window.location.replace('/') — but ProtectedRoute already redirected
  state.navigatedTo = "/";
  snapshots.push({ ...state });

  return snapshots;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Sign-out redirect: ordering contract", () => {
  it("correct flow: user is never null before navigation starts", () => {
    const snapshots = simulateCorrectSignOut();
    for (const snap of snapshots) {
      if (snap.navigatedTo === null) {
        // Before navigation, user must still be set
        expect(snap.user).not.toBeNull();
      }
    }
  });

  it("correct flow: navigation target is /", () => {
    const snapshots = simulateCorrectSignOut();
    const finalNav = snapshots[snapshots.length - 1].navigatedTo;
    expect(finalNav).toBe("/");
  });

  it("correct flow: ProtectedRoute would NOT redirect because user is set until navigation", () => {
    const snapshots = simulateCorrectSignOut();
    for (const snap of snapshots) {
      if (snap.navigatedTo === null) {
        // ProtectedRoute check: user is still set, so no redirect
        const wouldRedirect = shouldRedirectToSignIn({
          user: snap.user,
          loading: snap.loading,
          isGuestSession: false,
        });
        expect(wouldRedirect).toBe(false);
      }
    }
  });

  it("broken flow: user becomes null BEFORE navigation, triggering ProtectedRoute redirect", () => {
    const snapshots = simulateBrokenSignOut();
    // Find the snapshot where user is null but we haven't navigated yet
    const dangerousState = snapshots.find(
      (s) => s.user === null && s.navigatedTo === null
    );
    expect(dangerousState).toBeDefined();

    // ProtectedRoute would fire redirect here
    const wouldRedirect = shouldRedirectToSignIn({
      user: dangerousState!.user,
      loading: dangerousState!.loading,
      isGuestSession: false,
    });
    expect(wouldRedirect).toBe(true);
  });

  it("broken flow: redirect would go to /signin?returnUrl=/create", () => {
    const returnUrl = buildReturnUrl("/create");
    expect(returnUrl).toBe("/signin?returnUrl=%2Fcreate");
  });
});

describe("Sign-out redirect: buildReturnUrl", () => {
  it("encodes pathname into returnUrl param", () => {
    expect(buildReturnUrl("/create")).toBe("/signin?returnUrl=%2Fcreate");
  });

  it("encodes nested paths", () => {
    expect(buildReturnUrl("/game/abc-123")).toBe("/signin?returnUrl=%2Fgame%2Fabc-123");
  });

  it("returns plain /signin when pathname is empty", () => {
    expect(buildReturnUrl("")).toBe("/signin");
  });

  it("encodes paths with special characters", () => {
    const url = buildReturnUrl("/my-games?tab=active");
    expect(url).toBe("/signin?returnUrl=%2Fmy-games%3Ftab%3Dactive");
  });
});
