"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface OnlineGuestPresence {
  id: string;
  nickname: string;
}

interface UseGameRoomPresenceParams {
  gameId: string;
  isOwner: boolean;
  gamesLoading: boolean;
  sessionUserId: string | undefined;
  guestNickname: string | null;
}

/**
 * Manages Supabase Presence for a game room.
 * - Owner broadcasts their online status
 * - All clients track who's online (owner + guests)
 */
export function useGameRoomPresence({
  gameId,
  isOwner,
  gamesLoading,
  sessionUserId,
  guestNickname,
}: UseGameRoomPresenceParams) {
  const [onlineGuestPresences, setOnlineGuestPresences] = useState<OnlineGuestPresence[]>([]);
  const [isOwnerOnline, setIsOwnerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!gameId) return;
    if (gamesLoading) return;

    // Read guestId/nickname directly from URL or localStorage instead of React state.
    // This prevents a double-channel race condition: if we depend on `guestId` state,
    // the effect runs first with guestId=null (key="anon"), then re-runs when state
    // updates — creating two channels with the same name simultaneously, causing
    // Supabase to reject the second subscription silently (guest never appears).
    const directGuestId = !sessionUserId
      ? (new URLSearchParams(window.location.search).get("guestId")
          ?? localStorage.getItem(`guestId_${gameId}`)
          ?? null)
      : null;
    const directNickname = !sessionUserId
      ? (localStorage.getItem(`nickname_${gameId}`) ?? guestNickname ?? "Guest")
      : null;

    const channel = supabase.channel(`presence:${gameId}`, {
      config: { presence: { key: sessionUserId ?? directGuestId ?? "anon" } },
    });

    const syncGuestsFromState = (state: Record<string, Array<{ role?: string; nickname?: string }>>) => {
      const guests = Object.entries(state).flatMap(([key, entries]) =>
        entries
          .filter((p) => p.role === "guest")
          .map((p) => ({ id: key, nickname: p.nickname ?? "Guest" }))
      );
      setOnlineGuestPresences(guests);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        const ownerPresent = Object.values(state)
          .flat()
          .some((p) => p.role === "owner");
        setIsOwnerOnline(ownerPresent);
        syncGuestsFromState(state);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if ((newPresences as Array<{ role?: string }>).some((p) => p.role === "owner")) {
          setIsOwnerOnline(true);
        }
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        syncGuestsFromState(state);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        if ((leftPresences as Array<{ role?: string }>).some((p) => p.role === "owner")) {
          const ownerStillPresent = Object.values(state).flat().some((p) => p.role === "owner");
          setIsOwnerOnline(ownerStillPresent);
        }
        syncGuestsFromState(state);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (isOwner) {
            await channel.track({ role: "owner", userId: sessionUserId });
          } else {
            await channel.track({ role: "guest", nickname: directNickname ?? "Guest" });
          }
        }
      });

    // When the browser tab is closed/refreshed, React's useEffect cleanup does NOT run.
    // Calling channel.untrack() in beforeunload makes Supabase fire the leave event
    // on other clients immediately instead of waiting ~30 s for heartbeat timeout.
    const handleBeforeUnload = () => {
      channel.untrack();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      supabase.removeChannel(channel);
    };
  // guestNickname intentionally excluded from deps: we read it directly from
  // URL/localStorage above so the channel is created with the correct key on the
  // first run, preventing the double-channel race condition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, gamesLoading, isOwner, sessionUserId]);

  return { onlineGuestPresences, isOwnerOnline } as const;
}
