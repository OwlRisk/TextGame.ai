"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, Send, Mic, MicOff, Eye, X, Check, MessageSquarePlus, Trash2, MoreVertical, Play, Plus } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import type { DiscoverPreset } from "@/app/components/discover-page";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/app/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { HOST_PERSONALITIES, getDefaultHost, getDefaultHostForTemplate, getLastSelectedHostId, saveLastSelectedHostId, getHostById } from "@/app/config/host-config";
import { HostSelector } from "@/app/components/host-selector";
import { streamAIChatResponse, type ChatMessage as AIChatMessage } from "@/lib/openai";
import { useVoiceInput, useVoiceOutput } from "@/lib/voice";
import { VoiceWaveform } from "@/app/components/voice-waveform";

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
  generatedHost?: {
    name: string;
    personality: string;
    voiceStyle: string;
    systemPrompt: string;
    icon: string;
    color: string;
  }; // Dynamically generated host configuration
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
    defaultRules: `SETTING: A village is plagued by werewolves. By day you are neighbors; by night the wolves hunt. Find them before they devour the town.

OBJECTIVE: Villagers must eliminate all Werewolves by day vote. Werewolves must eliminate Villagers at night until they outnumber the town.

PHASES:
1. Night — Werewolves choose one victim; Seer may check one player; Doctor may protect one.
2. Day — Everyone discusses and votes to eliminate one player. Tied vote = no elimination.

ROLES:
- Villager: Innocent; no special power.
- Werewolf: Each night, with other wolves, choose one player to eliminate.
- Seer: Each night, learn one player's true role (Villager or Werewolf).
- Doctor: Each night, protect one player (including self once per game). They cannot be eliminated that night.

RULES:
- Host runs phases in order. Dead players cannot speak or vote.
- Once rules are set, they cannot be changed.

WINNING:
- Villagers win when all Werewolves are eliminated.
- Werewolves win when they equal or outnumber the living Villagers.`,
    roles: ["Villager", "Werewolf", "Seer", "Doctor"]
  },
  {
    id: "undercover",
    name: "Undercover (Who's the Spy)",
    description: "Find the undercover agent who has a different word while blending in with the group.",
    minPlayers: 4,
    maxPlayers: 10,
    defaultRules: `SETTING: Everyone shares a secret word—except one Undercover with a different word, and optionally Mr. White with no word. Describe your word without saying it; find the spy or blend in to survive.

OBJECTIVE: Civilians must find and vote out the Undercover. Undercover must blend in and survive to the final round.

SETUP:
- Most players receive the same word (Civilians).
- One player receives a similar but different word (Undercover).
- Optionally, one player receives no word (Mr. White).

GAMEPLAY:
1. In turn, each player describes their word in one sentence (no saying the word).
2. After all speak, everyone votes to eliminate one player. Highest votes eliminated; reveal role.
3. Repeat until Undercover is eliminated (Civilians win) or only a few remain (Undercover wins).

RULES:
- Host assigns words and runs rounds. Descriptions must be one sentence only.

WINNING:
- Civilians win if the Undercover is eliminated.
- Undercover wins if still alive when 3 or fewer players remain.
- Mr. White (if in game) wins by correctly guessing the civilian word when eliminated.`,
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
  initialPreset?: DiscoverPreset | null;
  onPresetApplied?: () => void;
}

// Helper function to generate session title
function generateSessionTitle(template: GameTemplate | null, playerCount: number, gameName?: string): string {
  const trimmedName = gameName?.trim();
  const countStr = playerCount === 0 ? "GM decides" : `${playerCount + 1} Players`;
  if (trimmedName) return `${trimmedName} - ${countStr}`;
  if (!template) return "New Game Setup";
  if (template.id === "custom") return "Custom Game Setup";
  return `${template.name} - ${countStr}`;
}

