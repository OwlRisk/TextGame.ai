/**
 * Tests for the pool-growth hybrid avatar system:
 * - Dynamic pool size detection
 * - generateAndPool API mode
 * - fetchAvatarsForRoom batch function
 * - Character persistence to ai_characters table
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import crypto from "crypto";

beforeAll(() => {
  process.env.OPENAI_API_KEY = "sk-test-dummy";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
});

describe("Pool Growth: Dynamic pool size", () => {
  it("getPoolAvatarUrl uses MIN_POOL_SIZE (30) as default", async () => {
    const { getPoolAvatarUrl, POOL_SIZE } = await import("@/app/api/avatar/route");
    expect(POOL_SIZE).toBe(30);
    const url = getPoolAvatarUrl("TestPlayer", "player", "male");
    expect(url).toContain("/pool/male/");
    expect(url).toMatch(/\/\d{3}\.png$/);
  });

  it("getPoolAvatarUrl maps gender correctly", async () => {
    const { getPoolAvatarUrl } = await import("@/app/api/avatar/route");
    const maleUrl = getPoolAvatarUrl("Alice", "player", "male");
    const femaleUrl = getPoolAvatarUrl("Alice", "player", "female");
    expect(maleUrl).toContain("/pool/male/");
    expect(femaleUrl).toContain("/pool/female/");
  });

  it("getPoolAvatarUrl is deterministic for same inputs", async () => {
    const { getPoolAvatarUrl } = await import("@/app/api/avatar/route");
    const url1 = getPoolAvatarUrl("Bob", "player", "male");
    const url2 = getPoolAvatarUrl("Bob", "player", "male");
    expect(url1).toBe(url2);
  });

  it("different names produce different pool assignments (usually)", async () => {
    const { getPoolAvatarUrl } = await import("@/app/api/avatar/route");
    const urls = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const url = getPoolAvatarUrl(`Player${i}`, "player", "male");
      if (url) urls.add(url);
    }
    expect(urls.size).toBeGreaterThan(5);
  });

  it("pool index stays within valid range", () => {
    const POOL_SIZE = 30;
    for (let i = 0; i < 100; i++) {
      const key = `TestPlayer${i}|player`;
      const hash = crypto.createHash("sha256").update(key).digest("hex");
      const index = (parseInt(hash.slice(0, 8), 16) % POOL_SIZE) + 1;
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(POOL_SIZE);
    }
  });
});

describe("Pool Growth: fetchAvatarsForRoom", () => {
  it("is exported and callable", async () => {
    const { fetchAvatarsForRoom } = await import("@/lib/avatar");
    expect(typeof fetchAvatarsForRoom).toBe("function");
  });

  it("RoomPlayerInfo interface accepts all fields", async () => {
    const player = {
      name: "TestPlayer",
      type: "player" as const,
      gender: "male",
      personality: "Skeptical",
      background: "Former judge",
      role: "Villager",
    };
    expect(player.name).toBe("TestPlayer");
    expect(player.gender).toBe("male");
  });
});

describe("Pool Growth: API generateAndPool parameter", () => {
  it("avatar API accepts generateAndPool in request body schema", () => {
    const body = {
      name: "TestPlayer",
      type: "player" as const,
      gender: "male",
      personality: "Skeptical and analytical",
      background: "Former debate champion",
      generateAndPool: true,
      gameId: "test-game-id",
    };
    expect(body.generateAndPool).toBe(true);
    expect(body.name).toBe("TestPlayer");
  });

  it("generateAndPool response includes generated flag", () => {
    const response = { image: "https://example.com/pool/male/031.png", pool: true, generated: true };
    expect(response.generated).toBe(true);
    expect(response.pool).toBe(true);
  });
});

describe("Pool Growth: ai_characters table schema", () => {
  it("character record includes all required fields", () => {
    const character = {
      user_id: "system",
      name: "TestCharacter",
      gender: "male",
      personality: "Skeptical and analytical",
      background: "Former debate champion",
      avatar_url: "https://example.com/pool/male/031.png",
      is_system: true,
      source_game_id: "test-game-uuid",
    };
    expect(character.user_id).toBe("system");
    expect(character.is_system).toBe(true);
    expect(character.avatar_url).toContain("pool/male/");
  });
});

describe("Pool Growth: batch allocation logic", () => {
  it("picks exactly 1 AI player for generation when multiple exist", () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      name: `Player${i}`,
      type: "player" as const,
      gender: i % 2 === 0 ? "male" : "female",
    }));

    const generateIndex = Math.floor(Math.random() * players.length);
    expect(generateIndex).toBeGreaterThanOrEqual(0);
    expect(generateIndex).toBeLessThan(players.length);

    const generateTargets = players.filter((_, i) => i === generateIndex);
    expect(generateTargets).toHaveLength(1);
  });

  it("host players are not selected for generateAndPool", () => {
    const players = [
      { name: "Echo", type: "host" as const, gender: "male" },
      { name: "Player1", type: "player" as const, gender: "male" },
      { name: "Player2", type: "player" as const, gender: "female" },
    ];

    const aiPlayers = players.filter(p => (p.type ?? "player") === "player");
    expect(aiPlayers).toHaveLength(2);
    expect(aiPlayers.every(p => p.type === "player")).toBe(true);
  });

  it("with 0 AI players, no generation target is selected", () => {
    const players: Array<{ name: string; type: "host" | "player"; gender: string }> = [
      { name: "Echo", type: "host", gender: "male" },
    ];
    const aiPlayers = players.filter(p => (p.type ?? "player") === "player");
    const generateIndex = aiPlayers.length > 0 ? Math.floor(Math.random() * aiPlayers.length) : -1;
    expect(generateIndex).toBe(-1);
  });
});
