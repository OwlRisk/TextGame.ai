import { NextRequest, NextResponse } from "next/server";
import { createWorld, getWorlds, createGame } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getWorlds(user.id);
  if (error) return NextResponse.json({ error: "Failed to load worlds" }, { status: 500 });
  return NextResponse.json({ worlds: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, theme, icon, color, config, rooms } = body;

  if (!name || !theme) {
    return NextResponse.json({ error: "name and theme are required" }, { status: 400 });
  }

  const worldId = crypto.randomUUID();

  const { data: world, error: worldErr } = await createWorld({
    id: worldId,
    user_id: user.id,
    name,
    theme,
    icon: icon || "⚔️",
    color: color || "#7c2d12",
    config: config || {},
    party_state: body.partyState || {},
  });

  if (worldErr || !world) {
    return NextResponse.json({ error: "Failed to create world" }, { status: 500 });
  }

  const createdRooms: Array<{ id: string; name: string; roomType: string }> = [];
  if (rooms && Array.isArray(rooms)) {
    for (const room of rooms) {
      const roomId = crypto.randomUUID();
      const { error: roomErr } = await createGame({
        id: roomId,
        user_id: user.id,
        name: room.name || "Unknown Room",
        icon: room.icon || "🏠",
        color: room.color || "#44403c",
        config: room.config || { template: "exploration", rules: "", name: room.name, playerCount: 4, hostId: "gm" },
        is_active: true,
        world_id: worldId,
        room_type: room.roomType || "hub",
        room_connections: room.connections || [],
        room_description: room.description || "",
      });
      if (!roomErr) {
        createdRooms.push({ id: roomId, name: room.name, roomType: room.roomType });
      }
    }
  }

  return NextResponse.json({ world, rooms: createdRooms });
}
