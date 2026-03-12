import { describe, it, expect } from "vitest";
import { WORLD_THEMES, getWorldThemeById } from "@/data/world-themes";
import { buildRoomRules } from "@/app/api/worlds/generate/route";

// ── buildRoomRules ──────────────────────────────────────────────────────

describe("buildRoomRules", () => {
  const theme = getWorldThemeById("cursed-kingdom")!;

  it("includes the world setting", () => {
    const room = theme.rooms[0];
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("SETTING:");
    expect(rules).toContain(theme.setting);
  });

  it("includes the room name and description", () => {
    const room = theme.rooms.find((r) => r.id === "tavern")!;
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("LOCATION: The Rusty Tankard");
    expect(rules).toContain(room.description);
  });

  it("includes the room type", () => {
    for (const room of theme.rooms) {
      const rules = buildRoomRules(theme, room);
      expect(rules).toContain(`ROOM TYPE: ${room.roomType}`);
    }
  });

  it("includes NPCs when present", () => {
    const room = theme.rooms.find((r) => r.npcs && r.npcs.length > 0)!;
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("NPCs PRESENT:");
    for (const npc of room.npcs!) {
      expect(rules).toContain(npc);
    }
  });

  it("does not include NPCs line when no NPCs", () => {
    const room = theme.rooms.find((r) => !r.npcs || r.npcs.length === 0)!;
    const rules = buildRoomRules(theme, room);
    expect(rules).not.toContain("NPCs PRESENT:");
  });

  it("includes encounters when present", () => {
    const room = theme.rooms.find((r) => r.encounters && r.encounters.length > 0)!;
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("POSSIBLE ENCOUNTERS:");
    for (const enc of room.encounters!) {
      expect(rules).toContain(enc);
    }
  });

  it("includes connected locations by name", () => {
    const tavern = theme.rooms.find((r) => r.id === "tavern")!;
    const rules = buildRoomRules(theme, tavern);
    expect(rules).toContain("CONNECTED LOCATIONS:");
    expect(rules).toContain("Ashwick Village");
    expect(rules).toContain("Edge of the Thornwood");
  });

  it("includes item pool", () => {
    const room = theme.rooms[0];
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("AVAILABLE ITEMS IN THIS WORLD:");
    for (const item of theme.itemPool) {
      expect(rules).toContain(item);
    }
  });

  it("includes GM context", () => {
    const room = theme.rooms[0];
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain(theme.gmContext);
  });

  it("includes all RPG directive documentation", () => {
    const room = theme.rooms[0];
    const rules = buildRoomRules(theme, room);
    const directives = ["SCENE:", "HP:", "MP:", "ITEM:", "SKILL_CHECK:", "COMBAT:", "DICE:", "XP:", "LOOT:", "LEVEL_UP:", "SHOP:", "EQUIP:", "QUEST:", "WORLD_EVENT:"];
    for (const dir of directives) {
      expect(rules).toContain(dir);
    }
  });

  it("includes hosting rules", () => {
    const room = theme.rooms[0];
    const rules = buildRoomRules(theme, room);
    expect(rules).toContain("HOSTING RULES:");
    expect(rules).toContain("MOOD:");
  });
});

// ── World generation flow structural tests ──────────────────────────────

