import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Tests for the sign-out localStorage cleanup logic.
 * Verifies that the Supabase auth token keys are properly identified and removed.
 *
 * Since Vitest runs in node (no DOM), we provide a minimal localStorage shim.
 */

const store = new Map<string, string>();
const localStorageShim: Storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (i: number) => [...store.keys()][i] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageShim, configurable: true });

function clearSupabaseLocalStorage(): string[] {
  const removed: string[] = [];
  Object.keys(Object.fromEntries(store))
    .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
    .forEach((k) => {
      localStorage.removeItem(k);
      removed.push(k);
    });
  return removed;
}

describe("clearSupabaseLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes sb-*-auth-token keys", () => {
    localStorage.setItem("sb-abc123-auth-token", '{"access_token":"tok1"}');
    localStorage.setItem("sb-xyz-auth-token", '{"access_token":"tok2"}');
    localStorage.setItem("other-key", "keep");

    const removed = clearSupabaseLocalStorage();

    expect(removed).toEqual(["sb-abc123-auth-token", "sb-xyz-auth-token"]);
    expect(localStorage.getItem("sb-abc123-auth-token")).toBeNull();
    expect(localStorage.getItem("sb-xyz-auth-token")).toBeNull();
    expect(localStorage.getItem("other-key")).toBe("keep");
  });

  it("does nothing when no matching keys exist", () => {
    localStorage.setItem("unrelated", "data");
    const removed = clearSupabaseLocalStorage();
    expect(removed).toEqual([]);
    expect(localStorage.getItem("unrelated")).toBe("data");
  });

  it("ignores keys that start with sb- but don't end with -auth-token", () => {
    localStorage.setItem("sb-abc-other", "keep");
    localStorage.setItem("sb-abc-auth-token", "remove");
    const removed = clearSupabaseLocalStorage();
    expect(removed).toEqual(["sb-abc-auth-token"]);
    expect(localStorage.getItem("sb-abc-other")).toBe("keep");
  });

  it("ignores keys ending with -auth-token but not starting with sb-", () => {
    localStorage.setItem("xx-abc-auth-token", "keep");
    const removed = clearSupabaseLocalStorage();
    expect(removed).toEqual([]);
  });
});

/**
 * Tests for getLocalCachedSession (extracted logic).
 */
function getLocalCachedSession(): { user: unknown; session: unknown } {
  try {
    const key = [...store.keys()].find(
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

describe("getLocalCachedSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no Supabase keys exist", () => {
    const { user, session } = getLocalCachedSession();
    expect(user).toBeNull();
    expect(session).toBeNull();
  });

  it("returns user/session from valid cached token", () => {
    const cached = {
      access_token: "tok",
      user: { id: "u1", email: "a@b.com" },
      expires_at: Date.now() / 1000 + 3600,
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(cached));
    const { user, session } = getLocalCachedSession();
    expect(user).toEqual(cached.user);
    expect(session).toEqual(cached);
  });

  it("returns null for expired token (within 60s)", () => {
    const cached = {
      access_token: "tok",
      user: { id: "u1" },
      expires_at: Date.now() / 1000 + 30, // 30s left, within 60s buffer
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(cached));
    const { user } = getLocalCachedSession();
    expect(user).toBeNull();
  });

  it("returns null when access_token is missing", () => {
    localStorage.setItem("sb-proj-auth-token", JSON.stringify({ user: { id: "u1" } }));
    const { user } = getLocalCachedSession();
    expect(user).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem("sb-proj-auth-token", "not-json{{{");
    const { user } = getLocalCachedSession();
    expect(user).toBeNull();
  });

  it("returns null after clearSupabaseLocalStorage", () => {
    const cached = {
      access_token: "tok",
      user: { id: "u1" },
      expires_at: Date.now() / 1000 + 3600,
    };
    localStorage.setItem("sb-proj-auth-token", JSON.stringify(cached));
    expect(getLocalCachedSession().user).not.toBeNull();

    clearSupabaseLocalStorage();
    expect(getLocalCachedSession().user).toBeNull();
  });
});
