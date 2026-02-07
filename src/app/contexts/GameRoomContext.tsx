"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Message } from "@/app/components/chat-area";
import { Player } from "@/app/components/player-panel";
import {
  type GamePhaseState,
  DEFAULT_GAME_PHASE,
} from "@/app/config/game-phase";

interface PrivateMessage {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
}

interface GameRoomContextType {
  // State
  messages: Message[];
  players: Player[];
  gamePhase: string;
  gamePhaseState: GamePhaseState;
  selectedChannelId: string | null;
  currentSpeakerId: string | null;
  typingUsers: { name: string; avatar: string }[];
  privateMessages: Record<string, PrivateMessage[]>;
  gameProgress: string;
  myBoardContent: Record<string, string>; // playerId -> board content
  sections: Array<{ id: string; name: string }>;
  sectionsLoading: boolean;
  gameEnded: boolean;
  gameResult: { winner: string; message: string } | null;
  aiSuggestedPrompts: string[];

  // Actions - Messages
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => string | undefined;
  addStreamingMessage: (msg: Omit<Message, "id" | "timestamp" | "content" | "isStreaming">) => string;
  updateStreamingMessage: (messageId: string, content: string, isComplete?: boolean) => void;
  addEventNotification: (content: string) => void;
  addPrivateMessage: (playerNameOrId: string, content: string, fromName: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  // Actions - Players
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Actions - Game State
  setGamePhase: React.Dispatch<React.SetStateAction<string>>;
  setGamePhaseState: React.Dispatch<React.SetStateAction<GamePhaseState>>;
  setSelectedChannelId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentSpeakerId: React.Dispatch<React.SetStateAction<string | null>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<{ name: string; avatar: string }[]>>;
  setGameProgress: React.Dispatch<React.SetStateAction<string>>;
  setMyBoardContent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSections: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string }>>>;
  setSectionsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setGameEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setGameResult: React.Dispatch<React.SetStateAction<{ winner: string; message: string } | null>>;
  setAiSuggestedPrompts: React.Dispatch<React.SetStateAction<string[]>>;

  // Utility
  resetGame: () => void;
  userId: string;
}

const GameRoomContext = createContext<GameRoomContextType | undefined>(undefined);

interface GameRoomProviderProps {
  children: ReactNode;
  gameId: string;
}

