import { describe, it, expect } from "vitest";
import { WORLD_THEMES, getWorldThemeById, type WorldTheme } from "@/data/world-themes";

describe("WORLD_THEMES data integrity", () => {
  it("has at least 3 themes defined", () => {
    expect(WORLD_THEMES.length).toBeGreaterThanOrEqual(3);
  });

  it("all theme IDs are unique", () => {
    const ids = WORLD_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(WORLD_THEMES.map((t) => [t.id, t]))("theme '%s'", (_id, theme) => {
    const t = theme as WorldTheme;

    it("has required top-level fields", () => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.setting).toBeTruthy();
      expect(t.gmContext).toBeTruthy();
    });

    it("has at least 3 rooms", () => {
      expect(t.rooms.length).toBeGreaterThanOrEqual(3);
    });

    it("has a valid startingRoomId that exists in rooms", () => {
      const roomIds = t.rooms.map((r) => r.id);
      expect(roomIds).toContain(t.startingRoomId);
    });

    it("all room IDs are unique within the theme", () => {
      const roomIds = t.rooms.map((r) => r.id);
      expect(new Set(roomIds).size).toBe(roomIds.length);
    });

    it("all room connections reference existing rooms", () => {
      const roomIds = new Set(t.rooms.map((r) => r.id));
      for (const room of t.rooms) {
        for (const conn of room.connections) {
          expect(roomIds.has(conn)).toBe(true);
        }
      }
    });

    it("connections are bidirectional (if A connects to B, B connects to A)", () => {
      const missing: string[] = [];
      for (const room of t.rooms) {
        for (const conn of room.connections) {
          const target = t.rooms.find((r) => r.id === conn);
          if (target && !target.connections.includes(room.id)) {
            missing.push(`${room.id} -> ${conn} (but ${conn} does not connect back to ${room.id})`);
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it("every room has a valid roomType", () => {
      const validTypes = ["hub", "combat", "quest", "shop", "boss", "mystery"];
      for (const room of t.rooms) {
        expect(validTypes).toContain(room.roomType);
      }
    });

    it("has at least one hub room", () => {
      const hubs = t.rooms.filter((r) => r.roomType === "hub");
      expect(hubs.length).toBeGreaterThanOrEqual(1);
    });

    it("has at least one boss room", () => {
      const bosses = t.rooms.filter((r) => r.roomType === "boss");
      expect(bosses.length).toBeGreaterThanOrEqual(1);
    });

    it("starting room is a hub", () => {
      const startRoom = t.rooms.find((r) => r.id === t.startingRoomId);
      expect(startRoom?.roomType).toBe("hub");
    });

    it("partyRoles has exactly 4 roles", () => {
      expect(t.partyRoles).toHaveLength(4);
    });

    it("monsterPool is non-empty", () => {
      expect(t.monsterPool.length).toBeGreaterThan(0);
    });

    it("itemPool is non-empty", () => {
      expect(t.itemPool.length).toBeGreaterThan(0);
    });

    it("all rooms are reachable from the starting room", () => {
      const visited = new Set<string>();
      const queue = [t.startingRoomId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        const room = t.rooms.find((r) => r.id === current);
        if (room) {
          for (const conn of room.connections) {
            if (!visited.has(conn)) queue.push(conn);
          }
        }
      }
      const unreachable = t.rooms.filter((r) => !visited.has(r.id)).map((r) => r.id);
      expect(unreachable).toEqual([]);
    });

    // ── Enhanced theme fields ──────────────────────────────────────────

    it("has mainQuest stages defined", () => {
      expect(t.mainQuest).toBeDefined();
      expect(t.mainQuest!.length).toBeGreaterThanOrEqual(3);
    });

    it("mainQuest stages reference valid roomIds", () => {
      const roomIds = new Set(t.rooms.map((r) => r.id));
      for (const stage of t.mainQuest!) {
        expect(roomIds.has(stage.roomId)).toBe(true);
      }
    });

    it("mainQuest stages have unique IDs", () => {
      const ids = t.mainQuest!.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("mainQuest stages have objectives", () => {
      for (const stage of t.mainQuest!) {
        expect(stage.objectives.length).toBeGreaterThan(0);
      }
    });

    it("has itemTable defined", () => {
      expect(t.itemTable).toBeDefined();
      expect(t.itemTable!.length).toBeGreaterThan(0);
    });

    it("itemTable entries have valid types and rarities", () => {
      const validTypes = ["weapon", "armor", "accessory", "consumable", "quest", "material"];
      const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
      for (const item of t.itemTable!) {
        expect(validTypes).toContain(item.type);
        expect(validRarities).toContain(item.rarity);
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
      }
    });

    it("has enemyTable defined", () => {
      expect(t.enemyTable).toBeDefined();
      expect(t.enemyTable!.length).toBeGreaterThan(0);
    });

    it("enemyTable entries have valid stats", () => {
      for (const enemy of t.enemyTable!) {
        expect(enemy.name).toBeTruthy();
        expect(enemy.hp).toBeGreaterThan(0);
        expect(enemy.attack).toBeGreaterThan(0);
        expect(enemy.defense).toBeGreaterThanOrEqual(0);
        expect(enemy.xpReward).toBeGreaterThan(0);
        expect(enemy.goldReward).toBeGreaterThanOrEqual(0);
      }
    });

    it("enemy loot drop chances are between 0 and 1", () => {
      for (const enemy of t.enemyTable!) {
        if (enemy.loot) {
          for (const lootEntry of enemy.loot) {
            expect(lootEntry.chance).toBeGreaterThan(0);
            expect(lootEntry.chance).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  });
});

describe("getWorldThemeById", () => {
  it("returns the correct theme for a valid ID", () => {
    const theme = getWorldThemeById("cursed-kingdom");
    expect(theme).not.toBeNull();
    expect(theme!.name).toBe("The Cursed Kingdom");
  });

  it("returns null for an unknown ID", () => {
    expect(getWorldThemeById("nonexistent-theme")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getWorldThemeById("")).toBeNull();
  });
});
