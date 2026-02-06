"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea, Message } from "@/app/components/chat-area";
import { Player } from "@/app/components/player-panel";
import { PlayerPanelWithBoard } from "@/app/components/player-panel-with-board";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { WelcomePage } from "@/app/components/welcome-page";
import { MyGamesPage } from "@/app/components/my-games-page";
import { GameMasterChat } from "@/app/components/game-master-chat";
import { GameCreatorForm } from "@/app/components/game-creator-form";
import { UserProfile } from "@/app/components/user-profile";
import { PlayerBoardData } from "@/app/components/player-board";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { getHostById, getDefaultHost } from "@/app/config/host-config";
import { pickTraitsForPlayers } from "@/app/config/ai-player-personalities";
import { getAIChatResponse, streamAIChatResponse } from "@/lib/openai";
import {
  type GamePhaseState,
  type GamePhaseKind,
  DEFAULT_GAME_PHASE,
  nextPhaseForWerewolf,
  phaseLabel,
} from "@/app/config/game-phase";

/** Message returned by /api/chat when the model returns empty content; treat as failure and use fallback. */
const API_ERROR_PLACEHOLDER = /I apologize,? but I encountered an error/i;

/** Instruction: default to English; only use rules' language if rules are clearly in another language (e.g. Chinese). */
const LANG_MATCH_RULES =
  "LANGUAGE (CRITICAL): Write ALL your output in English by default. Only if the game rules above are written entirely (or primarily) in another language (e.g. Chinese), write in that language instead. Regardless of character name or cultural background (e.g. Maria, Akira, Zuri), use one language for the entire game—English unless the rules are clearly in another language.";

/** Pick notification text: default to English for UI. */
function notifyLang(_rules: string | undefined, en: string, _zh: string): string {
  return en;
}

/** Fallback AI count when GM/API hasn't decided—based on template midpoint (werewolf 7, undercover 6, mafia 9, custom 6) */
function getDefaultAICountForTemplate(template?: string): number {
  switch (template) {
    case "werewolf": return 7;
    case "undercover": return 6;
    case "mafia": return 9;
    default: return 6;
  }
}

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
}

