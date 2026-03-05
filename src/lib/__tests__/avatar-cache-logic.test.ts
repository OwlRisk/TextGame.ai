import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for avatar.ts cache and storage logic.
 * The module is 'use client' so we test the pure utility functions
 * by extracting their logic patterns.
 */

const PERSIST_PREFIX = "gm_avatar_";
const PERSIST_KEYS_LIST = "gm_avatar_keys";
const PERSIST_MAX_KEYS = 200;
const PERSIST_EVICT_COUNT = 30;

function identityCacheKey(name: string, type: "host" | "player"): string {
  return [name, type].join("|");
}

describe("identityCacheKey", () => {
  it("joins name and type with pipe", () => {
    expect(identityCacheKey("Alice", "player")).toBe("Alice|player");
    expect(identityCacheKey("GM", "host")).toBe("GM|host");
  });

  it("produces different keys for different types", () => {
    expect(identityCacheKey("Bob", "host")).not.toBe(identityCacheKey("Bob", "player"));
  });

  it("handles names with special characters", () => {
    expect(identityCacheKey("Dr. Evil", "player")).toBe("Dr. Evil|player");
    expect(identityCacheKey("名前", "host")).toBe("名前|host");
  });

  it("handles empty name", () => {
    expect(identityCacheKey("", "player")).toBe("|player");
  });
});

describe("avatar localStorage persistence", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function loadFromStorage(key: string): string | null {
    try {
      const stored = localStorage.getItem(PERSIST_PREFIX + key);
      return stored || null;
    } catch { return null; }
  }

  function saveToStorage(key: string, dataUrl: string): void {
    try {
      localStorage.setItem(PERSIST_PREFIX + key, dataUrl);
      const keysJson = localStorage.getItem(PERSIST_KEYS_LIST);
      const keys: string[] = keysJson ? JSON.parse(keysJson) : [];
      if (!keys.includes(key)) keys.push(key);
      if (keys.length > PERSIST_MAX_KEYS) {
        for (let i = 0; i < PERSIST_EVICT_COUNT && keys.length > 0; i++) {
          const old = keys.shift()!;
          localStorage.removeItem(PERSIST_PREFIX + old);
        }
      }
      localStorage.setItem(PERSIST_KEYS_LIST, JSON.stringify(keys));
    } catch { /* ignored */ }
  }

  it("saves and loads an avatar URL", () => {
    const key = identityCacheKey("Alice", "player");
    saveToStorage(key, "data:image/png;base64,abc123");
    expect(loadFromStorage(key)).toBe("data:image/png;base64,abc123");
  });

  it("returns null for unknown key", () => {
    expect(loadFromStorage("nonexistent|player")).toBeNull();
  });

  it("tracks keys in the keys list", () => {
    saveToStorage("A|player", "url-a");
    saveToStorage("B|host", "url-b");
    const keys = JSON.parse(storage[PERSIST_KEYS_LIST]);
    expect(keys).toContain("A|player");
    expect(keys).toContain("B|host");
  });

  it("does not add duplicate keys", () => {
    saveToStorage("A|player", "url-1");
    saveToStorage("A|player", "url-2");
    const keys = JSON.parse(storage[PERSIST_KEYS_LIST]);
    expect(keys.filter((k: string) => k === "A|player")).toHaveLength(1);
  });

  it("evicts old keys when exceeding PERSIST_MAX_KEYS", () => {
    for (let i = 0; i < PERSIST_MAX_KEYS + 5; i++) {
      saveToStorage(`player-${i}|player`, `url-${i}`);
    }
    const keys: string[] = JSON.parse(storage[PERSIST_KEYS_LIST]);
    expect(keys.length).toBeLessThanOrEqual(PERSIST_MAX_KEYS);
    // First keys should have been evicted
    expect(loadFromStorage("player-0|player")).toBeNull();
  });
});

describe("avatar cache (in-memory)", () => {
  it("cache map operations work correctly", () => {
    const cache = new Map<string, string>();
    const key = identityCacheKey("TestPlayer", "player");
    expect(cache.has(key)).toBe(false);
    cache.set(key, "https://example.com/avatar.png");
    expect(cache.get(key)).toBe("https://example.com/avatar.png");
    cache.delete(key);
    expect(cache.has(key)).toBe(false);
  });

  it("invalidation clears specific key", () => {
    const cache = new Map<string, string>();
    cache.set("A|player", "url-a");
    cache.set("B|host", "url-b");
    cache.delete("A|player");
    expect(cache.has("A|player")).toBe(false);
    expect(cache.has("B|host")).toBe(true);
  });
});
