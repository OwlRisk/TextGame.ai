"use client";

import { useEffect, useState, useCallback } from "react";
import { MEMBERS_POLL_INTERVAL_MS, MEMBERS_MAX_ERRORS } from "@/lib/game-room-constants";

export interface RoomMember {
  id: string;
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
  guest_id: string | null;
}

/**
 * Polls the room members API at a regular interval.
 * Stops polling after consecutive failures to avoid spamming the server.
 */
export function useRoomMembers(gameId: string) {
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);

  useEffect(() => {
    if (!gameId) return;
    let consecutiveErrors = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timer = setTimeout(() => { load(); }, MEMBERS_POLL_INTERVAL_MS);
    };

    const load = () => {
      const url = `/api/games/${gameId}/members`;
      fetch(url)
        .then((r) => r.ok ? r.json() : null)
        .then((data: { members?: RoomMember[] } | null) => {
          if (data?.members) {
            setRoomMembers(data.members);
            consecutiveErrors = 0;
          } else {
            consecutiveErrors++;
          }
          if (consecutiveErrors < MEMBERS_MAX_ERRORS) schedule();
        })
        .catch(() => {
          consecutiveErrors++;
          if (consecutiveErrors < MEMBERS_MAX_ERRORS) schedule();
        });
    };

    load();
    return () => { if (timer) clearTimeout(timer); };
  }, [gameId]);

  const refreshMembers = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await fetch(`/api/games/${gameId}/members`).then((r) => r.ok ? r.json() : null);
      if (data?.members) setRoomMembers(data.members);
    } catch { /* ignore */ }
  }, [gameId]);

  return { roomMembers, setRoomMembers, refreshMembers } as const;
}
