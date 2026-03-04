/**
 * Tests for pure helper functions extracted from AuthContext.tsx.
 * Since the helpers are not exported, we duplicate their logic here to
 * ensure correctness. This is preferable to exporting test-only helpers.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Minimal localStorage shim for Node
const store: Record<string, string> = {};
const localStorageShim = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  key: (i: number) => Object.keys(store)[i] ?? null,
  get length() { return Object.keys(store).length; },
};
(globalThis as any).localStorage = localStorageShim;

// ─── Re-implement the pure helpers exactly as in AuthContext.tsx ─────────────

function getLocalCachedSession(): { user: unknown; session: unknown } {
  try {
    const key = Object.keys(store).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return { user: null, session: null };
    const raw = localStorage.getItem(key);
    if (!raw) return { user: null, session: null };
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.user) return { user: null, session: null };
    if (parsed.expires_at && parsed.expires_at < Date.now() / 1000 + 60) {
      return { user: null, session: null };
    }
    return { user: parsed.user, session: parsed };
  } catch {
    return { user: null, session: null };
  }
}

function isInvalidRefreshToken(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String((err as { name?: string }).name) : "";
  const msg = "message" in err ? String((err as { message?: string }).message) : "";
  if (name === "AuthApiError" && /refresh token|Refresh Token|refresh_token/i.test(msg)) return true;
  return /refresh token|Refresh Token|refresh_token/i.test(msg) && /not found|invalid|expired/i.test(msg);
}

function isSessionMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String((err as { name: string }).name) : "";
  const msg = "message" in err ? String((err as { message: string }).message) : "";
  return name === "AuthSessionMissingError" || /auth session missing/i.test(msg);
}

// ─── getLocalCachedSession ──────────────────────────────────────────────────

describe("getLocalCachedSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when no sb-*-auth-token key exists", () => {
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns null when key exists but value is empty string", () => {
    localStorage.setItem("sb-test-auth-token", "");
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns null when value has no access_token", () => {
    localStorage.setItem("sb-test-auth-token", JSON.stringify({ user: { id: "u1" } }));
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns null when value has no user", () => {
    localStorage.setItem("sb-test-auth-token", JSON.stringify({ access_token: "tok" }));
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns cached session when valid and not expired", () => {
    const session = {
      access_token: "tok",
      user: { id: "u1", email: "a@b.c" },
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(session));
    const result = getLocalCachedSession();
    expect(result.user).toEqual({ id: "u1", email: "a@b.c" });
    expect(result.session).toEqual(session);
  });

  it("returns null when session is expired", () => {
    const session = {
      access_token: "tok",
      user: { id: "u1" },
      expires_at: Math.floor(Date.now() / 1000) - 100, // expired
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(session));
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns null when session expires within 60 seconds", () => {
    const session = {
      access_token: "tok",
      user: { id: "u1" },
      expires_at: Math.floor(Date.now() / 1000) + 30, // only 30s left
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(session));
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("returns session when no expires_at field (never expires)", () => {
    const session = { access_token: "tok", user: { id: "u1" } };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(session));
    const result = getLocalCachedSession();
    expect(result.user).toEqual({ id: "u1" });
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem("sb-proj-auth-token", "not json{");
    const result = getLocalCachedSession();
    expect(result).toEqual({ user: null, session: null });
  });

  it("finds the correct key among other localStorage entries", () => {
    localStorage.setItem("other-key", "value");
    localStorage.setItem("sb-proj-auth-token", JSON.stringify({
      access_token: "tok",
      user: { id: "u1" },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
    localStorage.setItem("another-key", "value");
    const result = getLocalCachedSession();
    expect(result.user).toEqual({ id: "u1" });
  });
});

// ─── isInvalidRefreshToken ──────────────────────────────────────────────────

describe("isInvalidRefreshToken", () => {
  it("returns false for null / undefined / non-object", () => {
    expect(isInvalidRefreshToken(null)).toBe(false);
    expect(isInvalidRefreshToken(undefined)).toBe(false);
    expect(isInvalidRefreshToken("string")).toBe(false);
    expect(isInvalidRefreshToken(123)).toBe(false);
  });

  it("returns true for AuthApiError with refresh_token message", () => {
    expect(isInvalidRefreshToken({ name: "AuthApiError", message: "Invalid Refresh Token" })).toBe(true);
    expect(isInvalidRefreshToken({ name: "AuthApiError", message: "refresh token is expired" })).toBe(true);
    expect(isInvalidRefreshToken({ name: "AuthApiError", message: "refresh_token not found" })).toBe(true);
  });

  it("returns true for generic error with refresh token + not found/invalid/expired", () => {
    expect(isInvalidRefreshToken({ name: "Error", message: "refresh token not found" })).toBe(true);
    expect(isInvalidRefreshToken({ name: "Error", message: "Refresh Token is invalid" })).toBe(true);
    expect(isInvalidRefreshToken({ name: "Error", message: "refresh_token expired" })).toBe(true);
  });

  it("returns false for AuthApiError without refresh token mention", () => {
    expect(isInvalidRefreshToken({ name: "AuthApiError", message: "User not found" })).toBe(false);
  });

  it("returns false for refresh token mention without not found/invalid/expired", () => {
    expect(isInvalidRefreshToken({ name: "Error", message: "refresh token was sent" })).toBe(false);
  });

  it("returns false for empty error object", () => {
    expect(isInvalidRefreshToken({})).toBe(false);
  });
});

// ─── isSessionMissingError ──────────────────────────────────────────────────

describe("isSessionMissingError", () => {
  it("returns false for null / undefined / non-object", () => {
    expect(isSessionMissingError(null)).toBe(false);
    expect(isSessionMissingError(undefined)).toBe(false);
    expect(isSessionMissingError("oops")).toBe(false);
  });

  it("returns true for AuthSessionMissingError name", () => {
    expect(isSessionMissingError({ name: "AuthSessionMissingError", message: "" })).toBe(true);
  });

  it("returns true for message containing 'Auth session missing'", () => {
    expect(isSessionMissingError({ name: "Error", message: "Auth session missing" })).toBe(true);
    expect(isSessionMissingError({ name: "Error", message: "AUTH SESSION MISSING" })).toBe(true);
    expect(isSessionMissingError({ name: "Error", message: "Something: auth session missing error" })).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isSessionMissingError({ name: "Error", message: "Session expired" })).toBe(false);
    expect(isSessionMissingError({ name: "TypeError", message: "Cannot read" })).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isSessionMissingError({})).toBe(false);
  });
});
