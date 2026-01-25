"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, Send, Mic, MicOff, Eye, X, Check, MessageSquarePlus, Trash2, MoreVertical, Play, Volume2, VolumeX } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { HOST_PERSONALITIES, getDefaultHost, getDefaultHostForTemplate, getLastSelectedHostId, saveLastSelectedHostId, getHostById } from "@/app/config/host-config";
import { HostSelector } from "@/app/components/host-selector";
import { streamAIChatResponse, type ChatMessage as AIChatMessage } from "@/lib/openai";
import { useVoiceInput, useVoiceOutput } from "@/lib/voice";

interface ChatMessage {
  id: string;
  role: "gm" | "user";
  content: string;
  timestamp: Date;
}

export interface GameSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  conversationState: ConversationState;
  selectedTemplate: GameTemplate | null;
  playerCount: number;
  customRules: string;
  gameName: string;
  selectedHostId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Format message content with markdown-like syntax
function formatMessage(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      elements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    if (trimmedLine.startsWith('###')) {
      const text = trimmedLine.replace(/^###+\s*/, '');
      elements.push(
        <h3 key={index} className="font-bold text-base text-violet-300 mt-4 mb-2 first:mt-0">
          {parseInlineFormatting(text)}
        </h3>
      );
      return;
    }
    if (trimmedLine.startsWith('##')) {
      const text = trimmedLine.replace(/^##+\s*/, '');
      elements.push(
        <h2 key={index} className="font-bold text-lg text-violet-200 mt-4 mb-2 first:mt-0">
          {parseInlineFormatting(text)}
        </h2>
      );
      return;
    }
    if (trimmedLine.startsWith('#')) {
      const text = trimmedLine.replace(/^#+\s*/, '');
      elements.push(
        <h1 key={index} className="font-bold text-xl text-violet-100 mt-4 mb-3 first:mt-0">
          {parseInlineFormatting(text)}
        </h1>
      );
      return;
    }

    const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      const [, number, text] = numberedListMatch;
      elements.push(
        <div key={index} className="flex gap-2.5 mb-1.5">
          <span className="text-violet-400 font-semibold flex-shrink-0 min-w-[20px]">{number}.</span>
          <div className="flex-1 min-w-0">{parseInlineFormatting(text)}</div>
        </div>
      );
      return;
    }
    if (/^[•\-\*]\s+/.test(trimmedLine)) {
      const text = trimmedLine.replace(/^[•\-\*]\s+/, '');
      elements.push(
        <div key={index} className="flex gap-2.5 mb-1.5">
          <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 min-w-0">{parseInlineFormatting(text)}</div>
        </div>
      );
      return;
    }
    if (trimmedLine.endsWith(':') && (trimmedLine.length < 50 || trimmedLine === trimmedLine.toUpperCase())) {
      elements.push(
        <div key={index} className="font-semibold text-sm text-violet-300 mt-3 mb-1.5 first:mt-0">
          {parseInlineFormatting(trimmedLine)}
        </div>
      );
      return;
    }
    elements.push(
      <div key={index} className="mb-1.5 leading-relaxed">
        {parseInlineFormatting(trimmedLine)}
      </div>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

// Helper function to parse inline formatting (bold, italic, emoji)
function parseInlineFormatting(text: string): JSX.Element[] {
  const parts: (string | JSX.Element)[] = [];
  let currentIndex = 0;
  
  // Match **bold**, *italic*, and emoji patterns
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
    { regex: /\*(.*?)\*/g, type: 'italic' },
    { regex: /`(.*?)`/g, type: 'code' },
  ];
  
  // Find all matches
  const matches: Array<{ start: number; end: number; type: string; content: string }> = [];
  
  patterns.forEach(({ regex, type }) => {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        content: match[1]
      });
    }
  });
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (prefer bold over italic)
  const filteredMatches: typeof matches = [];
  matches.forEach(match => {
    const overlaps = filteredMatches.some(m => 
      (match.start >= m.start && match.start < m.end) ||
      (match.end > m.start && match.end <= m.end) ||
      (match.start <= m.start && match.end >= m.end)
    );
    if (!overlaps) {
      filteredMatches.push(match);
    }
  });
  
  // Build elements
  filteredMatches.forEach((match, i) => {
    // Add text before match
    if (match.start > currentIndex) {
      parts.push(text.substring(currentIndex, match.start));
    }
    
    // Add formatted content
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${i}`} className="font-bold text-white">{match.content}</strong>);
    } else if (match.type === 'italic') {
      parts.push(<em key={`italic-${i}`} className="italic text-zinc-300">{match.content}</em>);
    } else if (match.type === 'code') {
      parts.push(<code key={`code-${i}`} className="bg-white/10 px-1.5 py-0.5 rounded text-[13px] font-mono text-violet-300">{match.content}</code>);
    }
    
    currentIndex = match.end;
  });
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  // If no matches, return original text
  if (parts.length === 0) {
    return [<span key="text">{text}</span>];
  }
  
  return parts.map((part, i) => 
    typeof part === 'string' ? <span key={`text-${i}`}>{part}</span> : part
  );
}

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultRules: string;
  roles?: string[];
}

const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: "werewolf",
    name: "Werewolf",
    description: "A classic social deduction game where villagers try to find the werewolves among them.",
    minPlayers: 5,
    maxPlayers: 12,
    defaultRules: `OBJECTIVE: Villagers must find and eliminate all Werewolves. Werewolves must eliminate all Villagers.

PHASES:
1. Night Phase - Werewolves choose a victim
2. Day Phase - All players discuss and vote to eliminate someone

ROLES:
- Villagers: Innocent townspeople
- Werewolves: Kill one villager each night
- Seer: Can check one player's role each night
- Doctor: Can protect one player each night

RULES:
- Once rules are set, they cannot be changed
- Game Master controls all phases
- Dead players cannot communicate
- Majority vote eliminates a player`,
    roles: ["Villager", "Werewolf", "Seer", "Doctor"]
  },
  {
    id: "undercover",
    name: "Undercover (Who's the Spy)",
    description: "Find the undercover agent who has a different word while blending in with the group.",
    minPlayers: 4,
    maxPlayers: 10,
    defaultRules: `OBJECTIVE: Civilians find the Undercover. Undercover tries to blend in and survive.

SETUP:
- Most players get the same word (Civilians)
- One player gets a similar but different word (Undercover)
- One player gets a completely different word (Mr. White - optional)

GAMEPLAY:
1. Each player describes their word in one sentence
2. Vote to eliminate the suspected Undercover
3. Eliminated player reveals their role
4. Continue until Undercover is found or wins

WINNING:
- Civilians win if they eliminate the Undercover
- Undercover wins if they survive to final 3 players
- Mr. White wins if they correctly guess the civilian word when eliminated`,
    roles: ["Civilian", "Undercover", "Mr. White"]
  },
  {
    id: "custom",
    name: "Custom Game",
    description: "Create your own game with custom rules and roles.",
    minPlayers: 2,
    maxPlayers: 20,
    defaultRules: "Custom game rules will be defined through conversation",
    roles: []
  }
];

type ConversationState = "greeting" | "game-type" | "player-count" | "rules-discussion" | "confirmation" | "completed";

interface GameMasterChatProps {
  onBack: () => void;
  onCreateGame: (config: GameConfig) => void;
}

// Helper function to generate session title
function generateSessionTitle(template: GameTemplate | null, playerCount: number): string {
  if (!template) return "New Game Setup";
  if (template.id === "custom") return "Custom Game Setup";
  return `${template.name} - ${playerCount + 1} Players`;
}

export function GameMasterChat({ onBack, onCreateGame }: GameMasterChatProps) {
  // Session management
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  // Current conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>("greeting");
  const [isGMTyping, setIsGMTyping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false); // Track if currently streaming
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Game configuration being built
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [customRules, setCustomRules] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");

  // Host personality - try last selected, then default
  const [selectedHostId, setSelectedHostId] = useState<string>(() => {
    const lastHostId = getLastSelectedHostId();
    if (lastHostId) return lastHostId;
    return getDefaultHost().id;
  });

  // Voice output (TTS): GM reads replies aloud. Init false to avoid hydration mismatch;
  // sync from localStorage after mount.
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const voiceOutputEnabledRef = useRef(voiceOutputEnabled);
  voiceOutputEnabledRef.current = voiceOutputEnabled;
  const { speak: speakTTS, stop: stopTTS, supported: ttsSupported } = useVoiceOutput();

  // Only render client-only UI (e.g. TTS button) after mount to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    setVoiceOutputEnabled(localStorage.getItem("gmVoiceOutput") === "1");
  }, [mounted]);

  // Voice input (STT)
  const voice = useVoiceInput();
  const { isRecording, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

  // Preview panel
  const [showPreview, setShowPreview] = useState(true);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("gameMasterSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      // Convert date strings back to Date objects and ensure unique IDs
      const sessionsWithDates = parsed.map((s: any) => ({
        ...s,
        messages: s.messages.map((m: any) => ({
          ...m,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Regenerate unique IDs
          timestamp: new Date(m.timestamp)
        })),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
      setSessions(sessionsWithDates);
      
      // Load the most recent session
      if (sessionsWithDates.length > 0) {
        loadSession(sessionsWithDates[0].id, sessionsWithDates);
      } else {
        // Create first session
        createNewSession();
      }
    } else {
      // Create first session
      createNewSession();
    }
  }, []);

  // Auto-save current session
  useEffect(() => {
    if (!currentSessionId) return;
    
    const timeoutId = setTimeout(() => {
      saveCurrentSession();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [messages, conversationState, selectedTemplate, playerCount, customRules, gameName, selectedHostId, currentSessionId]);

  // Save current session to state and localStorage
  const saveCurrentSession = () => {
    if (!currentSessionId) return;

    const sessionTitle = generateSessionTitle(selectedTemplate, playerCount);
    
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
      createdAt: sessions.find(s => s.id === currentSessionId)?.createdAt || new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== currentSessionId);
      const updated = [updatedSession, ...filtered];
      localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      return updated;
    });
  };

  // Create new session
  const createNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: GameSession = {
      id: newSessionId,
      title: "New Game Setup",
      messages: [],
      conversationState: "greeting",
      selectedTemplate: null,
      playerCount: 6,
      customRules: "",
      gameName: "",
      selectedHostId: getDefaultHostForTemplate(selectedTemplate?.id || null).id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Reset all state
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setConversationState("greeting");
    setIsGMTyping(true);
    setSelectedTemplate(null);
    setPlayerCount(6);
    setCustomRules("");
    setGameName("");
    setSelectedHostId(getDefaultHostForTemplate(null).id);

    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      return updated;
    });
  };

  // Load a session
  const loadSession = (sessionId: string, sessionsList?: GameSession[]) => {
    const sessionsToSearch = sessionsList || sessions;
    const session = sessionsToSearch.find(s => s.id === sessionId);
    if (!session) return;

    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setConversationState(session.conversationState);
    setSelectedTemplate(session.selectedTemplate);
    setPlayerCount(session.playerCount);
    setCustomRules(session.customRules);
    setGameName(session.gameName);
    setSelectedHostId(session.selectedHostId);
    setIsGMTyping(session.messages.length === 0);
  };

  // Delete a session
  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      localStorage.setItem("gameMasterSessions", JSON.stringify(filtered));
      
      // If deleting current session, switch to another or create new
      if (sessionId === currentSessionId) {
        if (filtered.length > 0) {
          loadSession(filtered[0].id, filtered);
        } else {
          createNewSession();
        }
      }
      
      return filtered;
    });
    toast.success("Session deleted");
  };

  // Show initial greeting when messages are empty
  useEffect(() => {
    if (messages.length === 0 && currentSessionId) {
      setTimeout(() => {
        addGMMessage(
          "👋 **Welcome! I'm your Game Master.**\n\n" +
          "I'll help you design and create any game you can imagine.\n\n" +
          "**How to start:**\n" +
          "• Choose a quick option below, or\n" +
          "• Simply describe your game idea to me\n\n" +
          "Let's create something amazing together! 🎮"
        );
      }, 300);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const addGMMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "gm",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsGMTyping(false);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const getGMResponse = async (userInput: string) => {
    // Prevent multiple simultaneous requests
    if (isStreaming || isGMTyping) {
      return;
    }
    
    setIsGMTyping(true);
    setIsStreaming(true);
    const lowerInput = userInput.toLowerCase();

    // Create a temporary message for streaming
    const tempMessageId = `msg-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      role: "gm",
      content: "",
      timestamp: new Date()
    };
    
    // Add empty message first for streaming (only if not already exists)
    setMessages(prev => {
      // Check if temp message already exists
      const hasTempMessage = prev.some(msg => msg.id.startsWith('msg-temp-'));
      if (hasTempMessage) {
        return prev;
      }
      return [...prev, tempMessage];
    });

    try {
      // Convert messages to API format (excluding the temp message)
      const apiMessages: AIChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Add current user message
      apiMessages.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      });

      // Get game context
      const gameContext = {
        template: selectedTemplate?.id || undefined,
        playerCount: playerCount,
        gameName: gameName || undefined,
        rules: customRules || selectedTemplate?.defaultRules || undefined,
        conversationState: conversationState
      };

      // Stream AI response
      let fullResponse = "";
      
      await streamAIChatResponse(
        {
          messages: apiMessages,
          hostId: selectedHostId,
          gameContext: gameContext
        },
          // onChunk: Update message content as chunks arrive
        (chunk: string) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
          // Auto-scroll to bottom during streaming
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
        },
        // onComplete: Handle cleanup after streaming completes
        () => {
          setIsGMTyping(false);
          setIsStreaming(false);
          if (voiceOutputEnabledRef.current && fullResponse.trim()) {
            speakTTS(fullResponse);
          }
          // Replace temp message with final message (ensure only one message)
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== tempMessageId || msg.content.trim() !== '');
            return filtered.map(msg =>
              msg.id === tempMessageId
                ? { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
                : msg
            );
          });
        },
        // onError: Handle errors
        (error: Error) => {
          console.error('Error streaming AI response:', error);
          toast.error(error.message || 'Failed to get AI response. Please try again.');
          
          // Remove temp message and add error message
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
          setIsGMTyping(false);
          setIsStreaming(false);
          
          addGMMessage(
            "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your message?"
          );
        }
      );
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      toast.error(error.message || 'Failed to get AI response. Please try again.');
      
      // Remove temp message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setIsGMTyping(false);
      setIsStreaming(false);
      
      // Fallback to a simple message
      addGMMessage(
        "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your message?"
      );
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const message = messageOverride || input.trim();
    if (message && !isGMTyping && !isStreaming) {
      addUserMessage(message);
      await getGMResponse(message);
      setInput("");
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (!isGMTyping && !isStreaming) {
      setInput(reply);
      setTimeout(async () => {
        addUserMessage(reply);
        await getGMResponse(reply);
        setInput("");
      }, 300);
    }
  };

  const host = getHostById(selectedHostId);

  return (
    <div className="flex-1 flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 h-full overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      {/* Voice Error Toast */}
      {voiceError && isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/50 rounded-xl p-4 shadow-2xl max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <X className="h-5 w-5 text-red-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Voice input error</h3>
                <p className="text-xs text-red-100 mb-3">{voiceError}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={voiceCancel}
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-xs h-7 px-3"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      voiceCancel();
                      setTimeout(() => voiceStart(), 100);
                    }}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white text-xs h-7 px-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Session History Sidebar */}
      <div className="w-52 sm:w-60 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-3 sm:p-4 border-b border-white/10 relative">
          <Button
            onClick={createNewSession}
            className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 sm:p-3 space-y-1.5 relative">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-all duration-200 ${
                  currentSessionId === session.id
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => loadSession(session.id)}
                  className="w-full p-2.5 sm:p-3 text-left"
                >
                  <div className="text-sm font-medium text-white mb-0.5 line-clamp-2 pr-7">
                    {session.title}
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500">
                    {new Date(session.updatedAt).toLocaleDateString()} · {session.messages.length}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-orange-500/5" />
          <div className="h-16 px-6 sm:px-8 flex items-center justify-between relative gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-xl rounded-full" />
                <GeneratedAvatar
                  name="Game Master"
                  type="gm"
                  className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/10 shadow-xl shadow-amber-500/20 relative"
                  fallbackColor="#f59e0b"
                  fallback={<Sparkles className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse" />}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate">Game Master</h1>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium truncate">
                  {isGMTyping || isStreaming ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-400/90">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Thinking...
                    </span>
                  ) : (
                    "Choose a game below or describe your own"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {mounted && ttsSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = !voiceOutputEnabled;
                    setVoiceOutputEnabled(next);
                    if (typeof window !== "undefined") localStorage.setItem("gmVoiceOutput", next ? "1" : "0");
                    if (!next) stopTTS();
                  }}
                  className={`h-9 w-9 rounded-lg transition-all ${voiceOutputEnabled ? "text-amber-400 hover:bg-amber-500/10" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
                  title={voiceOutputEnabled ? "Turn off read aloud" : "Read aloud GM replies"}
                >
                  {voiceOutputEnabled ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />}
                </Button>
              )}
              {selectedTemplate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
            {messages.map((message, index) => {
              if (!message.content.trim() && !message.id.startsWith('msg-temp-')) {
                return null;
              }
              const isUser = message.role === "user";
              const isStreamingMsg = message.id.startsWith("msg-temp-");
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
                >
                  <div className="relative flex-shrink-0">
                    {message.role === "gm" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20 blur-xl rounded-full" />
                    )}
                    {message.role === "user" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-xl rounded-full" />
                    )}
                    {message.role === "gm" ? (
                    <GeneratedAvatar
                      name="Game Master"
                      type="gm"
                      className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-white/10 shadow-lg relative border-amber-500/20"
                      fallbackColor="#f59e0b"
                      fallback={<Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />}
                    />
                    ) : (
                      <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 shadow-lg relative border-violet-500/20">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 via-indigo-500 to-violet-600 text-white font-semibold text-xs">
                          YOU
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
                    <div className={`max-w-[90%] sm:max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-lg backdrop-blur-xl relative overflow-hidden ${
                          message.role === "gm"
                            ? "bg-zinc-800/80 border border-white/[0.08] text-zinc-100"
                            : "bg-violet-600/85 border border-white/10 text-white"
                        } ${isStreamingMsg ? "ring-1 ring-amber-500/20" : ""}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                        <div className="text-[15px] sm:text-base leading-relaxed relative z-10 font-normal">
                          {message.role === "gm" ? formatMessage(message.content) : message.content}
                        </div>
                      </div>
                      <div className={`text-[11px] text-zinc-500 mt-1.5 ${isUser ? "pr-1" : "pl-1"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        {conversationState !== "completed" && (
          <div className="p-4 sm:p-5 border-t border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            
            <div className="max-w-3xl mx-auto relative space-y-3">
              {isRecording && !voiceError && (
                <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
                      <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white relative z-10" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-red-300">Recording</span>
                      <div className="flex items-center gap-0.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-400 rounded-full animate-pulse"
                            style={{ height: "6px", animationDelay: `${i * 80}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white truncate">{voiceTranscript || "Listening..."}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      onClick={voiceCancel}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      onClick={async () => {
                        const t = voiceTranscript.trim();
                        if (t) await handleSend(t);
                        voiceConfirm();
                      }}
                      size="sm"
                      disabled={!voiceTranscript.trim()}
                      className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-1 relative group min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/15 to-indigo-500/15 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <Input
                    value={isRecording && voiceTranscript ? voiceTranscript : input}
                    onChange={(e) => !isRecording && setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isRecording) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      isGMTyping || isStreaming
                        ? "GM is thinking..."
                        : isRecording
                          ? "Speaking..."
                          : "Message Game Master…"
                    }
                    className="bg-white/5 backdrop-blur-xl border border-white/10 focus:border-violet-500/40 text-white placeholder:text-zinc-500 text-sm sm:text-base h-12 sm:h-14 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-normal transition-all duration-200 relative shadow-md focus:shadow-lg focus:shadow-violet-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isGMTyping || isRecording}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (isRecording) {
                      voiceCancel();
                      return;
                    }
                    if (!voiceSupported) {
                      toast.error("Voice input is not supported in your browser");
                      return;
                    }
                    voiceStart();
                  }}
                  disabled={isGMTyping || (!mounted ? true : !voiceSupported)}
                  size="icon"
                  className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-200 disabled:opacity-50 disabled:shadow-none relative overflow-hidden group ${
                    isRecording
                      ? "bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/30 ring-2 ring-red-500/50"
                      : "bg-zinc-700/80 hover:bg-zinc-600/80 border border-white/10 hover:border-white/20"
                  }`}
                  title={isRecording ? "Cancel recording" : "Voice input"}
                >
                  {isRecording ? (
                    <>
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-red-500/20 animate-ping" />
                      <MicOff className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 text-white" />
                    </>
                  ) : (
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 text-zinc-300" />
                  )}
                </Button>
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGMTyping}
                  size="icon"
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 bg-violet-600 hover:bg-violet-500 border border-violet-500/30 hover:border-violet-400/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {selectedTemplate && showPreview && (
        <div className="w-72 sm:w-80 border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col relative z-10">
          <div className="absolute inset-0 bg-gradient-to-l from-violet-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="p-4 sm:p-5 border-b border-white/10 relative">
            <h2 className="text-lg font-bold text-white mb-1">Game Preview</h2>
            <p className="text-xs text-zinc-500">Building your game…</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-5 space-y-4 relative">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Game Type</div>
                    <div className="text-sm font-bold text-white">{selectedTemplate.name}</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400">{selectedTemplate.description}</p>
              </div>

              {playerCount > 0 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Players</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {playerCount + 1}
                    </span>
                    <span className="text-xs text-zinc-400">total · You + {playerCount} AI</span>
                  </div>
                </div>
              )}

              {customRules && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Rules</div>
                  <div className="text-xs text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {customRules}
                  </div>
                </div>
              )}

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <HostSelector
                  selectedHostId={selectedHostId}
                  onSelectHost={(hostId) => {
                    setSelectedHostId(hostId);
                    saveLastSelectedHostId(hostId);
                  }}
                  compact
                  templateId={selectedTemplate?.id}
                />
              </div>

              {selectedTemplate && playerCount > 0 && (
                <Button
                  size="lg"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20"
                  onClick={() => {
                    saveLastSelectedHostId(selectedHostId); // Save user's choice
                    onCreateGame({
                      name: gameName || selectedTemplate.name,
                      template: selectedTemplate.id,
                      playerCount,
                      rules: customRules || selectedTemplate.defaultRules,
                      customRoles: selectedTemplate.roles,
                      hostId: selectedHostId,
                    });
                    onBack();
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}