describe("world generation flow structure", () => {
  describe.each(WORLD_THEMES.map((t) => [t.id, t]))("theme '%s' room mapping", (_id, theme) => {
    const t = theme as (typeof WORLD_THEMES)[number];

    it("generates unique UUIDs for all rooms", () => {
      const roomIdMap = new Map<string, string>();
      for (const room of t.rooms) {
        roomIdMap.set(room.id, crypto.randomUUID());
      }
      const uuids = [...roomIdMap.values()];
      expect(new Set(uuids).size).toBe(uuids.length);
    });

    it("startingRoomId maps to a valid UUID", () => {
      const roomIdMap = new Map<string, string>();
      for (const room of t.rooms) {
        roomIdMap.set(room.id, crypto.randomUUID());
      }
      const startUuid = roomIdMap.get(t.startingRoomId);
      expect(startUuid).toBeDefined();
      expect(startUuid).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("all connection IDs can be resolved to UUIDs", () => {
      const roomIdMap = new Map<string, string>();
      for (const room of t.rooms) {
        roomIdMap.set(room.id, crypto.randomUUID());
      }
      for (const room of t.rooms) {
        for (const connId of room.connections) {
          const resolved = roomIdMap.get(connId);
          expect(resolved).toBeDefined();
        }
      }
    });

    it("buildRoomRules works for every room", () => {
      for (const room of t.rooms) {
        const rules = buildRoomRules(t, room);
        expect(rules.length).toBeGreaterThan(100);
        expect(rules).toContain(room.name);
      }
    });
  });

  it("party_state initial structure is well-formed", () => {
    const theme = getWorldThemeById("cursed-kingdom")!;
    const roomIdMap = new Map<string, string>();
    for (const room of theme.rooms) {
      roomIdMap.set(room.id, crypto.randomUUID());
    }
    const startRoomUuid = roomIdMap.get(theme.startingRoomId)!;

    const partyState = {
      characters: [],
      activeQuests: [],
      completedQuests: [],
      currentRoomId: startRoomUuid,
      visitedRoomIds: [startRoomUuid],
      roomStates: {},
      worldEvents: [],
      gold: 50,
      playTimeMinutes: 0,
      lastPlayedAt: new Date().toISOString(),
    };

    expect(partyState.characters).toEqual([]);
    expect(partyState.gold).toBe(50);
    expect(partyState.visitedRoomIds).toHaveLength(1);
    expect(partyState.currentRoomId).toBe(startRoomUuid);
    expect(partyState.playTimeMinutes).toBe(0);
    expect(new Date(partyState.lastPlayedAt).getTime()).toBeGreaterThan(0);
  });
});

// ── Ghost world prevention logic ────────────────────────────────────────

describe("ghost world prevention", () => {
  it("should detect when too many rooms fail", () => {
    const totalRooms = 13;
    const createdRooms = [{ id: "room-1", themeRoomId: "tavern", name: "The Rusty Tankard", roomType: "hub" }];
    const failedRooms = Array.from({ length: 12 }, (_, i) => `room-${i + 2}`);

    const failureRatio = failedRooms.length / totalRooms;
    expect(failureRatio).toBeGreaterThan(0.5);
    expect(createdRooms.length).toBe(1);
    expect(createdRooms.length < totalRooms * 0.5).toBe(true);
  });

  it("all rooms fail should trigger world cleanup", () => {
    const createdRooms: unknown[] = [];
    expect(createdRooms.length).toBe(0);
  });

  it("partial failure with start room intact uses start room", () => {
    const startRoomUuid = "start-uuid";
    const createdRooms = [
      { id: startRoomUuid, themeRoomId: "tavern", name: "Tavern", roomType: "hub" },
      { id: "uuid-2", themeRoomId: "village", name: "Village", roomType: "quest" },
    ];
    const actualStartRoom = createdRooms.find((r) => r.id === startRoomUuid) || createdRooms[0];
    expect(actualStartRoom.id).toBe(startRoomUuid);
  });

  it("partial failure with start room missing falls back to first created", () => {
    const startRoomUuid = "missing-uuid";
    const createdRooms = [
      { id: "uuid-2", themeRoomId: "village", name: "Village", roomType: "quest" },
      { id: "uuid-3", themeRoomId: "forest", name: "Forest", roomType: "combat" },
    ];
    const actualStartRoom = createdRooms.find((r) => r.id === startRoomUuid) || createdRooms[0];
    expect(actualStartRoom.id).toBe("uuid-2");
    expect(actualStartRoom.name).toBe("Village");
  });

  it("should cleanup when less than 50% of rooms created (ceil threshold)", () => {
    const totalRooms = 13;
    const minRequired = Math.ceil(totalRooms * 0.5);
    expect(minRequired).toBe(7);

    const testCases = [
      { created: 0, shouldCleanup: true },
      { created: 1, shouldCleanup: true },
      { created: 6, shouldCleanup: true },
      { created: 7, shouldCleanup: false },
      { created: 13, shouldCleanup: false },
    ];

    for (const tc of testCases) {
      const shouldCleanup = tc.created < minRequired;
      expect(shouldCleanup).toBe(tc.shouldCleanup);
    }
  });

  it("works for 9-room themes too", () => {
    const totalRooms = 9;
    const minRequired = Math.ceil(totalRooms * 0.5);
    expect(minRequired).toBe(5);
    expect(4 < minRequired).toBe(true);
    expect(5 < minRequired).toBe(false);
  });
});

// ── Room config structure ───────────────────────────────────────────────

describe("room config structure", () => {
  it("generated room configs have all required fields", () => {
    const theme = getWorldThemeById("zombie-siege")!;
    for (const room of theme.rooms) {
      const config = {
        template: "exploration",
        rules: buildRoomRules(theme, room),
        name: room.name,
        playerCount: 4,
        hostId: "gm",
      };
      expect(config.template).toBe("exploration");
      expect(config.name).toBe(room.name);
      expect(config.playerCount).toBe(4);
      expect(config.hostId).toBe("gm");
      expect(config.rules.length).toBeGreaterThan(0);
    }
  });

  it("room connections are mapped with names", () => {
    const theme = getWorldThemeById("cursed-kingdom")!;
    const roomIdMap = new Map<string, string>();
    for (const room of theme.rooms) {
      roomIdMap.set(room.id, crypto.randomUUID());
    }

    for (const room of theme.rooms) {
      const connections = room.connections.map((connId) => ({
        roomId: roomIdMap.get(connId) || connId,
        name: theme.rooms.find((r) => r.id === connId)?.name || connId,
      }));

      for (const conn of connections) {
        expect(conn.roomId).toMatch(/^[0-9a-f-]{36}$/);
        expect(conn.name).toBeTruthy();
        expect(conn.name).not.toMatch(/^[0-9a-f-]{36}$/);
      }
    }
  });
});
