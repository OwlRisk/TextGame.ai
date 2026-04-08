"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, GameSession, ConversationState } from "@/types/game-master";
import type { DiscoverPreset } from "@/data/discover-templates";
import type { GameTemplate } from "@/lib/game-templates";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import { getDefaultHost, getDefaultHostForTemplate } from "@/app/config/host-config";
import { generateSessionTitle } from "@/lib/game-master-utils";
import {
  getGameSessions,
  createGameSession,
  updateGameSession,
  deleteGameSession,
} from "@/lib/db";
import { toast } from "sonner";

const STATIC_WELCOME_CONTENT =
  "Hey, I'm your **Game Master**. Describe any game idea and I'll design the rules, roles, and setup for you.\n\n" +
  "Or pick a **ready-made template** — hit the Templates button to browse 10+ games.\n\n" +
  "You can always **edit the Game Rules** directly, or just **tell me** what to change. When you're happy, hit **Create Room**!";

export interface UseGameMasterSessionsParams {
  userId?: string;
  initialPreset?: DiscoverPreset | null;
  onPresetApplied?: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationState: ConversationState;
  setConversationState: React.Dispatch<React.SetStateAction<ConversationState>>;
  selectedTemplate: GameTemplate | null;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<GameTemplate | null>>;
  playerCount: number;
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>;
  customRules: string;
  setCustomRules: React.Dispatch<React.SetStateAction<string>>;
  gameName: string;
  setGameName: React.Dispatch<React.SetStateAction<string>>;
  selectedHostId: string;
  setSelectedHostId: React.Dispatch<React.SetStateAction<string>>;
  setIsGMTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseGameMasterSessionsReturn {
  sessions: GameSession[];
  setSessions: React.Dispatch<React.SetStateAction<GameSession[]>>;
  currentSessionId: string;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sessionToDelete: GameSession | null;
  setSessionToDelete: React.Dispatch<React.SetStateAction<GameSession | null>>;
  saveCurrentSession: () => void;
  createNewSession: () => void;
  createSessionFromPreset: (preset: DiscoverPreset) => void;
  loadSession: (sessionId: string, sessionsList?: GameSession[], fromHistoryClick?: boolean) => void;
  deleteSession: (sessionId: string) => void;
}

export function useGameMasterSessions({
  userId,
  initialPreset,
  onPresetApplied,
  messages,
  setMessages,
  conversationState,
  setConversationState,
  selectedTemplate,
  setSelectedTemplate,
  playerCount,
  setPlayerCount,
  customRules,
  setCustomRules,
  gameName,
  setGameName,
  selectedHostId,
  setSelectedHostId,
  setIsGMTyping,
}: UseGameMasterSessionsParams): UseGameMasterSessionsReturn {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);

  // Block the session-loader from auto-loading when a preset is about to be applied
  const skipAutoLoadRef = useRef(!!initialPreset);
  const welcomeRequestedForSessionRef = useRef<string | null>(null);
  const welcomeScheduledForSessionRef = useRef<string | null>(null);
  const didLoadSessionRef = useRef(false);
  const lastAppliedPresetRef = useRef<string | null>(null);

