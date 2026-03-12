import { NextRequest, NextResponse } from "next/server";
import { createWorld, createGameAdmin, deleteWorld } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { getWorldThemeById } from "@/data/world-themes";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!supabaseAdmin) {
    console.error("[worlds/generate] SUPABASE_SERVICE_ROLE_KEY is not configured — cannot create worlds");
    return NextResponse.json({ error: "Server misconfiguration: service role key missing" }, { status: 500 });
  }

  const body = await request.json();
  const { themeId, worldName } = body;

  const theme = getWorldThemeById(themeId);
  if (!theme) {
    return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
  }

  const worldId = crypto.randomUUID();
  const roomIdMap = new Map<string, string>();

  for (const room of theme.rooms) {
    roomIdMap.set(room.id, crypto.randomUUID());
  }

  const startRoomUuid = roomIdMap.get(theme.startingRoomId)!;

  const { data: world, error: worldErr } = await createWorld({
    id: worldId,
    user_id: user.id,
    name: worldName || theme.name,
    theme: theme.id,
    icon: theme.icon,
    color: theme.color,
    config: {
      setting: theme.setting,
      monsterPool: theme.monsterPool,
      npcArchetypes: theme.npcArchetypes,
      itemPool: theme.itemPool,
      partyRoles: theme.partyRoles,
      gmContext: theme.gmContext,
      mainQuest: theme.mainQuest,
      itemTable: theme.itemTable,
      enemyTable: theme.enemyTable,
    },
    party_state: {
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
    },
  });

  if (worldErr || !world) {
    console.error("[worlds/generate] Failed to create world:", worldErr);
    return NextResponse.json({ error: "Failed to create world" }, { status: 500 });
  }

  const createdRooms: Array<{ id: string; themeRoomId: string; name: string; roomType: string }> = [];
  const failedRooms: string[] = [];

  for (const room of theme.rooms) {
    const roomUuid = roomIdMap.get(room.id)!;
    const connections = room.connections.map((connId) => ({
      roomId: roomIdMap.get(connId) || connId,
      name: theme.rooms.find((r) => r.id === connId)?.name || connId,
    }));

    const roomRules = buildRoomRules(theme, room);

    const { error: roomErr } = await createGameAdmin({
      id: roomUuid,
      user_id: user.id,
      name: room.name,
      icon: room.icon,
      color: theme.color,
      config: {
        template: "exploration",
        rules: roomRules,
        name: room.name,
        playerCount: 4,
        hostId: "gm",
      },
      is_active: true,
      world_id: worldId,
      room_type: room.roomType,
      room_connections: connections,
      room_description: room.description,
    });

    if (roomErr) {
      console.error(`[worlds/generate] Failed to create room "${room.name}":`, roomErr);
      failedRooms.push(room.name);
    } else {
      createdRooms.push({ id: roomUuid, themeRoomId: room.id, name: room.name, roomType: room.roomType });
    }
  }

  const minRequired = Math.ceil(theme.rooms.length * 0.5);
  if (createdRooms.length < minRequired) {
    console.error(
      `[worlds/generate] Only ${createdRooms.length}/${theme.rooms.length} rooms created (need ≥${minRequired}). Cleaning up world ${worldId}. Failed: ${failedRooms.join(", ")}`,
    );
    await deleteWorld(worldId, user.id);
    return NextResponse.json(
      { error: `Failed to create enough game rooms (${createdRooms.length}/${theme.rooms.length} succeeded, need ≥${minRequired}). Please try again.` },
      { status: 500 },
    );
  }

  if (failedRooms.length > 0) {
    console.warn(`[worlds/generate] Partial success: ${createdRooms.length}/${theme.rooms.length} rooms created. Failed: ${failedRooms.join(", ")}`);
  }

  const actualStartRoom = createdRooms.find((r) => r.id === startRoomUuid) || createdRooms[0];

  return NextResponse.json({
    worldId,
    startRoomId: actualStartRoom.id,
    rooms: createdRooms,
  });
}

