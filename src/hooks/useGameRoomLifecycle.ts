import { useEffect, useRef } from "react";

interface UseGameRoomLifecycleParams {
  gamePhase: string;
  gameId: string;
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
  setActiveVote: (v: null) => void;
}

export function useGameRoomLifecycle({
  gamePhase,
  gameId,
  timerEndsAt,
  addMessage,
  setTimerEndsAt,
  setActiveVote,
}: UseGameRoomLifecycleParams) {
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Timer expiry (vote countdown etc.)
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
      setActiveVote(null);
    };
    if (remaining <= 0) {
      fire();
      return;
    }
    const timeout = setTimeout(fire, remaining);
    return () => clearTimeout(timeout);
  }, [timerEndsAt, addMessage, setTimerEndsAt, setActiveVote]);
}
