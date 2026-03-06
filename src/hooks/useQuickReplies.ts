import { useState, useEffect, useRef } from "react";
import { getPreferredModel } from "@/lib/model-prefs";

interface UseQuickRepliesParams<
  M extends { id: string; senderId: string; senderName: string; content: string; channelId?: string },
> {
  currentGameConfig: {
    name: string;
    rules?: string;
    template?: string;
  } | null;
  isGameChannel: boolean;
  selectedChannelId: string | null;
  messagesForChannel: M[];
  userId: string;
  gamePhase: string;
  isRoundInProgress: boolean;
  currentSpeakerId: string | null;
  humanGameIdentity: { name?: string } | null;
  players: Array<{ id: string; name?: string; role?: string }>;
  sessionAccessToken: string | null;
}

export function useQuickReplies<
  M extends { id: string; senderId: string; senderName: string; content: string; channelId?: string },
>({
  currentGameConfig,
  isGameChannel,
  selectedChannelId,
  messagesForChannel,
  userId,
  gamePhase,
  isRoundInProgress,
  currentSpeakerId,
  humanGameIdentity,
  players,
  sessionAccessToken,
}: UseQuickRepliesParams<M>) {
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
  const quickRepliesFailKeyRef = useRef<string | null>(null);

  const isHumanTurn =
    gamePhase === "ended" || !currentSpeakerId || currentSpeakerId === userId;

  useEffect(() => {
    if (!currentGameConfig || !isGameChannel) {
      setQuickRepliesLoading(false);
      setQuickReplies([]);
      return;
    }
    if (messagesForChannel.length === 0) {
      setQuickReplies([]);
      setQuickRepliesLoading(false);
      return;
    }
    if (isRoundInProgress || !isHumanTurn) {
      setQuickReplies([]);
      setQuickRepliesLoading(false);
      return;
    }
    const lastMessage = messagesForChannel[messagesForChannel.length - 1];
    if (lastMessage?.senderId === userId) {
      setQuickRepliesLoading(false);
      return;
    }
    const attemptKey = `${selectedChannelId ?? ""}:${lastMessage?.id ?? messagesForChannel.length}`;
    if (quickRepliesFailKeyRef.current === attemptKey) {
      setQuickRepliesLoading(false);
      return;
    }
    const abort = new AbortController();
    setQuickRepliesLoading(true);
    const recent = messagesForChannel
      .slice(-8)
      .map((m) => ({ senderName: m.senderName, content: m.content }));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionAccessToken)
      headers["Authorization"] = `Bearer ${sessionAccessToken}`;
    const humanPlayer = players.find((p) => p.id === userId);
    const humanName =
      humanGameIdentity?.name || humanPlayer?.name || "You";
    const humanRole = humanPlayer?.role ?? undefined;
    fetch("/api/suggest-quick-replies", {
      method: "POST",
      headers,
      signal: abort.signal,
      body: JSON.stringify({
        gameName: currentGameConfig.name,
        rules: currentGameConfig.rules,
        recentMessages: recent,
        gamePhase,
        playerName: humanName,
        playerRole: humanRole,
        preferredModel: getPreferredModel(),
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data: { suggestions?: string[] }) => {
        quickRepliesFailKeyRef.current = null;
        const list = Array.isArray(data.suggestions)
          ? data.suggestions.filter((s) => s && s.length <= 120).slice(0, 3)
          : [];
        setQuickReplies(list.length > 0 ? list : []);
      })
      .catch(() => {
        quickRepliesFailKeyRef.current = attemptKey;
        setQuickReplies([]);
      })
      .finally(() => setQuickRepliesLoading(false));
    return () => {
      abort.abort();
      setQuickRepliesLoading(false);
    };
  }, [
    isGameChannel,
    selectedChannelId ?? null,
    currentGameConfig?.name ?? null,
    gamePhase,
    isRoundInProgress,
    isHumanTurn,
    userId,
    messagesForChannel.length,
    sessionAccessToken ?? null,
  ]);

  return { quickReplies, quickRepliesLoading, setQuickReplies };
}
