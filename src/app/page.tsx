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
import { getAIChatResponse } from "@/lib/openai";
import {
  type GamePhaseState,
  type GamePhaseKind,
  DEFAULT_GAME_PHASE,
  nextPhaseForWerewolf,
  phaseLabel,
} from "@/app/config/game-phase";

/** Message returned by /api/chat when the model returns empty content; treat as failure and use fallback. */
const API_ERROR_PLACEHOLDER = /I apologize,? but I encountered an error/i;

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
}

// AI personality templates; gender used for avatar generation to match name
const AI_NAMES = [
  "Alex", "Blake", "Casey", "Drew", "Ellis", "Finley", "Gray", "Harper",
  "Indigo", "Jordan", "Kennedy", "Logan", "Morgan", "Nova", "Parker", "Quinn"
];
const AI_NAME_GENDER: Record<string, 'male' | 'female' | 'other'> = {
  Alex: "male", Blake: "other", Casey: "other", Drew: "other", Ellis: "other",
  Finley: "other", Gray: "other", Harper: "female", Indigo: "other", Jordan: "other",
  Kennedy: "female", Logan: "male", Morgan: "other", Nova: "female", Parker: "other", Quinn: "other",
};

const AI_COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", 
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
];

const WEREWOLF_ROLES = ["Villager", "Villager", "Villager", "Werewolf", "Werewolf", "Seer", "Doctor"];
const UNDERCOVER_WORDS = [
  { civilian: "Coffee", undercover: "Tea" },
  { civilian: "Dog", undercover: "Wolf" },
  { civilian: "Piano", undercover: "Guitar" },
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

  useEffect(() => {
    messagesRef.current = messages;
    playersRef.current = players;
    gamesRef.current = games;
    gamePhaseRef.current = gamePhase;
    gamePhaseStateRef.current = gamePhaseState;
    selectedGameIdRef.current = selectedGameId;
  }, [messages, players, games, gamePhase, gamePhaseState, selectedGameId]);

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
        const state = {
          games,
          selectedGameId,
          selectedChannelId,
          messages,
          players,
          gamePhase,
          gamePhaseState,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('gameRoomState', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving game state:', e);
      }
    }, 1000); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [games, selectedGameId, selectedChannelId, messages, players, gamePhase, gamePhaseState, isHydrated]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

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
  }, []);

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
    
    // Use configured players if available, otherwise generate random ones
    if (config.configuredPlayers && config.configuredPlayers.length > 0) {
      // Use GM-configured players
      config.configuredPlayers.forEach((configPlayer, i) => {
        let role = "Player";
        let stats: Record<string, string | number> = {};

        if (config.template === "werewolf" && i < WEREWOLF_ROLES.length) {
          role = WEREWOLF_ROLES[i];
          stats = { Status: "Alive" };
        } else if (config.template === "undercover") {
          if (i === 0) {
            role = "Undercover";
            const wordPair = UNDERCOVER_WORDS[0];
            stats = { Word: wordPair.undercover };
          } else {
            role = "Civilian";
            const wordPair = UNDERCOVER_WORDS[0];
            stats = { Word: wordPair.civilian };
          }
        }

        aiPlayers.push({
          id: `ai-${i + 1}`,
          name: configPlayer.name,
          avatar: AI_COLORS[i % AI_COLORS.length],
          role: role === "Player" ? undefined : role,
          stats,
          isAI: true,
          isMuted: false,
          personality: configPlayer.personality || "Friendly and observant",
          background: configPlayer.background || "A game enthusiast",
          gender: configPlayer.gender,
        });
      });
    } else {
      // Generate random AI players (legacy behavior)
      const traitsList = pickTraitsForPlayers(config.playerCount);
      const usedNames = new Set<string>();

      for (let i = 0; i < config.playerCount; i++) {
        let name = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        while (usedNames.has(name)) {
          name = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        }
        usedNames.add(name);

        let role = "Player";
        let stats: Record<string, string | number> = {};

        if (config.template === "werewolf" && i < WEREWOLF_ROLES.length) {
          role = WEREWOLF_ROLES[i];
          stats = { Status: "Alive" };
        } else if (config.template === "undercover") {
          if (i === 0) {
            role = "Undercover";
            const wordPair = UNDERCOVER_WORDS[0];
            stats = { Word: wordPair.undercover };
          } else {
            role = "Civilian";
            const wordPair = UNDERCOVER_WORDS[0];
            stats = { Word: wordPair.civilian };
          }
        }

        const traits = traitsList[i];
        aiPlayers.push({
          id: `ai-${i + 1}`,
          name,
          avatar: AI_COLORS[i % AI_COLORS.length],
          role: role === "Player" ? undefined : role,
          stats,
          isAI: true,
          isMuted: false,
          personality: traits.personality,
          background: traits.background,
          gender: AI_NAME_GENDER[name] ?? "other",
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
    setGamePhase("intro");
    setGamePhaseState({ ...DEFAULT_GAME_PHASE, phase: "intro" });

    const fallbackGreeting = `Hey everyone, ${host.name} here. Here's how we'll play ${config.name}:\n\n${config.rules}\n\nReady when you are - let's go!`;

    const scheduleReadyReplies = () => {
      if (!isMountedRef.current) return;
      aiPlayers.slice(0, 3).forEach((player, index) => {
        const playerTimeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          try {
            const { message } = await getAIChatResponse({
              messages: [{
                role: "user",
                content: `You are ${player.name}, a player in a social deduction game. Your personality: ${player.personality || "Friendly and enthusiastic."} Your background: ${player.background || "A game enthusiast."} The host just explained the rules and asked if everyone is ready. Write a short, natural response (1-2 sentences max) showing you're ready to play. Stay in character based on your personality and background. Output only your response, nothing else.`
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

    (async () => {
      try {
        const { message } = await getAIChatResponse({
          messages: [{
            role: "user",
            content: `You are ${host.name}, the host. The game is "${config.name}". Rules:\n\n${config.rules}\n\nWrite a short opening greeting to the players: introduce yourself, briefly explain the rules above, and ask if everyone is ready. Stay in character. Output only the greeting, no other commentary.`
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
        });
        if (!isMountedRef.current) return;
        const greeting = (message || "").trim() || fallbackGreeting;
        setMessages(prev =>
          prev.map((m) =>
            m.id === "msg-1" ? { ...m, content: greeting } : m
          )
        );
      } catch (e) {
        if (!isMountedRef.current) return;
        setMessages(prev =>
          prev.map((m) =>
            m.id === "msg-1" ? { ...m, content: fallbackGreeting } : m
          )
        );
      }
      if (!isMountedRef.current) return;
      const mainTimeout = setTimeout(scheduleReadyReplies, 2000);
      timeoutRefs.current.push(mainTimeout);
    })();

  }, [userId, addMessage]);

  const handleCreateGame = useCallback(async (config: GameConfig) => {
    // Show loading toast
    const loadingToast = toast.loading("Creating game...");
    
    try {
      // Generate game icon with AI
      let gameIcon = "🎮"; // Default fallback
      try {
        toast.loading("AI is generating game icon...", { id: loadingToast });
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
          toast.success("Game icon generated!", { id: loadingToast });
        } else {
          console.warn('Failed to generate icon, using fallback');
          // Use emoji fallback
          gameIcon = config.template === "werewolf" ? "🐺" : config.template === "undercover" ? "🕵️" : "🎮";
          toast.dismiss(loadingToast);
        }
      } catch (error) {
        console.error('Error generating game icon:', error);
        // Use emoji fallback
        gameIcon = config.template === "werewolf" ? "🐺" : config.template === "undercover" ? "🕵️" : "🎮";
        toast.dismiss(loadingToast);
      }
      
      const newGame: Game = {
        id: `game-${Date.now()}`,
        name: config.name,
        icon: gameIcon,
        color: config.template === "werewolf" ? "#7c3aed" : config.template === "undercover" ? "#0ea5e9" : "#ec4899",
        config,
        isActive: false
      };

      setGames(prev => [...prev, newGame]);
      setSelectedGameId(newGame.id);
      setSelectedChannelId("game-room");
      setShowGameMasterChat(false);
      setShowGameCreatorForm(false);
      initializeGame(config);
      toast.success(`Game "${config.name}" created!`, { id: loadingToast });
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error("Failed to create game", { id: loadingToast });
    }
  }, [initializeGame]);

  // Track last sent message to prevent duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  /** Schedules Host to pick next speaker; runs after user or AI speaks. Longer delay = less spam, better pacing. */
  const scheduleNextSpeaker = useCallback(() => {
    const delay = 3500 + Math.random() * 3000;
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
        ? "\n\nThe human player (You) hasn't spoken recently; consider NEXT_SPEAKER: You so they can participate, or NONE for a short pause."
        : "";

      let selectedPlayer: typeof alivePlayersList[0] | null = null;
      try {
        const { message: hostDecision } = await getAIChatResponse({
          messages: [{
            role: "user",
            content: `You are ${gameMaster.name}, the host of "${currentGame.name}". You may:
1) Decide who speaks next
2) Optionally send private messages to specific players (e.g. clues, role info, secrets)
3) Optionally post a public event/announcement to the channel

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessages.length > 0 ? recentMessages.map(m => `${m.role === "user" ? "Player" : "Other player"}: ${m.content}`).join("\n") : "Game just started."}

Available players (alive, not muted):
${playersInfo.map(p => `- ${p.name} (Role: ${p.role}, Type: ${p.isAI ? "AI" : "Human"}, Personality: ${p.personality})`).join("\n")}

Recent speakers: ${recentNames.length ? recentNames.join(", ") : "none yet"}
Current game phase: ${gamePhase}

Pacing: Don't rush. Reply NONE sometimes to create natural pauses (e.g. after several messages in a row). Prefer giving the human player (You) a turn every few messages so they can participate. One speaker at a time.${pacingHint}

Reply using these lines (one per line). You MUST include exactly one next-speaker line. Optional lines can be in any order after it.
- NEXT_SPEAKER: PlayerName   (exactly one; use a name from the list above, or NONE if no one should speak right now—use NONE to create a pause)
- PRIVATE_TO_PlayerName: your private message to that player (can repeat for different players)
- POST_EVENT: your public announcement to the channel (one line only)

Example:
NEXT_SPEAKER: Sofia
PRIVATE_TO_Kenji: You are the werewolf. Your teammates are Omar and Zuri.
POST_EVENT: The moon rises. Night has fallen.`
          }],
          hostId: currentGame.config.hostId,
          hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
          gameContext: { template: currentGame.config.template, gameName: currentGame.name, rules: currentGame.config.rules, conversationState: gamePhase }
        });
        if (!isMountedRef.current) return;
        setTypingUsers([]);
        const raw = (hostDecision || "").trim();
        const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
        let nextSpeakerName: string | null = null;
        for (const line of lines) {
          if (line.toUpperCase().startsWith("NEXT_SPEAKER:")) {
            nextSpeakerName = line.slice("NEXT_SPEAKER:".length).trim();
            break;
          }
        }
        if (!nextSpeakerName) nextSpeakerName = lines[0] || null;
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
          if (line.toUpperCase().startsWith("POST_EVENT:")) {
            const text = line.slice("POST_EVENT:".length).trim();
            if (text) hostPostEventRef.current?.(text);
          }
        }
        selectedPlayer = nextSpeakerName && nextSpeakerName.toUpperCase() !== "NONE"
          ? alivePlayersList.find(p => p.name.toLowerCase() === nextSpeakerName!.toLowerCase() || p.name === nextSpeakerName) ?? null
          : null;
        if (!selectedPlayer) {
          const isErrorOrEmpty = !raw || API_ERROR_PLACEHOLDER.test(raw);
          if (isErrorOrEmpty) {
            toast.info("Host chose who speaks next at random.");
          }
          const aiOnly = alivePlayersList.filter(p => p.isAI);
          const pool = aiOnly.length > 0 ? aiOnly : alivePlayersList;
          selectedPlayer = pool[Math.floor(Math.random() * pool.length)];
        }
        if (!selectedPlayer) return;
        recentSpeakers.current.push(selectedPlayer.id);
        if (recentSpeakers.current.length > 5) recentSpeakers.current.shift();
      } catch (e) {
        console.error("AI Host decision failed:", e);
        if (!isMountedRef.current) return;
        setTypingUsers([]);
        toast.info("Host chose who speaks next at random.");
        const aiOnly = alivePlayersList.filter(p => p.isAI);
        const pool = aiOnly.length > 0 ? aiOnly : alivePlayersList;
        selectedPlayer = pool[Math.floor(Math.random() * pool.length)];
        recentSpeakers.current.push(selectedPlayer.id);
        if (recentSpeakers.current.length > 5) recentSpeakers.current.shift();
      }
      if (!selectedPlayer) return;

      if (selectedPlayer.id === userId) {
        setCurrentSpeakerId(userId);
        setTypingUsers([{ name: gameMaster.name, avatar: gameMaster.avatar }]);
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setTypingUsers([]);
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIE2S56+ihUxILTKXh8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8Q==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (_) {}
          toast.info(`${gameMaster.name} thinks you might want to respond. You can speak now!`, { duration: 3000 });
          window.dispatchEvent(new CustomEvent('focusGameInput'));
        }, 800);
        return;
      }

      if (selectedPlayer.isAI) {
        setTypingUsers([{ name: selectedPlayer.name, avatar: selectedPlayer.avatar }]);
        const aiReplyDelay = 2500 + Math.random() * 2000;
        const messageTimeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          const messagesNow = messagesRef.current;
          const recentMessagesForAI = messagesNow.slice(-8).map(m => `${m.senderName}: ${m.content}`);
          try {
            const { message } = await getAIChatResponse({
              messages: [{
                role: "user",
                content: `You are ${selectedPlayer.name}, a player in a social deduction game "${currentGame.name}".

Your role: ${selectedPlayer.role || "Player"}
Your personality: ${selectedPlayer.personality || "Friendly and observant."}
Your background: ${selectedPlayer.background || "A game enthusiast."}

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessagesForAI.join("\n")}

The host (${gameMaster.name}) thinks you would naturally respond. Respond in character, briefly (1-2 sentences). Output only your response, nothing else.`
              }],
              gameContext: { template: currentGame.config.template, gameName: currentGame.name, rules: currentGame.config.rules, conversationState: gamePhase }
            });
            if (!isMountedRef.current) return;
            setTypingUsers([]);
            let reply = (message || "").trim() || "I'm thinking...";
            if (API_ERROR_PLACEHOLDER.test(reply)) {
              reply = ["That's an interesting point...", "I'm not sure I agree with that.", "Can you explain more?", "I think we should consider all options.", "Based on what I've seen, I have my suspicions.", "Let's think about this carefully."][Math.floor(Math.random() * 6)];
            }
            addMessage({ senderId: selectedPlayer.id, senderName: selectedPlayer.name, senderAvatar: selectedPlayer.avatar, content: reply, isAI: true });
            scheduleNextSpeaker();
          } catch (e) {
            if (!isMountedRef.current) return;
            setTypingUsers([]);
            toast.info(`${selectedPlayer.name} gave a default reply.`);
            const fallback = ["That's an interesting point...", "I'm not sure I agree with that.", "Can you explain more?", "I think we should consider all options.", "Based on what I've seen, I have my suspicions.", "Let's think about this carefully."];
            addMessage({ senderId: selectedPlayer.id, senderName: selectedPlayer.name, senderAvatar: selectedPlayer.avatar, content: fallback[Math.floor(Math.random() * fallback.length)], isAI: true });
            scheduleNextSpeaker();
          }
          timeoutRefs.current = timeoutRefs.current.filter(x => x !== messageTimeout);
        }, aiReplyDelay);
        timeoutRefs.current.push(messageTimeout);
      }
      timeoutRefs.current = timeoutRefs.current.filter(x => x !== t);
    }, delay);
    timeoutRefs.current.push(t);
  }, [addMessage, userId, addPrivateMessage]);

  const hostPostEventRef = useRef<(eventDescription: string, opts?: { nextSpeakerId?: string | null; setPhase?: GamePhaseKind | string; autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: GamePhaseKind | string } }) => Promise<void>>(null!);

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
      toast.warning("It's not your turn to speak. Wait for the Host to assign you.");
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
      
      const responseTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        setTypingUsers([]);
        addMessage({
          senderId: "gm-1",
          senderName: gameMaster.name,
          senderAvatar: gameMaster.avatar,
          content: "Excellent! Now that everyone is ready, let the game begin! I'll guide each phase and manage the speaking order. Remember, I have the authority to mute players and control who speaks when.",
          isAI: true
        });
        setGamePhase("active");
        const currentGame = games.find(g => g.id === selectedGameId);
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
      }, 2500);
      timeoutRefs.current.push(responseTimeout);
    } else {
      scheduleNextSpeaker();
    }
  }, [addMessage, scheduleNextSpeaker, userId, players, gamePhase, selectedGameId, games]);

  const handleToggleMute = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, isMuted: !p.isMuted } : p
    ));
    const player = players.find(p => p.id === playerId);
    if (player) {
      toast.info(`${player.name} has been ${player.isMuted ? "unmuted" : "muted"}`);
    }
  };

  type HostPostEventOpts = {
    nextSpeakerId?: string | null;
    setPhase?: GamePhaseKind | string;
    autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: GamePhaseKind | string };
  };

  const hostPostEvent = useCallback(async (
    eventDescription: string,
    opts?: HostPostEventOpts
  ) => {
    if (!isMountedRef.current) return;
    const gameMaster = players.find(p => p.isGameMaster);
    if (!gameMaster) return;

    const currentGame = games.find(g => g.id === selectedGameId);
    
    const postOne = async (desc: string, updatePhase?: GamePhaseKind | string) => {
      try {
        const { message } = await getAIChatResponse({
          messages: [{
            role: "user",
            content: `You are ${gameMaster!.name}, the host of "${currentGame?.name || "the game"}". ${desc} Announce this to the players in character. Keep it brief (2-3 sentences). Output only the announcement.`
          }],
          hostId: currentGame?.config.hostId,
          hostPersonality: currentGame?.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
          gameContext: {
            template: currentGame?.config.template,
            gameName: currentGame?.name,
            conversationState: gamePhaseState.phase
          }
        });
        if (!isMountedRef.current) return;
        const text = (message || "").trim() || desc;
        addMessage({
          senderId: "gm-1",
          senderName: gameMaster!.name,
          senderAvatar: gameMaster!.avatar,
          content: text,
          isAI: true
        });
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
      } catch (e) {
        if (!isMountedRef.current) return;
        addMessage({
          senderId: "gm-1",
          senderName: gameMaster!.name,
          senderAvatar: gameMaster!.avatar,
          content: desc,
          isAI: true
        });
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
      }
    };

    await postOne(eventDescription, opts?.setPhase);

    if (opts?.nextSpeakerId !== undefined) {
      setCurrentSpeakerId(opts.nextSpeakerId);
      if (opts.nextSpeakerId) {
        const nextPlayer = players.find(p => p.id === opts!.nextSpeakerId);
        if (nextPlayer) toast.info(`${nextPlayer.name} is now speaking`);
      } else {
        toast.info("Speaking is now open to all");
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

    // After Host announces (e.g. "discussion begins"), schedule who speaks next so the game doesn't get stuck
    if (currentGame?.isActive) scheduleNextSpeaker();
  }, [players, games, selectedGameId, gamePhaseState.phase, addMessage, scheduleNextSpeaker]);

  useEffect(() => {
    hostPostEventRef.current = hostPostEvent;
  }, [hostPostEvent]);

  const hostAssignSpeaker = useCallback((playerId: string | null) => {
    setCurrentSpeakerId(playerId);
    if (playerId) {
      const player = players.find(p => p.id === playerId);
      if (player) toast.info(`${player.name} is now speaking`);
    } else {
      toast.info("Speaking is now open to all");
    }
  }, [players]);

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

    const desc = `Announce that ${target.name} has been eliminated. Be brief and in character.`;
    try {
      const { message } = await getAIChatResponse({
        messages: [{
          role: "user",
          content: `You are ${gameMaster.name}, the host. ${desc} Output only the announcement.`
        }],
        hostId: currentGame.config.hostId,
        hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
        gameContext: { template: currentGame.config.template, gameName: currentGame.name }
      });
      if (!isMountedRef.current) return;
      addMessage({
        senderId: "gm-1",
        senderName: gameMaster.name,
        senderAvatar: gameMaster.avatar,
        content: (message || "").trim() || `${target.name} has been eliminated.`,
        isAI: true
      });
    } catch {
      if (!isMountedRef.current) return;
      addMessage({
        senderId: "gm-1",
        senderName: gameMaster.name,
        senderAvatar: gameMaster.avatar,
        content: `${target.name} has been eliminated.`,
        isAI: true
      });
    }
    toast.info(`${target.name} eliminated`);
  }, [players, games, selectedGameId, addMessage]);

  const hostRevealRole = useCallback(async (playerId: string) => {
    if (!isMountedRef.current) return;
    const gameMaster = players.find(p => p.isGameMaster);
    const target = players.find(p => p.id === playerId);
    const currentGame = games.find(g => g.id === selectedGameId);
    if (!gameMaster || !target || !currentGame) return;

    const role = target.role || "Unknown";
    const desc = `Announce that ${target.name} was a ${role}. Reveal their role to the group. Keep it brief.`;
    try {
      const { message } = await getAIChatResponse({
        messages: [{
          role: "user",
          content: `You are ${gameMaster.name}, the host. ${desc} Output only the announcement.`
        }],
        hostId: currentGame.config.hostId,
        hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
        gameContext: { template: currentGame.config.template, gameName: currentGame.name }
      });
      if (!isMountedRef.current) return;
      addMessage({
        senderId: "gm-1",
        senderName: gameMaster.name,
        senderAvatar: gameMaster.avatar,
        content: (message || "").trim() || `${target.name} was a ${role}.`,
        isAI: true
      });
    } catch {
      if (!isMountedRef.current) return;
      addMessage({
        senderId: "gm-1",
        senderName: gameMaster.name,
        senderAvatar: gameMaster.avatar,
        content: `${target.name} was a ${role}.`,
        isAI: true
      });
    }
  }, [players, games, selectedGameId, addMessage]);

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
              toast.info("Night target chosen at random.");
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
              toast.info("Vote result chosen at random.");
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
  }, [players, games, selectedGameId, gamePhaseState, alivePlayers, currentSpeakerId, messages, hostPostEvent, hostEliminatePlayer, hostRevealRole, addMessage]);

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
  const [channels, setChannels] = useState([
    { id: "general", name: "general", type: "text" as const },
    { id: "rules", name: "rules", type: "text" as const },
    { id: "game-room", name: "game-room", type: "game" as const },
  ]);

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
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onShare={handleShare}
            onSettings={() => toast.info("Settings coming soon")}
            onBackToArena={() => setSelectedGameId("home")}
            onDeleteChannel={(channelId) => {
              setChannels(prev => prev.filter(c => c.id !== channelId));
              if (selectedChannelId === channelId) {
                const remainingChannels = channels.filter(c => c.id !== channelId);
                if (remainingChannels.length > 0) {
                  setSelectedChannelId(remainingChannels[0].id);
                }
              }
            }}
          />

          {selectedChannelId === "game-room" ? (
            <div className="flex-1 flex min-w-0 h-full overflow-hidden">
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
              />
              <PlayerPanelWithBoard
                players={players}
                currentSpeakerId={currentSpeakerId}
                isUserGameMaster={false}
                gameId={selectedGameId || undefined}
                onToggleMute={handleToggleMute}
                onSelectSpeaker={setCurrentSpeakerId}
                playerBoardData={playerBoardData}
              />
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
                        <span>These rules are locked and cannot be changed during the game.</span>
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
          ) : (
            <div className="flex-1 bg-zinc-700 flex items-center justify-center">
              <div className="text-center text-zinc-400">
                <h2 className="text-xl mb-2">Welcome to {currentGame?.name}</h2>
                <p>Select a channel to start</p>
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
        toastOptions={{
          style: {
            zIndex: 9999,
          }
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
