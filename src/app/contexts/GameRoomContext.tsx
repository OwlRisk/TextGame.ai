"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { getGameRoomState, saveGameRoomState } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Message } from "@/app/components/chat-area";
import type { Player } from "@/types/player";
import {
  type GamePhaseState,
  type GameMood,
  type ActiveVote,
  DEFAULT_GAME_PHASE,
} from "@/app/config/game-phase";
import { fetchGeneratedAvatar, invalidateAvatarCache } from "@/lib/avatar";
import { AVATAR_STYLE_CHANGED_EVENT } from "@/lib/avatar-style-constants";
import type { GmState } from "@/lib/gm-state";

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
  myBoardContent: Record<string, string>; // playerId -> board content
  /** AI player's own private notes written via [MY_NOTES] — persisted per-game. */
  playerNotes: Record<string, string>; // playerId -> notes
  sections: Array<{ id: string; name: string; content: string }>;
  sectionsLoading: boolean;
  /** Chronological log of key game events recorded by RECORD_EVENT / ELIMINATE directives. */
  gameEvents: string[];
  gameEnded: boolean;
  gameResult: { winner: string; message: string } | null;
  aiSuggestedPrompts: string[];
  /** Human player's in-game name (and avatar key) for this game — AI-generated, persisted with room. */
  humanGameIdentity: { name: string } | null;
  /** Persisted avatar image URLs (key = "name|type") so they sync across devices. */
  avatarImageUrls: Record<string, string>;
  /** True until room state has been loaded (from DB or localStorage). Use to show loading UI. */
  isRoomLoading: boolean;

  // GM-driven universal UI state
  /** GM-set phase label (e.g. "Night · Round 2", "Puzzle 3") */
  phaseLabel: string;
  /** Visual mood for the chat area background */
  mood: GameMood;
  /** Structured vote initiated by GM via START_VOTE */
  activeVote: ActiveVote | null;
  /** Countdown timer end timestamp (Date.now() based), null = no timer */
  timerEndsAt: number | null;
  /** Summary text from GAME_OVER directive */
  gameOverSummary: string;
  /** Programmatic round counter */
  roundNumber: number;
  /** GM's persistent state — act, tension, quest log, location, etc. */
  gmState: GmState | null;
  /** LLM-generated story summary for session resume */
  storySummary: string;

  // Actions - Messages
  addMessage: (msg: Omit<Message, "id" | "timestamp"> & { id?: string }, channelId?: string) => string | undefined;
  addStreamingMessage: (msg: Omit<Message, "id" | "timestamp" | "content" | "isStreaming">, channelId?: string, initialContent?: string) => string;
  updateStreamingMessage: (messageId: string, content: string, isComplete?: boolean) => void;
  addEventNotification: (content: string) => void;
  addPrivateMessage: (playerNameOrId: string, content: string, fromName: string) => void;
  addReaction: (messageId: string, emoji: string, from: string) => void;
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
  setMyBoardContent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setPlayerNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSections: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; content: string }>>>;
  setSectionsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setGameEvents: React.Dispatch<React.SetStateAction<string[]>>;
  setGameEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setGameResult: React.Dispatch<React.SetStateAction<{ winner: string; message: string } | null>>;
  setAiSuggestedPrompts: React.Dispatch<React.SetStateAction<string[]>>;
  setHumanGameIdentity: React.Dispatch<React.SetStateAction<{ name: string } | null>>;
  /** Call when a generated avatar URL is first loaded so we persist it for this room (key = "name|type"). */
  onAvatarUrlLoaded: (key: string, url: string) => void;
  /** Force-regenerate a player/host avatar with DALL-E 3 (costs tokens). Returns the new URL. */
  regenerateAvatar: (playerName: string, type: 'host' | 'player', opts?: { gender?: string; background?: string; personality?: string; role?: string }) => Promise<string | null>;
  setPhaseLabel: React.Dispatch<React.SetStateAction<string>>;
  setMood: React.Dispatch<React.SetStateAction<GameMood>>;
  setActiveVote: React.Dispatch<React.SetStateAction<ActiveVote | null>>;
  setTimerEndsAt: React.Dispatch<React.SetStateAction<number | null>>;
  setGameOverSummary: React.Dispatch<React.SetStateAction<string>>;
  setRoundNumber: React.Dispatch<React.SetStateAction<number>>;
  setGmState: React.Dispatch<React.SetStateAction<GmState | null>>;
  setStorySummary: React.Dispatch<React.SetStateAction<string>>;

  // Utility
  resetGame: () => void;
  /** Immediately flush current state to DB (bypasses the 2s debounce). Call after player messages. */
  saveNow: () => void;
  userId: string;
}