  // Map DB row to GameSession
  const rowToSession = useCallback(
    (row: {
      id: string;
      title: string;
      game_name: string;
      template_id: string;
      host_id: string;
      player_count: number;
      custom_rules: string | null;
      conversation_state: string;
      messages: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      created_at: string;
      updated_at: string;
    }): GameSession => {
      const msgs = (row.messages || []).map((m: any, msgIndex: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...m,
        id:
          m.id ||
          `msg-${row.id}-${msgIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date(m.timestamp),
      }));
      return {
        id: row.id,
        title: row.title,
        messages: msgs,
        conversationState: (row.conversation_state || "greeting") as GameSession["conversationState"],
        selectedTemplate: GAME_TEMPLATES.find((t) => t.id === row.template_id) ?? null,
        playerCount: row.player_count ?? 0,
        customRules: row.custom_rules ?? "",
        gameName: row.game_name ?? "",
        selectedHostId: row.host_id ?? getDefaultHost().id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    [],
  );

  const saveCurrentSession = useCallback(() => {
    if (!currentSessionId) return;

    const sessionTitle = generateSessionTitle(selectedTemplate, playerCount, gameName);

    const existing = sessions.find((s) => s.id === currentSessionId);
    const messagesChanged = existing
      ? existing.messages.length !== messages.length ||
        (messages.length > 0 &&
          existing.messages[existing.messages.length - 1]?.id !==
            messages[messages.length - 1]?.id)
      : true;

    const updatedSession: GameSession = {
      id: currentSessionId,
      title: sessionTitle,
      messages: messages,
      conversationState: conversationState,
      selectedTemplate: selectedTemplate,
      playerCount: playerCount,
      customRules: customRules,
      gameName: gameName,
      selectedHostId: selectedHostId,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: messagesChanged ? new Date() : (existing?.updatedAt ?? new Date()),
    };

    setSessions((prev) => {
      const updated = messagesChanged
        ? [updatedSession, ...prev.filter((s) => s.id !== currentSessionId)]
        : prev.map((s) => (s.id === currentSessionId ? updatedSession : s));
      try {
        localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (userId) {
      const messagesForDb = messages.map((m) => ({
        ...m,
        timestamp:
          m.timestamp instanceof Date
            ? m.timestamp.toISOString()
            : (m.timestamp as unknown as string),
      }));
      updateGameSession(currentSessionId, {
        title: sessionTitle,
        game_name: gameName,
        template_id: selectedTemplate?.id ?? "",
        host_id: selectedHostId,
        player_count: playerCount,
        custom_rules: customRules || null,
        conversation_state: conversationState,
        messages: messagesForDb,
      }).then(({ error }) => {
        if (error) console.error("[Game Master] Failed to save session to DB:", error);
      });
    }
  }, [
    currentSessionId,
    messages,
    conversationState,
    selectedTemplate,
    playerCount,
    customRules,
    gameName,
    selectedHostId,
    sessions,
    userId,
  ]);

  const loadSession = useCallback(
    (sessionId: string, sessionsList?: GameSession[], fromHistoryClick?: boolean) => {
      const sessionsToSearch = sessionsList || sessions;
      const session = sessionsToSearch.find((s) => s.id === sessionId);
      if (!session) return;

      if (fromHistoryClick) didLoadSessionRef.current = true;
      setCurrentSessionId(session.id);
      const migratedMessages = session.messages.map((m) => {
        if (m.role !== "gm" || !m.content) return m;
        let c = m.content;
        c = c.replace(/rules panel(?:\s+directly)?\s+on the right/gi, "Game Rules directly");
        c = c.replace(/rules on the right/gi, "rules in the Game Rules panel");
        c = c.replace(/the rules panel on the right/gi, "the Game Rules panel");
        c = c.replace(/Game Document/g, "Game Rules");
        c = c.replace(/Say\s+["']create game["']/gi, 'Click **Create Room**');
        c = c.replace(/Templates button above/gi, "Templates button");
        if (c === m.content) return m;
        return { ...m, content: c };
      });
      setMessages(migratedMessages);
      setConversationState(session.conversationState);
      setSelectedTemplate(session.selectedTemplate);
      const maxAI = session.selectedTemplate && session.selectedTemplate.maxPlayers > 1 ? session.selectedTemplate.maxPlayers - 1 : 0;
      setPlayerCount(session.playerCount || maxAI);
      setCustomRules(session.customRules);
      setGameName(session.gameName);
      setSelectedHostId(session.selectedHostId);
      setIsGMTyping(session.messages.length === 0 && !fromHistoryClick);
    },
    [
      sessions,
      setMessages,
      setConversationState,
      setSelectedTemplate,
      setPlayerCount,
      setCustomRules,
      setGameName,
      setSelectedHostId,
      setIsGMTyping,
    ],
  );

  const createNewSession = useCallback(() => {
    const newSessionId =
      userId && typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const defaultHostId = getDefaultHostForTemplate(null).id;
    const staticWelcomeMessage: ChatMessage = {
      id: `msg-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "gm",
      content: STATIC_WELCOME_CONTENT,
      timestamp: new Date(),
    };
    const newSession: GameSession = {
      id: newSessionId,
      title: "New Game Setup",
      messages: [staticWelcomeMessage],
      conversationState: "greeting",
      selectedTemplate: null,
      playerCount: 0,
      customRules: "",
      gameName: "",
      selectedHostId: defaultHostId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    welcomeRequestedForSessionRef.current = newSessionId;
    welcomeScheduledForSessionRef.current = newSessionId;
    setCurrentSessionId(newSessionId);
    setMessages([staticWelcomeMessage]);
    setConversationState("greeting");
    setIsGMTyping(false);
    setSelectedTemplate(null);
    setPlayerCount(0);
    setCustomRules("");
    setGameName("");
    setSelectedHostId(defaultHostId);

    if (userId) {
      const messagesForDb = [staticWelcomeMessage].map((m) => ({
        ...m,
        timestamp:
          m.timestamp instanceof Date
            ? m.timestamp.toISOString()
            : (m.timestamp as unknown as string),
      }));
      createGameSession({
        id: newSessionId,
        user_id: userId,
        title: "New Game Setup",
        game_name: "",
        template_id: "",
        host_id: defaultHostId,
        player_count: 6,
        custom_rules: "",
        conversation_state: "greeting",
        messages: messagesForDb,
      }).then(({ error }) => {
        if (error) console.error("[Game Master] Failed to create session in DB:", error);
      });
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== newSessionId);
      const updated = [newSession, ...filtered];
      try {
        localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, [
    userId,
    setMessages,
    setConversationState,
    setIsGMTyping,
    setSelectedTemplate,
    setPlayerCount,
    setCustomRules,
    setGameName,
    setSelectedHostId,
  ]);

  const createSessionFromPreset = useCallback(
    (preset: DiscoverPreset) => {
      const resolvedTemplate =
        GAME_TEMPLATES.find((t) => t.id === (preset.templateId || "custom")) ?? null;
      const nextPlayerCount = preset.playerCount ?? (resolvedTemplate && resolvedTemplate.maxPlayers > 1 ? resolvedTemplate.maxPlayers - 1 : 0);
      const nextRules = preset.rules?.trim() || resolvedTemplate?.defaultRules || "";
      const nextGameName = preset.name?.trim() || "";
      const recommendedHost = getDefaultHostForTemplate(resolvedTemplate?.id ?? null);

      const templateName = resolvedTemplate?.name ?? preset.name ?? "this game";
      const presetWelcomeContent =
        `Great choice — **${templateName}**! I've loaded the rules.\n\n` +
        "You can **tell me** what you'd like to change (player count, roles, pacing…) and I'll update the rules for you. " +
        "Or **edit the Game Rules directly** — either way works!\n\n" +
        (nextPlayerCount > 0
          ? `Currently set for **${nextPlayerCount + 1} players** (you + ${nextPlayerCount} AI), plus a Host who runs the game. Click **Create Room** when you're ready!`
          : 'How many players would you like? Click **Create Room** whenever you\'re ready!');
      const presetWelcomeMessage: ChatMessage = {
        id: `msg-preset-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        role: "gm",
        content: presetWelcomeContent,
        timestamp: new Date(),
      };

      const newSessionId =
        userId && typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newSession: GameSession = {
        id: newSessionId,
        title: generateSessionTitle(resolvedTemplate, nextPlayerCount, nextGameName),
        messages: [presetWelcomeMessage],
        conversationState: "greeting",
        selectedTemplate: resolvedTemplate,
        playerCount: nextPlayerCount,
        customRules: nextRules,
        gameName: nextGameName,
        selectedHostId: recommendedHost.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      welcomeRequestedForSessionRef.current = newSessionId;
      welcomeScheduledForSessionRef.current = newSessionId;

      setCurrentSessionId(newSessionId);
      setMessages([presetWelcomeMessage]);
      setConversationState("greeting");
      setIsGMTyping(false);
      setSelectedTemplate(resolvedTemplate);
      setPlayerCount(nextPlayerCount);
      setCustomRules(nextRules);
      setGameName(nextGameName);
      setSelectedHostId(recommendedHost.id);

      if (userId) {
        const messagesForDb = [presetWelcomeMessage].map((m) => ({
          ...m,
          timestamp:
            m.timestamp instanceof Date
              ? m.timestamp.toISOString()
              : (m.timestamp as unknown as string),
        }));
        createGameSession({
          id: newSessionId,
          user_id: userId,
          title: newSession.title,
          game_name: nextGameName,
          template_id: resolvedTemplate?.id ?? "",
          host_id: recommendedHost.id,
          player_count: nextPlayerCount,
          custom_rules: nextRules,
          conversation_state: "greeting",
          messages: messagesForDb,
        }).then(({ error }) => {
          if (error) console.error("[Game Master] Failed to create session in DB:", error);
        });
      }
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== newSessionId);
        const updated = [newSession, ...filtered];
        try {
          localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    },
    [
      userId,
      setMessages,
      setConversationState,
      setIsGMTyping,
      setSelectedTemplate,
      setPlayerCount,
      setCustomRules,
      setGameName,
      setSelectedHostId,
    ],
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      if (userId) {
        deleteGameSession(sessionId, userId).then(({ error }) => {
          if (error) console.error("[Game Master] Failed to delete session from DB:", error);
        });
      }
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        try {
          localStorage.setItem("gameMasterSessions", JSON.stringify(filtered));
        } catch (_) {}
        if (sessionId === currentSessionId) {
          if (filtered.length > 0) loadSession(filtered[0].id, filtered);
          else createNewSession();
        }
        return filtered;
      });
      toast.success("Session deleted");
    },
    [userId, currentSessionId, loadSession, createNewSession],
  );

  // Load sessions from DB (logged in) or localStorage on mount
  useEffect(() => {
    if (userId) {
      getGameSessions(userId).then(({ data, error }) => {
        if (error || !data?.length) {
          setSessions([]);
          if (!skipAutoLoadRef.current) createNewSession();
          return;
        }
        const sessionsWithDates = data.map((row) => rowToSession(row));
        setSessions(sessionsWithDates);
        if (!skipAutoLoadRef.current) loadSession(sessionsWithDates[0].id, sessionsWithDates);
      });
      return;
    }
    const savedSessions = localStorage.getItem("gameMasterSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      const sessionsWithDates = parsed.map((s: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...s,
        messages: (s.messages || []).map((m: any, msgIndex: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          ...m,
          id: `msg-${s.id}-${msgIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          timestamp: new Date(m.timestamp),
        })),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
      const MAX_SESSIONS = 30;
      const sortedSessions = sessionsWithDates.sort(
        (a: GameSession, b: GameSession) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      const sessionsToKeep = sortedSessions.slice(0, MAX_SESSIONS);
      if (sessionsToKeep.length < sessionsWithDates.length) {
        localStorage.setItem("gameMasterSessions", JSON.stringify(sessionsToKeep));
      }
      setSessions(sessionsToKeep);
      if (sessionsToKeep.length > 0 && !skipAutoLoadRef.current)
        loadSession(sessionsToKeep[0].id, sessionsToKeep);
      else if (!skipAutoLoadRef.current) createNewSession();
    } else {
      if (!skipAutoLoadRef.current) createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-save current session (debounced 1s after any conversation state change)
  useEffect(() => {
    if (!currentSessionId) return;
    const timeoutId = setTimeout(() => {
      saveCurrentSession();
    }, 1000);
    return () => clearTimeout(timeoutId);
    // Keep dep array matching original — saveCurrentSession is intentionally omitted
    // to avoid re-triggering when sessions list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, conversationState, selectedTemplate, playerCount, customRules, gameName, selectedHostId, currentSessionId]);

  // Handle initial preset — create a session pre-loaded with the preset's template & rules
  useEffect(() => {
    if (!initialPreset) {
      lastAppliedPresetRef.current = null;
      return;
    }
    const rulesHash = initialPreset.rules?.substring(0, 100) || "";
    const presetKey = `${initialPreset.id}-${initialPreset.name}-${rulesHash}`;
    if (lastAppliedPresetRef.current !== presetKey) {
      setCustomRules("");
      setSelectedTemplate(null);
      requestAnimationFrame(() => {
        createSessionFromPreset(initialPreset);
        lastAppliedPresetRef.current = presetKey;
        if (onPresetApplied) {
          setTimeout(() => {
            onPresetApplied();
          }, 100);
        }
      });
    }
  }, [initialPreset, createSessionFromPreset, onPresetApplied, setCustomRules, setSelectedTemplate]);

  // Inject static welcome message into empty sessions (e.g. loaded from old data)
  useEffect(() => {
    if (messages.length !== 0 || !currentSessionId) return;
    if (didLoadSessionRef.current) {
      didLoadSessionRef.current = false;
      return;
    }
    if (welcomeRequestedForSessionRef.current === currentSessionId) return;
    welcomeRequestedForSessionRef.current = currentSessionId;
    welcomeScheduledForSessionRef.current = currentSessionId;
    const staticMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "gm",
      content: STATIC_WELCOME_CONTENT,
      timestamp: new Date(),
    };
    setMessages([staticMsg]);
  }, [currentSessionId, messages.length, setMessages]);

  return {
    sessions,
    setSessions,
    currentSessionId,
    deleteDialogOpen,
    setDeleteDialogOpen,
    sessionToDelete,
    setSessionToDelete,
    saveCurrentSession,
    createNewSession,
    createSessionFromPreset,
    loadSession,
    deleteSession,
  };
}
