import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("@/lib/pg-pool", () => ({ pool: { query: (...args: unknown[]) => mockQuery(...args) } }));

vi.mock("@/lib/env", () => ({
  env: { INWORLD_BASIC_BASE64: "dGVzdDp0ZXN0" },
}));

import { getCachedInworldVoices, type CachedVoice } from "../inworld-voices-cache";

const SAMPLE_VOICES: CachedVoice[] = [
  { voiceId: "v1", displayName: "Voice 1", tags: ["en"], langCode: "en-US" },
  { voiceId: "v2", displayName: "Voice 2", tags: ["en"], langCode: "en-GB" },
];

beforeEach(() => {
  vi.restoreAllMocks();
  mockQuery.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Cache hit ──────────────────────────────────────────────────────────────

describe("getCachedInworldVoices - cache hit", () => {
  it("returns cached voices when cache is fresh", async () => {
    const freshDate = new Date(Date.now() - 1000); // 1 second old
    mockQuery.mockResolvedValueOnce({
      rows: [{ value: { voices: SAMPLE_VOICES }, updated_at: freshDate }],
    });

    const result = await getCachedInworldVoices();
    expect(result.fromCache).toBe(true);
    expect(result.voices).toEqual(SAMPLE_VOICES);
    expect(result.updatedAt).toBe(freshDate.toISOString());
  });

  it("treats cache as hit when age < 24h", async () => {
    const almostExpired = new Date(Date.now() - 23 * 60 * 60 * 1000);
    mockQuery.mockResolvedValueOnce({
      rows: [{ value: { voices: SAMPLE_VOICES }, updated_at: almostExpired }],
    });

    const result = await getCachedInworldVoices();
    expect(result.fromCache).toBe(true);
  });
});

// ─── Cache miss / expired ───────────────────────────────────────────────────

describe("getCachedInworldVoices - cache miss", () => {
  it("fetches from API when no cache row exists", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // SELECT
      .mockResolvedValueOnce({}); // INSERT/UPSERT

    const apiVoices = [{ voiceId: "api1", displayName: "API Voice 1" }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ voices: apiVoices }),
    });

    const result = await getCachedInworldVoices();
    expect(result.fromCache).toBe(false);
    expect(result.voices).toHaveLength(1);
    expect(result.voices[0].voiceId).toBe("api1");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.inworld.ai/voices/v1/voices",
      expect.objectContaining({ headers: { Authorization: "Basic dGVzdDp0ZXN0" } })
    );
  });

  it("fetches from API when cache is expired (>24h)", async () => {
    const expired = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ value: { voices: SAMPLE_VOICES }, updated_at: expired }],
      })
      .mockResolvedValueOnce({});

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ voices: [{ voiceId: "fresh" }] }),
    });

    const result = await getCachedInworldVoices();
    expect(result.fromCache).toBe(false);
    expect(result.voices[0].voiceId).toBe("fresh");
  });

  it("upserts the new data into DB after fetch", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ voices: [{ voiceId: "v1" }] }),
    });

    await getCachedInworldVoices();

    const upsertCall = mockQuery.mock.calls[1];
    expect(upsertCall[0]).toContain("INSERT INTO app_cache");
    expect(upsertCall[0]).toContain("ON CONFLICT");
    expect(upsertCall[1][0]).toBe("inworld_voices");
  });
});

// ─── forceRefresh ───────────────────────────────────────────────────────────

describe("getCachedInworldVoices - forceRefresh", () => {
  it("skips cache and fetches from API", async () => {
    mockQuery.mockResolvedValueOnce({}); // upsert only, no SELECT

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ voices: [{ voiceId: "forced" }] }),
    });

    const result = await getCachedInworldVoices(true);
    expect(result.fromCache).toBe(false);
    expect(result.voices[0].voiceId).toBe("forced");
    // Should NOT have queried for cache
    expect(mockQuery.mock.calls[0][0]).toContain("INSERT");
  });
});

// ─── Error handling ─────────────────────────────────────────────────────────

describe("getCachedInworldVoices - errors", () => {
  it("returns empty when API returns non-ok status", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const result = await getCachedInworldVoices();
    expect(result.voices).toEqual([]);
    expect(result.fromCache).toBe(false);
  });

  it("returns empty when INWORLD_BASIC_BASE64 is missing", async () => {
    const origMock = await import("@/lib/env");
    const origValue = origMock.env.INWORLD_BASIC_BASE64;
    Object.defineProperty(origMock.env, "INWORLD_BASIC_BASE64", { get: () => undefined, configurable: true });

    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await getCachedInworldVoices();
    expect(result.voices).toEqual([]);
    expect(result.fromCache).toBe(false);

    Object.defineProperty(origMock.env, "INWORLD_BASIC_BASE64", { get: () => origValue, configurable: true });
  });

  it("handles missing voices field in API response", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await getCachedInworldVoices();
    expect(result.voices).toEqual([]);
    expect(result.fromCache).toBe(false);
  });

  it("handles malformed cache value gracefully", async () => {
    const freshDate = new Date(Date.now() - 1000);
    mockQuery.mockResolvedValueOnce({
      rows: [{ value: { notVoices: true }, updated_at: freshDate }],
    });

    const result = await getCachedInworldVoices();
    expect(result.fromCache).toBe(true);
    expect(result.voices).toEqual([]);
  });
});
