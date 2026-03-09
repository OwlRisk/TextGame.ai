import { useEffect, useRef } from "react";
import { GAME_INACTIVITY_TIMEOUT_MS } from "@/lib/game-room-constants";

interface UseGameRoomLifecycleParams {
  gamePhase: string;
  isOwner: boolean;
  isOwnerOnline: boolean | null;
  gameId: string;
  currentGameExists: boolean;
  messagesLength: number;
  timerEndsAt: number | null;
  addMessage: (msg: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    isAI: boolean;
    isSystemMessage: boolean;
  }) => void;
  setTimerEndsAt: (v: number | null) => void;
  setGameOverSummary: (v: string) => void;
  setGamePhase: (v: string) => void;
  updateGame: (id: string, data: { isActive: boolean }) => void;
}

export function useGameRoomLifecycle({
  gamePhase,
  isOwner,
  isOwnerOnline,
  gameId,
  currentGameExists,
  messagesLength,
  timerEndsAt,
  addMessage,
  setTimerEndsAt,
  setGameOverSummary,
  setGamePhase,
  updateGame,
}: UseGameRoomLifecycleParams) {
  // Keep stable refs so interval/timeout callbacks always see the latest values
  const callbacksRef = useRef({ setGameOverSummary, setGamePhase, updateGame, currentGameExists });
  useEffect(() => {
    callbacksRef.current = { setGameOverSummary, setGamePhase, updateGame, currentGameExists };
  });

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Timer expiry
  useEffect(() => {
    if (!timerEndsAt) return;
    const remaining = timerEndsAt - Date.now();
    const fire = () => {
      addMessage({
        senderId: "system",
        senderName: "System",
        senderAvatar: "#6366f1",
        content: "[System: timer expired]",
        isAI: false,
        isSystemMessage: true,
      });
      setTimerEndsAt(null);
    };
    if (remaining <= 0) {
      fire();
      return;
    }
    const timeout = setTimeout(fire, remaining);
    return () => clearTimeout(timeout);
  }, [timerEndsAt, addMessage, setTimerEndsAt]);

  // Inactivity auto-end (2 hours)
  const lastActivityRef = useRef(Date.now());
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [messagesLength]);
  useEffect(() => {
    if (gamePhase !== "active") return;
    const check = () => {
      if (!isMountedRef.current) return;
      if (Date.now() - lastActivityRef.current >= GAME_INACTIVITY_TIMEOUT_MS) {
        const cbs = callbacksRef.current;
        cbs.setGameOverSummary(
          "Game ended due to inactivity (2 hours with no messages).",
        );
        cbs.setGamePhase("ended");
        if (cbs.currentGameExists) cbs.updateGame(gameId, { isActive: false });
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [gamePhase, gameId]);

  // Owner-leave auto-end (5 min offline)
  const ownerLeftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (gamePhase !== "active" || isOwner) {
      if (ownerLeftTimerRef.current) {
        clearTimeout(ownerLeftTimerRef.current);
        ownerLeftTimerRef.current = null;
      }
      return;
    }
    if (isOwnerOnline === false) {
      if (!ownerLeftTimerRef.current) {
        ownerLeftTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          const cbs = callbacksRef.current;
          cbs.setGameOverSummary("The host has left the game. Game ended.");
          cbs.setGamePhase("ended");
        }, 5 * 60 * 1000);
      }
    } else {
      if (ownerLeftTimerRef.current) {
        clearTimeout(ownerLeftTimerRef.current);
        ownerLeftTimerRef.current = null;
      }
    }
    return () => {
      if (ownerLeftTimerRef.current) {
        clearTimeout(ownerLeftTimerRef.current);
        ownerLeftTimerRef.current = null;
      }
    };
  }, [gamePhase, isOwner, isOwnerOnline, setGameOverSummary, setGamePhase]);
}
