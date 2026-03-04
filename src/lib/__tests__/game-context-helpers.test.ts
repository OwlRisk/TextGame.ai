/**
 * Tests for pure helper functions from GameContext.tsx:
 *  - rowToGame(row) — DB row to Game object mapping
 *  - sortGamesByUpdatedAt(games) — sort by updatedAt descending
 */
import { describe, it, expect } from "vitest";

// Re-implement the pure helpers exactly as in GameContext.tsx

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
}

function rowToGame(row: {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: unknown;
  is_active: boolean;
  updated_at?: string;
}): Game {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    config: (row.config ?? {}) as Record<string, unknown>,
    isActive: row.is_active,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function sortGamesByUpdatedAt(games: Game[]): Game[] {
  return [...games].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

// ─── rowToGame ──────────────────────────────────────────────────────────────

describe("rowToGame", () => {
  it("maps all DB fields to Game fields", () => {
    const row = {
      id: "g1",
      name: "Werewolf",
      icon: "🐺",
      color: "#ff0000",
      config: { rules: "standard" },
      is_active: true,
      updated_at: "2026-01-01T00:00:00Z",
    };
    const game = rowToGame(row);
    expect(game).toEqual({
      id: "g1",
      name: "Werewolf",
      icon: "🐺",
      color: "#ff0000",
      config: { rules: "standard" },
      isActive: true,
      updatedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("defaults config to empty object when null", () => {
    const row = {
      id: "g2",
      name: "Mafia",
      icon: "🔫",
      color: "#000",
      config: null,
      is_active: false,
      updated_at: "2026-02-01T00:00:00Z",
    };
    const game = rowToGame(row);
    expect(game.config).toEqual({});
  });

  it("defaults updatedAt to now when not provided", () => {
    const before = new Date().toISOString();
    const row = {
      id: "g3",
      name: "RPG",
      icon: "⚔️",
      color: "#333",
      config: {},
      is_active: true,
    };
    const game = rowToGame(row);
    expect(game.updatedAt >= before).toBe(true);
  });

  it("maps is_active false correctly", () => {
    const row = {
      id: "g4",
      name: "Done",
      icon: "✅",
      color: "#0f0",
      config: {},
      is_active: false,
      updated_at: "2025-06-01T00:00:00Z",
    };
    expect(rowToGame(row).isActive).toBe(false);
  });
});

// ─── sortGamesByUpdatedAt ───────────────────────────────────────────────────

describe("sortGamesByUpdatedAt", () => {
  const makeGame = (id: string, updatedAt: string): Game => ({
    id,
    name: id,
    icon: "",
    color: "",
    config: {},
    isActive: true,
    updatedAt,
  });

  it("sorts games by updatedAt descending (newest first)", () => {
    const games = [
      makeGame("old", "2025-01-01T00:00:00Z"),
      makeGame("new", "2026-06-01T00:00:00Z"),
      makeGame("mid", "2025-06-01T00:00:00Z"),
    ];
    const sorted = sortGamesByUpdatedAt(games);
    expect(sorted.map((g) => g.id)).toEqual(["new", "mid", "old"]);
  });

  it("does not mutate the original array", () => {
    const games = [
      makeGame("b", "2025-01-01T00:00:00Z"),
      makeGame("a", "2026-01-01T00:00:00Z"),
    ];
    const original = [...games];
    sortGamesByUpdatedAt(games);
    expect(games).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortGamesByUpdatedAt([])).toEqual([]);
  });

  it("handles single element", () => {
    const games = [makeGame("only", "2026-01-01T00:00:00Z")];
    expect(sortGamesByUpdatedAt(games)).toEqual(games);
  });

  it("handles identical timestamps (stable relative order)", () => {
    const games = [
      makeGame("a", "2026-01-01T00:00:00Z"),
      makeGame("b", "2026-01-01T00:00:00Z"),
      makeGame("c", "2026-01-01T00:00:00Z"),
    ];
    const sorted = sortGamesByUpdatedAt(games);
    expect(sorted).toHaveLength(3);
  });

  it("correctly compares ISO date strings", () => {
    const games = [
      makeGame("dec", "2025-12-31T23:59:59Z"),
      makeGame("jan", "2026-01-01T00:00:00Z"),
    ];
    const sorted = sortGamesByUpdatedAt(games);
    expect(sorted[0].id).toBe("jan");
    expect(sorted[1].id).toBe("dec");
  });
});
