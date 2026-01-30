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

// Helper to parse AI response for whisper format
// AI can use: [WHISPER:PlayerName] content [/WHISPER] to send private messages
function parseAIWhisper(response: string, players: Player[]): { 
  publicContent: string; 
  whispers: Array<{ targetId: string; targetName: string; content: string }> 
} {
  const whispers: Array<{ targetId: string; targetName: string; content: string }> = [];
  let publicContent = response;
  
  // Match [WHISPER:Name]...[/WHISPER] patterns
  const whisperRegex = /\[WHISPER:([^\]]+)\]([\s\S]*?)\[\/WHISPER\]/gi;
  let match;
  
  while ((match = whisperRegex.exec(response)) !== null) {
    const targetName = match[1].trim();
    const whisperContent = match[2].trim();
    
    // Find the player by name
    const targetPlayer = players.find(p => 
      p.name.toLowerCase() === targetName.toLowerCase() || 
      p.name === targetName
    );
    
    if (targetPlayer && whisperContent) {
      whispers.push({
        targetId: targetPlayer.id,
        targetName: targetPlayer.name,
        content: whisperContent
      });
    }
    
    // Remove whisper from public content
    publicContent = publicContent.replace(match[0], '').trim();
  }
  
  return { publicContent, whispers };
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
  
  const userId = "user-1";
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  const recentSpeakers = useRef<string[]>([]); // Track recent speakers for diversity

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
      // Check if message already exists (prevent duplicates)
      const exists = prev.some(m => 
        m.senderId === newMessage.senderId && 
        m.content === newMessage.content && 
        Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000
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
                content: `You are ${player.name}, a player in a social deduction game. Your personality: ${player.personality || "Friendly and enthusiastic."} Your background: ${player.background || "A game enthusiast."} The host just explained the rules and asked if everyone is ready. Write a short, natural response (1-2 sentences max) showing you're ready to play. Stay in character based on your personality and background. Emojis are allowed; use when appropriate. Output only your response, nothing else.`
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
            content: `You are ${host.name}, the host. The game is "${config.name}". Rules:\n\n${config.rules}\n\nWrite a short opening greeting to the players: introduce yourself, briefly explain the rules above, and ask if everyone is ready. Stay in character. Emojis are allowed; use when appropriate. Output only the greeting, no other commentary.`
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

  const handleSendMessage = useCallback((content: string, whisperTo?: { id: string; name: string } | null) => {
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
    // Note: Whispers are always allowed regardless of turn
    if (!whisperTo && isGameActive && currentSpeakerId && currentSpeakerId !== userId) {
      toast.warning("It's not your turn to speak. Wait for the Host to assign you.");
      return;
    }
    
    addMessage({
      senderId: userId,
      senderName: "You",
      senderAvatar: "#6366f1",
      content,
      isAI: false,
      isWhisper: !!whisperTo,
      whisperToId: whisperTo?.id,
      whisperToName: whisperTo?.name,
    });
    
    // Clear currentSpeakerId when user sends a message (so timeout knows user has spoken)
    if (currentSpeakerId === userId) {
      setCurrentSpeakerId(null);
    }

    // Get the Game Master
    const gameMaster = players.find(p => p.isGameMaster);
    
    // Handle whisper reply - if user sends a whisper, the target AI should reply
    if (whisperTo && whisperTo.id !== userId) {
      const targetPlayer = players.find(p => p.id === whisperTo.id);
      if (targetPlayer?.isAI) {
        const whisperReplyTimeout = setTimeout(async () => {
          if (!isMountedRef.current) return;
          
          setTypingUsers([{ name: targetPlayer.name, avatar: targetPlayer.avatar }]);
          
          try {
            const currentGame = games.find(g => g.id === selectedGameId);
            const isTargetHost = targetPlayer.isGameMaster;
            
            const { message } = await getAIChatResponse({
              messages: [{
                role: "user",
                content: isTargetHost
                  ? `You are ${targetPlayer.name}, the host of "${currentGame?.name || "the game"}". A player named "You" (the human player) just sent you a private whisper: "${content}"

Reply to this whisper privately. Keep your response brief (1-2 sentences). Stay in character as the host. You can give hints, acknowledge their message, or provide guidance. Emojis are allowed; use when appropriate.

Output only your whisper reply, nothing else.`
                  : `You are ${targetPlayer.name}, a player in "${currentGame?.name || "the game"}".
Your role: ${targetPlayer.role || "Player"}
Your personality: ${targetPlayer.personality || "Friendly and observant."}
Your background: ${targetPlayer.background || "A game enthusiast."}

A player named "You" (the human player) just sent you a private whisper: "${content}"

Reply to this whisper privately. Keep your response brief (1-2 sentences). Stay in character. You might form an alliance, share suspicions, or respond based on your role. Emojis are allowed; use when appropriate.

Output only your whisper reply, nothing else.`
              }],
              gameContext: {
                template: currentGame?.config.template,
                gameName: currentGame?.name,
                conversationState: gamePhase
              }
            });
            
            if (!isMountedRef.current) return;
            setTypingUsers([]);
            
            const reply = (message || "").trim() || "I understand.";
            addMessage({
              senderId: targetPlayer.id,
              senderName: targetPlayer.name,
              senderAvatar: targetPlayer.avatar,
              content: reply,
              isAI: true,
              isWhisper: true,
              whisperToId: userId,
              whisperToName: "You",
            });
          } catch (e) {
            if (!isMountedRef.current) return;
            setTypingUsers([]);
            // Fallback whisper reply
            addMessage({
              senderId: targetPlayer.id,
              senderName: targetPlayer.name,
              senderAvatar: targetPlayer.avatar,
              content: targetPlayer.isGameMaster ? "Noted. I'll keep that in mind." : "Interesting... let's talk more later.",
              isAI: true,
              isWhisper: true,
              whisperToId: userId,
              whisperToName: "You",
            });
          }
        }, 1500 + Math.random() * 1000);
        timeoutRefs.current.push(whisperReplyTimeout);
        return; // Don't proceed with normal message flow for whispers
      }
    }

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
        
        // Send role whispers to each player based on game rules
        const allPlayers = [...players.filter(p => !p.isGameMaster)];
        const sendRoleWhispers = async () => {
          if (!isMountedRef.current || !currentGame) return;
          
          for (const player of allPlayers) {
            // Build role information based on game template
            let roleInfo = "";
            if (currentGame.config.template === "werewolf") {
              const role = player.role || "Villager";
              if (role === "Werewolf") {
                const otherWerewolves = allPlayers.filter(p => p.role === "Werewolf" && p.id !== player.id);
                roleInfo = `Your role is **Werewolf**. You must eliminate villagers without being caught. ${otherWerewolves.length > 0 ? `Your fellow werewolf is: ${otherWerewolves.map(w => w.name).join(", ")}.` : "You are the only werewolf."} During the night, you will choose a victim. During the day, blend in and deflect suspicion.`;
              } else if (role === "Seer") {
                roleInfo = `Your role is **Seer**. Each night, you may investigate one player to learn if they are a Werewolf or Not. Use this information wisely to guide the village, but be careful not to reveal yourself too early.`;
              } else if (role === "Doctor") {
                roleInfo = `Your role is **Doctor**. Each night, you may protect one player from being eliminated by the werewolves. You cannot protect the same player twice in a row. Your protection is crucial for the village's survival.`;
              } else {
                roleInfo = `Your role is **Villager**. You have no special abilities, but your vote and observations are crucial. Work with others to identify and eliminate the werewolves before they take over.`;
              }
            } else if (currentGame.config.template === "undercover") {
              const role = player.role || "Civilian";
              const word = player.stats?.Word as string || "";
              if (role === "Undercover") {
                roleInfo = `Your role is **Undercover**. Your secret word is: **"${word}"**. Your word is similar but different from the civilians' word. Describe your word carefully to blend in, but not so accurately that you give yourself away.`;
              } else {
                roleInfo = `Your role is **Civilian**. Your secret word is: **"${word}"**. Describe your word to help identify who has a different word. Be careful - the undercover agent has a similar but different word.`;
              }
            } else {
              // Custom game - use AI to generate role whisper based on rules
              try {
                const { message } = await getAIChatResponse({
                  messages: [{
                    role: "user",
                    content: `You are ${gameMaster.name}, the host of "${currentGame.name}". 
                    
Game Rules:
${currentGame.config.rules}

Player: ${player.name}
Role/Position: ${player.role || "Player"}
Stats: ${JSON.stringify(player.stats || {})}

Generate a brief private message (1-3 sentences) to whisper to this player about their role, abilities, or any secret information they should know based on the game rules. Be specific and helpful. If there's nothing secret to share, give them a brief encouragement or reminder relevant to their position in the game.

Output only the whisper message, nothing else.`
                  }],
                  gameContext: {
                    template: currentGame.config.template,
                    gameName: currentGame.name,
                    rules: currentGame.config.rules
                  }
                });
                roleInfo = (message || "").trim() || `Welcome to the game, ${player.name}. Play wisely and trust your instincts.`;
              } catch {
                roleInfo = `Welcome to the game, ${player.name}. Play wisely and trust your instincts.`;
              }
            }
            
            // Send whisper to player
            if (roleInfo) {
              await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between whispers
              if (!isMountedRef.current) return;
              addMessage({
                senderId: "gm-1",
                senderName: gameMaster.name,
                senderAvatar: gameMaster.avatar,
                content: roleInfo,
                isAI: true,
                isWhisper: true,
                whisperToId: player.id,
                whisperToName: player.name,
              });
            }
          }
        };
        
        // Send role whispers after a short delay
        const whisperTimeout = setTimeout(sendRoleWhispers, 1500);
        timeoutRefs.current.push(whisperTimeout);
        
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
          }, 5000); // Increased delay to allow role whispers to be sent first
          timeoutRefs.current.push(autoStartTimeout);
        }
      }, 2500);
      timeoutRefs.current.push(responseTimeout);
    } else {
      // AI Host decides which player is most likely to respond
      const delay = 1500 + Math.random() * 2000;
      const aiResponseTimeout = setTimeout(async () => {
        if (!isMountedRef.current) return;
        
        const currentGame = games.find(g => g.id === selectedGameId);
        const gameMaster = players.find(p => p.isGameMaster);
        if (!gameMaster || !currentGame) return;
        
        // Get alive players (both AI and human)
        const alivePlayers = players.filter(
          p => !p.isGameMaster && !p.isMuted && p.status !== "Eliminated" && p.stats?.Status !== "Eliminated"
        );
        
        if (alivePlayers.length === 0) return;
        
        let selectedPlayer: typeof alivePlayers[0] | null = null;
        let hostBriefForPlayer = "";
        
        // Get recent conversation context
        const recentMessages = messages.slice(-5).map(m => ({
          role: m.senderId === userId ? "user" as const : "assistant" as const,
          content: `${m.senderName}: ${m.content}`
        }));
        
        // Build player information for AI Host to analyze
        const playersInfo = alivePlayers.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role || "Player",
          isAI: p.isAI || false,
          personality: p.personality || "Friendly and observant",
          background: p.background || "A game enthusiast",
          isUser: p.id === userId
        }));
        
        try {
          // AI Host decides who speaks and provides a brief (info) for the selected player
          const { message: hostDecision } = await getAIChatResponse({
            messages: [{
              role: "user",
              content: `You are ${gameMaster.name}, the host of "${currentGame.name}". As the host, you decide who speaks next and what information to give that player.

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessages.length > 0 ? recentMessages.map(m => `${m.role === "user" ? "Player" : m.role === "assistant" ? "Other player" : ""}: ${m.content}`).join("\n") : "Game just started, no conversation yet."}

Available players (all alive and not muted):
${playersInfo.map(p => `- ${p.name} (Role: ${p.role}, Type: ${p.isAI ? "AI" : "Human"}, Personality: ${p.personality})`).join("\n")}

Current game phase: ${gamePhase}

Your task:
1. Choose who should speak next based on game flow, roles, and conversation context.
2. Write a brief for that player - the key information they need to know for their turn (e.g. their role, night events, accusations against them, what to defend/accuse, etc.). The brief is private - only that player sees it.
3. Optionally, you can send a WHISPER (private message) to any player. Use format: [WHISPER:PlayerName]Your private message[/WHISPER]. This is visible only to that player and you. Use whispers for role-specific information, private warnings, or secret instructions.

Respond in this EXACT format (do not add markdown or extra text):
NEXT_SPEAKER: [Player name exactly as listed, or NONE]
BRIEF_FOR_PLAYER: [1-3 sentences of info the player needs. If NONE, write nothing after the colon.]
WHISPER: [Optional - use [WHISPER:Name]message[/WHISPER] format if needed, or leave empty]`
            }],
            hostId: currentGame.config.hostId,
            hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
            gameContext: {
              template: currentGame.config.template,
              gameName: currentGame.name,
              rules: currentGame.config.rules,
              conversationState: gamePhase
            }
          });
          
            if (!isMountedRef.current) return;
            
            const raw = (hostDecision || "").trim();
            const nextSpeakerMatch = raw.match(/NEXT_SPEAKER:\s*(.+?)(?:\n|$)/i);
            const briefMatch = raw.match(/BRIEF_FOR_PLAYER:\s*([\s\S]+?)(?:\n[A-Z_]+:|$)/i);
            const selectedPlayerName = nextSpeakerMatch ? nextSpeakerMatch[1].trim() : raw.split("\n")[0]?.trim() || "";
            hostBriefForPlayer = briefMatch ? briefMatch[1].trim() : "";
            
            // Parse and send any whispers from the Host
            const { whispers: hostWhispers } = parseAIWhisper(raw, players);
            for (const whisper of hostWhispers) {
              addMessage({
                senderId: "gm-1",
                senderName: gameMaster.name,
                senderAvatar: gameMaster.avatar,
                content: whisper.content,
                isAI: true,
                isWhisper: true,
                whisperToId: whisper.targetId,
                whisperToName: whisper.targetName,
              });
            }
            
            selectedPlayer = alivePlayers.find(p => 
              p.name.toLowerCase() === selectedPlayerName.toLowerCase() || 
              p.name === selectedPlayerName
            ) ?? null;
            
            if (selectedPlayer) {
              recentSpeakers.current.push(selectedPlayer.id);
              if (recentSpeakers.current.length > 3) recentSpeakers.current.shift();
            }
            
            // If no valid player selected or host said "NONE", use fallback: random AI player or Host intervention
            if (!selectedPlayer || selectedPlayerName.toUpperCase() === "NONE") {
              const aiPlayers = alivePlayers.filter(p => p.isAI);
              if (aiPlayers.length > 0) {
                const availableAIPlayers = aiPlayers.filter(p => 
                  !recentSpeakers.current.includes(p.id)
                );
                selectedPlayer = availableAIPlayers.length > 0
                  ? availableAIPlayers[Math.floor(Math.random() * availableAIPlayers.length)]
                  : aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
                if (selectedPlayer) {
                  recentSpeakers.current.push(selectedPlayer.id);
                  if (recentSpeakers.current.length > 3) recentSpeakers.current.shift();
                }
              } else {
                // No AI players available, let Host make a comment to keep game moving
                const hostCommentTimeout = setTimeout(async () => {
                  if (!isMountedRef.current) return;
                  try {
                    const { message } = await getAIChatResponse({
                      messages: [{
                        role: "user",
                        content: `You are ${gameMaster.name}, the host. The conversation has paused. Make a brief comment to encourage discussion or guide the game forward (1-2 sentences). Emojis are allowed; use when appropriate. Output only your comment.`
                      }],
                      hostId: currentGame.config.hostId,
                      hostPersonality: currentGame.config.generatedHost ? { name: currentGame.config.generatedHost.name, description: currentGame.config.generatedHost.personality, personality: currentGame.config.generatedHost.voiceStyle } : undefined,
                      gameContext: {
                        template: currentGame.config.template,
                        gameName: currentGame.name,
                        rules: currentGame.config.rules,
                        conversationState: gamePhase
                      }
                    });
                    if (!isMountedRef.current) return;
                    addMessage({
                      senderId: "gm-1",
                      senderName: gameMaster.name,
                      senderAvatar: gameMaster.avatar,
                      content: (message || "").trim() || "Let's keep the discussion going!",
                      isAI: true
                    });
                  } catch (e) {
                    if (!isMountedRef.current) return;
                    addMessage({
                      senderId: "gm-1",
                      senderName: gameMaster.name,
                      senderAvatar: gameMaster.avatar,
                      content: "Let's keep the discussion going!",
                      isAI: true
                    });
                  }
                }, 2000);
                timeoutRefs.current.push(hostCommentTimeout);
                return;
              }
            }
          } catch (e) {
            // Fallback to random selection if AI Host decision fails
            console.error("Error getting AI Host decision:", e);
            const aiPlayers = alivePlayers.filter(p => p.isAI);
            if (aiPlayers.length > 0) {
              selectedPlayer = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
            } else {
              return;
            }
          }
        
        if (!selectedPlayer) return;
        
        // If selected player is the human user, prompt them to speak
          if (selectedPlayer.id === userId) {
            setCurrentSpeakerId(userId);
            // Show typing indicator briefly to indicate the host is "thinking"
            setTypingUsers([{ name: gameMaster.name, avatar: gameMaster.avatar }]);
            setTimeout(() => {
              if (!isMountedRef.current) return;
              setTypingUsers([]);
              
              // Play notification sound
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIE2S56+ihUxILTKXh8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8bllHgU2jdXvx3gpBSh+zPDckTwJFGO3+++mUhELTKXi8Q==');
                audio.volume = 0.3;
                audio.play().catch(() => {}); // Ignore errors if audio fails
              } catch (e) {
                // Ignore audio errors
              }
              
              toast.info(`${gameMaster.name} thinks you might want to respond. You can speak now!`, {
                duration: 3000,
              });
              
              // Trigger input focus event (will be handled by ChatArea component)
              window.dispatchEvent(new CustomEvent('focusGameInput'));
            }, 800);
            
            // Set timeout: if user doesn't speak within 30 seconds, automatically select an AI player
            const userTimeout = setTimeout(async () => {
              if (!isMountedRef.current) return;
              // Check if user has spoken (currentSpeakerId might be cleared when they send a message)
              const lastUserMessage = messages.find(m => m.senderId === userId);
              const lastUserMessageTime = lastUserMessage ? new Date(lastUserMessage.timestamp).getTime() : 0;
              const timeSinceLastUserMessage = Date.now() - lastUserMessageTime;
              
              // Only proceed if user hasn't spoken in the last 30 seconds
              if (timeSinceLastUserMessage > 30000 || !lastUserMessage) {
                setCurrentSpeakerId(null);
                // Select a random AI player to continue
                const aiPlayers = alivePlayers.filter(p => p.isAI && p.id !== userId);
                if (aiPlayers.length > 0) {
                  const availableAIPlayers = aiPlayers.filter(p => 
                    !recentSpeakers.current.includes(p.id)
                  );
                  const nextPlayer = availableAIPlayers.length > 0
                    ? availableAIPlayers[Math.floor(Math.random() * availableAIPlayers.length)]
                    : aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
                  
                  if (nextPlayer) {
                    setTypingUsers([{ name: nextPlayer.name, avatar: nextPlayer.avatar }]);
                    const messageTimeout = setTimeout(async () => {
                      if (!isMountedRef.current) return;
                      try {
                        const { message } = await getAIChatResponse({
                          messages: [{
                            role: "user",
                            content: `You are ${nextPlayer.name}, a player in a social deduction game "${currentGame.name}". 

Your role: ${nextPlayer.role || "Player"}
Your personality: ${nextPlayer.personality || "Friendly and observant."}
Your background: ${nextPlayer.background || "A game enthusiast."}

Game Rules:
${currentGame.config.rules || "No specific rules defined."}

Recent conversation:
${recentMessages.map(m => `${m.role === "user" ? "Player" : m.role === "assistant" ? "Other player" : ""}: ${m.content}`).join("\n")}

The conversation has paused. Respond naturally to keep the game moving. Stay in character. Keep it brief (1-2 sentences). Emojis are allowed; use when appropriate. Output only your response, nothing else.`
                          }],
                          gameContext: {
                            template: currentGame.config.template,
                            gameName: currentGame.name,
                            rules: currentGame.config.rules,
                            conversationState: gamePhase
                          }
                        });
                        if (!isMountedRef.current) return;
                        setTypingUsers([]);
                        const reply = (message || "").trim() || "Let me think about that...";
                        addMessage({
                          senderId: nextPlayer.id,
                          senderName: nextPlayer.name,
                          senderAvatar: nextPlayer.avatar,
                          content: reply,
                          isAI: true
                        });
                        recentSpeakers.current.push(nextPlayer.id);
                        if (recentSpeakers.current.length > 3) {
                          recentSpeakers.current.shift();
                        }
                      } catch (e) {
                        if (!isMountedRef.current) return;
                        setTypingUsers([]);
                        const fallbackResponses = [
                          "I'm still processing that...",
                          "That's an interesting point.",
                          "Let me think about this more carefully."
                        ];
                        addMessage({
                          senderId: nextPlayer.id,
                          senderName: nextPlayer.name,
                          senderAvatar: nextPlayer.avatar,
                          content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
                          isAI: true
                        });
                      }
                    }, 1500);
                    timeoutRefs.current.push(messageTimeout);
                  }
                }
              }
            }, 30000); // 30 second timeout
            timeoutRefs.current.push(userTimeout);
            return;
          }
          
          // If selected player is AI, generate their response using Host's brief
          if (selectedPlayer.isAI) {
            setTypingUsers([{ name: selectedPlayer.name, avatar: selectedPlayer.avatar }]);
            
            const messageTimeout = setTimeout(async () => {
              if (!isMountedRef.current) return;
              try {
                const briefSection = hostBriefForPlayer
                  ? `\n\nHOST'S BRIEF (information for you - use this to guide your response):\n${hostBriefForPlayer}\n`
                  : "";
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
${recentMessages.map(m => `${m.role === "user" ? "Player" : m.role === "assistant" ? "Other player" : ""}: ${m.content}`).join("\n")}
${briefSection}
The host (${gameMaster.name}) has called on you to speak. Respond based on the above context and the host's brief. Stay in character. Keep it brief (1-2 sentences). Emojis are allowed; use when appropriate.

WHISPER FEATURE: You can send a private message (whisper) to any player or the Host. Use format: [WHISPER:PlayerName]Your private message[/WHISPER]. Only that player can see it. Use whispers for secret alliances, private accusations, or sharing information discreetly.

Output your public response. Optionally include whispers if strategically appropriate.`
                  }],
                  gameContext: {
                    template: currentGame.config.template,
                    gameName: currentGame.name,
                    rules: currentGame.config.rules,
                    conversationState: gamePhase
                  }
                });
                if (!isMountedRef.current) return;
                setTypingUsers([]);
                const fullReply = (message || "").trim() || "I'm thinking...";
                
                // Parse whispers from AI Player response
                const { publicContent, whispers: playerWhispers } = parseAIWhisper(fullReply, players);
                
                // Send whispers first
                for (const whisper of playerWhispers) {
                  addMessage({
                    senderId: selectedPlayer.id,
                    senderName: selectedPlayer.name,
                    senderAvatar: selectedPlayer.avatar,
                    content: whisper.content,
                    isAI: true,
                    isWhisper: true,
                    whisperToId: whisper.targetId,
                    whisperToName: whisper.targetName,
                  });
                }
                
                // Send public message if there's content
                if (publicContent) {
                  addMessage({
                    senderId: selectedPlayer.id,
                    senderName: selectedPlayer.name,
                    senderAvatar: selectedPlayer.avatar,
                    content: publicContent,
                    isAI: true
                  });
                }
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
                  senderId: selectedPlayer.id,
                  senderName: selectedPlayer.name,
                  senderAvatar: selectedPlayer.avatar,
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
            content: `You are ${gameMaster!.name}, the host of "${currentGame?.name || "the game"}". ${desc} Announce this to the players in character. Keep it brief (2-3 sentences). Emojis are allowed; use when appropriate. Output only the announcement.`
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
          content: `You are ${gameMaster.name}, the host. ${desc} Emojis are allowed; use when appropriate. Output only the announcement.`
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
          content: `You are ${gameMaster.name}, the host. ${desc} Emojis are allowed; use when appropriate. Output only the announcement.`
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

  // Auto-decision effect - runs when game state changes or new message arrives
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
    <div className="h-screen flex overflow-hidden bg-zinc-900 text-white">
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
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
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
            <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
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
            <div className="flex-1 min-h-0 bg-zinc-700 p-10 overflow-y-auto">
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
            <div className="flex-1 min-h-0 bg-zinc-700 flex items-center justify-center">
              <div className="text-center text-zinc-400">
                <h2 className="text-xl mb-2">Welcome to {currentGame?.name}</h2>
                <p>Select a channel to start</p>
              </div>
            </div>
          )}
        </div>
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
