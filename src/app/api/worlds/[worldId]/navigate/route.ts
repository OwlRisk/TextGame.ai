import { NextRequest, NextResponse } from "next/server";
import { getWorld, updateWorldPartyState } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;
  const user = await getAuthUserFromRequest(request);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { targetRoomId, partyState } = body;

  if (!targetRoomId) {
    return NextResponse.json({ error: "targetRoomId is required" }, { status: 400 });
  }

  const worldRes = await getWorld(worldId);
  if (worldRes.error || !worldRes.data) {
    return NextResponse.json({ error: "World not found" }, { status: 404 });
  }

  const updatedState = {
    ...(partyState || worldRes.data.party_state || {}),
    currentRoomId: targetRoomId,
    visitedRoomIds: Array.from(new Set([
      ...((partyState?.visitedRoomIds || worldRes.data.party_state?.visitedRoomIds || []) as string[]),
      targetRoomId,
    ])),
  };

  const { error } = await updateWorldPartyState(worldId, updatedState);
  if (error) return NextResponse.json({ error: "Failed to save party state" }, { status: 500 });

  return NextResponse.json({ success: true, targetRoomId, partyState: updatedState });
}
