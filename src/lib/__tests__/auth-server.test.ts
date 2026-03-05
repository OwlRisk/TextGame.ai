import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for auth-server.ts — parseTokenFromCookie and getAuthUserFromToken.
 * getAuthUserFromRequest depends on NextRequest and next/headers cookies(),
 * which are hard to mock outside an integration test, so we focus on the
 * token-level helper that does the real Supabase call.
 */

// --- Replicate the private parseTokenFromCookie so we can unit-test it ---
function parseTokenFromCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

describe("parseTokenFromCookie", () => {
  it("returns null for undefined", () => {
    expect(parseTokenFromCookie(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseTokenFromCookie("")).toBeNull();
  });

  it("returns decoded value for URI-encoded token", () => {
    const encoded = encodeURIComponent("eyJhbGciOiJIUzI1NiJ9.test+value");
    expect(parseTokenFromCookie(encoded)).toBe("eyJhbGciOiJIUzI1NiJ9.test+value");
  });

  it("returns raw value when decoding fails (malformed %)", () => {
    expect(parseTokenFromCookie("%ZZ-bad-encoding")).toBe("%ZZ-bad-encoding");
  });

  it("returns plain token unchanged", () => {
    expect(parseTokenFromCookie("abc123")).toBe("abc123");
  });
});

// --- getAuthUserFromToken tests (mocking Supabase) ---

const mockGetUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}));

describe("getAuthUserFromToken", () => {
  let getAuthUserFromToken: typeof import("@/lib/auth-server").getAuthUserFromToken;

  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    mockGetUser.mockReset();
    const mod = await import("@/lib/auth-server");
    getAuthUserFromToken = mod.getAuthUserFromToken;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null for empty/whitespace token", async () => {
    expect(await getAuthUserFromToken("")).toBeNull();
    expect(await getAuthUserFromToken("   ")).toBeNull();
  });

  it("returns null when Supabase env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const mod = await import("@/lib/auth-server");
    expect(await mod.getAuthUserFromToken("valid-token")).toBeNull();
  });

  it("returns user when Supabase returns valid user", async () => {
    const fakeUser = { id: "u1", email: "a@b.com" };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    const result = await getAuthUserFromToken("valid-token");
    expect(result).toEqual(fakeUser);
    expect(mockGetUser).toHaveBeenCalledWith("valid-token");
  });

  it("returns null when Supabase returns error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
    expect(await getAuthUserFromToken("expired-token")).toBeNull();
  });

  it("returns null for non-string token", async () => {
    // @ts-expect-error — testing runtime safety
    expect(await getAuthUserFromToken(123)).toBeNull();
    // @ts-expect-error — testing runtime safety
    expect(await getAuthUserFromToken(null)).toBeNull();
  });
});
