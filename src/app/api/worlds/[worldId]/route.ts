import { NextRequest, NextResponse } from "next/server";
import { getWorld, getWorldRooms, updateWorld, deleteWorld } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [worldRes, roomsRes] = await Promise.all([
    getWorld(worldId),
    getWorldRooms(worldId),
  ]);

  if (worldRes.error || !worldRes.data) {
    return NextResponse.json({ error: "World not found" }, { status: 404 });
  }

  return NextResponse.json({
    world: worldRes.data,
    rooms: roomsRes.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await updateWorld(worldId, body);
  if (error) return NextResponse.json({ error: "Failed to update world" }, { status: 500 });
  return NextResponse.json({ world: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await deleteWorld(worldId, user.id);
  if (error) return NextResponse.json({ error: "Failed to delete world" }, { status: 500 });
  return NextResponse.json({ success: true });
}
