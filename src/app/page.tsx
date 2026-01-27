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

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
}

// AI personality templates
const AI_NAMES = [
  "Alex", "Blake", "Casey", "Drew", "Ellis", "Finley", "Gray", "Harper",
  "Indigo", "Jordan", "Kennedy", "Logan", "Morgan", "Nova", "Parker", "Quinn"
];

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
  
  const userId = "user-1";
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);

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
      // Check if message already exists (prevent duplicates)
      const exists = prev.some(m => 
        m.senderId === newMessage.senderId && 
        m.content === newMessage.content && 
        Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000
      );
      if (exists) return prev;
      return [...prev, newMessage];
    });
  }, []);

  // Initialize Game Master and Players
  const initializeGame = useCallback((config: GameConfig) => {
    // Get the selected host personality
    const host = getHostById(config.hostId) || getDefaultHost();
    
    const gameMaster: Player = {
      id: "gm-1",
      name: host.name,
      avatar: host.color,
      role: host.name,
      status: host.tagline,
      isGameMaster: true,
      isAI: true,
      isMuted: false,
      background: host.description,
    };

    const traitsList = pickTraitsForPlayers(config.playerCount);
    const aiPlayers: Player[] = [];
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
      });
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

  const handleCreateGame = useCallback((config: GameConfig) => {
    const newGame: Game = {
      id: `game-${Date.now()}`,
      name: config.name,
      icon: config.template === "werewolf" ? "🐺" : config.template === "undercover" ? "🕵️" : "🎮",
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
    toast.success(`Game "${config.name}" created!`);
  }, [initializeGame]);

  // Track last sent message to prevent duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

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
            timeoutRefs.current = timeoutRefs.current.filter(t => t !== autoStartTimeout);
          }, 3000);
          timeoutRefs.current.push(autoStartTimeout);
        }
      }, 2500);
      timeoutRefs.current.push(responseTimeout);
    } else {
      // Random AI response with typing indicator - generate based on personality/background
      const delay = 1500 + Math.random() * 2000;
      const aiResponseTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        const aiPlayers = players.filter(
          p => p.isAI && !p.isGameMaster && !p.isMuted && p.status !== "Eliminated" && p.stats?.Status !== "Eliminated"
        );
        if (aiPlayers.length > 0) {
          const randomPlayer = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
          
          // Show typing indicator
          setTypingUsers([{ name: randomPlayer.name, avatar: randomPlayer.avatar }]);
          
          // Get recent conversation context (last 3-5 messages)
          const recentMessages = messages.slice(-5).map(m => ({
            role: m.senderId === userId ? "user" as const : "assistant" as const,
            content: `${m.senderName}: ${m.content}`
          }));
          
          // After a short delay, generate and send the message
          const messageTimeout = setTimeout(async () => {
            if (!isMountedRef.current) return;
            try {
              const currentGame = games.find(g => g.id === selectedGameId);
              const { message } = await getAIChatResponse({
                messages: [
                  {
                    role: "user",
                    content: `You are ${randomPlayer.name}, a player in a social deduction game "${currentGame?.name || "the game"}". Your role: ${randomPlayer.role || "Player"}. Your personality: ${randomPlayer.personality || "Friendly and observant."} Your background: ${randomPlayer.background || "A game enthusiast."} Recent conversation:\n${recentMessages.map(m => `${m.role === "user" ? "Player" : m.role === "assistant" ? "Other player" : ""}: ${m.content}`).join("\n")}\n\nRespond naturally based on your personality, background, and role. Stay in character. Keep it brief (1-2 sentences). Output only your response, nothing else.`
                  }
                ],
                gameContext: {
                  template: currentGame?.config.template,
                  gameName: currentGame?.name,
                  conversationState: gamePhase
                }
              });
              if (!isMountedRef.current) return;
              setTypingUsers([]);
              const reply = (message || "").trim() || "I'm thinking...";
              addMessage({
                senderId: randomPlayer.id,
                senderName: randomPlayer.name,
                senderAvatar: randomPlayer.avatar,
                content: reply,
                isAI: true
              });
            } catch (e) {
              if (!isMountedRef.current) return;
              setTypingUsers([]);
              const fallbackResponses = [
                "That's an interesting point...",
                "I'm not sure I agree with that.",
                "Can you explain more?",
                "I think we should consider all options.",
                "Based on what I've seen, I have my suspicions.",
                "Let's think about this carefully."
              ];
              addMessage({
                senderId: randomPlayer.id,
                senderName: randomPlayer.name,
                senderAvatar: randomPlayer.avatar,
                content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
                isAI: true
              });
            }
          }, 1500);
          timeoutRefs.current.push(messageTimeout);
        }
      }, delay);
      timeoutRefs.current.push(aiResponseTimeout);
    }
  }, [players, gamePhase, selectedGameId, games, messages, addMessage, userId]);

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
  }, [players, games, selectedGameId, gamePhaseState.phase, addMessage]);

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

    const desc = `Announce that ${target.name} has been eliminated. Be brief and in character.`;
    try {
      const { message } = await getAIChatResponse({
        messages: [{
          role: "user",
          content: `You are ${gameMaster.name}, the host. ${desc} Output only the announcement.`
        }],
        hostId: currentGame.config.hostId,
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
        // Night phase: werewolves choose victim, then move to day
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          const werewolves = alivePlayers.filter(p => p.role === "Werewolf");
          if (werewolves.length > 0 && aliveCount > werewolves.length) {
            const possibleVictims = alivePlayers.filter(p => p.role !== "Werewolf");
            const victim = possibleVictims[Math.floor(Math.random() * possibleVictims.length)];
            if (victim) {
              await hostEliminatePlayer(victim.id);
              setGamePhaseState(s => ({ ...s, lastNightVictimId: victim.id }));
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
        // Discussion: move to voting after enough messages
        const discussionMessages = messages.filter(m => 
          m.senderId !== "gm-1" && 
          new Date(m.timestamp).getTime() > Date.now() - 30000
        );
        if (discussionMessages.length >= aliveCount * 2) {
          await hostPostEvent(
            "Announce that voting begins. Players must decide who to eliminate.",
            { setPhase: "voting", nextSpeakerId: null }
          );
        }
      } else if (phase === "voting" && !gamePhaseState.lastVotedOutId) {
        // Voting: eliminate player after voting period
        const timeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          if (aliveCount > 2) {
            const candidates = alivePlayers.filter(p => p.role !== "Werewolf" || aliveCount <= 3);
            const votedOut = candidates[Math.floor(Math.random() * candidates.length)];
            if (votedOut) {
              await hostEliminatePlayer(votedOut.id);
            }
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
  const channels = [
    { id: "general", name: "general", type: "text" as const },
    { id: "rules", name: "rules", type: "text" as const },
    { id: "game-room", name: "game-room", type: "game" as const },
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
          />

          {selectedChannelId === "game-room" ? (
            <>
              <ChatArea
                channelName="game-room"
                messages={messages}
                onSendMessage={handleSendMessage}
                isGameActive={currentGame?.isActive || false}
                currentSpeakerId={currentSpeakerId}
                userId={userId}
                players={players}
                typingUsers={typingUsers}
                onHostPostEvent={hostPostEvent}
                onHostAssignSpeaker={hostAssignSpeaker}
                onHostEliminate={hostEliminatePlayer}
                onHostRevealRole={hostRevealRole}
                isUserHost={false}
                gamePhaseLabel={currentGame?.isActive ? phaseLabel(gamePhaseState.phase, gamePhaseState.round) : undefined}
                alivePlayers={alivePlayers}
                lastVotedOutId={gamePhaseState.lastVotedOutId}
              />
              <PlayerPanelWithBoard
                players={players}
                currentSpeakerId={currentSpeakerId}
                isUserGameMaster={false}
                onToggleMute={handleToggleMute}
                onSelectSpeaker={setCurrentSpeakerId}
                playerBoardData={playerBoardData}
              />
            </>
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
        position="top-center" 
        expand={false}
        richColors
        closeButton
      />
    </div>
  );
}