const AI_COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", 
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
];

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>("home");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showGameMasterChat, setShowGameMasterChat] = useState(false);
  const [discoverPreset, setDiscoverPreset] = useState<DiscoverPreset | null>(null);
  const [showGameCreatorForm, setShowGameCreatorForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<string>("waiting");
  const [gamePhaseState, setGamePhaseState] = useState<GamePhaseState>(DEFAULT_GAME_PHASE);
  const [typingUsers, setTypingUsers] = useState<{ name: string; avatar: string }[]>([]);
  const [isHydrated, setIsHydrated] = useState(false); // Track if state is loaded from storage
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; message: string } | null>(null);
  /** Private messages from Host to players, keyed by playerId */
  const [privateMessages, setPrivateMessages] = useState<Record<string, Array<{ id: string; from: string; content: string; timestamp: Date }>>>({});
  /** Game progress text — editable by AI Host only; keyed by gameId */
  const [gameProgressByGameId, setGameProgressByGameId] = useState<Record<string, string>>({});
  // Background merged into Rules - no separate state needed
  /** My Board content per player per game — written by AI Host via MY_BOARD_FOR; keyed by gameId then playerId */
  const [myBoardContentByGameId, setMyBoardContentByGameId] = useState<Record<string, Record<string, string>>>({});
  /** AI-generated suggestion prompts for intro (theme, round length, ready, etc.) */
  const [aiSuggestedPrompts, setAiSuggestedPrompts] = useState<string[]>([]);
  /** Per-game sidebar sections (rules, progress, etc.) decided by AI; keyed by gameId */
  const [sectionsByGameId, setSectionsByGameId] = useState<Record<string, Array<{ id: string; name: string }>>>({});
  /** Loading sections for current game (AI suggestion) */
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const userId = "user-1";
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  const recentSpeakers = useRef<string[]>([]); // For prompt context (who spoke recently)
  const messagesRef = useRef<Message[]>([]);
  const playersRef = useRef<Player[]>([]);
  const gamesRef = useRef<Game[]>([]);
  const gamePhaseRef = useRef<string>("waiting");
  const gamePhaseStateRef = useRef<GamePhaseState>(DEFAULT_GAME_PHASE);
  const selectedGameIdRef = useRef<string | null>(null);
  const lastHostMessageForSuggestionsRef = useRef<string>('');

  useEffect(() => {
    messagesRef.current = messages;
    playersRef.current = players;
    gamesRef.current = games;
    gamePhaseRef.current = gamePhase;
    gamePhaseStateRef.current = gamePhaseState;
    selectedGameIdRef.current = selectedGameId;
  }, [messages, players, games, gamePhase, gamePhaseState, selectedGameId]);

  // Fetch AI-generated suggestion prompts when in game-room and host has sent a message (all phases, not only intro)
  useEffect(() => {
    if (selectedChannelId !== 'game-room' || !selectedGameId) {
      lastHostMessageForSuggestionsRef.current = '';
      setAiSuggestedPrompts([]);
      return;
    }
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!currentGame?.isActive) {
      setAiSuggestedPrompts([]);
      return;
    }
    const hostId = players.find(p => p.isGameMaster)?.id ?? 'gm-1';
    const hostMessages = messages.filter(m => m.senderId === hostId && !m.isStreaming);
    const lastHostMsg = hostMessages[hostMessages.length - 1];
    const lastContent = lastHostMsg?.content?.trim() ?? '';
    if (!lastContent || lastContent === lastHostMessageForSuggestionsRef.current) return;
    lastHostMessageForSuggestionsRef.current = lastContent;
    const rulesLangZh = /[\u4e00-\u9fff]/.test(currentGame?.config?.rules ?? '');
    fetch('/api/suggest-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameName: currentGame.name,
        lastHostMessage: lastContent.slice(0, 800),
        rulesSnippet: currentGame?.config?.rules?.slice(0, 500),
        language: rulesLangZh ? 'zh' : 'en',
      }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch suggestions')))
      .then((data: { suggestions?: string[] }) => {
        if (isMountedRef.current && Array.isArray(data.suggestions)) {
          setAiSuggestedPrompts(data.suggestions.slice(0, 5));
        }
      })
      .catch(() => {
        if (isMountedRef.current) setAiSuggestedPrompts([]);
      });
  }, [gamePhase, selectedChannelId, selectedGameId, games, players, messages]);

  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameRoomState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.games) setGames(state.games);
        if (state.selectedGameId) setSelectedGameId(state.selectedGameId);
        if (state.selectedChannelId) setSelectedChannelId(state.selectedChannelId);
        if (state.messages) {
          // Convert timestamp strings back to Date objects
          setMessages(state.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        }
        if (state.players) setPlayers(state.players);
        if (state.gamePhase) setGamePhase(state.gamePhase);
        if (state.gamePhaseState) setGamePhaseState(state.gamePhaseState);
        if (state.privateMessages) {
          const pm: Record<string, Array<{ id: string; from: string; content: string; timestamp: Date }>> = {};
          for (const [pid, list] of Object.entries(state.privateMessages) as [string, Array<{ id: string; from: string; content: string; timestamp: string }>][]) {
            pm[pid] = (list || []).map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
          }
          setPrivateMessages(pm);
        }
        if (state.gameProgressByGameId && typeof state.gameProgressByGameId === 'object') {
          setGameProgressByGameId(state.gameProgressByGameId);
        }
        if (state.myBoardContentByGameId && typeof state.myBoardContentByGameId === 'object') {
          setMyBoardContentByGameId(state.myBoardContentByGameId);
        }
        if (state.sectionsByGameId && typeof state.sectionsByGameId === 'object') {
          setSectionsByGameId(state.sectionsByGameId);
        }
      }
    } catch (e) {
      console.error('Error loading game state:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Don't save until we've loaded initial state
    
    const timeoutId = setTimeout(() => {
      try {
        // Trim to avoid QuotaExceededError (~5MB limit)
        const trimmedMessages = messages.slice(-60).map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
        }));
        const trimmedGames = games.slice(-10).map(g => ({
          ...g,
          config: g.config?.rules
            ? { ...g.config, rules: g.config.rules.slice(0, 3000) }
            : g.config
        }));
        const trimmedPrivateMessages: Record<string, Array<{ id: string; from: string; content: string; timestamp: string }>> = {};
        for (const [pid, list] of Object.entries(privateMessages)) {
          const arr = (list || []).slice(-20).map(m => ({
            ...m,
            timestamp: (m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)).toISOString()
          }));
          if (arr.length) trimmedPrivateMessages[pid] = arr;
        }
        const state = {
          games: trimmedGames,
          selectedGameId,
          selectedChannelId,
          messages: trimmedMessages,
          players,
          gamePhase,
          gamePhaseState,
          privateMessages: trimmedPrivateMessages,
          gameProgressByGameId,
          myBoardContentByGameId,
          sectionsByGameId,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('gameRoomState', JSON.stringify(state));
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          try {
            // Retry with minimal state
            const minimalMessages = messages.slice(-20).map(m => ({
              ...m,
              timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
            }));
            const minimalGames = games.slice(-5).map(g => ({
              ...g,
              config: g.config?.rules
                ? { ...g.config, rules: g.config.rules.slice(0, 1500) }
                : g.config
            }));
            const minPm: Record<string, Array<{ id: string; from: string; content: string; timestamp: string }>> = {};
            for (const [pid, list] of Object.entries(privateMessages)) {
              const arr = (list || []).slice(-10).map(m => ({
                ...m,
                timestamp: (m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)).toISOString()
              }));
              if (arr.length) minPm[pid] = arr;
            }
            localStorage.setItem('gameRoomState', JSON.stringify({
              games: minimalGames,
              selectedGameId,
              selectedChannelId,
              messages: minimalMessages,
              players,
              gamePhase,
              gamePhaseState,
              privateMessages: minPm,
              gameProgressByGameId,
              myBoardContentByGameId,
              sectionsByGameId,
              savedAt: new Date().toISOString()
            }));
          } catch {
            localStorage.removeItem('gameRoomState');
          }
        } else {
          console.error('Error saving game state:', e);
        }
      }
    }, 1000); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [games, selectedGameId, selectedChannelId, messages, players, gamePhase, gamePhaseState, privateMessages, gameProgressByGameId, myBoardContentByGameId, sectionsByGameId, isHydrated]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Fetch AI-suggested sections when entering a game that has no sections yet
  useEffect(() => {
    const gameId = selectedGameId;
    if (!gameId || gameId === "home" || gameId === "discover" || gameId === "my-games") return;
    if (sectionsByGameId[gameId] != null) return; // already have sections (including empty array)
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    let cancelled = false;
    setSectionsLoading(true);
    fetch("/api/suggest-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameName: game.name,
        rules: game.config?.rules ?? "",
        template: game.config?.template ?? "custom",
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch sections"))))
      .then((data: { sections?: Array<{ id: string; name: string }> }) => {
        if (cancelled || !isMountedRef.current) return;
        const list = Array.isArray(data.sections) && data.sections.length > 0
          ? data.sections
          : [{ id: "rules", name: "Rules" }, { id: "progress", name: "Progress" }];
        setSectionsByGameId((prev) => ({ ...prev, [gameId]: list }));
      })
      .catch(() => {
        if (cancelled || !isMountedRef.current) return;
        setSectionsByGameId((prev) => ({
          ...prev,
          [gameId]: [{ id: "rules", name: "Rules" }, { id: "progress", name: "Progress" }],
        }));
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedGameId, games, sectionsByGameId]);

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    if (!isMountedRef.current) return;
    const newMessage: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    };
    setMessages(prev => {
      // Check if message already exists (prevent duplicates from double submit / same tick)
      const last = prev[prev.length - 1];
      if (last && last.senderId === newMessage.senderId && last.content === newMessage.content) return prev;
      const exists = prev.some(m => 
        m.senderId === newMessage.senderId && 
        m.content === newMessage.content && 
        Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
      );
      if (exists) return prev;
      
      // Limit message history to last 100 messages to prevent memory issues
      const updated = [...prev, newMessage];
      if (updated.length > 100) {
        return updated.slice(-100); // Keep only last 100 messages
      }
      return updated;
    });
    return newMessage.id;
  }, []);

  /** Create a streaming message (starts with empty content, isStreaming = true) */
  const addStreamingMessage = useCallback((msg: Omit<Message, "id" | "timestamp" | "content" | "isStreaming">): string => {
    if (!isMountedRef.current) return "";
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newMessage: Message = {
      ...msg,
      id: messageId,
      content: "",
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, newMessage]);
    return messageId;
  }, []);

  /** Update a streaming message's content. When completing, empty content is replaced with "…" so messages never appear blank. */
  const updateStreamingMessage = useCallback((messageId: string, content: string, isComplete: boolean = false) => {
    if (!isMountedRef.current) return;
    const displayContent = isComplete && !content?.trim() ? "…" : content;
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, content: displayContent, isStreaming: !isComplete }
        : m
    ));
  }, []);

  const addEventNotification = useCallback((content: string) => {
    addMessage({
      senderId: "system",
      senderName: "System",
      senderAvatar: "#6366f1",
      content,
      isAI: false,
      isSystemMessage: true
    });
  }, [addMessage]);

  const addPrivateMessage = useCallback((playerNameOrId: string, content: string, fromName: string) => {
    if (!isMountedRef.current) return;
    setPrivateMessages(prev => {
      const playersList = playersRef.current;
      const isYou = playerNameOrId.trim().toLowerCase() === "you";
      const playerId = isYou ? userId : (playersList.find(p => p.id === playerNameOrId || p.name === playerNameOrId)?.id ?? playerNameOrId);
      const list = prev[playerId] ?? [];
      return {
        ...prev,
        [playerId]: [...list, { id: `pm-${Date.now()}-${Math.random().toString(36).slice(2)}`, from: fromName, content, timestamp: new Date() }]
      };
    });
  }, [userId]);

  // Initialize Game Master and Players
  const initializeGame = useCallback((config: GameConfig) => {
    // Use GM-created host when present, otherwise preset host
    const presetHost = getHostById(config.hostId) || getDefaultHost();
    const host = config.generatedHost
      ? {
          name: config.generatedHost.name,
          color: config.generatedHost.color,
          tagline: config.generatedHost.voiceStyle || config.generatedHost.personality,
          description: config.generatedHost.personality,
        }
      : presetHost;
    
    const gameMaster: Player = {
      id: "gm-1",
      name: host.name,
      avatar: host.color,
      role: host.name,
      status: host.tagline ?? undefined,
      isGameMaster: true,
      isAI: true,
      isMuted: false,
      background: host.description ?? undefined,
      gender: "gender" in host ? host.gender : undefined,
    };

    const aiPlayers: Player[] = [];
    
    // Use configured players (LLM-generated via /api/generate-players when not pre-configured)
    if (config.configuredPlayers && config.configuredPlayers.length > 0) {
      config.configuredPlayers.forEach((configPlayer, i) => {
        const role = configPlayer.role || undefined;
        const stats: Record<string, string | number> = {};
        if (role && (config.template === "werewolf" || config.template === "mafia")) {
          stats.Status = "Alive";
        }
        if (configPlayer.word && config.template === "undercover") {
          stats.Word = configPlayer.word;
        }

        aiPlayers.push({
          id: `ai-${i + 1}`,
          name: configPlayer.name,
          avatar: AI_COLORS[i % AI_COLORS.length],
          role: role || undefined,
          stats,
          isAI: true,
          isMuted: false,
          personality: configPlayer.personality || "Friendly and observant",
          background: configPlayer.background || "A game enthusiast",
          gender: configPlayer.gender as "male" | "female" | "other" | undefined,
        });
      });
    } else {
      // Fallback when API fails: placeholders (LLM decides normally via generate-players)
      const fallbackCount = config.playerCount > 0 ? config.playerCount : getDefaultAICountForTemplate(config.template);
      const traitsList = pickTraitsForPlayers(fallbackCount);
      for (let i = 0; i < fallbackCount; i++) {
        const traits = traitsList[i];
        aiPlayers.push({
          id: `ai-${i + 1}`,
          name: `Player ${i + 1}`,
          avatar: AI_COLORS[i % AI_COLORS.length],
          role: undefined,
          stats: {},
          isAI: true,
          isMuted: false,
          personality: traits.personality,
          background: traits.background,
          gender: "other",
        });
      }
    }

    // Add user
    const userPlayer: Player = {
      id: userId,
      name: "You",
      avatar: "#6366f1",
      role: config.template === "werewolf" ? "Villager" : "Civilian",
      stats: config.template === "werewolf" ? { Status: "Alive" } : {},
      isAI: false,
      isMuted: false
    };

    setPlayers([gameMaster, ...aiPlayers, userPlayer]);

    // Initial game message
    const initialMessages: Message[] = [
      {
        id: "msg-0",
        senderId: "system",
        senderName: "System",
        senderAvatar: host.color,
        content: `Welcome to ${config.name}! ${host.name} will guide you through the game.`,
        timestamp: new Date(),
        isAI: false,
        isSystemMessage: true
      },
      {
        id: "msg-1",
        senderId: "gm-1",
        senderName: host.name,
        senderAvatar: host.color,
        content: "…",
        timestamp: new Date(),
        isAI: true
      }
    ];

    setMessages(initialMessages);
    setPrivateMessages({});
    setGamePhase("intro");
    setGamePhaseState({ ...DEFAULT_GAME_PHASE, phase: "intro" });

    const fallbackGreeting = `Hey everyone, ${host.name} here. Here's how we'll play ${config.name}:\n\n${config.rules}\n\nReady when you are - let's go!`;

    const scheduleReadyReplies = () => {
      if (!isMountedRef.current) return;
      aiPlayers.slice(0, 3).forEach((player, index) => {
        const playerTimeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          try {
            const rulesSnippet = (config.rules || "").trim().slice(0, 500);
            const { message } = await getAIChatResponse({
              messages: [{
                role: "user",
                content: `You are ${player.name}, a player in a social deduction game. Your personality: ${player.personality || "Friendly and enthusiastic."} Your background: ${player.background || "A game enthusiast."}

Game rules (the language below is the ONLY language you may use):
${rulesSnippet || "No rules."}

${LANG_MATCH_RULES}

The host just explained the rules and asked if everyone is ready. Respond naturally in the SAME language as the rules above—do NOT use Spanish, Japanese, or any other language. Short (1-2 sentences). Output only your response.`
              }],
              gameContext: {
                template: config.template,
                gameName: config.name,
                conversationState: "intro"
              }
            });
            if (!isMountedRef.current) return;
            const reply = (message || "").trim() || "Ready!";
            addMessage({
              senderId: player.id,
              senderName: player.name,
              senderAvatar: player.avatar,
              content: reply,
              isAI: true
            });
          } catch (e) {
            if (!isMountedRef.current) return;
            const fallbackReplies = ["Ready!", "Let's do this!", "I'm prepared.", "Sounds good!", "Let's start!"];
            addMessage({
              senderId: player.id,
              senderName: player.name,
              senderAvatar: player.avatar,
              content: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
              isAI: true
            });
          }
        }, 1000 * (index + 1));
        timeoutRefs.current.push(playerTimeout);
      });
    };

    const greetingRequest = {
      messages: [{
        role: "user" as const,
        content: `You are ${host.name}, the host. The game is "${config.name}". Rules:\n\n${config.rules}\n\n${LANG_MATCH_RULES}\n\nWrite a short opening greeting to the players: introduce yourself, briefly explain the rules, and ask if everyone is ready. Speak naturally—like a real host would, spontaneous and warm. Keep it short—a few sentences at most; players are human, don't write a long intro. Whether you use emojis or not is up to your character. Output only the greeting, nothing else.`
      }],
      hostId: config.hostId,
      hostPersonality: config.generatedHost ? { name: config.generatedHost.name, description: config.generatedHost.personality, personality: config.generatedHost.voiceStyle } : undefined,
      gameContext: {
        template: config.template,
        playerCount: config.playerCount,
        gameName: config.name,
        rules: config.rules,
        conversationState: "intro"
      }
    };

    (async () => {
      let fullContent = "";
      try {
        await streamAIChatResponse(
          greetingRequest,
          (chunk) => {
            fullContent += chunk;
            if (isMountedRef.current) {
              setMessages(prev => prev.map((m) =>
                m.id === "msg-1" ? { ...m, content: fullContent, isStreaming: true } : m
              ));
            }
          },
          () => {
            if (!isMountedRef.current) return;
            const greeting = fullContent.trim() || fallbackGreeting;
            setMessages(prev => prev.map((m) =>
              m.id === "msg-1" ? { ...m, content: greeting, isStreaming: false } : m
            ));
            const mainTimeout = setTimeout(scheduleReadyReplies, 2000);
            timeoutRefs.current.push(mainTimeout);
          },
          (e) => {
            if (!isMountedRef.current) return;
            setMessages(prev => prev.map((m) =>
              m.id === "msg-1" ? { ...m, content: fallbackGreeting, isStreaming: false } : m
            ));
            const mainTimeout = setTimeout(scheduleReadyReplies, 2000);
            timeoutRefs.current.push(mainTimeout);
          }
        );
      } catch (e) {
        if (!isMountedRef.current) return;
        setMessages(prev => prev.map((m) =>
          m.id === "msg-1" ? { ...m, content: fallbackGreeting, isStreaming: false } : m
        ));
        const mainTimeout = setTimeout(scheduleReadyReplies, 2000);
        timeoutRefs.current.push(mainTimeout);
      }
    })();

  }, [userId, addMessage]);

  const handleCreateGame = useCallback(async (config: GameConfig) => {
    const toastId = "create-game";
    toast.loading("Creating game...", { id: toastId });

    try {
      // Generate game icon with AI
      let gameIcon = "🎮"; // Default fallback
      try {
        toast.loading("Generating icon...", { id: toastId });
        const iconResponse = await fetch('/api/generate-game-icon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameName: config.name,
            gameTemplate: config.template,
            rules: config.rules
          })
        });

        if (iconResponse.ok) {
          const iconData = await iconResponse.json();
          gameIcon = iconData.icon;
        } else {
          gameIcon = config.template === "werewolf" ? "🐺" : config.template === "undercover" ? "🕵️" : "🎮";
        }
      } catch (error) {
        console.error('Error generating game icon:', error);
        gameIcon = config.template === "werewolf" ? "🐺" : config.template === "undercover" ? "🕵️" : "🎮";
      }

      // Generate players via LLM when not configured
      let finalConfig = config;
      if (!config.configuredPlayers || config.configuredPlayers.length === 0) {
        try {
          toast.loading("Setting up players...", { id: toastId });
          const playersRes = await fetch('/api/generate-players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerCount: config.playerCount || 0,
              gameTemplate: config.template,
              rules: config.rules,
              minPlayers: config.template === 'werewolf' ? 5 : config.template === 'undercover' ? 4 : config.template === 'mafia' ? 6 : 2,
              maxPlayers: config.template === 'werewolf' ? 12 : config.template === 'undercover' ? 10 : config.template === 'mafia' ? 15 : 20
            })
          });
          if (playersRes.ok) {
            const data = await playersRes.json();
            const aiCount = data.players?.length ?? config.playerCount;
            finalConfig = { ...config, playerCount: aiCount, configuredPlayers: data.players };
          }
        } catch (err) {
          console.warn('Failed to generate players:', err);
        }
      }
      
      const newGame: Game = {
        id: `game-${Date.now()}`,
        name: config.name,
        icon: gameIcon,
        color: config.template === "werewolf" ? "#7c3aed" : config.template === "undercover" ? "#0ea5e9" : "#ec4899",
        config: finalConfig,
        isActive: false
      };

      setGames(prev => [...prev, newGame]);
      setSelectedGameId(newGame.id);
      setSelectedChannelId("game-room");
      setGameProgressByGameId(prev => ({ ...prev, [newGame.id]: "" }));
      setShowGameMasterChat(false);
      setShowGameCreatorForm(false);
      initializeGame(finalConfig);
      toast.success(`"${config.name}" is ready!`, { id: toastId });
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error("Failed to create game", { id: toastId });
    }
  }, [initializeGame]);

  // Track last sent message to prevent duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  /** Schedules Host to pick next speaker; Host decides when to act via NEXT_AFTER_SECONDS and REPLY_AFTER_SECONDS. */
  const scheduleNextSpeaker = useCallback(() => {
    const initialDelay = 6000 + Math.random() * 4000;
    const t = setTimeout(async () => {
      if (!isMountedRef.current) return;
      const messages = messagesRef.current;
      const players = playersRef.current;
      const games = gamesRef.current;
      const gamePhase = gamePhaseRef.current;
      const selectedGameId = selectedGameIdRef.current;
      const currentGame = games.find(g => g.id === selectedGameId);
      const gameMaster = players.find(p => p.isGameMaster);
      if (!gameMaster || !currentGame?.isActive) return;
      const alivePlayersList = players.filter(
        p => !p.isGameMaster && !p.isMuted && p.status !== "Eliminated" && p.stats?.Status !== "Eliminated"
      );
      if (alivePlayersList.length === 0) return;

      setTypingUsers([{ name: gameMaster.name, avatar: gameMaster.avatar }]);
      const recentMessages = messages.slice(-8).map(m => ({
        role: m.senderId === userId ? "user" : "assistant",
        content: `${m.senderName}: ${m.content}`
      }));
      const playersInfo = alivePlayersList.map(p => ({
        id: p.id, name: p.name, role: p.role || "Player", isAI: p.isAI || false,
        personality: p.personality || "Friendly and observant", background: p.background || "A game enthusiast", isUser: p.id === userId
      }));
      const recentNames = recentSpeakers.current.map(id => alivePlayersList.find(p => p.id === id)?.name).filter(Boolean);
      const lastFewFromUser = messages.slice(-6).some(m => m.senderId === userId);
      const pacingHint = !lastFewFromUser && messages.length >= 4
        ? "\n\nIf the human (You) hasn't spoken in a while, you may optionally give them a turn—but don't over-call them. Run the game flow; let AI players participate."
        : "";
      const languageRule = LANG_MATCH_RULES.replace("above", "below").replace("write all your output", "write all your output (NEXT_SPEAKER, PRIVATE_TO_..., MY_BOARD_FOR_..., POST_EVENT, UPDATE_PROGRESS)");

      let selectedPlayer: typeof alivePlayersList[0] | null = null;
      let nextAfterSeconds = 12;
      let replyAfterSeconds = 12;
      try {
        let hostDecision = "";
        await streamAIChatResponse({
          messages: [{
            role: "user",
            content: `You are ${gameMaster.name}, the host of "${currentGame.name}". You are in control—announce the flow, let AI players respond; don't keep asking the human for confirmation.

CRITICAL—RULES ARE LOCKED: The game is "${currentGame.name}". Rules are decided in GM chat (setup) before the game starts; the Host has NO authority to change rules—only to run the game. Once the game has started, rules are immutable. Do NOT output <EDIT_RULES>, <ADD_TO_RULES>, or <REPLACE_IN_RULES>. Do NOT invent a different game (e.g. hotel escape, fear meter, relics, spirits). Run ONLY this game: use the phases, roles, and actions defined in the rules below—nothing else.

REALISM: Speak naturally and authentically, like a real host. Vary your phrasing—don't sound scripted or formulaic. Be spontaneous and engaging. POST_EVENT text should feel human, conversational, not robotic. Keep POST_EVENT short: one sentence is often enough; 2 at most. Players are human and read in real time—no long paragraphs. Whether you use emojis or not is up to your character.

You may:
1) Decide who speaks next
2) Optionally send private messages to specific players (e.g. clues, role info, secrets)
3) Optionally write to a player's My Board (only that player sees it)—use for hidden-role games. You decide what to show: e.g. their role at start, night action result (who the Seer saw, who was saved), etc. Only that player sees their Board.
4) Optionally post a public event/announcement to the channel

${languageRule}

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessages.length > 0 ? recentMessages.map(m => `${m.role === "user" ? "Player" : "Other player"}: ${m.content}`).join("\n") : "Game just started."}

Available players (alive, not muted):
${playersInfo.map(p => `- ${p.name} (Role: ${p.role}, Type: ${p.isAI ? "AI" : "Human"}, Personality: ${p.personality})`).join("\n")}

Recent speakers: ${recentNames.length ? recentNames.join(", ") : "none yet"}
Current game phase: ${gamePhase}

Pacing: SLOW DOWN. Use longer NEXT_AFTER_SECONDS (10-20) and REPLY_AFTER_SECONDS (10-20). Don't flood—let players read. Reply NONE sometimes for natural pauses. Run the game autonomously: balance turns across AI players; only select You when the game flow genuinely requires the human's input (e.g. their turn to answer). Don't constantly direct questions at the human. One speaker at a time. Output at most ONE POST_EVENT per turn—one short sentence or two; never a long paragraph.${pacingHint}

Reply using these lines (one per line). You MUST include exactly one next-speaker line. Optional lines can be in any order after it.
- NEXT_SPEAKER: PlayerName   (exactly one; use a name from the list above, or NONE if no one should speak right now—use NONE to create a pause)
- NEXT_AFTER_SECONDS: N      (optional; 10-20 seconds to wait before acting; default 12; USE 12 OR MORE—don't rush, let players read)
- REPLY_AFTER_SECONDS: N     (optional; 10-20 seconds before the selected speaker's reply appears; default 12; USE 12 OR MORE)
- PRIVATE_TO_PlayerName: your private message to that player (can repeat for different players)
- MY_BOARD_FOR_PlayerName: one line (or short text) to show on that player's My Board only. Use for hidden-role games (e.g. "Your role: Werewolf. Teammates: Kenji, Zuri." or "You saw Luna as Werewolf."). You decide what each player sees—only that player sees it. Use "You" for the human player (MY_BOARD_FOR_You: ...). Use underscores in names if needed (e.g. MY_BOARD_FOR_Sofia_Mendez: ...).
- POST_EVENT: your public announcement—one short sentence or two; write naturally, no long paragraphs (players are human)
- UPDATE_PROGRESS: in-game progress summary for the # progress channel (optional). One short line—round, phase, what players discovered. No long paragraphs; players are human. Only the Host can update progress; Rules (including background story if any) are set by the GM and cannot be changed during the game.

Example:
NEXT_SPEAKER: Sofia
NEXT_AFTER_SECONDS: 12
REPLY_AFTER_SECONDS: 12
PRIVATE_TO_Kenji: You are the werewolf. Your teammates are Omar and Zuri.
MY_BOARD_FOR_Kenji: Your role: Werewolf. Teammates: Omar, Zuri.
POST_EVENT: The moon rises. Night has fallen.`
          }],
          hostId: currentGame.config.hostId,
          hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
          gameContext: { template: currentGame.config.template, gameName: currentGame.name, rules: currentGame.config.rules, conversationState: gamePhase }
        },
        (chunk) => {
          hostDecision += chunk;
        },
        () => {
          if (!isMountedRef.current) return;
          setTypingUsers([]);
        }
        );
        if (!isMountedRef.current) return;
        const raw = hostDecision.trim();
        const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
        let nextSpeakerName: string | null = null;
        nextAfterSeconds = 12;
        replyAfterSeconds = 12;
        for (const line of lines) {
          if (line.toUpperCase().startsWith("NEXT_SPEAKER:")) {
            nextSpeakerName = line.slice("NEXT_SPEAKER:".length).trim();
          } else if (line.toUpperCase().startsWith("NEXT_AFTER_SECONDS:")) {
            const n = parseInt(line.slice("NEXT_AFTER_SECONDS:".length).trim(), 10);
            if (!isNaN(n) && n >= 10 && n <= 20) nextAfterSeconds = n;
          } else if (line.toUpperCase().startsWith("REPLY_AFTER_SECONDS:")) {
            const n = parseInt(line.slice("REPLY_AFTER_SECONDS:".length).trim(), 10);
            if (!isNaN(n) && n >= 10 && n <= 20) replyAfterSeconds = n;
          }
        }
        // Human-like variation: add slight random jitter (±1–2s) so timing feels natural
        nextAfterSeconds = Math.max(10, Math.min(20, nextAfterSeconds + Math.floor((Math.random() - 0.5) * 4)));
        replyAfterSeconds = Math.max(10, Math.min(20, replyAfterSeconds + Math.floor((Math.random() - 0.5) * 4)));
        if (!nextSpeakerName) nextSpeakerName = lines.find(l => !l.toUpperCase().startsWith("NEXT_AFTER_SECONDS:") && !l.toUpperCase().startsWith("REPLY_AFTER_SECONDS:") && !l.toUpperCase().startsWith("PRIVATE_TO_") && !l.toUpperCase().startsWith("MY_BOARD_FOR_") && !l.toUpperCase().startsWith("POST_EVENT:") && !l.toUpperCase().startsWith("UPDATE_PROGRESS:"))?.trim() || null;
        selectedPlayer = nextSpeakerName && nextSpeakerName.toUpperCase() !== "NONE"
          ? alivePlayersList.find(p => p.name.toLowerCase() === nextSpeakerName!.toLowerCase() || p.name === nextSpeakerName) ?? null
          : null;
        if (!selectedPlayer) {
          const isErrorOrEmpty = !raw || API_ERROR_PLACEHOLDER.test(raw);
          if (isErrorOrEmpty) {
            addEventNotification(notifyLang(currentGame.config.rules, "Host chose who speaks next at random.", "Host 随机选择了下一位发言者。"));
          }
          const aiOnly = alivePlayersList.filter(p => p.isAI);
          const pool = aiOnly.length > 0 ? aiOnly : alivePlayersList;
          selectedPlayer = pool[Math.floor(Math.random() * pool.length)];
        }
        if (!selectedPlayer) return;
        recentSpeakers.current.push(selectedPlayer.id);
        if (recentSpeakers.current.length > 5) recentSpeakers.current.shift();
        const postEventTexts: string[] = [];
        for (const line of lines) {
          if (line.toUpperCase().startsWith("PRIVATE_TO_")) {
            const rest = line.slice("PRIVATE_TO_".length);
            const colon = rest.indexOf(":");
            if (colon >= 0) {
              const toName = rest.slice(0, colon).trim();
              const msg = rest.slice(colon + 1).trim();
              if (toName && msg) addPrivateMessage(toName, msg, gameMaster.name);
            }
          }
          if (line.toUpperCase().startsWith("MY_BOARD_FOR_")) {
            const rest = line.slice("MY_BOARD_FOR_".length);
            const colonSpace = rest.indexOf(": ");
            if (colonSpace >= 0 && selectedGameId) {
              const namePart = rest.slice(0, colonSpace).trim().replace(/_/g, " ");
              const content = rest.slice(colonSpace + 2).trim();
              const target = namePart.toLowerCase() === "you"
                ? alivePlayersList.find(p => p.id === userId)
                : alivePlayersList.find(p => p.name.toLowerCase() === namePart.toLowerCase() || p.name.replace(/\s+/g, " ").toLowerCase() === namePart.toLowerCase());
              if (target && content) {
                setMyBoardContentByGameId(prev => ({
                  ...prev,
                  [selectedGameId]: { ...(prev[selectedGameId] || {}), [target.id]: content }
                }));
              }
            }
          }
          if (line.toUpperCase().startsWith("POST_EVENT:")) {
            const text = line.slice("POST_EVENT:".length).trim();
            if (text) postEventTexts.push(text);
          }
          if (line.toUpperCase().startsWith("UPDATE_PROGRESS:")) {
            const text = line.slice("UPDATE_PROGRESS:".length).trim();
            if (text && selectedGameId) {
              setGameProgressByGameId(prev => ({ ...prev, [selectedGameId]: text }));
            }
          }
        }
        // Single host announcement per turn: merge all POST_EVENT lines into one to avoid flood.
        // Strip any rule-editing tags (Host must not change rules during game)—only show real announcement.
        if (postEventTexts.length > 0) {
          let merged = postEventTexts.join("\n\n");
          merged = merged
            .replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, "")
            .replace(/<ADD_TO_RULES[^>]*>[\s\S]*?<\/ADD_TO_RULES>/gi, "")
            .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*?<\/REPLACE_IN_RULES>/gi, "")
            .trim();
          if (merged) await hostPostEventRef.current?.(merged, { skipScheduleNextSpeaker: true });
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error("AI Host decision failed:", err);
        if (!isMountedRef.current) return;
        setTypingUsers([]);
        nextAfterSeconds = 12;
        replyAfterSeconds = 12;
        const shortMsg = err.message?.slice(0, 120) || notifyLang(currentGame.config.rules, "Host chose who speaks next at random.", "Host 随机选择了下一位发言者。");
        addEventNotification(shortMsg);
        const aiOnly = alivePlayersList.filter(p => p.isAI);
        const pool = aiOnly.length > 0 ? aiOnly : alivePlayersList;
        selectedPlayer = pool[Math.floor(Math.random() * pool.length)];
        recentSpeakers.current.push(selectedPlayer.id);
        if (recentSpeakers.current.length > 5) recentSpeakers.current.shift();
      }
      if (!selectedPlayer) return;

      const waitMs = nextAfterSeconds * 1000;
      const executeTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
      if (selectedPlayer!.id === userId) {
        setCurrentSpeakerId(userId);
        setTypingUsers([{ name: gameMaster.name, avatar: gameMaster.avatar }]);
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setTypingUsers([]);
          addEventNotification(notifyLang(currentGame.config.rules, "Your turn.", "轮到你了。"));
          window.dispatchEvent(new CustomEvent('focusGameInput'));
        }, 800);
        timeoutRefs.current = timeoutRefs.current.filter(x => x !== executeTimeout);
        return;
      }

      if (selectedPlayer.isAI) {
        setTypingUsers([{ name: selectedPlayer.name, avatar: selectedPlayer.avatar }]);
        const aiReplyDelayMs = replyAfterSeconds * 1000;
        const messageTimeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          const messagesNow = messagesRef.current;
          const recentMessagesForAI = messagesNow.slice(-8).map(m => `${m.senderName}: ${m.content}`);
          
          const messageId = addStreamingMessage({
            senderId: selectedPlayer.id,
            senderName: selectedPlayer.name,
            senderAvatar: selectedPlayer.avatar,
            isAI: true
          });
          setTypingUsers([]);

          const playerPrompt = `You are ${selectedPlayer.name}, a player in the game "${currentGame.name}".

CRITICAL—STAY IN THIS GAME: The rules below are FIXED. Your role is: ${selectedPlayer.role || "Player"}. You must act ONLY according to these rules and your role (e.g. in Werewolf: Villager discusses suspects and votes to eliminate; Werewolf hides identity and eliminates at night; Seer/Doctor use their ability as per rules). Do NOT invent a different game or scenario (e.g. hotel, spirits, fear meter)—stay in this game and do what your role does.

Your personality: ${selectedPlayer.personality || "Friendly and observant."}
Your background: ${selectedPlayer.background || "A game enthusiast."}

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessagesForAI.join("\n")}

${LANG_MATCH_RULES}

REALISM: React to what was just said—don't give a generic reply. Be natural and human-like. Stay in character and in this game. Keep your reply short: one sentence is often enough; 2–3 at most. Real players don't give speeches. Whether you use emojis or not is up to your character.

CRITICAL: Write ONLY in the same language as the Game Rules above. Do NOT use Spanish, Japanese, or any other language—everyone in this game speaks the rules' language. Output only your response.`;
          const playerChatReq = {
            messages: [{ role: "user" as const, content: playerPrompt }],
            gameContext: { template: currentGame.config.template, gameName: currentGame.name, rules: currentGame.config.rules, conversationState: gamePhase }
          };
          const defaultReplies = ["That's an interesting point...", "I'm not sure I agree with that.", "Can you explain more?", "I think we should consider all options.", "Based on what I've seen, I have my suspicions.", "Let's think about this carefully."];
          const onError = () => {
            if (!isMountedRef.current) return;
            const errorMsg = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
            updateStreamingMessage(messageId, errorMsg, true);
            addEventNotification(notifyLang(currentGame.config.rules, `${selectedPlayer.name} gave a default reply.`, `${selectedPlayer.name} 给出了默认回复。`));
            scheduleNextSpeaker();
          };

          let fullContent = "";
          try {
            await streamAIChatResponse(
              playerChatReq,
              (chunk) => { if (isMountedRef.current) { fullContent += chunk; updateStreamingMessage(messageId, fullContent, false); } },
              () => { if (isMountedRef.current) { updateStreamingMessage(messageId, fullContent.trim() || "I'm thinking...", true); scheduleNextSpeaker(); } },
              onError
            );
          } catch (e) {
            onError();
          }
          timeoutRefs.current = timeoutRefs.current.filter(x => x !== messageTimeout);
        }, aiReplyDelayMs);
        timeoutRefs.current.push(messageTimeout);
      }
        timeoutRefs.current = timeoutRefs.current.filter(x => x !== executeTimeout);
      }, waitMs);
      timeoutRefs.current.push(executeTimeout);
      timeoutRefs.current = timeoutRefs.current.filter(x => x !== t);
    }, initialDelay);
    timeoutRefs.current.push(t);
  }, [addMessage, addEventNotification, userId, addPrivateMessage, addStreamingMessage, updateStreamingMessage]);

  const hostPostEventRef = useRef<(eventDescription: string, opts?: { nextSpeakerId?: string | null; setPhase?: GamePhaseKind | string; autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: GamePhaseKind | string }; skipScheduleNextSpeaker?: boolean }) => Promise<void>>(null!);

  const handleSendMessage = useCallback((content: string) => {
    if (!isMountedRef.current) return;
    
    // Prevent duplicate messages within 500ms
    const now = Date.now();
    if (lastSentMessageRef.current && 
        lastSentMessageRef.current.content === content && 
        now - lastSentMessageRef.current.timestamp < 500) {
      return;
    }
    lastSentMessageRef.current = { content, timestamp: now };
    
    const currentGame = games.find(g => g.id === selectedGameId);
    const isGameActive = currentGame?.isActive || false;
    
    // Check if user can speak (only if game is not active, or no speaker assigned, or user is the assigned speaker)
    if (isGameActive && currentSpeakerId && currentSpeakerId !== userId) {
      addEventNotification(notifyLang(currentGame?.config.rules, "It's not your turn to speak. Wait for the Host to assign you.", "还没轮到你发言，请等待 Host 指定。"));
      return;
    }
    
    addMessage({
      senderId: userId,
      senderName: "You",
      senderAvatar: "#6366f1",
      content,
      isAI: false
    });

    // Get the Game Master
    const gameMaster = players.find(p => p.isGameMaster);

    // Simulate AI responses
    if (gamePhase === "intro" && gameMaster) {
      // Show typing indicator
      const typingTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        setTypingUsers([{ name: gameMaster.name, avatar: gameMaster.avatar }]);
      }, 800);
      timeoutRefs.current.push(typingTimeout);
      
      const responseTimeout = setTimeout(async () => {
        if (!isMountedRef.current) return;
        const currentGame = games.find(g => g.id === selectedGameId);
        let gameBeginsContent = "";
        let gameBeginsDelayMs = 4000;
        try {
          const { message } = await getAIChatResponse({
            messages: [{
              role: "user",
              content: `You are ${gameMaster.name}, the host. Everyone has finished speaking—the game "${currentGame?.name || "this game"}" is about to begin. ${LANG_MATCH_RULES}\n\nWrite a very brief announcement (1-2 short sentences) to officially start the game. Like real game hosting—players are human, don't write a long intro. Stay in character.\n\nOptional: add DELAY_SECONDS: N (2-8) on a line to control when you appear to reply (seconds to wait). If omitted, 4.\n\nOutput format: optional "DELAY_SECONDS: N" line, then your announcement.`
            }],
            hostId: currentGame?.config.hostId,
            hostPersonality: currentGame?.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
            gameContext: { template: currentGame?.config.template, gameName: currentGame?.name, rules: currentGame?.config.rules, conversationState: "intro" }
          });
          const rawResponse = (message || "").trim();
        const delayMatch = rawResponse.match(/DELAY_SECONDS:\s*(\d+)/i);
        if (delayMatch) {
          const n = parseInt(delayMatch[1], 10);
          if (n >= 2 && n <= 8) gameBeginsDelayMs = n * 1000;
        }
        gameBeginsContent = rawResponse.replace(/DELAY_SECONDS:\s*\d+\s*\n?/gi, "").trim();
        } catch (e) {
          console.warn("Failed to generate game-begins message:", e);
        }
        if (!gameBeginsContent) {
          gameBeginsContent = `Let the game begin! I'll guide each phase and manage the speaking order.`;
        }
        const gameBeginsShowTimeout = setTimeout(() => {
          if (!isMountedRef.current) return;
          setTypingUsers([]);
        addMessage({
          senderId: "gm-1",
          senderName: gameMaster.name,
          senderAvatar: gameMaster.avatar,
          content: gameBeginsContent,
          isAI: true
        });
        setGamePhase("active");
        const firstPhase: GamePhaseKind = currentGame?.config.template === "werewolf" ? "night" : "day";
        setGamePhaseState({
          round: 1,
          phase: firstPhase,
          eliminatedPlayerIds: [],
          lastNightVictimId: null,
          lastVotedOutId: null,
        });
        setGames(prev => {
          const g = prev.find(x => x.id === selectedGameId);
          if (g) return prev.map(x => x.id === selectedGameId ? { ...x, isActive: true } : x);
          return prev;
        });
        
        // Auto-start first phase after intro
        if (currentGame?.config.template === "werewolf") {
          const autoStartTimeout = setTimeout(async () => {
            if (!isMountedRef.current) return;
            await hostPostEventRef.current?.(
              "Announce that Night Phase begins. All players close their eyes. Werewolves wake up and choose a victim.",
              { 
                setPhase: "night",
                autoAdvance: { 
                  afterMs: 15000, 
                  nextEvent: "Announce that Day Phase begins. Everyone wakes up. Reveal who was eliminated during the night (if any).", 
                  nextPhase: "day" 
                } 
              }
            );
            timeoutRefs.current = timeoutRefs.current.filter(t => t !== autoStartTimeout);
          }, 3000);
          timeoutRefs.current.push(autoStartTimeout);
        }
        timeoutRefs.current = timeoutRefs.current.filter(x => x !== gameBeginsShowTimeout);
      }, gameBeginsDelayMs);
      timeoutRefs.current.push(gameBeginsShowTimeout);
      }, 1000);
      timeoutRefs.current.push(responseTimeout);
    } else {
      scheduleNextSpeaker();
    }
  }, [addMessage, addEventNotification, scheduleNextSpeaker, userId, players, gamePhase, selectedGameId, games]);

  const handleToggleMute = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, isMuted: !p.isMuted } : p
    ));
    const player = players.find(p => p.id === playerId);
    const cg = games.find(g => g.id === selectedGameId);
    if (player) {
      addEventNotification(notifyLang(cg?.config.rules, `${player.name} has been ${player.isMuted ? "unmuted" : "muted"}`, `${player.name} 已被${player.isMuted ? "取消静音" : "静音"}`));
    }
  };

  type HostPostEventOpts = {
    nextSpeakerId?: string | null;
    setPhase?: GamePhaseKind | string;
    autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: GamePhaseKind | string };
    skipScheduleNextSpeaker?: boolean;
  };

  const hostPostEvent = useCallback(async (
    eventDescription: string,
    opts?: HostPostEventOpts
  ) => {
    if (!isMountedRef.current) return;
    const gameMaster = players.find(p => p.isGameMaster);
    if (!gameMaster) return;

    const currentGame = games.find(g => g.id === selectedGameId);
    
    const rulesForLang = (currentGame?.config.rules || "").trim().slice(0, 600);
    const postOne = async (desc: string, updatePhase?: GamePhaseKind | string) => {
      const msgPayload = {
        senderId: "gm-1",
        senderName: gameMaster!.name,
        senderAvatar: gameMaster!.avatar,
        isAI: true
      };
      const chatRequest = {
        messages: [{
          role: "user" as const,
          content: `You are ${gameMaster!.name}, the host of "${currentGame?.name || "the game"}". Game rules (use this language for your announcement):\n${rulesForLang || "No rules."}\n\n${LANG_MATCH_RULES}\n\n${desc} Announce this to the players in character. Keep it very brief—one short sentence is often enough; 2 at most. Players are human, like real game hosting. Whether you use emojis or not is up to your character. Output only the announcement.`
        }],
        hostId: currentGame?.config.hostId,
        hostPersonality: currentGame?.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
        gameContext: {
          template: currentGame?.config.template,
          gameName: currentGame?.name,
          conversationState: gamePhaseState.phase
        }
      };
      const applyPhase = () => {
        if (updatePhase) {
          const phase = updatePhase as GamePhaseKind;
          setGamePhaseState(s => ({
            ...s,
            phase,
            ...(phase === "night" && s.phase === "elimination"
              ? { round: s.round + 1, lastVotedOutId: null, lastNightVictimId: null }
              : {})
          }));
        }
      };

      const messageId = addStreamingMessage(msgPayload);
      let fullContent = "";
      try {
        await streamAIChatResponse(
          chatRequest,
          (chunk) => {
            if (!isMountedRef.current) return;
            fullContent += chunk;
            updateStreamingMessage(messageId, fullContent, false);
          },
          () => {
            if (!isMountedRef.current) return;
            const finalText = fullContent.trim() || desc;
            updateStreamingMessage(messageId, finalText, true);
            applyPhase();
          },
          () => {
            if (!isMountedRef.current) return;
            updateStreamingMessage(messageId, desc, true);
            applyPhase();
          }
        );
      } catch (e) {
        if (!isMountedRef.current) return;
        updateStreamingMessage(messageId, desc, true);
        applyPhase();
      }
    };

    await postOne(eventDescription, opts?.setPhase);

    if (opts?.nextSpeakerId !== undefined) {
      setCurrentSpeakerId(opts.nextSpeakerId);
      if (opts?.nextSpeakerId) {
        const nextPlayer = players.find(p => p.id === opts!.nextSpeakerId);
        if (nextPlayer) addEventNotification(notifyLang(currentGame?.config.rules, `${nextPlayer.name} is now speaking`, `${nextPlayer.name} 正在发言`));
      } else {
        addEventNotification(notifyLang(currentGame?.config.rules, "Speaking is now open to all", "现在大家可以自由发言"));
      }
    }

    if (opts?.autoAdvance && opts.autoAdvance.afterMs > 0) {
      const { afterMs, nextEvent, nextPhase } = opts.autoAdvance;
      const t = setTimeout(() => {
        if (!isMountedRef.current) return;
        postOne(nextEvent, nextPhase as GamePhaseKind);
        timeoutRefs.current = timeoutRefs.current.filter(x => x !== t);
      }, afterMs);
      timeoutRefs.current.push(t);
    }

    // After Host announces (e.g. "discussion begins"), schedule who speaks next so the game doesn't get stuck.
    // Skip when next speaker is the user—wait for them to respond instead of looping.
    if (currentGame?.isActive && !opts?.skipScheduleNextSpeaker) scheduleNextSpeaker();
  }, [players, games, selectedGameId, gamePhaseState.phase, addMessage, addEventNotification, scheduleNextSpeaker, addStreamingMessage, updateStreamingMessage]);

  useEffect(() => {
    hostPostEventRef.current = hostPostEvent;
  }, [hostPostEvent]);

  const hostAssignSpeaker = useCallback((playerId: string | null) => {
    setCurrentSpeakerId(playerId);
    const cg = games.find(g => g.id === selectedGameId);
    if (playerId) {
      const player = players.find(p => p.id === playerId);
      if (player) addEventNotification(notifyLang(cg?.config.rules, `${player.name} is now speaking`, `${player.name} 正在发言`));
    } else {
      addEventNotification(notifyLang(cg?.config.rules, "Speaking is now open to all", "现在大家可以自由发言"));
    }
  }, [players, games, selectedGameId, addEventNotification]);

  const alivePlayers = players.filter(
    p => !p.isGameMaster && p.status !== "Eliminated" && p.stats?.Status !== "Eliminated"
  );

  // Check win conditions
  const checkWinConditions = useCallback(() => {
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!currentGame || gameEnded) return;
    
    const alive = players.filter(
      p => !p.isGameMaster && p.status !== "Eliminated" && p.stats?.Status !== "Eliminated"
    );
    
    if (alive.length === 0) {
      setGameEnded(true);
      setGameResult({ winner: "No one", message: "Game ended with no survivors" });
      return;
    }
    
    // Werewolf win conditions
    if (currentGame.config.template === "werewolf") {
      const werewolves = alive.filter(p => p.role === "Werewolf");
      const villagers = alive.filter(p => p.role !== "Werewolf");
      
      if (werewolves.length === 0) {
        setGameEnded(true);
        setGameResult({ winner: "Villagers", message: "All werewolves have been eliminated!" });
      } else if (werewolves.length >= villagers.length) {
        setGameEnded(true);
        setGameResult({ winner: "Werewolves", message: "Werewolves have taken over the village!" });
      }
    }
    
    // Undercover win conditions
    if (currentGame.config.template === "undercover") {
      const undercover = alive.filter(p => p.role === "Undercover");
      const civilians = alive.filter(p => p.role === "Civilian");
      
      if (undercover.length === 0) {
        setGameEnded(true);
        setGameResult({ winner: "Civilians", message: "The undercover agent has been caught!" });
      } else if (alive.length <= 3 && undercover.length > 0) {
        setGameEnded(true);
        setGameResult({ winner: "Undercover", message: "The undercover agent survived!" });
      }
    }
  }, [players, games, selectedGameId, gameEnded]);

  const hostEliminatePlayer = useCallback(async (playerId: string) => {
    if (!isMountedRef.current) return;
    const gameMaster = players.find(p => p.isGameMaster);
    const target = players.find(p => p.id === playerId);
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!gameMaster || !target || !currentGame) return;

    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? {
            ...p,
            status: "Eliminated",
            stats: { ...p.stats, Status: "Eliminated" } as Record<string, string | number>,
          }
        : p
    ));
    setGamePhaseState(s => ({
      ...s,
      eliminatedPlayerIds: [...s.eliminatedPlayerIds, playerId],
      lastVotedOutId: playerId,
      phase: "elimination",
    }));
    setCurrentSpeakerId(null);
    
    // Check win conditions after elimination
    setTimeout(() => {
      checkWinConditions();
    }, 1000);

    const elimRulesSnippet = (currentGame.config.rules || "").trim().slice(0, 500);
    const desc = `Announce that ${target.name} has been eliminated. Be brief and in character.`;
    const fallback = `${target.name} has been eliminated.`;
    const messageId = addStreamingMessage({
      senderId: "gm-1",
      senderName: gameMaster.name,
      senderAvatar: gameMaster.avatar,
      isAI: true
    });
    const chatReq = {
      messages: [{ role: "user" as const, content: `You are ${gameMaster.name}, the host. Game rules (use this language for your announcement):\n${elimRulesSnippet || "No rules."}\n\n${LANG_MATCH_RULES}\n\n${desc} Keep it very brief—one short sentence is enough; 2 at most. Whether you use emojis or not is up to your character. Output only the announcement.` }],
      hostId: currentGame.config.hostId,
      hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
      gameContext: { template: currentGame.config.template, gameName: currentGame.name }
    };
    let fullContent = "";
    try {
      await streamAIChatResponse(
        chatReq,
        (chunk) => { fullContent += chunk; if (isMountedRef.current) updateStreamingMessage(messageId, fullContent, false); },
        () => { if (isMountedRef.current) updateStreamingMessage(messageId, fullContent.trim() || fallback, true); },
        () => { if (isMountedRef.current) updateStreamingMessage(messageId, fallback, true); }
      );
    } catch {
      if (isMountedRef.current) updateStreamingMessage(messageId, fallback, true);
    }
    addEventNotification(notifyLang(currentGame.config.rules, `${target.name} eliminated`, `${target.name} 被淘汰`));
  }, [players, games, selectedGameId, addMessage, addEventNotification, addStreamingMessage, updateStreamingMessage]);

  const hostRevealRole = useCallback(async (playerId: string) => {
    if (!isMountedRef.current) return;
    const gameMaster = players.find(p => p.isGameMaster);
    const target = players.find(p => p.id === playerId);
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!gameMaster || !target || !currentGame) return;

    const role = target.role || "Unknown";
    const revealRulesSnippet = (currentGame.config.rules || "").trim().slice(0, 500);
    const desc = `Announce that ${target.name} was a ${role}. Reveal their role to the group. One short sentence is enough; 2 at most.`;
    const fallback = `${target.name} was a ${role}.`;
    const messageId = addStreamingMessage({
      senderId: "gm-1",
      senderName: gameMaster.name,
      senderAvatar: gameMaster.avatar,
      isAI: true
    });
    const chatReq = {
      messages: [{ role: "user" as const, content: `You are ${gameMaster.name}, the host. Game rules (use this language for your announcement):\n${revealRulesSnippet || "No rules."}\n\n${LANG_MATCH_RULES}\n\n${desc} Whether you use emojis or not is up to your character. Output only the announcement.` }],
      hostId: currentGame.config.hostId,
      hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
      gameContext: { template: currentGame.config.template, gameName: currentGame.name }
    };
    let fullContent = "";
    try {
      await streamAIChatResponse(
        chatReq,
        (chunk) => { fullContent += chunk; if (isMountedRef.current) updateStreamingMessage(messageId, fullContent, false); },
        () => { if (isMountedRef.current) updateStreamingMessage(messageId, fullContent.trim() || fallback, true); },
        () => { if (isMountedRef.current) updateStreamingMessage(messageId, fallback, true); }
      );
    } catch {
      if (isMountedRef.current) updateStreamingMessage(messageId, fallback, true);
    }
  }, [players, games, selectedGameId, addStreamingMessage, updateStreamingMessage]);

  // AI Host Auto-Decision System - automatically advances game phases and makes decisions
  const aiHostAutoDecision = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!currentGame?.isActive) return;
    
    const gameMaster = players.find(p => p.isGameMaster);
    if (!gameMaster) return;

    const aliveCount = alivePlayers.length;
    const phase = gamePhaseState.phase;
    const template = currentGame.config.template;

    // Auto-advance based on game rules and state
    if (template === "werewolf") {
      if (phase === "night" && !gamePhaseState.lastNightVictimId) {
        // Night phase: LLM (as werewolf team) chooses victim, then move to day
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          const werewolves = alivePlayers.filter(p => p.role === "Werewolf");
          const possibleVictims = alivePlayers.filter(p => p.role !== "Werewolf");
          if (werewolves.length > 0 && possibleVictims.length > 0) {
            let victim: typeof possibleVictims[0] | null = null;
            const victimNames = possibleVictims.map(p => p.name).join(", ");
            toast.loading("Host is deciding the night target…", { id: "night-decision" });
            try {
              const { message } = await getAIChatResponse({
                messages: [{
                  role: "user",
                  content: `You are the werewolf team in a werewolf game. You must choose one living villager to eliminate tonight. Living non-werewolf players (choose exactly one): ${victimNames}. Consider who is a threat or who to frame. Reply with ONLY the exact name of the player you choose to kill, nothing else.`
                }],
                gameContext: { template: "werewolf", gameName: currentGame.name, conversationState: "night" }
              });
              if (!isMountedRef.current) return;
              const name = (message || "").trim();
              victim = possibleVictims.find(p => p.name === name || p.name.toLowerCase() === name.toLowerCase()) ?? null;
            } catch (e) {
              console.error("Night victim LLM failed:", e);
            }
            toast.dismiss("night-decision");
            if (!victim) {
              addEventNotification(notifyLang(currentGame.config.rules, "Night target chosen at random.", "夜间目标为随机选择。"));
              victim = possibleVictims[Math.floor(Math.random() * possibleVictims.length)];
            }
            if (victim) {
              await hostEliminatePlayer(victim.id);
              setGamePhaseState(s => ({ ...s, lastNightVictimId: victim!.id }));
            }
          }
          await hostPostEvent(
            "Announce that Day Phase begins. Everyone wakes up. Reveal who was eliminated during the night (if any).",
            { setPhase: "day" }
          );
          timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
        }, 15000);
        timeoutRefs.current.push(timeout);
      } else if (phase === "day" && !currentSpeakerId) {
        // Day phase: start discussion after announcement
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          await hostPostEvent(
            "Announce that discussion begins. Players may speak to find the werewolves.",
            { setPhase: "discussion", nextSpeakerId: null }
          );
          timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
        }, 5000);
        timeoutRefs.current.push(timeout);
      } else if (phase === "discussion") {
        // Discussion: LLM decides when to move to voting (when there's enough discussion)
        const discussionMessages = messages.filter(m => 
          m.senderId !== "gm-1" && 
          new Date(m.timestamp).getTime() > Date.now() - 45000
        );
        if (discussionMessages.length >= Math.max(4, aliveCount)) {
          try {
            const recentDiscussion = messages.slice(-20).map(m => `${m.senderName}: ${m.content}`).join("\n");
            const { message } = await getAIChatResponse({
              messages: [{
                role: "user",
                content: `You are ${gameMaster.name}, the host of a werewolf game. The village is in discussion. Should we end discussion and start voting now?

Recent discussion (last 20 messages):
${recentDiscussion || "No messages yet."}

Reply with ONLY "YES" if it's a good time to start voting (enough has been said), or "NO" if discussion should continue.`
              }],
              hostId: currentGame.config.hostId,
              hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
              gameContext: { template: "werewolf", gameName: currentGame.name, conversationState: "discussion" }
            });
            if (!isMountedRef.current) return;
            const answer = (message || "").trim().toUpperCase();
            if (answer.startsWith("YES") || !answer) {
              await hostPostEvent(
                "Announce that voting begins. Players must decide who to eliminate.",
                { setPhase: "voting", nextSpeakerId: null }
              );
            }
          } catch (e) {
            await hostPostEvent(
              "Announce that voting begins. Players must decide who to eliminate.",
              { setPhase: "voting", nextSpeakerId: null }
            );
          }
        }
      } else if (phase === "voting" && !gamePhaseState.lastVotedOutId) {
        // Voting: LLM decides who is voted out based on discussion
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          if (aliveCount > 2) {
            const candidates = alivePlayers.filter(p => p.role !== "Werewolf" || aliveCount <= 3);
            const candidateNames = candidates.map(p => p.name).join(", ");
            const recentDiscussion = messages.slice(-15).map(m => `${m.senderName}: ${m.content}`).join("\n");
            toast.loading("Host is tallying the vote…", { id: "vote-decision" });
            let votedOut: typeof candidates[0] | null = null;
            try {
              const { message } = await getAIChatResponse({
                messages: [{
                  role: "user",
                  content: `You are the host summarizing the village vote in a werewolf game. Based on the discussion below, who should be voted out? Living players who can be eliminated: ${candidateNames}.

Recent discussion:
${recentDiscussion || "No discussion yet."}

Reply with ONLY the exact name of the player to eliminate (the one the village voted out).`
                }],
                hostId: currentGame.config.hostId,
                hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
                gameContext: { template: "werewolf", gameName: currentGame.name, conversationState: "voting" }
              });
              if (!isMountedRef.current) return;
              const name = (message || "").trim();
              votedOut = candidates.find(p => p.name === name || p.name.toLowerCase() === name.toLowerCase()) ?? null;
            } catch (e) {
              console.error("Vote result LLM failed:", e);
            }
            toast.dismiss("vote-decision");
            if (!votedOut) {
              addEventNotification(notifyLang(currentGame.config.rules, "Vote result chosen at random.", "投票结果为随机选择。"));
              votedOut = candidates[Math.floor(Math.random() * candidates.length)];
            }
            if (votedOut) await hostEliminatePlayer(votedOut.id);
          }
          timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
        }, 20000);
        timeoutRefs.current.push(timeout);
      } else if (phase === "elimination" && gamePhaseState.lastVotedOutId) {
        // Elimination: reveal role, check win, then next round
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          await hostRevealRole(gamePhaseState.lastVotedOutId!);
          const werewolves = alivePlayers.filter(p => p.role === "Werewolf");
          const villagers = alivePlayers.filter(p => p.role !== "Werewolf");
          if (werewolves.length === 0) {
            await hostPostEvent("Announce that the game is over. The villagers have successfully eliminated all werewolves!", { setPhase: "game-over" });
          } else if (werewolves.length >= villagers.length) {
            await hostPostEvent("Announce that the game is over. The werewolves have taken over the village!", { setPhase: "game-over" });
          } else {
            await hostPostEvent(
              "Announce that Night Phase begins. All players close their eyes. Werewolves wake up and choose a victim.",
              { 
                setPhase: "night",
                autoAdvance: { 
                  afterMs: 15000, 
                  nextEvent: "Announce that Day Phase begins. Everyone wakes up. Reveal who was eliminated during the night (if any).", 
                  nextPhase: "day" 
                } 
              }
            );
          }
          timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
        }, 5000);
        timeoutRefs.current.push(timeout);
      }
    } else {
      // Other game types - simpler auto-advance
      if (phase === "day" && !currentSpeakerId) {
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          await hostPostEvent(
            "Announce that discussion begins. Players may speak.",
            { setPhase: "discussion", nextSpeakerId: null }
          );
          timeoutRefs.current = timeoutRefs.current.filter(t => t !== timeout);
        }, 5000);
        timeoutRefs.current.push(timeout);
      }
    }
  }, [players, games, selectedGameId, gamePhaseState, alivePlayers, currentSpeakerId, messages, hostPostEvent, hostEliminatePlayer, hostRevealRole, addMessage, addEventNotification]);

  // Auto-decision effect - runs when game state changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!currentGame?.isActive) return;
    
    // Trigger auto-decision after a short delay
    const timeout = setTimeout(() => {
      aiHostAutoDecision();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [gamePhaseState.phase, gamePhaseState.round, alivePlayers.length, currentSpeakerId, selectedGameId, games, aiHostAutoDecision]);

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyShareLink = () => {
    const shareLink = `https://aigames.app/game/${selectedGameId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied to clipboard!");
  };

  const currentGame = games.find(g => g.id === selectedGameId);

  const DEFAULT_SECTIONS: Array<{ id: string; name: string; type: "text" }> = [
    { id: "rules", name: "Rules", type: "text" },
    { id: "progress", name: "Progress", type: "text" },
  ];
  const textChannels =
    currentGame && sectionsByGameId[currentGame.id]?.length
      ? sectionsByGameId[currentGame.id].map((s) => ({ id: s.id, name: s.name, type: "text" as const }))
      : DEFAULT_SECTIONS;
  const channelsWithLabels: Array<{ id: string; name: string; type: "text" | "game" }> = [
    ...textChannels,
    { id: "game-room", name: "game-room", type: "game" },
  ];

  // Player board data (dynamically generated based on current game)
  const playerBoardData: PlayerBoardData = {
    characterName: "You",
    characterClass: currentGame?.config.template === "werewolf" ? "Villager" : currentGame?.config.template === "undercover" ? "Civilian" : "Player",
    level: 1,
    avatar: "#6366f1",
    attributes: [
      { id: "health", name: "Health", value: 100, maxValue: 100, color: "red" },
      { id: "mana", name: "Mana", value: 50, maxValue: 100, color: "blue" },
      { id: "attack", name: "Attack", value: 15, color: "orange" },
      { id: "defense", name: "Defense", value: 10, color: "green" },
    ],
    items: [
      { 
        id: "1", 
        name: "Lucky Coin", 
        description: "Increases your chances of winning votes", 
        icon: "🪙", 
        rarity: "rare" 
      },
      { 
        id: "2", 
        name: "Truth Serum", 
        description: "Forces a player to reveal their role", 
        icon: "⚗️", 
        rarity: "epic",
        quantity: 2
      },
    ],
    statusEffects: [
      { 
        id: "1", 
        name: "Blessed", 
        description: "Protected from elimination for 1 round", 
        icon: "✨", 
        duration: "1 round",
        type: "buff"
      },
    ],
  };

  return (
    <div className="h-screen flex bg-zinc-900 text-white">
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId) => {
          setSelectedGameId(gameId);
          if (gameId !== "home") setShowGameMasterChat(false);
        }}
        onCreateGame={() => {
          setDiscoverPreset(null);
          setShowGameMasterChat(true);
        }}
        onDeleteGame={(gameId) => {
          setGames(prev => prev.filter(g => g.id !== gameId));
          if (selectedGameId === gameId) {
            setSelectedGameId("home");
          }
        }}
        onOpenProfile={() => setShowUserProfile(true)}
      />

      {showUserProfile ? (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      ) : showGameCreatorForm ? (
        <GameCreatorForm
          onBack={() => setShowGameCreatorForm(false)}
          onCreateGame={(config) => {
            handleCreateGame(config);
            setShowGameCreatorForm(false);
          }}
          onSwitchToChat={() => {
            setShowGameCreatorForm(false);
            setDiscoverPreset(null);
            setShowGameMasterChat(true);
          }}
        />
      ) : selectedGameId === "my-games" ? (
        <MyGamesPage
          games={games}
          onSelectGame={setSelectedGameId}
          onCreateGame={() => {
            setDiscoverPreset(null);
            setShowGameMasterChat(true);
          }}
        />
      ) : showGameMasterChat ? (
        <GameMasterChat
          onBack={() => {
            setShowGameMasterChat(false);
            if (selectedGameId === "home" || selectedGameId === "discover") {
              setSelectedGameId("discover");
            }
          }}
          onCreateGame={handleCreateGame}
          initialPreset={discoverPreset}
          onPresetApplied={() => setDiscoverPreset(null)}
        />
      ) : selectedGameId === "discover" ? (
        <DiscoverPage
          onCreateGame={(preset) => {
            // Clear previous preset first to ensure new one is applied
            setDiscoverPreset(null);
            // Use setTimeout to ensure state update happens before showing chat
            setTimeout(() => {
              setDiscoverPreset(preset);
              setShowGameMasterChat(true);
            }, 0);
          }}
        />
      ) : selectedGameId === "home" ? (
        <GameMasterChat
          onBack={() => {
            setShowGameMasterChat(false);
            setSelectedGameId("discover");
          }}
          onCreateGame={handleCreateGame}
          initialPreset={discoverPreset}
          onPresetApplied={() => setDiscoverPreset(null)}
        />
      ) : (
        <>
          <ChannelList
            gameName={currentGame?.name || "Game"}
            channels={channelsWithLabels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onShare={handleShare}
            onSettings={() => toast.info("Settings coming soon")}
            onBackToArena={() => setSelectedGameId("home")}
            textSectionLabel="Sections"
            gameSectionLabel="Game Rooms"
            onDeleteChannel={(channelId) => {
              if (channelId === "game-room") return;
              if (!currentGame) return;
              const list = sectionsByGameId[currentGame.id] ?? DEFAULT_SECTIONS;
              const remaining = list.filter((s) => s.id !== channelId);
              if (remaining.length === 0) return;
              setSectionsByGameId((prev) => ({ ...prev, [currentGame.id]: remaining }));
              if (selectedChannelId === channelId) {
                setSelectedChannelId(remaining[0]?.id ?? "game-room");
              }
            }}
          />

          {selectedChannelId === "game-room" ? (
            <div className="flex-1 flex min-w-0 h-full overflow-hidden">
              {(() => {
                const hostId = players.find(p => p.isGameMaster)?.id ?? 'gm-1';
                const userHasSpokenInIntro = messages.some(m => m.senderId === userId);
                const hostHasSpokenInIntro = messages.some(m => m.senderId === hostId && !m.isStreaming);
                const someOtherPlayerHasSpoken = messages.some(m => m.senderId !== userId && m.senderId !== hostId);
                const everyoneHasSpokenInIntro =
                  gamePhase === "intro" &&
                  !!currentGame?.isActive &&
                  userHasSpokenInIntro;
                const yourTurnInIntro =
                  gamePhase === "intro" &&
                  !!currentGame?.isActive &&
                  hostHasSpokenInIntro &&
                  someOtherPlayerHasSpoken &&
                  !userHasSpokenInIntro;
                return (
              <ChatArea
                channelName="game-room"
                messages={messages}
                onSendMessage={handleSendMessage}
                isGameActive={currentGame?.isActive || false}
                currentSpeakerId={currentSpeakerId}
                userId={userId}
                players={players}
                typingUsers={typingUsers}
                gameId={selectedGameId || undefined}
                onHostPostEvent={hostPostEvent}
                onHostAssignSpeaker={hostAssignSpeaker}
                onHostEliminate={hostEliminatePlayer}
                onHostRevealRole={hostRevealRole}
                isUserHost={false}
                gamePhaseLabel={currentGame?.isActive ? phaseLabel(gamePhaseState.phase, gamePhaseState.round) : undefined}
                alivePlayers={alivePlayers}
                lastVotedOutId={gamePhaseState.lastVotedOutId}
                privateMessagesFromHost={privateMessages[userId] ?? []}
                privateSectionLabel="Private from Host"
                quickReplies={
                  gamePhase === "intro" && currentGame?.isActive
                    ? ["Ready!", "Let's go!", "I'm in!"]
                    : (currentGame?.isActive && aiSuggestedPrompts.length > 0 ? aiSuggestedPrompts : undefined)
                }
                introYourTurnHint={yourTurnInIntro ? "Your turn—tap the button or a quick reply below to start." : undefined}
                introYourTurnReply={yourTurnInIntro ? "Ready!" : undefined}
                introEveryoneSpokenHint={everyoneHasSpokenInIntro ? "Everyone has spoken. Click \"Let's go!\" or send any message to start the game." : undefined}
                aiSuggestedPrompts={gamePhase === "intro" && currentGame?.isActive && aiSuggestedPrompts.length > 0 ? aiSuggestedPrompts : undefined}
                aiSuggestionsLabel="AI suggestions"
              />
                );
              })()}
              <PlayerPanelWithBoard
                players={players}
                currentSpeakerId={currentSpeakerId}
                isUserGameMaster={false}
                gameId={selectedGameId || undefined}
                onToggleMute={handleToggleMute}
                onSelectSpeaker={setCurrentSpeakerId}
                playerBoardData={playerBoardData}
                myBoardContentFromHost={selectedGameId ? (myBoardContentByGameId[selectedGameId]?.[userId] ?? "") : ""}
                isHiddenRoleGame={currentGame?.config.hideRolesInPlayerList ?? (currentGame?.config.template === "werewolf" || currentGame?.config.template === "mafia")}
                currentUserId={userId}
              />
            </div>
          ) : selectedChannelId === "progress" ? (
            <div className="flex-1 bg-zinc-700 p-10 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Game Progress</h1>
                      <p className="text-zinc-400 text-sm mt-0.5">Text record — editable by AI Host only</p>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-xl border border-zinc-600/80 overflow-hidden">
                  <textarea
                    readOnly
                    value={selectedGameId ? (gameProgressByGameId[selectedGameId] ?? "") : ""}
                    placeholder="Game progress will appear here as the AI Host updates it. Only the Host can edit this."
                    className="w-full min-h-[320px] p-6 font-mono text-sm text-zinc-300 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-500"
                    spellCheck={false}
                  />
                </div>
                <div className="mt-4 p-4 rounded-lg bg-zinc-800/60 border border-zinc-600/50">
                  <p className="text-zinc-500 text-xs flex items-center gap-2">
                    <span>🔒</span>
                    <span>This board is read-only for players. Only the AI Host can update it via UPDATE_PROGRESS in its responses.</span>
                  </p>
                </div>
              </div>
            </div>
          ) : selectedChannelId === "rules" ? (
            <div className="flex-1 bg-zinc-700 p-10 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-white">Game Rules</h1>
                {currentGame?.config.rules && 
                 currentGame.config.rules !== "Custom game rules will be defined through conversation" &&
                 currentGame.config.rules.trim() !== "" ? (
                  <>
                    <div className="bg-zinc-800 p-8 rounded-xl border border-zinc-700 mb-6">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300 leading-relaxed">
                        {currentGame.config.rules}
                      </pre>
                    </div>
                    <div className="p-5 bg-amber-600/10 rounded-xl border border-amber-600/30">
                      <p className="text-amber-400 text-sm flex items-center gap-2.5">
                        <span>⚠️</span>
                        <span>Locked after entering the game—editable only before starting.</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-zinc-800 p-10 rounded-xl border border-zinc-700 text-center">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-700 mb-5">
                          <span className="text-4xl">📋</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-3">No Rules Defined Yet</h2>
                      <p className="text-zinc-400 mb-8 text-base leading-relaxed">
                        {currentGame?.config.template === "custom" 
                          ? "This is a custom game. Rules will be defined through conversation with the Game Master."
                          : "Game rules will be displayed here once the game is set up."}
                      </p>
                      {currentGame?.config.template === "custom" && (
                        <Button
                          onClick={() => {
                            setSelectedChannelId("game-room");
                            toast.info("Continue the conversation with Game Master to define rules");
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-6"
                        >
                          Go to Game Room
                        </Button>
                      )}
                    </div>
                    <div className="p-5 bg-blue-600/10 rounded-xl border border-blue-600/30">
                      <p className="text-blue-400 text-sm flex items-center gap-2.5">
                        <span>ℹ️</span>
                        <span>Rules will be automatically updated as you configure your game with the Game Master.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : textChannels.some((c) => c.id === selectedChannelId) ? (
            <div className="flex-1 bg-zinc-700 p-10 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                    <span className="text-2xl">📌</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {textChannels.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-0.5">AI-suggested section for this game</p>
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-xl border border-zinc-600/80 p-6">
                  <p className="text-zinc-500 text-sm">
                    Content for this section can be updated by the Host during the game (e.g. scoreboard, character list).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-zinc-700 flex items-center justify-center">
              <div className="text-center text-zinc-400">
                <h2 className="text-xl mb-2">Welcome to {currentGame?.name}</h2>
                <p>Select a section or room to start</p>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle>Share Your Game</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Share this game with others (coming soon with backend)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={`https://aigames.app/game/${selectedGameId}`}
                readOnly
                className="bg-zinc-800 border-zinc-700"
              />
              <Button onClick={copyShareLink} className="bg-indigo-600 hover:bg-indigo-500">
                Copy
              </Button>
            </div>
            <p className="text-sm text-zinc-400">
              Game sharing requires a backend to save and load game configurations.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster 
        position="top-right" 
        expand={false}
        richColors
        closeButton
        offset={{ top: "72px", right: "20px" }}
        gap={12}
        toastOptions={{
          style: { zIndex: 9999 },
          duration: 4000,
        }}
      />

      {/* Game End Dialog */}
      <Dialog open={gameEnded} onOpenChange={(open) => {
        if (!open) {
          setGameEnded(false);
          setGameResult(null);
        }
      }}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">Game Over!</DialogTitle>
            <DialogDescription className="text-zinc-400">
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {gameResult?.winner} Win!
                </div>
                <p className="text-lg text-zinc-300">{gameResult?.message}</p>
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => {
                      // Reset game
                      setGameEnded(false);
                      setGameResult(null);
                      setMessages([]);
                      setPlayers([]);
                      setGamePhase("waiting");
                      setGamePhaseState(DEFAULT_GAME_PHASE);
                      setCurrentSpeakerId(null);
                      const currentGame = games.find(g => g.id === selectedGameId);
                      if (currentGame) {
                        initializeGame(currentGame.config);
                      }
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white w-full"
                  >
                    Play Again
                  </Button>
                  <Button
                    onClick={() => {
                      setGameEnded(false);
                      setGameResult(null);
                      setSelectedGameId("home");
                    }}
                    variant="outline"
                    className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-white w-full"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