const GameRoomContext = createContext<GameRoomContextType | undefined>(undefined);

interface GameRoomProviderProps {
  children: ReactNode;
  gameId: string;
}

export function GameRoomProvider({ children, gameId }: GameRoomProviderProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePhase, setGamePhase] = useState<string>("waiting");
  const [gamePhaseState, setGamePhaseState] = useState<GamePhaseState>(DEFAULT_GAME_PHASE);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>("game-room");
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ name: string; avatar: string }[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessage[]>>({});
  const [myBoardContent, setMyBoardContent] = useState<Record<string, string>>({});
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Array<{ id: string; name: string; content: string }>>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [gameEvents, setGameEvents] = useState<string[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; message: string } | null>(null);
  const [aiSuggestedPrompts, setAiSuggestedPrompts] = useState<string[]>([]);
  const [humanGameIdentity, setHumanGameIdentity] = useState<{ name: string } | null>(null);
  const [avatarImageUrls, setAvatarImageUrls] = useState<Record<string, string>>({});
  const [phaseLabel, setPhaseLabel] = useState("");
  const [mood, setMood] = useState<GameMood>("neutral");
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [gameOverSummary, setGameOverSummary] = useState("");
  const [roundNumber, setRoundNumber] = useState(0);
  const [gmState, setGmState] = useState<GmState | null>(null);
  const [storySummary, setStorySummary] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Track which messages have been persisted to game_messages table
  const savedMessageIdsRef = useRef<Set<string>>(new Set());

  const onAvatarUrlLoaded = useCallback((key: string, url: string) => {
    if (!key || !url || !url.startsWith("http")) return;
    setAvatarImageUrls((prev) => (prev[key] === url ? prev : { ...prev, [key]: url }));
  }, []);

  // When the user changes avatar style, the cached URLs in avatarImageUrls belong to
  // the OLD style. Clear the map so every GeneratedAvatar falls through to its
  // style-aware hook and re-fetches with the new style. The hook uses the in-memory
  // and localStorage caches (keyed by name|type|style), so re-fetches are instant
  // for styles the user has already visited.
  useEffect(() => {
    function handleStyleChange() {
      setAvatarImageUrls({});
    }
    window.addEventListener(AVATAR_STYLE_CHANGED_EVENT, handleStyleChange);
    return () => window.removeEventListener(AVATAR_STYLE_CHANGED_EVENT, handleStyleChange);
  }, []);

  const regenerateAvatar = useCallback(async (
    playerName: string,
    type: 'host' | 'player',
    opts?: { gender?: string; background?: string; personality?: string; role?: string },
  ): Promise<string | null> => {
    try {
      invalidateAvatarCache(playerName, type);
      const style = typeof window !== 'undefined' ? (localStorage.getItem('avatar_style_pack') ?? undefined) : undefined;
      const newUrl = await fetchGeneratedAvatar(
        playerName, type, gameId,
        opts?.role, opts?.background, opts?.personality, opts?.gender,
        true,
        style,
      );
      if (newUrl) {
        const key = `${playerName}|${type}`;
        setAvatarImageUrls((prev) => ({ ...prev, [key]: newUrl }));
      }
      return newUrl;
    } catch (err) {
      console.error('[regenerateAvatar] failed:', err);
      return null;
    }
  }, [gameId]);

  // Stable per-session ID to filter out our own Realtime echo
  const clientIdRef = useRef<string>("");
  if (!clientIdRef.current) {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("rt_client_id");
      if (stored) {
        clientIdRef.current = stored;
      } else {
        const id = crypto.randomUUID();
        sessionStorage.setItem("rt_client_id", id);
        clientIdRef.current = id;
      }
    } else {
      clientIdRef.current = "ssr";
    }
  }

  const isMountedRef = useRef(true);
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load game room state: local-first (show cache immediately, then sync from DB)
  useEffect(() => {
    function applyMessages(state: Record<string, unknown>, merge: boolean) {
      if (!state.messages || !Array.isArray(state.messages)) return;
      const incoming = (state.messages as any[]).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        isStreaming: false,
      }));
      if (merge) {
        setMessages((prev) => {
          if (prev.length === 0) return incoming;
          const localIds = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m: any) => !localIds.has(m.id));
          if (fresh.length === 0) return prev;
          const merged = [...prev, ...fresh];
          merged.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());
          return merged.length > 60 ? merged.slice(-60) : merged;
        });
      } else {
        setMessages(incoming);
      }
    }

    function applyNonMessageState(state: Record<string, unknown>) {
      if (state.players && (state.players as Player[]).length > 0) setPlayers(state.players as Player[]);
      if (state.gamePhase !== undefined) setGamePhase(state.gamePhase as string);
      if (state.gamePhaseState) setGamePhaseState(state.gamePhaseState as GamePhaseState);
      if (state.selectedChannelId !== undefined) setSelectedChannelId(state.selectedChannelId as string | null);
      if (state.myBoardContent) setMyBoardContent((state.myBoardContent as Record<string, string>) ?? {});
      if (state.playerNotes && typeof state.playerNotes === "object") {
        setPlayerNotes(state.playerNotes as Record<string, string>);
      }
      if (state.sections) setSections(state.sections as Array<{ id: string; name: string; content: string }>);
      if (state.gameEvents && Array.isArray(state.gameEvents)) setGameEvents(state.gameEvents as string[]);
      if (state.privateMessages && typeof state.privateMessages === "object") {
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
      if (state.humanGameIdentity && typeof (state.humanGameIdentity as any).name === "string") {
        setHumanGameIdentity({ name: (state.humanGameIdentity as any).name });
      }
      if (typeof state.phaseLabel === "string") setPhaseLabel(state.phaseLabel);
      if (state.mood === "dark" || state.mood === "light" || state.mood === "neutral") setMood(state.mood);
      if (typeof state.gameOverSummary === "string") setGameOverSummary(state.gameOverSummary);
      if (typeof state.roundNumber === "number") setRoundNumber(state.roundNumber);
      if (state.gmState && typeof state.gmState === "object") setGmState(state.gmState as GmState);
      if (typeof state.storySummary === "string") setStorySummary(state.storySummary);
    }

    if (!user?.id) {
      setIsHydrated(true);
      return;
    }

    try {
      const saved = localStorage.getItem(`gameRoom_${gameId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        applyMessages(parsed, false);
        applyNonMessageState(parsed);
      }
    } catch (_) {}

    getGameRoomState(gameId)
      .then(({ data, error }) => {
        if (!error && data != null) {
          const state = data as Record<string, unknown>;
          // Merge messages from DB to avoid wiping in-memory messages
          // generated between localStorage restore and DB response.
          applyMessages(state, true);
          applyNonMessageState(state);
        }
      })
      .catch((err) => {
        console.error("Failed to load game room state from DB:", err);
      })
      .finally(() => {
        setIsHydrated(true);
      });
  }, [gameId, user?.id]);

  /** Immediately flush current state to DB (bypasses the 2-second debounce). */
  const saveNow = useCallback(() => {
    if (isHydrated) setSaveTrigger((s) => s + 1);
  }, [isHydrated]);

  // Keep refs of key state for synchronous beforeunload save
  const messagesRef = useRef(messages);
  const gamePhaseRef = useRef(gamePhase);
  const gamePhaseStateRef = useRef(gamePhaseState);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const myBoardContentRef = useRef(myBoardContent);
  const playerNotesRef = useRef(playerNotes);
  const sectionsRef = useRef(sections);
  const gameEventsRef = useRef(gameEvents);
  const privateMessagesRef = useRef(privateMessages);
  const humanGameIdentityRef = useRef(humanGameIdentity);
  const avatarImageUrlsRef = useRef(avatarImageUrls);
  const phaseLabelRef = useRef(phaseLabel);
  const moodRef = useRef(mood);
  const gameOverSummaryRef = useRef(gameOverSummary);
  const roundNumberRef = useRef(roundNumber);
  const gmStateRef = useRef(gmState);
  const storySummaryRef = useRef(storySummary);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { gamePhaseStateRef.current = gamePhaseState; }, [gamePhaseState]);
  useEffect(() => { selectedChannelIdRef.current = selectedChannelId; }, [selectedChannelId]);
  useEffect(() => { myBoardContentRef.current = myBoardContent; }, [myBoardContent]);
  useEffect(() => { playerNotesRef.current = playerNotes; }, [playerNotes]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { gameEventsRef.current = gameEvents; }, [gameEvents]);
  useEffect(() => { privateMessagesRef.current = privateMessages; }, [privateMessages]);
  useEffect(() => { humanGameIdentityRef.current = humanGameIdentity; }, [humanGameIdentity]);
  useEffect(() => { avatarImageUrlsRef.current = avatarImageUrls; }, [avatarImageUrls]);
  useEffect(() => { phaseLabelRef.current = phaseLabel; }, [phaseLabel]);
  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { gameOverSummaryRef.current = gameOverSummary; }, [gameOverSummary]);
  useEffect(() => { roundNumberRef.current = roundNumber; }, [roundNumber]);
  useEffect(() => { gmStateRef.current = gmState; }, [gmState]);
  useEffect(() => { storySummaryRef.current = storySummary; }, [storySummary]);

  // Synchronously save to localStorage on page close to prevent state loss
  useEffect(() => {
    if (!isHydrated) return;
    const handleBeforeUnload = () => {
      try {
        const state = {
          messages: messagesRef.current.slice(-60).map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
          })),
          players: playersRef.current,
          gamePhase: gamePhaseRef.current,
          gamePhaseState: gamePhaseStateRef.current,
          selectedChannelId: selectedChannelIdRef.current,
          myBoardContent: myBoardContentRef.current,
          playerNotes: Object.keys(playerNotesRef.current).length ? playerNotesRef.current : undefined,
          sections: sectionsRef.current,
          gameEvents: gameEventsRef.current,
          privateMessages: Object.fromEntries(
            Object.entries(privateMessagesRef.current)
              .map(([pid, list]) => [pid, (list || []).slice(-20).map((m) => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
              }))])
              .filter(([, arr]) => (arr as unknown[]).length > 0)
          ),
          humanGameIdentity: humanGameIdentityRef.current || undefined,
          phaseLabel: phaseLabelRef.current || undefined,
          mood: moodRef.current !== "neutral" ? moodRef.current : undefined,
          gameOverSummary: gameOverSummaryRef.current || undefined,
          roundNumber: roundNumberRef.current || undefined,
          gmState: gmStateRef.current || undefined,
          storySummary: storySummaryRef.current || undefined,
          savedAt: new Date().toISOString(),
          clientId: clientIdRef.current,
        };
        localStorage.setItem(`gameRoom_${gameId}`, JSON.stringify(state));
      } catch { /* best effort */ }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameId, isHydrated]);

  // Bump saveTrigger when state changes (debounced) so save effect runs with fixed deps
  useEffect(() => {
    if (!isHydrated) return;
    const timeoutId = setTimeout(() => setSaveTrigger((s) => s + 1), 2000);
    return () => clearTimeout(timeoutId);
  }, [
    isHydrated,
    messages,
    players,
    gamePhase,
    gamePhaseState,
    selectedChannelId,
    myBoardContent,
    playerNotes,
    sections,
    gameEvents,
    privateMessages,
    humanGameIdentity,
    avatarImageUrls,
    phaseLabel,
    roundNumber,
    gmState,
    storySummary,
  ]);

  // Save game room state: fixed dependency array to satisfy React strict rules
  useEffect(() => {
    if (!isHydrated) return;

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
      myBoardContent,
      playerNotes: Object.keys(playerNotes).length ? playerNotes : undefined,
      sections,
      gameEvents,
      privateMessages: trimmedPrivateMessages,
      humanGameIdentity: humanGameIdentity || undefined,
      phaseLabel: phaseLabel || undefined,
      mood: mood !== "neutral" ? mood : undefined,
      gameOverSummary: gameOverSummary || undefined,
      roundNumber: roundNumber || undefined,
      gmState: gmState || undefined,
      storySummary: storySummary || undefined,
      savedAt: new Date().toISOString(),
      clientId: clientIdRef.current as string,
    };

    try {
      if (user?.id) {
        saveGameRoomState(gameId, user.id, state).catch((e) =>
          console.error("Error saving game room state to DB:", e)
        );

        // Persist new messages to game_messages table (append-only)
        const newMessages = messages.filter((m) => !savedMessageIdsRef.current.has(m.id) && !m.isStreaming);
        if (newMessages.length > 0) {
          const payload = newMessages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            content: m.content,
            channelId: m.channelId || null,
            isAI: m.isAI,
            isSystemMessage: m.isSystemMessage || false,
            isPrivate: m.isPrivate || false,
            isAnnouncement: m.isAnnouncement || false,
            imageUrl: m.imageUrl || null,
            reactions: m.reactions || [],
          }));
          fetch(`/api/games/${gameId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payload }),
          })
            .then((res) => {
              if (res.ok) {
                for (const m of newMessages) savedMessageIdsRef.current.add(m.id);
              }
            })
            .catch((e) => console.error("Error saving messages to DB:", e));
        }
      }
      const key = `gameRoom_${gameId}`;
      const payload = JSON.stringify(state);
      try {
        localStorage.setItem(key, payload);
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          // Evict other games' caches first, then retry
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k?.startsWith("gameRoom_") && k !== key) keysToRemove.push(k);
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
            localStorage.setItem(key, payload);
          } catch (e2) {
            // Still over quota — retry without avatar URLs (large payload)
            const stateSlim = { ...state, avatarImageUrls: undefined };
            try {
              localStorage.setItem(key, JSON.stringify(stateSlim));
            } catch (e3) {
              console.warn("Game room state skipped (localStorage quota exceeded):", (e3 as Error)?.message);
            }
          }
        } else {
          throw e;
        }
      }
    } catch (e) {
      console.error("Error saving game room state:", e);
    }
    // Fixed length: gameId, userId, isHydrated, saveTrigger only
  }, [gameId, userId, isHydrated, saveTrigger]);

  // ─── Realtime subscription ────────────────────────────────────────────────
  // Merge remote state received via Supabase Realtime (postgres_changes).
  // Only messages not already in local state are added; streaming messages are never merged.
  const mergeRemoteState = useCallback((remoteState: Record<string, unknown>) => {
    if (!isMountedRef.current) return;

    if (remoteState.messages && Array.isArray(remoteState.messages)) {
      setMessages((prev) => {
        const remoteMessages = (remoteState.messages as Array<Record<string, unknown>>).map((m) => ({
          ...(m as object),
          timestamp: new Date(m.timestamp as string),
          isStreaming: false,
        })) as Message[];
        const localIds = new Set(prev.map((m) => m.id));
        const newMsgs = remoteMessages.filter((m) => !localIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        newMsgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const merged = [...prev, ...newMsgs];
        return merged.length > 60 ? merged.slice(-60) : merged;
      });
    }

    if (remoteState.players && Array.isArray(remoteState.players)) {
      setPlayers(remoteState.players as Player[]);
    }
    if (typeof remoteState.gamePhase === "string" && remoteState.gamePhase) {
      setGamePhase(remoteState.gamePhase);
    }
    if (remoteState.gamePhaseState && typeof remoteState.gamePhaseState === "object") {
      setGamePhaseState(remoteState.gamePhaseState as GamePhaseState);
    }
    if (remoteState.myBoardContent && typeof remoteState.myBoardContent === "object") {
      setMyBoardContent(remoteState.myBoardContent as Record<string, string>);
    }
    if (remoteState.gameEvents && Array.isArray(remoteState.gameEvents)) {
      setGameEvents(remoteState.gameEvents as string[]);
    }
    if (typeof remoteState.phaseLabel === "string") setPhaseLabel(remoteState.phaseLabel);
    if (remoteState.mood === "dark" || remoteState.mood === "light" || remoteState.mood === "neutral") setMood(remoteState.mood);
    if (typeof remoteState.gameOverSummary === "string") setGameOverSummary(remoteState.gameOverSummary);
    if (typeof remoteState.roundNumber === "number") setRoundNumber(remoteState.roundNumber);
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game_room_rt:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_room_state",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const remoteState = (payload.new as { state?: Record<string, unknown>; clientId?: string })
            ?.state as Record<string, unknown> | undefined;
          if (!remoteState) return;
          // Skip our own saves to avoid re-processing state we just wrote
          if (remoteState.clientId === (clientIdRef.current as string)) return;
          mergeRemoteState(remoteState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, mergeRemoteState]);

  const addMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp"> & { id?: string }, channelId?: string) => {
      if (!isMountedRef.current) return;
      const newMessage: Message = {
        ...msg,
        // Allow callers to supply a pre-generated ID so the Realtime echo
        // can be deduplicated by ID.
        id: msg.id ?? `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date(),
        ...(channelId != null && { channelId }),
      };
      setMessages((prev) => {
        // Dedup by ID — reliable for all pre-generated message IDs.
        if (prev.some((m) => m.id === newMessage.id)) return prev;

        const updated = [...prev, newMessage];
        return updated.length > 60 ? updated.slice(-60) : updated;
      });
      return newMessage.id;
    },
    []
  );

  const addStreamingMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp" | "content" | "isStreaming">, channelId?: string, initialContent?: string): string => {
      if (!isMountedRef.current) return "";
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newMessage: Message = {
        ...msg,
        id: messageId,
        content: initialContent ?? "",
        timestamp: new Date(),
        isStreaming: true,
        ...(channelId != null && { channelId }),
      };
      setMessages((prev) => {
        const updated = [...prev, newMessage];
        return updated.length > 60 ? updated.slice(-60) : updated;
      });
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

  const addReaction = useCallback((messageId: string, emoji: string, from: string) => {
    if (!isMountedRef.current) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions ?? [];
        const sameExact = existing.findIndex((r) => r.emoji === emoji && r.from === from);
        if (sameExact >= 0) {
          return { ...m, reactions: existing.filter((_, i) => i !== sameExact) };
        }
        const withoutPrev = existing.filter((r) => r.from !== from);
        return { ...m, reactions: [...withoutPrev, { emoji, from }] };
      })
    );
  }, []);

  const addPrivateMessage = useCallback(
    (playerNameOrId: string, content: string, fromName: string) => {
      if (!isMountedRef.current) return;
      setPrivateMessages((prev) => {
        const isYou = playerNameOrId.trim().toLowerCase() === "you";
        const playerId = isYou
          ? userId
          : playersRef.current.find((p) => p.id === playerNameOrId || p.name === playerNameOrId)?.id ??
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
    [userId]
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
    setSelectedChannelId("game-room");
    setCurrentSpeakerId(null);
    setTypingUsers([]);
    setPrivateMessages({});
    setMyBoardContent({});
    setPlayerNotes({});
    setGameEvents([]);
    setGameEnded(false);
    setGameResult(null);
    setAiSuggestedPrompts([]);
    setHumanGameIdentity(null);
    setAvatarImageUrls({});
    setPhaseLabel("");
    setMood("neutral");
    setActiveVote(null);
    setTimerEndsAt(null);
    setGameOverSummary("");
    setRoundNumber(0);
    setGmState(null);
    setStorySummary("");
  }, []);

  const contextValue = useMemo(() => ({
    messages,
    players,
    gamePhase,
    gamePhaseState,
    selectedChannelId,
    currentSpeakerId,
    typingUsers,
    privateMessages,
    myBoardContent,
    playerNotes,
    sections,
    sectionsLoading,
    gameEvents,
    gameEnded,
    gameResult,
    aiSuggestedPrompts,
    humanGameIdentity,
    avatarImageUrls,
    isRoomLoading: !isHydrated,
    phaseLabel,
    mood,
    activeVote,
    timerEndsAt,
    gameOverSummary,
    roundNumber,
    gmState,
    storySummary,
    onAvatarUrlLoaded,
    regenerateAvatar,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    addEventNotification,
    addPrivateMessage,
    addReaction,
    setMessages,
    setPlayers,
    updatePlayer,
    setGamePhase,
    setGamePhaseState,
    setSelectedChannelId,
    setCurrentSpeakerId,
    setTypingUsers,
    setMyBoardContent,
    setPlayerNotes,
    setSections,
    setSectionsLoading,
    setGameEvents,
    setGameEnded,
    setGameResult,
    setAiSuggestedPrompts,
    setHumanGameIdentity,
    setPhaseLabel,
    setMood,
    setActiveVote,
    setTimerEndsAt,
    setGameOverSummary,
    setRoundNumber,
    setGmState,
    setStorySummary,
    resetGame,
    saveNow,
    userId,
  }), [
    messages, players, gamePhase, gamePhaseState, selectedChannelId,
    currentSpeakerId, typingUsers, privateMessages,
    myBoardContent, playerNotes, sections, sectionsLoading, gameEvents,
    gameEnded, gameResult, aiSuggestedPrompts, humanGameIdentity,
    avatarImageUrls, isHydrated, phaseLabel, mood, activeVote, timerEndsAt,
    gameOverSummary, roundNumber, gmState, storySummary, onAvatarUrlLoaded, regenerateAvatar, addMessage,
    addStreamingMessage, updateStreamingMessage, addEventNotification,
    addPrivateMessage, addReaction, updatePlayer, resetGame, saveNow, userId,
  ]);

  return (
    <GameRoomContext.Provider value={contextValue}>
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