export function GameRoomProvider({ children, gameId }: GameRoomProviderProps) {
  const userId = "user-1"; // TODO: Get from auth context

  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePhase, setGamePhase] = useState<string>("waiting");
  const [gamePhaseState, setGamePhaseState] = useState<GamePhaseState>(DEFAULT_GAME_PHASE);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>("game-room");
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ name: string; avatar: string }[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessage[]>>({});
  const [gameProgress, setGameProgress] = useState<string>("");
  const [myBoardContent, setMyBoardContent] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; message: string } | null>(null);
  const [aiSuggestedPrompts, setAiSuggestedPrompts] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load game room state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gameRoom_${gameId}`);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.messages) {
          setMessages(
            state.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }))
          );
        }
        if (state.players) setPlayers(state.players);
        if (state.gamePhase) setGamePhase(state.gamePhase);
        if (state.gamePhaseState) setGamePhaseState(state.gamePhaseState);
        if (state.selectedChannelId) setSelectedChannelId(state.selectedChannelId);
        if (state.gameProgress) setGameProgress(state.gameProgress);
        if (state.myBoardContent) setMyBoardContent(state.myBoardContent);
        if (state.sections) setSections(state.sections);
        if (state.privateMessages) {
          const pm: Record<string, PrivateMessage[]> = {};
          for (const [pid, list] of Object.entries(state.privateMessages) as [
            string,
            Array<{ id: string; from: string; content: string; timestamp: string }>
          ][]) {
            pm[pid] = (list || []).map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
          }
          setPrivateMessages(pm);
        }
      }
    } catch (e) {
      console.error("Error loading game room state:", e);
    }
    setIsHydrated(true);
  }, [gameId]);

  // Save game room state to localStorage
  useEffect(() => {
    if (!isHydrated) return;

    const timeoutId = setTimeout(() => {
      try {
        const trimmedMessages = messages.slice(-60).map((m) => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        }));

        const trimmedPrivateMessages: Record<
          string,
          Array<{ id: string; from: string; content: string; timestamp: string }>
        > = {};
        for (const [pid, list] of Object.entries(privateMessages)) {
          const arr = (list || []).slice(-20).map((m) => ({
            ...m,
            timestamp:
              m.timestamp instanceof Date
                ? m.timestamp.toISOString()
                : new Date(m.timestamp).toISOString(),
          }));
          if (arr.length) trimmedPrivateMessages[pid] = arr;
        }

        const state = {
          messages: trimmedMessages,
          players,
          gamePhase,
          gamePhaseState,
          selectedChannelId,
          gameProgress,
          myBoardContent,
          sections,
          privateMessages: trimmedPrivateMessages,
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem(`gameRoom_${gameId}`, JSON.stringify(state));
      } catch (e) {
        console.error("Error saving game room state:", e);
      }
    }, 1000); // Debounce

    return () => clearTimeout(timeoutId);
  }, [
    gameId,
    messages,
    players,
    gamePhase,
    gamePhaseState,
    selectedChannelId,
    gameProgress,
    myBoardContent,
    sections,
    privateMessages,
    isHydrated,
  ]);

  const addMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp">) => {
      if (!isMountedRef.current) return;
      const newMessage: Message = {
        ...msg,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        // Prevent duplicates
        const last = prev[prev.length - 1];
        if (
          last &&
          last.senderId === newMessage.senderId &&
          last.content === newMessage.content
        )
          return prev;

        const exists = prev.some(
          (m) =>
            m.senderId === newMessage.senderId &&
            m.content === newMessage.content &&
            Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
        );
        if (exists) return prev;

        // Limit to last 100 messages
        const updated = [...prev, newMessage];
        if (updated.length > 100) {
          return updated.slice(-100);
        }
        return updated;
      });
      return newMessage.id;
    },
    []
  );

  const addStreamingMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp" | "content" | "isStreaming">): string => {
      if (!isMountedRef.current) return "";
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newMessage: Message = {
        ...msg,
        id: messageId,
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      return messageId;
    },
    []
  );

  const updateStreamingMessage = useCallback(
    (messageId: string, content: string, isComplete: boolean = false) => {
      if (!isMountedRef.current) return;
      const displayContent = isComplete && !content?.trim() ? "…" : content;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: displayContent, isStreaming: !isComplete }
            : m
        )
      );
    },
    []
  );

  const addEventNotification = useCallback(
    (content: string) => {
      addMessage({
        senderId: "system",
        senderName: "System",
        senderAvatar: "#6366f1",
        content,
        isAI: false,
        isSystemMessage: true,
      });
    },
    [addMessage]
  );

  const addPrivateMessage = useCallback(
    (playerNameOrId: string, content: string, fromName: string) => {
      if (!isMountedRef.current) return;
      setPrivateMessages((prev) => {
        const isYou = playerNameOrId.trim().toLowerCase() === "you";
        const playerId = isYou
          ? userId
          : players.find((p) => p.id === playerNameOrId || p.name === playerNameOrId)?.id ??
            playerNameOrId;
        const list = prev[playerId] ?? [];
        return {
          ...prev,
          [playerId]: [
            ...list,
            {
              id: `pm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              from: fromName,
              content,
              timestamp: new Date(),
            },
          ],
        };
      });
    },
    [userId, players]
  );

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? { ...player, ...updates } : player))
    );
  }, []);

  const resetGame = useCallback(() => {
    setMessages([]);
    setPlayers([]);
    setGamePhase("waiting");
    setGamePhaseState(DEFAULT_GAME_PHASE);
    setCurrentSpeakerId(null);
    setTypingUsers([]);
    setPrivateMessages({});
    setGameProgress("");
    setMyBoardContent({});
    setGameEnded(false);
    setGameResult(null);
    setAiSuggestedPrompts([]);
  }, []);

  return (
    <GameRoomContext.Provider
      value={{
        messages,
        players,
        gamePhase,
        gamePhaseState,
        selectedChannelId,
        currentSpeakerId,
        typingUsers,
        privateMessages,
        gameProgress,
        myBoardContent,
        sections,
        sectionsLoading,
        gameEnded,
        gameResult,
        aiSuggestedPrompts,
        addMessage,
        addStreamingMessage,
        updateStreamingMessage,
        addEventNotification,
        addPrivateMessage,
        setMessages,
        setPlayers,
        updatePlayer,
        setGamePhase,
        setGamePhaseState,
        setSelectedChannelId,
        setCurrentSpeakerId,
        setTypingUsers,
        setGameProgress,
        setMyBoardContent,
        setSections,
        setSectionsLoading,
        setGameEnded,
        setGameResult,
        setAiSuggestedPrompts,
        resetGame,
        userId,
      }}
    >
      {children}
    </GameRoomContext.Provider>
  );
}

export function useGameRoomContext() {
  const context = useContext(GameRoomContext);
  if (context === undefined) {
    throw new Error("useGameRoomContext must be used within a GameRoomProvider");
  }
  return context;
}