export function GameMasterChat({ onBack, onCreateGame, initialPreset, onPresetApplied }: GameMasterChatProps) {
  // Session management
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);
  
  // Current conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>("greeting");
  const [isGMTyping, setIsGMTyping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false); // Track if currently streaming
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const MIN_INPUT_H = 48;
  const MAX_INPUT_H = 160;
  
  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    
    // Store current scroll position
    const scrollTop = el.scrollTop;
    
    // Temporarily hide overflow to get accurate scrollHeight
    el.style.overflow = 'hidden';
    
    // Reset height to auto to shrink if needed
    el.style.height = 'auto';
    
    // Get the scroll height (includes padding but not border)
    const scrollH = el.scrollHeight;
    
    // Calculate new height with constraints
    const newH = Math.min(Math.max(scrollH, MIN_INPUT_H), MAX_INPUT_H);
    
    // Set the new height
    el.style.height = `${newH}px`;
    
    // Show overflow only if content exceeds max height
    el.style.overflow = scrollH > MAX_INPUT_H ? 'auto' : 'hidden';
    
    // Restore scroll position if needed
    if (scrollTop > 0) {
      el.scrollTop = scrollTop;
    }
  }, []);
  // Game configuration being built
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [customRules, setCustomRules] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");
  const [gameStory, setGameStory] = useState<string>(""); // Optional narrative/story prepended to rules
  const [configuredPlayers, setConfiguredPlayers] = useState<Array<{
    name: string;
    gender?: string;
    personality?: string;
    background?: string;
  }>>([]);

  // Host personality - try last selected, then default
  const [selectedHostId, setSelectedHostId] = useState<string>(() => {
    const lastHostId = getLastSelectedHostId();
    if (lastHostId) return lastHostId;
    return getDefaultHost().id;
  });

  const getCombinedRules = useCallback((rulesOverride?: string): string => {
    const baseRules = (rulesOverride ?? customRules) || selectedTemplate?.defaultRules || "";
    const story = gameStory.trim();
    if (!story) return baseRules;
    if (!baseRules) return `STORY:\n${story}`;
    const strippedRules = baseRules.replace(/^(STORY|BACKGROUND|WORLD|SETTING|故事|背景|世界观)[\s\S]*?\n\n/i, "");
    return `STORY:\n${story}\n\n${strippedRules}`;
  }, [customRules, selectedTemplate, gameStory]);

  const gameDocValue = useMemo(() => getCombinedRules(), [getCombinedRules]);

  /** Quick reply chips shown when GM has sent the first message but no A)/B) options were parsed */
  const DEFAULT_FIRST_CHAT_CHIPS: { label: string; value: string; fullLabel?: string }[] = [
    { label: "Werewolf", value: "I want to play Werewolf." },
    { label: "Undercover", value: "I want to play Undercover." },
    { label: "Custom game", value: "I'd like a fully custom social deduction game." },
    { label: "What can I do?", value: "What can I do?" },
  ];

  // Voice output (TTS): GM reads replies aloud. Init false to avoid hydration mismatch;
  // sync from localStorage after mount.
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const voiceOutputEnabledRef = useRef(voiceOutputEnabled);
  voiceOutputEnabledRef.current = voiceOutputEnabled;
  const { speak: speakTTS, speakQueued, stop: stopTTS, supported: ttsSupported } = useVoiceOutput();

  /** Strip markdown from quick-reply labels so "**Mini Werewolf**" shows as "Mini Werewolf" */
  const stripChipLabel = (raw: string): string =>
    (raw || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  const MAX_CHIP_LABEL = 52;

  /** Parse last GM message for option prompts (e.g. "A)", "B)" or "1.", "2.") to show as clickable chips; fallback to default first-chat chips when none parsed. */
  const suggestionChips = useMemo(() => {
    const lastGM = [...messages].reverse().find((m) => m.role === "gm" && m.content?.trim());
    if (!lastGM?.content) return [];
    const text = lastGM.content.trim();
    const chips: { label: string; value: string; fullLabel?: string }[] = [];
    const seen = new Set<string>();
    const trimLabel = (rest: string) =>
      rest.length > MAX_CHIP_LABEL ? rest.slice(0, MAX_CHIP_LABEL).trim() + "…" : rest;
    // A) / B) / A. / B. or Option A: style
    const letterOption = /^\s*([A-Z])[).]\s*(.+)$/gm;
    let m;
    while ((m = letterOption.exec(text)) !== null) {
      const key = m[1].toUpperCase();
      const rest = stripChipLabel(m[2] || "");
      if (seen.has(key)) continue;
      seen.add(key);
      chips.push({ label: trimLabel(rest) || key, value: key, fullLabel: rest.length > MAX_CHIP_LABEL ? rest : undefined });
    }
    // Option A: / Option B:
    if (chips.length === 0) {
      const optionLabel = /^\s*Option\s+([A-Z]):\s*(.+)$/gim;
      while ((m = optionLabel.exec(text)) !== null) {
        const key = m[1].toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const rest = stripChipLabel(m[2] || "");
        chips.push({ label: trimLabel(rest) || key, value: key, fullLabel: rest.length > MAX_CHIP_LABEL ? rest : undefined });
      }
    }
    // 1. / 2. numbered style
    if (chips.length === 0) {
      const numbered = /^\s*(\d+)[).]\s*(.+)$/gm;
      while ((m = numbered.exec(text)) !== null) {
        const num = m[1];
        const rest = stripChipLabel(m[2] || "");
        if (seen.has(num)) continue;
        seen.add(num);
        chips.push({ label: trimLabel(rest) || num, value: num, fullLabel: rest.length > MAX_CHIP_LABEL ? rest : undefined });
      }
    }
    if (chips.length >= 2 && chips.length <= 8) return chips;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "gm") return DEFAULT_FIRST_CHAT_CHIPS;
    return [];
  }, [messages]);

  /** LLM-generated quick replies; when set, they replace parsed/default chips */
  const [llmQuickReplies, setLlmQuickReplies] = useState<string[]>([]);
  const lastGMContentForSuggestionsRef = useRef<string>("");
  const isStreamingRef = useRef(false);
  const isGMTypingRef = useRef(false);
  isStreamingRef.current = isStreaming;
  isGMTypingRef.current = isGMTyping;

  useEffect(() => {
    if (isGMTypingRef.current || isStreamingRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "gm" || !lastMsg.content?.trim()) {
      setLlmQuickReplies([]);
      lastGMContentForSuggestionsRef.current = "";
      return;
    }
    const content = lastMsg.content.trim().slice(0, 500);
    if (content === lastGMContentForSuggestionsRef.current) return;
    lastGMContentForSuggestionsRef.current = content;

    setLlmQuickReplies([]);
    const lang = /[\u4e00-\u9fff]/.test(content) ? "zh" : "en";
    fetch("/api/suggest-gm-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        language: lang,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed"))))
      .then((data: { suggestions?: string[] }) => {
        if (Array.isArray(data.suggestions)) {
          setLlmQuickReplies(data.suggestions.slice(0, 8));
        }
      })
      .catch(() => {});
  }, [messages]);

  /** Chips to show: 完全由 AI 决定是否出现、出现几条、内容；仅使用 LLM 返回的 suggestions，无解析/默认回退。 */
  const displayChips = useMemo(() => {
    return llmQuickReplies.map((text) => {
      const clean = stripChipLabel(text);
      return {
        label: clean.length > 52 ? clean.slice(0, 52).trim() + "…" : clean,
        value: clean,
        fullLabel: clean.length > 52 ? clean : undefined,
      };
    });
  }, [llmQuickReplies]);

  // Only render client-only UI after mount to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Voice input (STT)
  const voice = useVoiceInput();
  const { isRecording, isTranscribing, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

  // Resize on mount and input change
  useEffect(() => {
    if (inputRef.current) {
      resizeInput();
    }
  }, [resizeInput]);

  useEffect(() => {
    if (input || isRecording) {
      resizeInput();
    }
  }, [input, isRecording, voiceTranscript, resizeInput]);

  // Preview panel
  const [showPreview, setShowPreview] = useState(true);
  // Background merged into Rules - no separate tab needed
  const [isRulesBeingEdited, setIsRulesBeingEdited] = useState<boolean>(false); // Track if rules are being edited in real-time
  const [isStartingGame, setIsStartingGame] = useState(false);
  const rulesPanelRef = useRef<HTMLDivElement>(null); // Scroll into view when GM edits rules

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
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, // Regenerate unique IDs
          timestamp: new Date(m.timestamp)
        })),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
      
      // Auto-cleanup: Keep only the most recent 30 sessions
      const MAX_SESSIONS = 30;
      const sortedSessions = sessionsWithDates.sort((a: GameSession, b: GameSession) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const sessionsToKeep = sortedSessions.slice(0, MAX_SESSIONS);
      
      if (sessionsToKeep.length < sessionsWithDates.length) {
        localStorage.setItem("gameMasterSessions", JSON.stringify(sessionsToKeep));
      }
      
      setSessions(sessionsToKeep);
      
      // Load the most recent session
      if (sessionsToKeep.length > 0) {
        loadSession(sessionsToKeep[0].id, sessionsToKeep);
      } else {
        // Create first session
        createNewSession();
      }
    } else {
      // Create first session
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const sessionTitle = generateSessionTitle(selectedTemplate, playerCount, gameName);
    
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
    // Use timestamp + random to ensure unique ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newSession: GameSession = {
      id: newSessionId,
      title: "New Game Setup",
      messages: [],
      conversationState: "greeting",
      selectedTemplate: null,
      playerCount: 0,
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
      // Remove any existing session with the same ID (shouldn't happen, but just in case)
      const filtered = prev.filter(s => s.id !== newSessionId);
      const updated = [newSession, ...filtered];
      localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      return updated;
    });
  };

  const createSessionFromPreset = useCallback((preset: DiscoverPreset) => {
    const resolvedTemplate = GAME_TEMPLATES.find(t => t.id === (preset.templateId || "custom")) || null;
    const nextPlayerCount = preset.playerCount ?? 0;
    // Use preset rules if available, otherwise fall back to template default rules
    const nextRules = preset.rules?.trim() || resolvedTemplate?.defaultRules || "";
    const nextGameName = preset.name?.trim() || "";
    const recommendedHost = getDefaultHostForTemplate(resolvedTemplate?.id || null);

    // Use timestamp + random to ensure unique ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newSession: GameSession = {
      id: newSessionId,
      title: generateSessionTitle(resolvedTemplate, nextPlayerCount, nextGameName),
      messages: [],
      conversationState: "greeting",
      selectedTemplate: resolvedTemplate,
      playerCount: nextPlayerCount,
      customRules: nextRules,
      gameName: nextGameName,
      selectedHostId: recommendedHost.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCurrentSessionId(newSessionId);
    setMessages([]);
    setConversationState("greeting");
    setIsGMTyping(true);
    setSelectedTemplate(resolvedTemplate);
    setPlayerCount(nextPlayerCount);
    setCustomRules(nextRules);
    setGameName(nextGameName);
    setSelectedHostId(recommendedHost.id);

    setSessions(prev => {
      // Remove any existing session with the same ID (shouldn't happen, but just in case)
      const filtered = prev.filter(s => s.id !== newSessionId);
      const updated = [newSession, ...filtered];
      localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Track the last applied preset to avoid duplicate applications
  const lastAppliedPresetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialPreset) {
      lastAppliedPresetRef.current = null;
      return;
    }
    
    // Create a unique key for this preset based on id, name, and rules hash
    const rulesHash = initialPreset.rules?.substring(0, 100) || '';
    const presetKey = `${initialPreset.id}-${initialPreset.name}-${rulesHash}`;
    
    // Only apply if this is a different preset
    if (lastAppliedPresetRef.current !== presetKey) {
      // Force update by clearing first, then applying
      setCustomRules("");
      setSelectedTemplate(null);
      
      // Use requestAnimationFrame to ensure state is cleared before applying new preset
      requestAnimationFrame(() => {
        createSessionFromPreset(initialPreset);
        lastAppliedPresetRef.current = presetKey;
        
        if (onPresetApplied) {
          // Use setTimeout to ensure state updates are complete
          setTimeout(() => {
            onPresetApplied();
          }, 100);
        }
      });
    }
  }, [initialPreset, createSessionFromPreset, onPresetApplied]);

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

  // Ref to avoid requesting welcome twice for the same session
  const welcomeRequestedForSessionRef = useRef<string | null>(null);

  // Stream initial greeting from LLM when messages are empty
  const streamWelcomeMessage = useCallback(() => {
    if (!currentSessionId || welcomeRequestedForSessionRef.current === currentSessionId) return;
    welcomeRequestedForSessionRef.current = currentSessionId;

    const WELCOME_TRIGGER =
      "The user just opened this chat. Reply with a brief, friendly welcome as the Game Master. " +
      "Mention that you help design games and that the rules panel on the right updates in real time as you discuss. " +
      "Keep it to one short paragraph. Do not output any editing tags (no EDIT_RULES, etc.).";

    setIsGMTyping(true);
    setIsStreaming(true);
    const tempMessageId = `msg-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      role: "gm",
      content: "",
      timestamp: new Date()
    };
    let fullResponse = "";
    let tempMessageAdded = false;

    const cleanForDisplay = (text: string): string => {
      return text
        .replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '')
        .replace(/<ADD_TO_RULES[^>]*>[\s\S]*?<\/ADD_TO_RULES>/gi, '')
        .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*?<\/REPLACE_IN_RULES>/gi, '')
        .replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '')
        .replace(/<SET_PLAYER_COUNT>\d+<\/SET_PLAYER_COUNT>/gi, '')
        .replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '')
        .replace(/<EDIT_RULES>[\s\S]*$/i, '')
        .trim();
    };

    streamAIChatResponse(
      {
        messages: [{ role: "user", content: WELCOME_TRIGGER, timestamp: new Date() }],
        gameContext: {
          template: selectedTemplate?.id,
          playerCount: playerCount,
          gameName: gameName || undefined,
          rules: customRules || selectedTemplate?.defaultRules || undefined,
          conversationState: "greeting"
        },
        maxCompletionTokens: 500
      },
      (chunk: string) => {
        fullResponse += chunk;
        const displayContent = cleanForDisplay(fullResponse);
        setMessages(prev => {
          const hasTemp = prev.some(m => m.id === tempMessageId);
          if (!hasTemp && displayContent.trim()) {
            tempMessageAdded = true;
            return [...prev, { ...tempMessage, content: displayContent }];
          }
          if (hasTemp) {
            return prev.map(msg =>
              msg.id === tempMessageId ? { ...msg, content: displayContent } : msg
            );
          }
          return prev;
        });
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      },
      () => {
        setIsGMTyping(false);
        setIsStreaming(false);
        const cleaned = cleanForDisplay(fullResponse);
        setMessages(prev => {
          if (!cleaned.trim()) return prev.filter(m => m.id !== tempMessageId);
          return prev.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, content: cleaned }
              : msg
          );
        });
      },
      (error: Error) => {
        welcomeRequestedForSessionRef.current = null;
        setIsGMTyping(false);
        setIsStreaming(false);
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempMessageId);
          const isConfigError = error.message?.includes("OPENAI_API_KEY") || error.message?.includes("API key");
          const fallbackContent = isConfigError
            ? "⚠️ **Configuration Error**\n\nThe OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file and restart."
            : "👋 Welcome! I'm your Game Master. I'll help you design and create any game you can imagine. " +
              "Choose a quick option below or describe your game idea—the rules panel on the right updates in real time as we discuss.";
          const fallbackMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            role: "gm",
            content: fallbackContent,
            timestamp: new Date()
          };
          return [...withoutTemp, fallbackMessage];
        });
        if (error.message?.includes("OPENAI_API_KEY") || error.message?.includes("API key")) {
          toast.error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.");
        } else {
          toast.error(error.message || "Failed to load welcome.");
        }
      }
    );
  }, [
    currentSessionId,
    selectedTemplate,
    playerCount,
    gameName,
    customRules
  ]);

  useEffect(() => {
    if (messages.length === 0 && currentSessionId) {
      const t = setTimeout(streamWelcomeMessage, 400);
      return () => clearTimeout(t);
    }
  }, [currentSessionId, messages.length, streamWelcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const addGMMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "gm",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsGMTyping(false);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "user",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Helper function to extract and update game rules from AI response (like a code editor agent)
  const extractAndUpdateRules = (response: string): string => {
    let cleanedResponse = response;
    
    // 1. Handle EDIT_RULES - Complete replacement (highest priority)
    // Use a more robust regex that captures all content between tags, including newlines
    const editRulesMatch = response.match(/<EDIT_RULES>([\s\S]*?)<\/EDIT_RULES>/i);
    if (editRulesMatch && editRulesMatch[1]) {
      const newRules = editRulesMatch[1].trim();
      if (newRules) {
        // Always update with the complete rules from the tag
        setCustomRules(newRules);
        // Remove the tag from the response (use global flag to remove all instances)
        cleanedResponse = cleanedResponse.replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '').trim();
        return cleanedResponse; // EDIT_RULES replaces everything, so return early
      }
    }
    
    // Also check for incomplete EDIT_RULES tags (in case closing tag is missing)
    // This can happen if streaming was interrupted
    const incompleteEditMatch = response.match(/<EDIT_RULES>([\s\S]+)$/i);
    if (incompleteEditMatch && incompleteEditMatch[1]) {
      const partialRules = incompleteEditMatch[1].trim();
      if (partialRules.length > 50) {
        // If we have substantial content even without closing tag, use it
        setCustomRules(partialRules);
        cleanedResponse = cleanedResponse.replace(/<EDIT_RULES>[\s\S]*$/i, '').trim();
      }
    }
    
    // 2. Handle ADD_TO_RULES - Add content to a specific section
    const addToRulesMatches = Array.from(response.matchAll(/<ADD_TO_RULES\s+section="([^"]+)"[^>]*>([\s\S]*?)<\/ADD_TO_RULES>/gi));
    if (addToRulesMatches.length > 0) {
      setCustomRules(prevRules => {
        let updatedRules = prevRules || selectedTemplate?.defaultRules || "";
        for (const match of addToRulesMatches) {
          const section = match[1].trim();
          const contentToAdd = match[2].trim();
          if (contentToAdd) {
            updatedRules = addContentToSection(updatedRules, section, contentToAdd);
          }
        }
        return updatedRules;
      });
      // Remove all ADD_TO_RULES tags from response
      for (const match of addToRulesMatches) {
        cleanedResponse = cleanedResponse.replace(match[0], '').trim();
      }
    }
    
    // 3. Handle REPLACE_IN_RULES - Replace specific content in a section
    const replaceMatches = Array.from(response.matchAll(/<REPLACE_IN_RULES\s+section="([^"]+)"\s+old="([^"]+)"\s+new="([^"]+)"[^>]*>\s*<\/REPLACE_IN_RULES>/gi));
    if (replaceMatches.length > 0) {
      setCustomRules(prevRules => {
        let updatedRules = prevRules || selectedTemplate?.defaultRules || "";
        for (const match of replaceMatches) {
          const section = match[1].trim();
          const oldContent = match[2].trim();
          const newContent = match[3].trim();
          if (oldContent && newContent) {
            updatedRules = replaceContentInSection(updatedRules, section, oldContent, newContent);
          }
        }
        return updatedRules;
      });
      // Remove all REPLACE_IN_RULES tags from response
      for (const match of replaceMatches) {
        cleanedResponse = cleanedResponse.replace(match[0], '').trim();
      }
    }
    
    // Also handle old UPDATE_RULES format for backward compatibility
    const updateRulesMatch = response.match(/<UPDATE_RULES>([\s\S]*?)<\/UPDATE_RULES>/i);
    if (updateRulesMatch && updateRulesMatch[1] && !editRulesMatch) {
      const extractedRules = updateRulesMatch[1].trim();
      if (extractedRules) {
        setCustomRules(extractedRules);
        cleanedResponse = cleanedResponse.replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '').trim();
      }
    }

    // 4. Handle SET_PLAYER_COUNT - GM decides number of AI players
    const setPlayerCountMatch = response.match(/<SET_PLAYER_COUNT>(\d+)<\/SET_PLAYER_COUNT>/i);
    if (setPlayerCountMatch && setPlayerCountMatch[1]) {
      const n = parseInt(setPlayerCountMatch[1], 10);
      if (!Number.isNaN(n)) {
        const min = selectedTemplate ? selectedTemplate.minPlayers - 1 : 1;
        const max = selectedTemplate ? selectedTemplate.maxPlayers - 1 : 19;
        const clamped = Math.min(max, Math.max(min, n));
        setPlayerCount(clamped);
      }
      cleanedResponse = cleanedResponse.replace(/<SET_PLAYER_COUNT>\d+<\/SET_PLAYER_COUNT>/gi, '').trim();
    }

    // 5. Handle UPDATE_GENERAL - GM adds background to Rules (prepend to rules)
    const updateGeneralMatch = response.match(/<UPDATE_GENERAL>([\s\S]*?)<\/UPDATE_GENERAL>/i);
    if (updateGeneralMatch && updateGeneralMatch[1]) {
      const background = updateGeneralMatch[1].trim();
      if (background) {
        setCustomRules((prevRules) => {
          const existing = prevRules || selectedTemplate?.defaultRules || "";
          // If rules already start with background-like content, replace it; otherwise prepend
          const hasBackground = existing.match(/^(背景|BACKGROUND|故事|STORY|世界观|WORLD)[\s\S]{0,200}/i);
          if (hasBackground) {
            return background + "\n\n" + existing.replace(/^(背景|BACKGROUND|故事|STORY|世界观|WORLD)[\s\S]{0,200}\n\n/i, '');
          }
          return background + (existing ? "\n\n" + existing : "");
        });
      }
      cleanedResponse = cleanedResponse.replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '').trim();
    }

    return cleanedResponse;
  };

  const extractAndApplyPlayerConfig = (response: string): void => {
    const configMatch = response.match(/<CONFIG_PLAYERS>([\s\S]*?)<\/CONFIG_PLAYERS>/i);
    if (!configMatch || !configMatch[1]) return;
    try {
      const raw = configMatch[1].trim();
      const arr = JSON.parse(raw) as Array<{ name: string; gender?: string; personality?: string; background?: string }>;
      if (Array.isArray(arr) && arr.length > 0) {
        const valid = arr.filter((p): p is { name: string; gender?: string; personality?: string; background?: string } =>
          p && typeof p === 'object' && typeof p.name === 'string'
        );
        if (valid.length > 0) setConfiguredPlayers(valid);
      }
    } catch {
      /* ignore parse errors */
    }
  };

  // Helper function to add content to a specific section
  // Now more flexible - can handle natural language sections
  const addContentToSection = (rules: string, section: string, content: string): string => {
    if (!rules) {
      // If no rules exist, just add the content
      return content;
    }
    
    // Try to find the section using flexible matching
    // First try exact section name match (uppercase, with colon)
    const exactSectionRegex = new RegExp(`(${section}[\\s:]*)([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
    let match = rules.match(exactSectionRegex);
    
    if (match) {
      // Section exists, append to it
      const sectionHeader = match[1];
      const sectionContent = match[2].trim();
      const newSectionContent = sectionContent 
        ? `${sectionContent}\n${content}`
        : content;
      return rules.replace(exactSectionRegex, `$1${newSectionContent}`);
    }
    
    // If no exact match, try to find similar section names or just append at the end
    // For natural language rules, just append the new content
    // This is more flexible for LLM-readable rules
    return `${rules}\n\n${content}`;
  };

  // Helper function to replace content in a specific section
  // Now more flexible - can handle natural language rules
  const replaceContentInSection = (rules: string, section: string, oldContent: string, newContent: string): string => {
    if (!rules) return rules;
    
    // Escape special regex characters in oldContent
    const escapedOld = oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // First try to find and replace within a specific section
    const sectionRegex = new RegExp(`(${section}[\\s:]*)([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
    const match = rules.match(sectionRegex);
    
    if (match) {
      const sectionHeader = match[1];
      let sectionContent = match[2];
      
      // Replace the old content with new content within the section
      if (sectionContent.includes(oldContent)) {
        sectionContent = sectionContent.replace(new RegExp(escapedOld, 'g'), newContent);
        return rules.replace(sectionRegex, `$1${sectionContent}`);
      }
    }
    
    // If section not found or content not in section, try global replace
    // This is more flexible for natural language rules where structure is less rigid
    if (rules.includes(oldContent)) {
      return rules.replace(new RegExp(escapedOld, 'g'), newContent);
    }
    
    return rules;
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
    const tempMessageId = `msg-temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      role: "gm",
      content: "",
      timestamp: new Date()
    };
    
    // Don't add empty temp message - we'll add it only when first chunk arrives
    // This prevents showing empty bubble at the start

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
      let tempMessageAdded = false;
      let lastProcessedLength = 0; // Track what we've already processed
      let processedEditTags = new Set<string>(); // Track which edit tags we've already processed to avoid duplicates
      let lastRulesPanelUpdate = 0; // Throttle rules panel updates (ms)
      const RULES_UPDATE_THROTTLE_MS = 80; // Min interval between incremental rules updates
      await streamAIChatResponse(
        {
          messages: apiMessages,
          gameContext: gameContext,
          maxCompletionTokens: 2000
        },
          // onChunk: Update message content as chunks arrive - REAL-TIME EDITING like code agent
        (chunk: string) => {
          fullResponse += chunk;
          
          // Real-time rule editing - process incrementally as chunks arrive
          // This makes it feel like a code editor agent writing code in real-time
          try {
            const newContent = fullResponse.slice(lastProcessedLength);
            lastProcessedLength = fullResponse.length;
            
            // Real-time rule editing - like a code agent writing code
            let hasEditActivity = false;
            
            // 1. Check for EDIT_RULES - update rules panel incrementally as content streams (no "stuck" until end)
            const editRulesMatch = fullResponse.match(/<EDIT_RULES>([\s\S]*?)(<\/EDIT_RULES>|$)/i);
            if (editRulesMatch) {
              hasEditActivity = true;
              const rulesContent = editRulesMatch[1];
              const newRules = rulesContent.trim();
              const isComplete = editRulesMatch[2] === '</EDIT_RULES>';
              const now = Date.now();
              if (newRules && (isComplete || now - lastRulesPanelUpdate >= RULES_UPDATE_THROTTLE_MS)) {
                lastRulesPanelUpdate = now;
                setIsRulesBeingEdited(true);
                flushSync(() => setCustomRules(newRules));
                rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
              if (isComplete) {
                processedEditTags.add(`EDIT_RULES_done_${editRulesMatch.index || 0}`);
              }
            }

            // 1b. UPDATE_RULES (legacy) - also stream incrementally so rules don't "stick" until end
            const updateRulesMatch = fullResponse.match(/<UPDATE_RULES>([\s\S]*?)(<\/UPDATE_RULES>|$)/i);
            if (updateRulesMatch && !editRulesMatch) {
              hasEditActivity = true;
              const rulesContent = updateRulesMatch[1].trim();
              const now = Date.now();
              if (rulesContent && (updateRulesMatch[2] === '</UPDATE_RULES>' || now - lastRulesPanelUpdate >= RULES_UPDATE_THROTTLE_MS)) {
                lastRulesPanelUpdate = now;
                setIsRulesBeingEdited(true);
                flushSync(() => setCustomRules(rulesContent));
                rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }
            
            // 2. Check for ADD_TO_RULES - process as we receive content
            const addMatches = Array.from(fullResponse.matchAll(/<ADD_TO_RULES\s+section="([^"]+)"[^>]*>([\s\S]*?)(<\/ADD_TO_RULES>|$)/gi));
            for (const match of addMatches) {
              const section = match[1]?.trim();
              const content = match[2]?.trim();
              const tagKey = `ADD_${section}_${match.index}`;
              
              // Only apply if we have closing tag (to avoid partial additions)
              if (section && content && match[3] === '</ADD_TO_RULES>' && !processedEditTags.has(tagKey)) {
                hasEditActivity = true;
                processedEditTags.add(tagKey);
                flushSync(() => {
                  setIsRulesBeingEdited(true);
                  setCustomRules(prevRules => {
                    const currentRules = prevRules || selectedTemplate?.defaultRules || "";
                    if (!currentRules.includes(content)) {
                      return addContentToSection(currentRules, section, content);
                    }
                    return currentRules;
                  });
                });
                rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              } else if (section && content && content.length > 0) {
                // Show editing indicator even for partial content
                hasEditActivity = true;
                setIsRulesBeingEdited(true);
              }
            }
            
            // 3. Check for REPLACE_IN_RULES - process when complete
            const replaceMatches = Array.from(fullResponse.matchAll(/<REPLACE_IN_RULES\s+section="([^"]+)"\s+old="([^"]+)"\s+new="([^"]+)"[^>]*>\s*(<\/REPLACE_IN_RULES>|$)/gi));
            for (const match of replaceMatches) {
              const tagKey = `REPLACE_${match[1]}_${match.index}`;
              
              // Only process if we have the closing tag (REPLACE needs complete instruction)
              if (match[4] === '</REPLACE_IN_RULES>' && !processedEditTags.has(tagKey)) {
                hasEditActivity = true;
                processedEditTags.add(tagKey);
                const section = match[1]?.trim();
                const oldContent = match[2]?.trim();
                const newContent = match[3]?.trim();
                if (section && oldContent && newContent) {
                  flushSync(() => {
                    setIsRulesBeingEdited(true);
                    setCustomRules(prevRules => {
                      const currentRules = prevRules || selectedTemplate?.defaultRules || "";
                      return replaceContentInSection(currentRules, section, oldContent, newContent);
                    });
                  });
                  rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              } else if (match[1]) {
                // We're in the middle of a replace instruction
                hasEditActivity = true;
                setIsRulesBeingEdited(true);
              }
            }

            // 4. Handle SET_PLAYER_COUNT - GM decides number of AI players (real-time)
            const setPlayerCountMatches = Array.from(fullResponse.matchAll(/<SET_PLAYER_COUNT>(\d+)<\/SET_PLAYER_COUNT>/gi));
            for (const match of setPlayerCountMatches) {
              const tagKey = `SET_PLAYER_COUNT_${match.index}`;
              if (!processedEditTags.has(tagKey)) {
                processedEditTags.add(tagKey);
                const n = parseInt(match[1], 10);
                if (!Number.isNaN(n)) {
                  const min = selectedTemplate ? selectedTemplate.minPlayers - 1 : 1;
                  const max = selectedTemplate ? selectedTemplate.maxPlayers - 1 : 19;
                  const clamped = Math.min(max, Math.max(min, n));
                  setPlayerCount(clamped);
                }
              }
            }
            
            const hasAnyEditTag = /<(EDIT_RULES|UPDATE_RULES|ADD_TO_RULES|REPLACE_IN_RULES)/i.test(fullResponse);
            if (hasAnyEditTag) {
              setIsRulesBeingEdited(true);
            } else if (!hasEditActivity && fullResponse.length > 200) {
              // Only reset if we've received substantial content and no edit tags at all
              setIsRulesBeingEdited(false);
            }
          } catch (e) {
            // Ignore errors during streaming, will be handled in onComplete
            console.debug('Real-time editing error (non-critical):', e);
          }
          
          // Clean response for display (remove all editing tags) - keep conversation and editing separate
          const cleanForDisplay = (text: string): string => {
            // Remove all editing tags and their content
            let cleaned = text
              .replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '')
              .replace(/<ADD_TO_RULES[^>]*>[\s\S]*?<\/ADD_TO_RULES>/gi, '')
              .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*?<\/REPLACE_IN_RULES>/gi, '')
              .replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '')
              .replace(/<CONFIG_PLAYERS>[\s\S]*?<\/CONFIG_PLAYERS>/gi, '')
              .replace(/<SET_PLAYER_COUNT>\d+<\/SET_PLAYER_COUNT>/gi, '')
              .replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '')
              // Also remove incomplete tags
              .replace(/<EDIT_RULES>[\s\S]*$/i, '')
              .replace(/<ADD_TO_RULES[^>]*>[\s\S]*$/i, '')
              .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*$/i, '')
              .replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '')
              .replace(/<SET_PLAYER_COUNT>\d*$/i, '')
              .replace(/<UPDATE_GENERAL>[\s\S]*$/i, '')
              .trim();
            return cleaned;
          };
          
          const displayContent = cleanForDisplay(fullResponse);

          // Add temp message only when first chunk with content arrives
          setMessages(prev => {
            const hasTempMessage = prev.some(msg => msg.id === tempMessageId);
            let updated;
            // Only show message if there's content after removing editing tags
            if (!hasTempMessage && displayContent.trim()) {
              tempMessageAdded = true;
              updated = [...prev, { ...tempMessage, content: displayContent }];
            } else if (hasTempMessage) {
              // Update with cleaned content
              updated = prev.map(msg => 
                msg.id === tempMessageId 
                  ? { ...msg, content: displayContent }
                  : msg
              );
            } else {
              updated = prev;
            }
            // Rules are updated in real-time via extractAndUpdateRules in onChunk
            return updated;
          });
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
          
          // Final pass: Extract and update rules if present (handles any missed edits)
          // This ensures we always have the complete, final version of rules
          // Extract rules and player config
          const cleanedResponse = extractAndUpdateRules(fullResponse);
          extractAndApplyPlayerConfig(fullResponse);
          
          // Double-check: if we have EDIT_RULES in the final response, make sure it's applied
          const finalEditMatch = fullResponse.match(/<EDIT_RULES>([\s\S]*?)<\/EDIT_RULES>/i);
          if (finalEditMatch && finalEditMatch[1]) {
            const finalRules = finalEditMatch[1].trim();
            if (finalRules) {
              flushSync(() => setCustomRules(finalRules));
              rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }
          const finalGeneralMatch = fullResponse.match(/<UPDATE_GENERAL>([\s\S]*?)<\/UPDATE_GENERAL>/i);
          if (finalGeneralMatch && finalGeneralMatch[1]) {
            const background = finalGeneralMatch[1].trim();
            if (background) {
              flushSync(() => {
                setCustomRules((prevRules) => {
                  const existing = prevRules || selectedTemplate?.defaultRules || "";
                  const hasBackground = existing.match(/^(背景|BACKGROUND|故事|STORY|世界观|WORLD)[\s\S]{0,200}/i);
                  if (hasBackground) {
                    return background + "\n\n" + existing.replace(/^(背景|BACKGROUND|故事|STORY|世界观|WORLD)[\s\S]{0,200}\n\n/i, '');
                  }
                  return background + (existing ? "\n\n" + existing : "");
                });
              });
            }
          }
          
          setIsRulesBeingEdited(false); // Reset editing indicator after final update
          
          // Replace temp message with final message (ensure only one message)
          // Use cleaned response which has all editing tags removed
          setMessages(prev => {
            // If no content was received after cleaning, remove the temp message
            if (!cleanedResponse.trim()) {
              return prev.filter(msg => msg.id !== tempMessageId);
            }
            // Replace temp message ID with final message ID and use cleaned response
            // This ensures conversation content is completely separate from editing tags
            const updated = prev.map(msg =>
              msg.id === tempMessageId
                ? { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, content: cleanedResponse }
                : msg
            );
            // Rules are already updated via extractAndUpdateRules
            return updated;
          });
        },
        // onError: Handle errors
        (error: Error) => {
          console.error('Error streaming AI response:', error);
          
          // Check if it's an API key configuration error
          const isConfigError = error.message?.includes('OPENAI_API_KEY') || error.message?.includes('API key');
          
          if (isConfigError) {
            toast.error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.', {
              duration: 10000,
            });
            addGMMessage(
              "⚠️ **Configuration Error**\n\n" +
              "The OpenAI API key is not configured. Please:\n\n" +
              "1. Create a `.env` file in the project root\n" +
              "2. Add: `OPENAI_API_KEY=your_api_key_here`\n" +
              "3. Restart the development server\n\n" +
              "You can get your API key from: https://platform.openai.com/api-keys"
            );
          } else {
            toast.error(error.message || 'Failed to get AI response. Please try again.');
            addGMMessage(
              "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your message?"
            );
          }
          
          // Remove temp message
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
          setIsGMTyping(false);
          setIsStreaming(false);
        }
      );
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      // Remove temp message if it exists
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setIsGMTyping(false);
      setIsStreaming(false);
      
      // Only handle error here if onError callback wasn't called (e.g., error before streaming starts)
      // Most errors should be handled by onError callback, so we check if we're still streaming
      if (!isStreaming) {
        toast.error(error.message || 'Failed to get AI response. Please try again.');
        addGMMessage(
          "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your message?"
        );
      }
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const message = messageOverride || input.trim();
    if (message && !isGMTyping && !isStreaming) {
      // Clear input immediately for better UX
      setInput("");
      requestAnimationFrame(() => resizeInput());
      
      // Then send message and get response
      addUserMessage(message);
      await getGMResponse(message);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (!isGMTyping && !isStreaming) {
      setInput(reply);
      setTimeout(async () => {
        // Clear input immediately after showing the quick reply
        setInput("");
        requestAnimationFrame(() => resizeInput());
        
        // Then send message and get response
        addUserMessage(reply);
        await getGMResponse(reply);
      }, 300);
    }
  };

  const host = getHostById(selectedHostId);

  return (
    <div className="flex-1 flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 h-full overflow-hidden relative">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      <div className="flex flex-1 min-w-0 relative z-10 h-full">
      
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
      <div className="w-52 sm:w-60 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col relative z-10 h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-3 sm:p-4 border-b border-white/10 relative flex-shrink-0">
          <Button
            onClick={createNewSession}
            className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="p-2 space-y-1 relative">
            {sessions.map((session) => (
              <ContextMenu key={session.id}>
                <ContextMenuTrigger>
                  <div
                    className={`group relative rounded-lg transition-all duration-200 ${
                      currentSessionId === session.id
                        ? "bg-white/10 border border-white/20"
                        : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => loadSession(session.id)}
                      className="w-full p-2 text-left"
                    >
                      <div className="text-xs font-medium text-white mb-0.5 line-clamp-1 pr-6">
                        {session.title}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(session.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.messages.length} msgs
                      </div>
                    </button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white">
                  <ContextMenuItem 
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    onClick={() => {
                      setSessionToDelete(session);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Session
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            {sessions.length > 20 && (
              <div className="pt-2 pb-1 px-2 border-t border-white/5 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Keep only the most recent 20 sessions
                    const sortedSessions = [...sessions].sort((a, b) => 
                      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    );
                    const sessionsToKeep = sortedSessions.slice(0, 20);
                    setSessions(sessionsToKeep);
                    localStorage.setItem("gameMasterSessions", JSON.stringify(sessionsToKeep));
                    toast.success(`Cleaned up ${sessions.length - 20} old sessions`);
                  }}
                  className="w-full h-7 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  Clear Old ({sessions.length - 20})
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-col min-w-0 h-full ${showPreview ? 'flex-[1] min-w-0' : 'flex-1'}`}>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(!showPreview)}
                className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-none mx-auto py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
            {messages.map((message, index) => {
              // Filter out empty messages (including empty temp messages)
              if (!message.content.trim()) {
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
            
            <div className="max-w-none mx-auto relative space-y-3">
              {(isRecording || isTranscribing) && !voiceError ? (
                <div className="relative w-full px-1">
                  <div
                    className="flex items-center gap-2 w-full rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 px-2 py-2 shadow-xl"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-11 w-11 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                      onClick={voiceCancel}
                      disabled={isTranscribing}
                      title="Cancel"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0 relative flex items-center h-11 px-3">
                      <VoiceWaveform 
                        analyser={voice.liveAnalyser}
                        duration={voice.duration}
                        className="w-full h-full"
                        barClassName="bg-violet-400/90"
                        waveColor="rgba(192, 132, 252, 0.95)"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      className="flex-shrink-0 h-11 w-11 rounded-full bg-white hover:bg-zinc-100 text-zinc-900 disabled:opacity-40 shadow-lg transition-all"
                      disabled={isTranscribing}
                      title="Finish and insert"
                      onClick={async () => {
                        const t = await voiceConfirm();
                        if (t) {
                          setInput(t);
                          requestAnimationFrame(() => { inputRef.current?.focus(); resizeInput(); });
                        }
                      }}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {displayChips.length > 0 && !isGMTyping && !isStreaming && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs text-zinc-500 self-center mr-1">Quick reply:</span>
                      {displayChips.map((chip) => (
                        <Button
                          key={chip.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          title={chip.fullLabel ?? chip.label}
                          className="h-auto min-h-8 max-w-[280px] sm:max-w-[320px] px-3 py-1.5 text-sm text-left whitespace-normal border-white/20 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white leading-snug"
                          onClick={() => handleSend(chip.value)}
                        >
                          {chip.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 relative group min-w-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/15 to-indigo-500/15 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                      <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          requestAnimationFrame(() => resizeInput());
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={
                          isGMTyping || isStreaming ? "GM is thinking..." : "Message Game Master…"
                        }
                        className="bg-white/5 backdrop-blur-xl border border-white/10 focus:border-violet-500/40 text-white placeholder:text-zinc-500 text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 font-normal transition-all duration-200 relative shadow-md focus:shadow-lg focus:shadow-violet-500/10 disabled:opacity-70 disabled:cursor-not-allowed resize-none leading-relaxed scrollbar-hide"
                        style={{ minHeight: `${MIN_INPUT_H}px`, maxHeight: `${MAX_INPUT_H}px` }}
                        disabled={isGMTyping}
                        rows={1}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!voiceSupported) {
                          toast.error("Voice input is not supported in your browser");
                          return;
                        }
                        voiceStart();
                      }}
                      disabled={isGMTyping || (!mounted ? true : !voiceSupported)}
                      size="icon"
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-200 disabled:opacity-50 disabled:shadow-none bg-zinc-700/80 hover:bg-zinc-600/80 border border-white/10 hover:border-white/20"
                      title="Voice input"
                    >
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 text-zinc-300" />
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel - Editable before starting game; scrolls into view when GM edits */}
      {showPreview && (() => {
        return (
        <div ref={rulesPanelRef} className="flex-[1.2] min-w-0 border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col relative z-10 h-full">
          <div className="absolute inset-0 bg-gradient-to-l from-violet-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="px-4 py-3 border-b border-white/10 relative flex-shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Game Rules</h2>
                  <span className="text-xs text-zinc-500">
                    You can edit directly
                  </span>
                </div>
                {isRulesBeingEdited && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-md flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs text-amber-400 font-medium">AI Editing...</span>
                  </div>
                )}
                <Button
                  onClick={async () => {
                    if (!customRules || customRules.trim() === "" || customRules === "Custom game rules will be defined through conversation") {
                      toast.error("Please define game rules first");
                      return;
                    }
                    setIsStartingGame(true);
                    const startToastId = "start-game";
                    toast.loading("Preparing game...", { id: startToastId });
                    try {
                    let finalConfiguredPlayers = configuredPlayers;
                    let finalPlayerCount = configuredPlayers.length > 0 ? configuredPlayers.length : playerCount;

                    // If no players configured, automatically generate them
                    if (configuredPlayers.length === 0) {
                      toast.loading("Setting up players...", { id: startToastId });
                      try {
                        const response = await fetch('/api/generate-players', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            playerCount: playerCount || 0,
                            gameTemplate: selectedTemplate?.id || "custom",
                            rules: customRules,
                            minPlayers: selectedTemplate?.minPlayers ?? 2,
                            maxPlayers: selectedTemplate?.maxPlayers ?? 20
                          })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          finalConfiguredPlayers = data.players;
                          finalPlayerCount = data.players?.length ?? (selectedTemplate ? Math.round((selectedTemplate.minPlayers + selectedTemplate.maxPlayers) / 2) - 1 : 6);
                          setConfiguredPlayers(data.players);
                          if (playerCount === 0) setPlayerCount(finalPlayerCount);
                        }
                      } catch (error) {
                        console.error('Error generating players:', error);
                      }
                    }

                    // Generate AI Host based on game rules
                    type GeneratedHost = { name: string; personality: string; voiceStyle: string; systemPrompt: string; icon: string; color: string };
                    let generatedHostData: GeneratedHost | null = null;
                    toast.loading("Generating host...", { id: startToastId });
                    try {
                      const response = await fetch('/api/generate-host', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          gameRules: customRules,
                          gameName: gameName || selectedTemplate?.name || "Custom Game"
                        })
                      });

                      if (response.ok) {
                        const host = await response.json() as GeneratedHost;
                        generatedHostData = host;
                        console.log('[Game Master] Generated host:', host);

                        setSessions(prev => prev.map(s =>
                          s.id === currentSessionId
                            ? { ...s, generatedHost: host }
                            : s
                        ));
                      }
                    } catch (error) {
                      console.error('[Game Master] Failed to generate host:', error);
                    }

                    toast.dismiss(startToastId);
                    const tid = selectedTemplate?.id || "custom";
                    const gameConfig: GameConfig = {
                      template: tid as "werewolf" | "undercover" | "custom",
                      playerCount: finalPlayerCount || playerCount || (selectedTemplate ? Math.round((selectedTemplate.minPlayers + selectedTemplate.maxPlayers) / 2) - 1 : 6),
                      rules: customRules,
                      name: gameName || selectedTemplate?.name || "Custom Game",
                      hostId: selectedHostId,
                      tone: "balanced", // Default tone
                      hideRolesInPlayerList: tid === "werewolf" || tid === "mafia",
                      configuredPlayers: finalConfiguredPlayers.length > 0 ? finalConfiguredPlayers : undefined,
                      generatedHost: generatedHostData || undefined
                    };
                    await onCreateGame(gameConfig);
                    } finally {
                      setIsStartingGame(false);
                    }
                  }}
                  disabled={isRulesBeingEdited || isStartingGame}
                  className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingGame ? "Starting…" : "Start Game"}
                </Button>
              </div>
              
              {/* Player Count Info */}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Players: {playerCount === 0 ? "GM decides" : playerCount + 1}</span>
                {configuredPlayers.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">{configuredPlayers.length} configured</span>
                    <button
                      onClick={async () => {
                        toast.info("Regenerating players...");
                        try {
                          const response = await fetch('/api/generate-players', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              playerCount: playerCount,
                              gameTemplate: selectedTemplate?.id || "custom",
                              rules: customRules
                            })
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            setConfiguredPlayers(data.players);
                            toast.success(`Regenerated ${data.count} players!`);
                          } else {
                            toast.error("Failed to regenerate");
                          }
                        } catch (error) {
                          toast.error("Failed to regenerate");
                        }
                      }}
                      className="text-violet-400 hover:text-violet-300 underline"
                    >
                      Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-0 overflow-hidden flex flex-col min-h-0">
            <Textarea
              key={currentSessionId || 'rules-viewer'}
              value={customRules || selectedTemplate?.defaultRules || ""}
              onChange={(e) => setCustomRules(e.target.value)}
              placeholder="Game rules will appear here as you discuss with the Game Master. You and the GM can edit before starting the game; after starting, rules are locked.\n\nTip: You can write background story (world, era, atmosphere) at the beginning of the rules. The GM can also add it for you."
              className="flex-1 w-full h-full min-h-0 bg-white/5 backdrop-blur-xl border-0 border-white/10 text-white placeholder:text-zinc-500 text-sm sm:text-base rounded-none px-4 py-3 font-normal resize-none leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </div>
        );
      })()}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{sessionToDelete?.title}"? All conversation history will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (sessionToDelete) {
                  deleteSession(sessionToDelete.id);
                }
                setSessionToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}