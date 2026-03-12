"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { toast } from "sonner";
import type { SendMessageOptions } from "@/hooks/useHostRound";

interface UseGuestPlayerParams {
  gameId: string;
  isOwner: boolean;
  isRoundInProgress: boolean;
  handleSendMessageRef: React.MutableRefObject<((content: string, options?: SendMessageOptions) => Promise<void>) | null>;
  roomMembers: Array<{ id: string; guest_id?: string | null; player_id?: string | null; is_owner?: boolean; nickname?: string }>;
  refreshMembers: () => Promise<void>;
  onlineGuestPresences: Array<{ id: string; nickname: string }>;
}

export interface UseGuestPlayerReturn {
  guestId: string | null;
  guestMemberId: string | null;
  guestNickname: string | null;
  isGuestPlayer: boolean;
  enrichedGuestMembers: Array<{
    id: string;
    nickname: string;
    memberId?: string;
    playerId?: string;
    playerName?: string;
    playerRole?: string;
  }>;
  guestPlayerBinding: string | null;
  boardContentForViewer: string;
  handleGuestSendMessage: (content: string) => Promise<void>;
  handleAssignGuestToPlayer: (memberId: string, playerId: string | null) => Promise<void>;
}

export function useGuestPlayer({
  gameId,
  isOwner,
  isRoundInProgress,
  handleSendMessageRef,
  roomMembers,
  refreshMembers,
  onlineGuestPresences,
}: UseGuestPlayerParams): UseGuestPlayerReturn {
  const { session } = useAuth();
  const { games } = useGameContext();
  const {
    messages,
    setMessages,
    players,
    addMessage,
    selectedChannelId,
    userId,
    myBoardContent,
  } = useGameRoomContext();

  const currentGame = games.find((g) => g.id === gameId);

  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestMemberId, setGuestMemberId] = useState<string | null>(null);
  const [guestNickname, setGuestNickname] = useState<string | null>(null);

  const isGuestPlayer = !isOwner && !!guestId;

  // Read guestId / memberId from URL search params
  useEffect(() => {
    if (typeof window === "undefined" || !gameId) return;
    const guestIdKey = `guestId_${gameId}`;
    const searchParams = new URLSearchParams(window.location.search);
    const urlGuestId = searchParams.get("guestId");
    const urlMemberId = searchParams.get("memberId");
    if (urlGuestId) {
      setGuestId(urlGuestId);
      localStorage.setItem(guestIdKey, urlGuestId);
    } else if (!session?.user?.id) {
      const stored = localStorage.getItem(guestIdKey);
      if (stored) {
        setGuestId(stored);
      } else {
        const legacy = localStorage.getItem("guestId");
        if (legacy) {
          setGuestId(legacy);
          localStorage.setItem(guestIdKey, legacy);
          localStorage.removeItem("guestId");
        }
      }
    }
    if (urlMemberId) {
      setGuestMemberId(urlMemberId);
      localStorage.setItem(`member_${gameId}`, urlMemberId);
    } else {
      const stored = localStorage.getItem(`member_${gameId}`);
      if (stored) setGuestMemberId(stored);
    }
    const storedNickname = localStorage.getItem(`nickname_${gameId}`);
    if (storedNickname) setGuestNickname(storedNickname);
  }, [gameId, session?.user?.id]);

  const enrichedGuestMembers = useMemo(() => {
    return onlineGuestPresences.map((g) => {
      const member = roomMembers.find((m) => m.guest_id === g.id && !m.is_owner);
      const boundPlayer = member?.player_id ? players.find((p) => p.id === member.player_id) : null;
      return {
        id: g.id,
        nickname: g.nickname,
        memberId: member?.id,
        playerId: boundPlayer?.id,
        playerName: boundPlayer?.name,
        playerRole: boundPlayer?.role,
      };
    });
  }, [onlineGuestPresences, roomMembers, players]);

  const guestPlayerBinding = useMemo(() => {
    if (!isGuestPlayer || !guestId) return null;
    return roomMembers.find((m) => m.guest_id === guestId && !m.is_owner)?.player_id ?? null;
  }, [isGuestPlayer, guestId, roomMembers]);

  const boardContentForViewer = useMemo(() => {
    if (isGuestPlayer) return guestPlayerBinding ? myBoardContent[guestPlayerBinding] ?? "" : "";
    return myBoardContent[userId] ?? "";
  }, [isGuestPlayer, guestPlayerBinding, myBoardContent, userId]);

  // Owner: auto-trigger AI when a guest message arrives via Realtime
  const lastProcessedGuestMsgRef = useRef<string | null>(null);
  const pendingGuestMsgsRef = useRef<Array<{ content: string; channelId?: string; senderId?: string; senderName?: string }>>([]);
  const hydratedMsgIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    if (hydratedMsgIdsRef.current === null) {
      hydratedMsgIdsRef.current = new Set(messages.map((m) => m.id));
      const guestMsgs = messages.filter(
        (m) => (m as unknown as { isGuestMessage?: boolean }).isGuestMessage && !m.isAI
      );
      if (guestMsgs.length > 0) {
        lastProcessedGuestMsgRef.current = guestMsgs[guestMsgs.length - 1].id;
      }
      return;
    }

    const guestMessages = messages.filter(
      (m) => (m as unknown as { isGuestMessage?: boolean }).isGuestMessage && !m.isAI
    );
    if (guestMessages.length === 0) return;
    const latest = guestMessages[guestMessages.length - 1];

    if (latest.id === lastProcessedGuestMsgRef.current) return;
    if (hydratedMsgIdsRef.current.has(latest.id)) {
      lastProcessedGuestMsgRef.current = latest.id;
      return;
    }

    lastProcessedGuestMsgRef.current = latest.id;

    const payload = {
      content: latest.content,
      channelId: (latest as unknown as { channelId?: string }).channelId ?? undefined,
      senderId: latest.senderId,
      senderName: latest.senderName,
    };

    if (isRoundInProgress) {
      pendingGuestMsgsRef.current.push(payload);
      return;
    }

    handleSendMessageRef.current?.(payload.content, {
      skipAddMessage: true,
      channelId: payload.channelId,
      senderId: payload.senderId,
      senderName: payload.senderName,
    });
  }, [messages, isOwner, isRoundInProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process queued guest messages once the current round finishes
  useEffect(() => {
    if (isRoundInProgress || !isOwner) return;
    if (pendingGuestMsgsRef.current.length === 0) return;
    const next = pendingGuestMsgsRef.current.shift();
    if (next) {
      handleSendMessageRef.current?.(next.content, {
        skipAddMessage: true,
        channelId: next.channelId,
        senderId: next.senderId,
        senderName: next.senderName,
      });
    }
  }, [isRoundInProgress, isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGuestSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !gameId) return;
    const cfgChannels = currentGame?.config?.channels;
    const channelId = selectedChannelId ?? cfgChannels?.[0]?.id ?? "game-room";

    const messageId = `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    addMessage(
      {
        id: messageId,
        senderId: guestId ?? "guest",
        senderName: guestNickname ?? "Guest",
        senderAvatar: "#10b981",
        content,
        isAI: false,
        isGuestMessage: true,
      },
      channelId
    );

    try {
      const res = await fetch(`/api/games/${gameId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          guestId,
          content,
          nickname: guestNickname ?? "Guest",
          channelId,
        }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 429) {
          toast.error("Sending too fast — please wait a moment.");
        } else {
          toast.error(data.error ?? "Failed to send message");
        }
      }
    } catch (e) {
      console.error("[guest message]", e);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.error("Failed to send message");
    }
  }, [gameId, guestId, guestNickname, selectedChannelId, currentGame?.config?.channels, addMessage, setMessages]);

  const handleAssignGuestToPlayer = useCallback(async (memberId: string, playerId: string | null) => {
    if (!session?.access_token || !memberId) return;
    try {
      const res = await fetch(`/api/games/${gameId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        toast.error(playerId ? "Failed to assign guest" : "Failed to unassign guest");
        return;
      }
      await refreshMembers();
    } catch {
      toast.error(playerId ? "Failed to assign guest" : "Failed to unassign guest");
    }
  }, [gameId, session?.access_token, refreshMembers]);

  return {
    guestId,
    guestMemberId,
    guestNickname,
    isGuestPlayer,
    enrichedGuestMembers,
    guestPlayerBinding,
    boardContentForViewer,
    handleGuestSendMessage,
    handleAssignGuestToPlayer,
  };
}
