"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, Send, ArrowLeft, CheckCircle2, Mic, MicOff, Eye, X, Check, MessageSquarePlus, Trash2, MoreVertical } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { HOST_PERSONALITIES, getDefaultHost } from "@/app/config/host-config";
import { HostSelector } from "@/app/components/host-selector";

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
    if (!line.trim()) {
      elements.push(<div key={`br-${index}`} className="h-3" />);
      return;
    }

    // List items starting with •
    if (line.trim().startsWith('•')) {
      const text = line.replace(/^[•\s]+/, '');
      // Parse bold text **text**
      const parts = text.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={index} className="flex gap-3 mb-2">
          <span className="text-indigo-400 flex-shrink-0">•</span>
          <div>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        </div>
      );
    } 
    // Headers (lines ending with :)
    else if (line.trim().endsWith(':') && line.trim().length < 50 && line.trim() === line.trim().toUpperCase()) {
      elements.push(
        <div key={index} className="font-bold text-lg text-indigo-300 mt-4 mb-2">
          {line.trim()}
        </div>
      );
    }
    // Regular text with bold support
    else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={index} className="mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    }
  });

  return <div>{elements}</div>;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Game configuration being built
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [customRules, setCustomRules] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");

  // Host personality
  const [selectedHostId, setSelectedHostId] = useState<string>(getDefaultHost().id);
  const [showHostSelector, setShowHostSelector] = useState(false);

  // Voice input
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string>("");

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
      selectedHostId: getDefaultHost().id,
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
    setSelectedHostId(getDefaultHost().id);
    setShowHostSelector(false);

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
    setShowHostSelector(false);
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setVoiceError("");
      };

      recognitionInstance.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setVoiceError("Microphone access denied. Please allow microphone permissions in your browser settings.");
        } else if (event.error === 'no-speech') {
          setVoiceError("No speech detected. Please try again.");
        } else {
          setVoiceError("Voice input failed. Please check your microphone and try again.");
        }
      };

      recognitionInstance.onend = () => {
        // Don't auto-close, wait for user to confirm or cancel
      };

      setRecognition(recognitionInstance);
    }
  }, []);

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

  const simulateGMResponse = (userInput: string) => {
    setIsGMTyping(true);
    const lowerInput = userInput.toLowerCase();

    setTimeout(() => {
      if (conversationState === "greeting") {
        // Detect game type
        if (lowerInput.includes("werewolf") || lowerInput.includes("wolf")) {
          setSelectedTemplate(GAME_TEMPLATES[0]);
          setConversationState("player-count");
          addGMMessage(
            "Excellent choice! Werewolf is a classic game of deception and deduction.\n\n" +
            "For this game, I recommend 5-12 players (including you). How many other players would you like to join? " +
            "Just give me a number between 4 and 11."
          );
        } else if (lowerInput.includes("undercover") || lowerInput.includes("spy") || lowerInput.includes("卧底")) {
          setSelectedTemplate(GAME_TEMPLATES[1]);
          setConversationState("player-count");
          addGMMessage(
            "Great! Undercover is a fantastic word-guessing game where one player has a different word.\n\n" +
            "This game works best with 4-10 players (including you). How many other players should I create? " +
            "Give me a number between 3 and 9."
          );
        } else if (lowerInput.includes("custom") || lowerInput.includes("create") || lowerInput.includes("自定义")) {
          setSelectedTemplate(GAME_TEMPLATES[2]);
          setConversationState("rules-discussion");
          addGMMessage(
            "Wonderful! Let's create a custom game together. I love creativity!\n\n" +
            "Tell me about the game you envision:\n" +
            "• What's the objective?\n" +
            "• What roles or characters are involved?\n" +
            "• Any special rules or phases?\n\n" +
            "Share your ideas, and I'll help structure it into a playable game!"
          );
        } else {
          addGMMessage(
            "I'm not sure which game you'd prefer. Let me help you:\n\n" +
            "🐺 **Werewolf** - Perfect for strategy lovers. Players debate to find hidden werewolves.\n" +
            "🕵️ **Undercover** - Quick and fun! Guess who has the different word.\n" +
            "🎮 **Custom** - Have a unique idea! Let's build it together!\n\n" +
            "Which one sounds interesting to you?"
          );
        }
      } else if (conversationState === "player-count") {
        const numbers = userInput.match(/\\d+/);
        if (numbers) {
          const count = parseInt(numbers[0]);
          const min = selectedTemplate!.minPlayers - 1;
          const max = selectedTemplate!.maxPlayers - 1;
          
          if (count >= min && count <= max) {
            setPlayerCount(count);
            setConversationState("rules-discussion");
            addGMMessage(
              `Perfect! I'll create ${count} players for you.\n\n` +
              `Now, let's discuss the rules. Here are the standard rules for ${selectedTemplate!.name}:\n\n` +
              `${selectedTemplate!.defaultRules}\n\n` +
              `Would you like to:\n` +
              `• **Keep these rules** (just say "yes" or "keep them")\n` +
              `• **Modify something** (tell me what you'd like to change)\n` +
              `• **Start fresh** (describe your own rules)`
            );
          } else {
            addGMMessage(
              `Hmm, ${count} players might not work well for this game. ` +
              `I recommend between ${min} and ${max} other players (plus you makes ${min + 1} to ${max + 1} total). ` +
              `Could you choose a number in that range?`
            );
          }
        } else {
          addGMMessage(
            "I didn't catch a number there. How many other players would you like? " +
            `Please give me a number between ${selectedTemplate!.minPlayers - 1} and ${selectedTemplate!.maxPlayers - 1}.`
          );
        }
      } else if (conversationState === "rules-discussion") {
        if (lowerInput.includes("yes") || lowerInput.includes("keep") || lowerInput.includes("standard") || 
            lowerInput.includes("ok") || lowerInput.includes("good") || lowerInput.includes("fine")) {
          setCustomRules(selectedTemplate!.defaultRules);
          setConversationState("confirmation");
          addGMMessage(
            `Excellent! Let me summarize your game setup:\n\n` +
            `**Game Type:** ${selectedTemplate!.name}\n` +
            `**Total Players:** ${playerCount + 1} (you + ${playerCount} others)\n` +
            `**Rules:** Standard ${selectedTemplate!.name} rules\n\n` +
            `**Important:** Once we start, these rules are locked and cannot be changed. This ensures fair gameplay.\n\n` +
            `Ready to create your game? Say "create" to proceed, or "modify" if you want to adjust something.`
          );
        } else if (lowerInput.includes("modify") || lowerInput.includes("change") || lowerInput.includes("different")) {
          addGMMessage(
            "Of course! What would you like to modify? For example:\n" +
            "• Add or remove roles\n" +
            "• Change winning conditions\n" +
            "• Adjust game phases\n" +
            "• Add special abilities\n\n" +
            "Tell me what changes you have in mind!"
          );
        } else if (selectedTemplate?.id === "custom") {
          setCustomRules(prev => prev ? prev + "\n\n" + userInput : userInput);
          addGMMessage(
            "Great ideas! I'm noting that down. " +
            "Anything else you'd like to add to the rules? " +
            "Or shall I summarize what we have so far? (say 'summarize' or 'done')"
          );
        } else {
          setCustomRules(selectedTemplate!.defaultRules + "\n\nMODIFICATIONS:\n" + userInput);
          addGMMessage(
            "Got it! I've added your modifications to the rules. " +
            "Would you like to add anything else, or are we ready to finalize? " +
            "(say 'finalize' when ready)"
          );
        }
        
        if (lowerInput.includes("summarize") || lowerInput.includes("done") || lowerInput.includes("finalize")) {
          setConversationState("confirmation");
          const finalRules = customRules || selectedTemplate!.defaultRules;
          addGMMessage(
            `Perfect! Here's your complete game setup:\n\n` +
            `**Game Type:** ${selectedTemplate!.name}\n` +
            `**Total Players:** ${playerCount + 1} (you + ${playerCount} others)\n` +
            `**Rules:**\n${finalRules}\n\n` +
            `**⚠️ Important:** These rules are now locked and cannot be changed during gameplay.\n\n` +
            `Ready to begin? Say "create game" to start!`
          );
        }
      } else if (conversationState === "confirmation") {
        if (lowerInput.includes("create") || lowerInput.includes("start") || 
            lowerInput.includes("begin") || lowerInput.includes("yes")) {
          setShowHostSelector(true);
          addGMMessage(
            "Perfect! One last step - choose your guide for this adventure. Each has their own unique style that will shape your experience:"
          );
        } else if (lowerInput.includes("modify") || lowerInput.includes("change") || lowerInput.includes("back")) {
          setConversationState("rules-discussion");
          addGMMessage(
            "No problem! What would you like to modify?\n" +
            "• Change player count?\n" +
            "• Adjust rules?\n" +
            "• Switch game type?\n\n" +
            "Let me know what you'd like to change."
          );
        } else {
          addGMMessage(
            "I'm ready when you are! Say 'create game' to begin, or 'modify' if you want to make changes."
          );
        }
      }
    }, 800 + Math.random() * 400);
  };

  const handleSend = (messageOverride?: string) => {
    const message = messageOverride || input.trim();
    if (message && !isGMTyping) {
      addUserMessage(message);
      simulateGMResponse(message);
      setInput("");
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!isGMTyping) {
      setInput(reply);
      setTimeout(() => {
        addUserMessage(reply);
        simulateGMResponse(reply);
        setInput("");
      }, 300);
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      toast.error("Voice input is not supported in your browser");
      return;
    }

    setIsRecording(true);
    setVoiceTranscript("");
    setVoiceError("");

    setTimeout(() => {
      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setVoiceError("Unable to start voice input. Please check your microphone permissions.");
      }
    }, 100);
  };

  const handleVoiceCancel = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
    setIsRecording(false);
    setVoiceTranscript("");
    setVoiceError("");
  };

  const handleVoiceConfirm = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
    if (voiceTranscript.trim()) {
      setInput(voiceTranscript.trim());
    }
    setIsRecording(false);
    setVoiceTranscript("");
    setVoiceError("");
  };

  return (
    <div className="flex-1 flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 h-full overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      {/* Voice Recording Overlay */}
      {isRecording && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="mb-16 max-w-2xl px-8">
            {voiceError ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-red-600 mb-3">
                    Microphone Access Blocked
                  </h2>
                  <p className="text-base text-zinc-700 mb-6">
                    Your browser has blocked microphone access. To use voice input, you need to allow microphone permissions.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleVoiceCancel}
                    variant="outline"
                    className="bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setVoiceError("");
                      setVoiceTranscript("");
                      setTimeout(() => {
                        if (recognition) {
                          try {
                            recognition.start();
                          } catch (err) {
                            setVoiceError("Still unable to access microphone. Please check your browser settings and reload the page.");
                          }
                        }
                      }, 100);
                    }}
                    className="bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <h2 className="text-2xl font-normal text-zinc-900 text-center">
                {voiceTranscript ? voiceTranscript : "Ready when you are."}
              </h2>
            )}
          </div>
          
          {!voiceError && (
            <div className="relative w-full max-w-3xl mb-24">
              <div className="h-14 bg-white border border-zinc-200 rounded-full shadow-2xl flex items-center justify-between px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-white to-zinc-50" />
                <button className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors relative z-10">
                  <Mic className="h-5 w-5 text-zinc-600" />
                </button>
                <div className="flex-1 flex items-center justify-center gap-1 px-8 relative z-10">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-zinc-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 32 + 8}px`,
                        animationDelay: `${i * 50}ms`,
                        animationDuration: `${800 + Math.random() * 400}ms`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={handleVoiceCancel}
                    className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5 text-zinc-600" />
                  </button>
                  <button
                    onClick={handleVoiceConfirm}
                    className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
                  >
                    <Check className="h-5 w-5 text-zinc-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!voiceError && (
            <p className="text-sm text-zinc-500">
              Speak now • Press <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-xs">✓</kbd> to confirm or <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-xs">✕</kbd> to cancel
            </p>
          )}
        </div>
      )}
      
      {/* Session History Sidebar */}
      <div className="w-60 border-r border-white/5 bg-black/60 backdrop-blur-xl flex flex-col relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent" />
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 relative">
          <Button
            onClick={createNewSession}
            className="w-full bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:via-indigo-500 hover:to-violet-600 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-300"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Session List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2 relative">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-xl transition-all duration-300 ${
                  currentSessionId === session.id
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => loadSession(session.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                    {session.title}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(session.updatedAt).toLocaleDateString()} • {session.messages.length} messages
                  </div>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
          <div className="h-24 px-10 flex items-center justify-between relative">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 to-orange-600/40 blur-xl rounded-full" />
                <Avatar className="h-16 w-16 border-2 border-white/10 shadow-2xl shadow-amber-500/20 relative">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white">
                    <Sparkles className="h-8 w-8 animate-pulse" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight mb-1">Game Master</h1>
                <p className="text-sm text-zinc-500 font-medium">Choose a game below or describe your own</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedTemplate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <Eye className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-5xl mx-auto py-20 px-10 space-y-12">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-6 ${message.role === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative flex-shrink-0">
                  {message.role === "gm" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-2xl rounded-full" />
                  )}
                  {message.role === "user" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-indigo-600/30 blur-2xl rounded-full" />
                  )}
                  <Avatar
                    className={`h-14 w-14 border-2 shadow-2xl relative ${
                      message.role === "gm"
                        ? "border-amber-500/20 shadow-amber-500/20"
                        : "border-violet-500/20 shadow-violet-500/20"
                    }`}
                  >
                    <AvatarFallback
                      className={`text-white font-semibold ${
                        message.role === "gm"
                          ? "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600"
                          : "bg-gradient-to-br from-violet-500 via-indigo-500 to-violet-600"
                      }`}
                    >
                      {message.role === "gm" ? (
                        <Sparkles className="h-6 w-6" />
                      ) : (
                        <span className="text-sm">YOU</span>
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-3xl px-8 py-7 shadow-2xl backdrop-blur-xl relative overflow-hidden ${
                        message.role === "gm"
                          ? "bg-gradient-to-br from-zinc-900/90 via-zinc-800/80 to-zinc-900/90 border border-white/10 text-zinc-100"
                          : "bg-gradient-to-br from-violet-600/90 via-indigo-600/90 to-violet-600/90 border border-white/10 text-white"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                      
                      <div className="text-base leading-relaxed relative z-10 font-normal">
                        {message.role === "gm" ? formatMessage(message.content) : message.content}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600 font-medium mt-3 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isGMTyping && (
              <div className="flex gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-2xl rounded-full" />
                  <Avatar className="h-12 w-12 border-2 border-amber-500/20 shadow-2xl shadow-amber-500/20 relative">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white">
                      <Sparkles className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/80 to-zinc-900/90 backdrop-blur-xl rounded-3xl px-7 py-6 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                  <div className="flex gap-2.5 relative z-10">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce shadow-lg shadow-amber-500/50" style={{ animationDelay: "0ms" }} />
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce shadow-lg shadow-amber-500/50" style={{ animationDelay: "150ms" }} />
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce shadow-lg shadow-amber-500/50" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Host Selector */}
            {conversationState === "confirmation" && showHostSelector && (
              <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <HostSelector
                  selectedHostId={selectedHostId}
                  onSelectHost={setSelectedHostId}
                />
                
                <div className="mt-10 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowHostSelector(false);
                      setSelectedHostId(getDefaultHost().id);
                    }}
                    className="bg-zinc-900/80 backdrop-blur-xl border-white/20 hover:bg-zinc-800/80 hover:border-white/30 text-white transition-all duration-300 px-8 text-base h-12"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      setConversationState("completed");
                      const host = HOST_PERSONALITIES.find(h => h.id === selectedHostId);
                      addGMMessage(
                        `🎉 Fantastic! ${host?.name} will be your guide.\n\n` +
                        `Your game is being created now. See you in the game room!`
                      );
                      
                      setTimeout(() => {
                        onCreateGame({
                          name: gameName || selectedTemplate!.name,
                          template: selectedTemplate!.id,
                          playerCount: playerCount,
                          rules: customRules || selectedTemplate!.defaultRules,
                          customRoles: selectedTemplate!.roles,
                          hostId: selectedHostId
                        });
                        
                        setTimeout(() => {
                          onBack();
                        }, 1500);
                      }, 1000);
                    }}
                    className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:via-indigo-500 hover:to-violet-600 text-white shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 transition-all duration-300 px-10 text-base h-12 font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Create Game
                  </Button>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        {conversationState !== "completed" && !showHostSelector && (
          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-orange-500/5" />
            
            <div className="max-w-5xl mx-auto relative space-y-5">
              {conversationState === "greeting" && messages.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <button
                    onClick={() => handleQuickReply("Create a mystery game in a haunted mansion")}
                    disabled={isGMTyping}
                    className="group relative px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/50 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors relative z-10">
                      💬 "Create a mystery game"
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleQuickReply("I want to play Werewolf")}
                    disabled={isGMTyping}
                    className="group relative px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/50 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors relative z-10">
                      🐺 "Setup Werewolf"
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleQuickReply("Design a space adventure game")}
                    disabled={isGMTyping}
                    className="group relative px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/50 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors relative z-10">
                      🚀 "Space adventure"
                    </span>
                  </button>
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your message... or use voice 🎤"
                    className="bg-white/5 backdrop-blur-xl border border-white/10 focus:border-violet-500/50 text-white placeholder:text-zinc-600 text-base h-16 rounded-2xl px-7 font-normal transition-all duration-300 relative shadow-lg focus:shadow-2xl focus:shadow-violet-500/10"
                    disabled={isGMTyping}
                  />
                </div>
                <Button
                  onClick={handleVoiceInput}
                  disabled={isGMTyping}
                  size="icon"
                  className={`h-16 w-16 rounded-2xl shadow-2xl flex-shrink-0 transition-all duration-300 disabled:opacity-50 disabled:shadow-none relative overflow-hidden group ${
                    isRecording
                      ? "bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/30 hover:shadow-red-500/50 animate-pulse"
                      : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/30 hover:shadow-indigo-500/50"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isRecording ? (
                    <MicOff className="h-5 w-5 relative z-10" />
                  ) : (
                    <Mic className="h-5 w-5 relative z-10" />
                  )}
                </Button>
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGMTyping}
                  size="icon"
                  className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:via-indigo-500 hover:to-violet-600 h-16 w-16 rounded-2xl shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 flex-shrink-0 transition-all duration-300 disabled:opacity-50 disabled:shadow-none relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Send className="h-5 w-5 relative z-10" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {selectedTemplate && showPreview && (
        <div className="w-80 border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col relative z-10">
          <div className="absolute inset-0 bg-gradient-to-l from-violet-500/5 via-transparent to-transparent" />
          
          <div className="p-6 border-b border-white/10 relative">
            <h2 className="text-xl font-bold text-white mb-2">Game Preview</h2>
            <p className="text-sm text-zinc-500">Building your game...</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 relative">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Game Type</div>
                    <div className="text-base font-bold text-white">{selectedTemplate.name}</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">{selectedTemplate.description}</p>
              </div>

              {playerCount > 0 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Players</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {playerCount + 1}
                    </div>
                    <div className="text-sm text-zinc-400">total players</div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-2">You + {playerCount} AI characters</div>
                </div>
              )}

              {customRules && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Rules</div>
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {customRules}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-5">
                <div className="text-xs text-violet-300 uppercase tracking-wider font-semibold mb-3">Setup Progress</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={conversationState === "greeting" ? "text-white font-semibold" : "text-zinc-500"}>
                      1. Choose Game
                    </span>
                    {conversationState !== "greeting" && <span className="text-green-400">✓</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={conversationState === "player-count" ? "text-white font-semibold" : conversationState === "greeting" ? "text-zinc-600" : "text-zinc-500"}>
                      2. Set Players
                    </span>
                    {playerCount > 0 && conversationState !== "player-count" && conversationState !== "greeting" && <span className="text-green-400">✓</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={conversationState === "rules-discussion" ? "text-white font-semibold" : conversationState === "greeting" || conversationState === "player-count" ? "text-zinc-600" : "text-zinc-500"}>
                      3. Configure Rules
                    </span>
                    {customRules && conversationState !== "rules-discussion" && conversationState !== "player-count" && conversationState !== "greeting" && <span className="text-green-400">✓</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={conversationState === "confirmation" ? "text-white font-semibold" : conversationState === "completed" ? "text-zinc-500" : "text-zinc-600"}>
                      4. Confirm & Launch
                    </span>
                    {conversationState === "completed" && <span className="text-green-400">✓</span>}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}