export function buildRoomRules(theme: ReturnType<typeof getWorldThemeById> & object, room: (typeof theme)["rooms"][number]): string {
  const t = theme as NonNullable<ReturnType<typeof getWorldThemeById>>;
  const lines: string[] = [];

  lines.push(`SETTING: ${t.setting}`);
  lines.push(`\nLOCATION: ${room.name} — ${room.description}`);
  lines.push(`ROOM TYPE: ${room.roomType}`);

  if (room.npcs && room.npcs.length > 0) {
    lines.push(`NPCs PRESENT: ${room.npcs.join(", ")}`);
  }
  if (room.encounters && room.encounters.length > 0) {
    lines.push(`POSSIBLE ENCOUNTERS: ${room.encounters.join(", ")}`);
  }

  const connNames = room.connections.map((c) => t.rooms.find((r) => r.id === c)?.name || c);
  lines.push(`CONNECTED LOCATIONS: ${connNames.join(", ")}`);

  lines.push(`\nAVAILABLE ITEMS IN THIS WORLD: ${t.itemPool.join(", ")}`);

  lines.push(`\n${t.gmContext}`);

  lines.push(`\nOBJECTIVE: Explore this location. Interact with NPCs, fight enemies, find items, and advance quests. Use directives to update game state.`);

  lines.push(`\nGM DIRECTIVES (use inline — stripped from player view):
- SCENE: <room_name> — Signal party wants to move (UI will handle room transition)
- HP: <PlayerName> | <+/-amount> — Damage or heal
- MP: <PlayerName> | <+/-amount> — Mana change
- ITEM: <PlayerName> | + <ItemName> — Add item
- ITEM: <PlayerName> | - <ItemName> — Remove item
- SKILL_CHECK: <PlayerName> | <SkillName> | DC:<number> | <roll> — Skill check
- COMBAT: start | <EnemyName> | hp:<hp> | atk:<atk> | def:<def> — Begin combat with stats
- COMBAT: end — End combat
- DICE: <CharName> | d20 | <roll> | +<modifier> | = <total> | <context> — Show dice roll
- XP: <amount> | <reason> — Award XP to party
- LOOT: <ItemName> | <rarity> | <description> — Drop loot
- LEVEL_UP: <PlayerName> | <newLevel> — Level up
- SHOP: open | <item1:price1, item2:price2> — Open shop
- SHOP: close — Close shop
- EQUIP: <PlayerName> | <ItemName> | <slot> — Equip item
- QUEST: <QuestName> | start | <description> — Start quest
- QUEST: <QuestName> | progress | <update> — Update quest
- QUEST: <QuestName> | complete | <summary> — Complete quest
- WORLD_EVENT: <eventId> | <description> — Global world event`);

  lines.push(`\nHOSTING RULES:
1. Describe this location vividly when the party arrives. Use sensory details: sights, sounds, smells, atmosphere.
2. NPCs speak in character with distinct voices and personalities. Give them memorable quirks.
3. For combat rooms: encounters trigger dynamically during exploration. Build tension before combat. Describe enemy appearance, formation, and behavior. Use COMBAT: start|<enemy> to begin, manage HP changes, and COMBAT: end when resolved. Drop loot via ITEM directives after victories.
4. For hub rooms: safe zone. NPCs offer quests (QUEST: start), trade items (ITEM directives), share world lore and hints about connected locations. Companions relax and share backstory.
5. For quest rooms: drive story forward. NPCs reveal critical info, assign objectives. Moral dilemmas with real consequences. Use QUEST: progress to track advancement.
6. For boss rooms: epic multi-phase encounter. Phase 1: setup and initial clash. Phase 2: boss reveals new abilities. Phase 3: final push. Companions coordinate tactics. Heavy HP changes. Major loot on victory.
7. For mystery rooms: present environmental puzzles. Clues hidden in descriptions. SKILL_CHECK for investigation/perception. Reward cleverness with items or quest progress.
8. When the party says they want to leave to a connected location, emit SCENE: <location_name> and let the system handle the room transition. Describe the journey briefly.
9. AI companions react proactively: suggest tactics before combat, warn of danger, comment on discoveries, argue about choices, use their skills contextually. They are NOT passive followers — they have opinions and act on them.
10. Use MOOD: dark for combat/dungeons, light for safe zones, neutral for outdoors.
11. Dynamically generate encounters from the POSSIBLE ENCOUNTERS list — vary difficulty based on party HP and previous victories.
12. Generate loot from AVAILABLE ITEMS appropriate to the encounter difficulty and room type.
13. NPCs may offer side quests that span multiple rooms. Use QUEST directives to track them.

IMPORTANT: Always emit directives when state changes. The UI relies on these.`);

  return lines.join("\n");
}
