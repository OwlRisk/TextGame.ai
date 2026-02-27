"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, Send, Mic, MicOff, X, Check, MessageSquarePlus, Trash2, MoreVertical, Play, Plus } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import type { DiscoverPreset } from "@/app/components/discover-page";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
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
import { parseInlineFormatting } from "@/lib/format-message";
import { HostSelector } from "@/app/components/host-selector";
import { useAuth } from "@/app/contexts/AuthContext";
import { getGameSessions, createGameSession, updateGameSession, deleteGameSession } from "@/lib/db";
import { streamAIChatResponse, type ChatMessage as AIChatMessage } from "@/lib/openai";
import { useVoiceInput, useVoiceOutput } from "@/lib/voice";
import { VoiceWaveform } from "@/app/components/voice-waveform";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";

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

// Notion-style: on Enter, turn current line starting with # / - into heading/list, then newline (works without space)
function handleGameDocEnter(editor: unknown): boolean {
  const ed = editor as { state: { selection: { $from: { depth: number; before: (d: number) => number; node: (d: number) => { type: { name: string }; textContent: string; nodeSize: number } } } }; commands: { insertContentAt: (pos: unknown, content: unknown, opts?: unknown) => boolean } } | null;
  if (!ed) return false;
  const { state, commands } = ed;
  const $from = state.selection.$from;
  const depth = $from.depth;
  const node = $from.node(depth);
  if (node.type.name !== "paragraph") return false;
  const text = node.textContent;
  const from = $from.before(depth);
  const to = from + node.nodeSize;

  let insert: { type: string; attrs?: Record<string, number>; content: unknown[] }[] | null = null;

  const hMatch = text.match(/^(#{1,6})\s*(.*)$/);
  if (hMatch) {
    const level = Math.min(hMatch[1].length, 3);
    const rest = (hMatch[2] ?? "").trim();
    insert = [
      { type: "heading", attrs: { level }, content: rest ? [{ type: "text", text: rest }] : [] },
      { type: "paragraph", content: [] },
    ];
  } else if (/^[-*]\s*(.*)$/.test(text)) {
    const rest = text.replace(/^[-*]\s*/, "").trim();
    insert = [
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: rest ? [{ type: "text", text: rest }] : [] }],
          },
        ],
      },
      { type: "paragraph", content: [] },
    ];
  } else if (/^\d+\.\s*(.*)$/.test(text)) {
    const rest = text.replace(/^\d+\.\s*/, "").trim();
    insert = [
      {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: rest ? [{ type: "text", text: rest }] : [] }],
          },
        ],
      },
      { type: "paragraph", content: [] },
    ];
  }

  if (!insert) return false;
  commands.insertContentAt({ from, to }, insert, { updateSelection: true });
  return true;
}

/** Strip GM control tags so they are never shown in the chat bubble. */
function cleanGMMessageContentForDisplay(content: string): string {
  if (!content?.trim()) return content;
  return content
    .replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '')
    .replace(/<ADD_TO_RULES[^>]*>[\s\S]*?<\/ADD_TO_RULES>/gi, '')
    .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*?<\/REPLACE_IN_RULES>/gi, '')
    .replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '')
    .replace(/<CONFIG_PLAYERS>[\s\S]*?<\/CONFIG_PLAYERS>/gi, '')
    .replace(/<CONFIG_CHANNELS>[\s\S]*?<\/CONFIG_CHANNELS>/gi, '')
    .replace(/<SET_PLAYER_COUNT>\s*\d+\s*<\/SET_PLAYER_COUNT>/gi, '')
    .replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '')
    .replace(/<EDIT_RULES>[\s\S]*$/i, '')
    .replace(/<ADD_TO_RULES[^>]*>[\s\S]*$/i, '')
    .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*$/i, '')
    .replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '')
    .replace(/<CONFIG_CHANNELS>[\s\S]*$/i, '')
    .replace(/<SET_PLAYER_COUNT>\s*\d*\s*$/i, '')
    .replace(/<UPDATE_GENERAL>[\s\S]*$/i, '')
    .trim();
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

import { GameTemplate, GAME_TEMPLATES } from "@/lib/game-templates";
import { getPreferredModel } from "@/lib/model-prefs";

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
  const { session, user } = useAuth();
  const authToken = session?.access_token;
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

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
  /** Channels (game rooms) decided by the GM via <CONFIG_CHANNELS>. null = use template default. */
  const [gmChannels, setGmChannels] = useState<{ id: string; name: string }[] | null>(null);

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
    const strippedRules = baseRules.replace(/^(STORY|BACKGROUND|WORLD|SETTING)[\s\S]*?\n\n/i, "");
    return `STORY:\n${story}\n\n${strippedRules}`;
  }, [customRules, selectedTemplate, gameStory]);

  const gameDocValue = useMemo(() => getCombinedRules(), [getCombinedRules]);

  // When template changes, clear GM-decided channels so we use template default until GM outputs CONFIG_CHANNELS again
  useEffect(() => {
    setGmChannels(null);
  }, [selectedTemplate?.id]);

  /** Static welcome message for new sessions (no LLM call) */
  const STATIC_WELCOME_CONTENT =
    "Welcome—I'm your Game Master. I'll help you design and fine-tune your game (rules, player count, and any options) right here. " +
    "As we talk, the rules panel on the right updates in real time so you can see exactly what will be used when you create the game. " +
    "I can also suggest game rooms and other setup from the rules. Choose an option below or describe what you have in mind.";

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
    setLlmQuickReplies([]); // New GM message: clear old suggestions; displayChips will show suggestionChips until API returns

    const lang = /[\u4e00-\u9fff]/.test(content) ? "zh" : "en";
    fetch("/api/suggest-gm-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        language: lang,
        preferredModel: getPreferredModel(),
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

  /** Max number of quick-reply chips to show */
  const MAX_DISPLAY_CHIPS = 3;

  /** Chips to show: LLM suggestions when available, else parsed/default chips so they don't flash away. */
  const displayChips = useMemo(() => {
    if (llmQuickReplies.length > 0) {
      return llmQuickReplies.slice(0, MAX_DISPLAY_CHIPS).map((text) => {
        const clean = stripChipLabel(text);
        return {
          label: clean.length > 52 ? clean.slice(0, 52).trim() + "…" : clean,
          value: clean,
          fullLabel: clean.length > 52 ? clean : undefined,
        };
      });
    }
    return suggestionChips.slice(0, MAX_DISPLAY_CHIPS).map((c) => ({
      label: c.label,
      value: c.value,
      fullLabel: c.fullLabel,
    }));
  }, [llmQuickReplies, suggestionChips]);

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

  // Resizable preview panel width (px); drag the divider to resize
  const [previewWidth, setPreviewWidth] = useState(420);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitDragRef = useRef({ startX: 0, startW: 0 });
  const PREVIEW_MIN = 280;
  const PREVIEW_MAX = 900;
  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - splitDragRef.current.startX;
      setPreviewWidth((w) => {
        const next = splitDragRef.current.startW - delta;
        return Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, next));
      });
    };
    const onUp = () => setIsDraggingSplit(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingSplit]);
  // Background merged into Rules - no separate tab needed
  const [isRulesBeingEdited, setIsRulesBeingEdited] = useState<boolean>(false); // Track if rules are being edited in real-time
  const [isStartingGame, setIsStartingGame] = useState(false);
  const rulesPanelRef = useRef<HTMLDivElement>(null); // Scroll into view when GM edits rules

  // Convert Markdown to HTML (for Tiptap initial content and external sync)
  // Preprocess: allow #word / -word to be parsed as heading/list even without space after
  const markdownToHtml = useCallback((md: string): string => {
    if (!md || md.trim() === "") return "<p></p>";
    try {
      const normalized = md
        .split("\n")
        .map((line) => {
          // # / ## / ### followed by non-space: add space so marked parses as heading
          if (/\s*#{1,6}[^\s#]/.test(line)) {
            return line.replace(/^(\s*)(#{1,6})([^\s#].*)$/, "$1$2 $3");
          }
          // - or * at line start followed by non-space: add space so it parses as list
          if (/\s*[-*]\S/.test(line)) {
            return line.replace(/^(\s*)([-*])(\S.*)$/, "$1$2 $3");
          }
          return line;
        })
        .join("\n");
      return marked.parse(normalized) as string;
    } catch (e) {
      console.error("Markdown parse error:", e);
      return `<p>${md}</p>`;
    }
  }, []);

  // Ref for handleKeyDown (format # / - lines on Enter)
  const gameDocEditorRef = useRef<ReturnType<typeof useEditor>>(null);

  // Tiptap editor: Notion-style, ## + space becomes heading
  const gameDocEditor = useEditor({
    immediatelyRender: false, // Next.js SSR compat
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder: "Click here to edit game rules...",
      }),
    ],
    content: markdownToHtml(customRules || selectedTemplate?.defaultRules || ""),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-full",
      },
      handleKeyDown: (_view, event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        const editor = gameDocEditorRef.current;
        if (editor && handleGameDocEnter(editor)) event.preventDefault();
      },
    },
    onUpdate: ({ editor }) => {
      // On user edit: convert HTML to Markdown and store in customRules
      const html = editor.getHTML();
      // Empty <p></p> -> empty string
      if (html === "<p></p>" || html.trim() === "") {
        setCustomRules("");
      } else {
        // Tiptap HTML is clean (h1, h2, ul, li); use simple conversion
        const md = htmlToMarkdown(html);
        setCustomRules(md);
      }
    },
  }, []);

  useEffect(() => {
    (gameDocEditorRef as React.MutableRefObject<ReturnType<typeof useEditor> | null>).current = gameDocEditor;
  }, [gameDocEditor]);

  // Simple HTML → Markdown (Tiptap: <h1> → # xxx, <ul><li> → - xxx, <strong> → **xxx**)
  const htmlToMarkdown = (html: string): string => {
    let md = html;
    // h1-h3
    md = md.replace(/<h1>([\s\S]*?)<\/h1>/g, "# $1\n");
    md = md.replace(/<h2>([\s\S]*?)<\/h2>/g, "## $1\n");
    md = md.replace(/<h3>([\s\S]*?)<\/h3>/g, "### $1\n");
    // Lists
    md = md.replace(/<ul>([\s\S]*?)<\/ul>/g, (_match: string, content: string) => {
      return content.replace(/<li>(.*?)<\/li>/g, "- $1\n");
    });
    md = md.replace(/<ol>([\s\S]*?)<\/ol>/g, (_match: string, content: string) => {
      let i = 1;
      return content.replace(/<li>(.*?)<\/li>/g, (_: string, item: string) => `${i++}. ${item}\n`);
    });
    // Bold, italic, code
    md = md.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
    md = md.replace(/<em>(.*?)<\/em>/g, "*$1*");
    md = md.replace(/<code>(.*?)<\/code>/g, "`$1`");
    // Paragraphs
    md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
    // Trim extra blank lines and tags
    md = md.replace(/<[^>]+>/g, "").trim();
    return md;
  };

  // When GM or external updates customRules, sync to editor (throttle: 500ms during stream, then once at end)
  const gameDocSyncThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRulesBeingEditedRef = useRef(isRulesBeingEdited);
  useEffect(() => {
    if (!gameDocEditor || gameDocEditor.isFocused) return;
    const markdown = customRules || selectedTemplate?.defaultRules || "";
    const newContentHtml = markdownToHtml(markdown);
    const apply = () => {
      if (gameDocEditor && !gameDocEditor.isFocused) {
        const currentHtml = gameDocEditor.getHTML();
        if (currentHtml !== newContentHtml) gameDocEditor.commands.setContent(newContentHtml);
      }
    };
    const justStoppedEditing = prevRulesBeingEditedRef.current && !isRulesBeingEdited;
    prevRulesBeingEditedRef.current = isRulesBeingEdited;
    if (justStoppedEditing) {
      if (gameDocSyncThrottleRef.current) {
        clearTimeout(gameDocSyncThrottleRef.current);
        gameDocSyncThrottleRef.current = null;
      }
      apply();
      return () => {};
    }
    if (isRulesBeingEdited) {
      if (gameDocSyncThrottleRef.current) clearTimeout(gameDocSyncThrottleRef.current);
      gameDocSyncThrottleRef.current = setTimeout(() => {
        gameDocSyncThrottleRef.current = null;
        apply();
      }, 500);
      return () => {
        if (gameDocSyncThrottleRef.current) {
          clearTimeout(gameDocSyncThrottleRef.current);
          gameDocSyncThrottleRef.current = null;
        }
      };
    }
    apply();
    return () => {};
  }, [customRules, selectedTemplate?.defaultRules, gameDocEditor, markdownToHtml, isRulesBeingEdited]);

  // Map DB row to GameSession
  const rowToSession = useCallback((row: { id: string; title: string; game_name: string; template_id: string; host_id: string; player_count: number; custom_rules: string | null; conversation_state: string; messages: any; created_at: string; updated_at: string }): GameSession => {
    const msgs = (row.messages || []).map((m: any, msgIndex: number) => ({
      ...m,
      id: m.id || `msg-${row.id}-${msgIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(m.timestamp)
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
      updatedAt: new Date(row.updated_at)
    };
  }, []);

  // Load sessions: from DB when logged in, else localStorage
  useEffect(() => {
    if (user?.id) {
      getGameSessions(user.id).then(({ data, error }) => {
        if (error || !data?.length) {
          setSessions([]);
          createNewSession();
          return;
        }
        const sessionsWithDates = data.map((row) => rowToSession(row));
        setSessions(sessionsWithDates);
        loadSession(sessionsWithDates[0].id, sessionsWithDates);
      });
      return;
    }
    const savedSessions = localStorage.getItem("gameMasterSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      const sessionsWithDates = parsed.map((s: any) => ({
        ...s,
        messages: (s.messages || []).map((m: any, msgIndex: number) => ({
          ...m,
          id: `msg-${s.id}-${msgIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          timestamp: new Date(m.timestamp)
        })),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
      const MAX_SESSIONS = 30;
      const sortedSessions = sessionsWithDates.sort((a: GameSession, b: GameSession) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const sessionsToKeep = sortedSessions.slice(0, MAX_SESSIONS);
      if (sessionsToKeep.length < sessionsWithDates.length) {
        localStorage.setItem("gameMasterSessions", JSON.stringify(sessionsToKeep));
      }
      setSessions(sessionsToKeep);
      if (sessionsToKeep.length > 0) loadSession(sessionsToKeep[0].id, sessionsToKeep);
      else createNewSession();
    } else {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-save current session
  useEffect(() => {
    if (!currentSessionId) return;
    
    const timeoutId = setTimeout(() => {
      saveCurrentSession();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [messages, conversationState, selectedTemplate, playerCount, customRules, gameName, selectedHostId, currentSessionId]);

  // Save current session to state, localStorage, and DB (when logged in)
  const saveCurrentSession = useCallback(() => {
    if (!currentSessionId) return;

    const sessionTitle = generateSessionTitle(selectedTemplate, playerCount, gameName);

    const existing = sessions.find((s) => s.id === currentSessionId);
    // Only bump updatedAt (and move to top) when messages actually changed
    const messagesChanged = existing
      ? existing.messages.length !== messages.length ||
        (messages.length > 0 &&
          existing.messages[existing.messages.length - 1]?.id !== messages[messages.length - 1]?.id)
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

    // If messages changed, move session to top; otherwise update in-place to preserve order
    setSessions((prev) => {
      const updated = messagesChanged
        ? [updatedSession, ...prev.filter((s) => s.id !== currentSessionId)]
        : prev.map((s) => (s.id === currentSessionId ? updatedSession : s));
      try {
        localStorage.setItem("gameMasterSessions", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (user?.id) {
      const messagesForDb = messages.map((m) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp as unknown as string)
      }));
      updateGameSession(currentSessionId, {
        title: sessionTitle,
        game_name: gameName,
        template_id: selectedTemplate?.id ?? "",
        host_id: selectedHostId,
        player_count: playerCount,
        custom_rules: customRules || null,
        conversation_state: conversationState,
        messages: messagesForDb
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
    user?.id
  ]);

  // Create new session (UUID when saving to DB, else client id for localStorage-only)
  const createNewSession = useCallback(() => {
    const newSessionId =
      user?.id && typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const defaultHostId = getDefaultHostForTemplate(null).id;
    const staticWelcomeMessage: ChatMessage = {
      id: `msg-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "gm",
      content: STATIC_WELCOME_CONTENT,
      timestamp: new Date()
    };
    const newSession: GameSession = {
      id: newSessionId,
      title: "New Game Setup",
      messages: [staticWelcomeMessage],
      conversationState: "greeting",
      selectedTemplate: null,
      playerCount: 6,
      customRules: "",
      gameName: "",
      selectedHostId: defaultHostId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    welcomeRequestedForSessionRef.current = newSessionId;
    welcomeScheduledForSessionRef.current = newSessionId;
    setCurrentSessionId(newSessionId);
    setMessages([staticWelcomeMessage]);
    setConversationState("greeting");
    setIsGMTyping(false);
    setSelectedTemplate(null);
    setPlayerCount(6);
    setCustomRules("");
    setGameName("");
    setSelectedHostId(defaultHostId);

    if (user?.id) {
      const messagesForDb = [staticWelcomeMessage].map((m) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp as unknown as string)
      }));
      createGameSession({
        id: newSessionId,
        user_id: user.id,
        title: "New Game Setup",
        game_name: "",
        template_id: "",
        host_id: defaultHostId,
        player_count: 6,
        custom_rules: "",
        conversation_state: "greeting",
        messages: messagesForDb
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
  }, [user?.id]);

  const createSessionFromPreset = useCallback((preset: DiscoverPreset) => {
    const resolvedTemplate = GAME_TEMPLATES.find((t) => t.id === (preset.templateId || "custom")) ?? null;
    const nextPlayerCount = preset.playerCount ?? 0;
    const nextRules = preset.rules?.trim() || resolvedTemplate?.defaultRules || "";
    const nextGameName = preset.name?.trim() || "";
    const recommendedHost = getDefaultHostForTemplate(resolvedTemplate?.id ?? null);

    const templateName = resolvedTemplate?.name ?? preset.name ?? "this game";
    const presetWelcomeContent =
      `You've chosen **${templateName}**. The rules are in the panel on the right and update as we talk; you can edit them there too. ` +
      "I can suggest game rooms and other setup from the rules. " +
      (nextPlayerCount > 0
        ? `We're set for ${nextPlayerCount + 1} players (including you). Say how you'd like to adjust, or "create game" when ready.`
        : "Tell me how many players you want, or say \"create game\" when you're ready.");
    const presetWelcomeMessage: ChatMessage = {
      id: `msg-preset-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "gm",
      content: presetWelcomeContent,
      timestamp: new Date()
    };

    const newSessionId =
      user?.id && typeof crypto !== "undefined" && crypto.randomUUID
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
      updatedAt: new Date()
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

    if (user?.id) {
      const messagesForDb = [presetWelcomeMessage].map((m) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp as unknown as string)
      }));
      createGameSession({
        id: newSessionId,
        user_id: user.id,
        title: newSession.title,
        game_name: nextGameName,
        template_id: resolvedTemplate?.id ?? "",
        host_id: recommendedHost.id,
        player_count: nextPlayerCount,
        custom_rules: nextRules,
        conversation_state: "greeting",
        messages: messagesForDb
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
  }, [user?.id]);

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

  // Load a session. When fromHistoryClick is true, we skip auto-welcome for empty sessions.
  const loadSession = (sessionId: string, sessionsList?: GameSession[], fromHistoryClick?: boolean) => {
    const sessionsToSearch = sessionsList || sessions;
    const session = sessionsToSearch.find(s => s.id === sessionId);
    if (!session) return;

    if (fromHistoryClick) didLoadSessionRef.current = true;
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setConversationState(session.conversationState);
    setSelectedTemplate(session.selectedTemplate);
    setPlayerCount(session.playerCount);
    setCustomRules(session.customRules);
    setGameName(session.gameName);
    setSelectedHostId(session.selectedHostId);
    setIsGMTyping(session.messages.length === 0 && !fromHistoryClick);
  };

  // Delete a session
  const deleteSession = (sessionId: string) => {
    if (user?.id) {
      deleteGameSession(sessionId, user.id).then(({ error }) => {
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
  };

  // Ref to avoid requesting welcome twice for the same session
  const welcomeRequestedForSessionRef = useRef<string | null>(null);
  const welcomeScheduledForSessionRef = useRef<string | null>(null);
  // 从历史列表点进某会话时不要自动发欢迎消息，只对「新建会话」发欢迎
  const didLoadSessionRef = useRef(false);

  // When an empty session is shown (e.g. loaded from old data), add static welcome once
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
      timestamp: new Date()
    };
    setMessages([staticMsg]);
  }, [currentSessionId, messages.length]);

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
    const setPlayerCountMatch = response.match(/<SET_PLAYER_COUNT>\s*(\d+)\s*<\/SET_PLAYER_COUNT>/i);
    if (setPlayerCountMatch && setPlayerCountMatch[1]) {
      const n = parseInt(setPlayerCountMatch[1], 10);
      if (!Number.isNaN(n)) {
        const min = selectedTemplate ? selectedTemplate.minPlayers - 1 : 1;
        const max = selectedTemplate ? selectedTemplate.maxPlayers - 1 : 19;
        const clamped = Math.min(max, Math.max(min, n));
        setPlayerCount(clamped);
      }
      cleanedResponse = cleanedResponse.replace(/<SET_PLAYER_COUNT>\s*\d+\s*<\/SET_PLAYER_COUNT>/gi, '').trim();
    }

    // 5. Handle UPDATE_GENERAL - GM adds background to Rules (prepend to rules)
    const updateGeneralMatch = response.match(/<UPDATE_GENERAL>([\s\S]*?)<\/UPDATE_GENERAL>/i);
    if (updateGeneralMatch && updateGeneralMatch[1]) {
      const background = updateGeneralMatch[1].trim();
      if (background) {
        setCustomRules((prevRules) => {
          const existing = prevRules || selectedTemplate?.defaultRules || "";
          // If rules already start with background-like content, replace it; otherwise prepend
          const hasBackground = existing.match(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}/i);
          if (hasBackground) {
            return background + "\n\n" + existing.replace(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}\n\n/i, '');
          }
          return background + (existing ? "\n\n" + existing : "");
        });
      }
      cleanedResponse = cleanedResponse.replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '').trim();
    }

    // 6. Handle CONFIG_CHANNELS - GM decides game rooms (e.g. General, Werewolves only)
    const configChannelsMatch = response.match(/<CONFIG_CHANNELS>([\s\S]*?)<\/CONFIG_CHANNELS>/i);
    if (configChannelsMatch && configChannelsMatch[1]) {
      try {
        const raw = configChannelsMatch[1].trim();
        const arr = JSON.parse(raw) as Array<{ id: string; name: string }>;
        if (Array.isArray(arr) && arr.length > 0) {
          const valid = arr.filter((c): c is { id: string; name: string } =>
            c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string'
          );
          if (valid.length > 0) setGmChannels(valid);
        }
      } catch {
        /* ignore parse errors */
      }
      cleanedResponse = cleanedResponse.replace(/<CONFIG_CHANNELS>[\s\S]*?<\/CONFIG_CHANNELS>/gi, '').trim();
    }
    cleanedResponse = cleanedResponse.replace(/<CONFIG_CHANNELS>[\s\S]*$/i, '').trim();

    // 7. Remove CONFIG_PLAYERS from display (players aren't programmers; only show natural language)
    cleanedResponse = cleanedResponse.replace(/<CONFIG_PLAYERS>[\s\S]*?<\/CONFIG_PLAYERS>/gi, '').trim();
    cleanedResponse = cleanedResponse.replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '').trim();

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
          maxCompletionTokens: 2000,
          authToken
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
            const setPlayerCountMatches = Array.from(fullResponse.matchAll(/<SET_PLAYER_COUNT>\s*(\d+)\s*<\/SET_PLAYER_COUNT>/gi));
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
              .replace(/<CONFIG_CHANNELS>[\s\S]*?<\/CONFIG_CHANNELS>/gi, '')
              .replace(/<SET_PLAYER_COUNT>\s*\d+\s*<\/SET_PLAYER_COUNT>/gi, '')
              .replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '')
              // Also remove incomplete tags
              .replace(/<EDIT_RULES>[\s\S]*$/i, '')
              .replace(/<ADD_TO_RULES[^>]*>[\s\S]*$/i, '')
              .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*$/i, '')
              .replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '')
              .replace(/<CONFIG_CHANNELS>[\s\S]*$/i, '')
              .replace(/<SET_PLAYER_COUNT>\s*\d*\s*$/i, '')
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
                  const hasBackground = existing.match(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}/i);
                  if (hasBackground) {
                    return background + "\n\n" + existing.replace(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}\n\n/i, '');
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
    <div className="flex-1 flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden relative min-h-0 min-w-0">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      <div className="flex flex-1 min-w-0 min-h-0 relative z-10 overflow-hidden">
      
      {/* Voice Error Toast — show for mic errors and transcription failures */}
      {voiceError && (
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
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => {
                      voiceCancel();
                      setTimeout(() => voiceStart(), 400);
                    }}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white text-xs h-7 px-3"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Session History Sidebar */}
      <div className="flex-shrink-0 w-52 sm:w-60 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col relative z-10 overflow-hidden">
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

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="p-2 space-y-1 w-full">
            {sessions.map((session) => (
              <ContextMenu key={session.id}>
                <ContextMenuTrigger>
                  <div
                    className={`group relative rounded-lg transition-all duration-200 overflow-hidden ${
                      currentSessionId === session.id
                        ? "bg-white/10 border border-white/20"
                        : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => loadSession(session.id, undefined, true)}
                      className="w-full min-w-0 p-2 text-left"
                    >
                      <div className="text-xs font-medium text-white mb-0.5 line-clamp-1 pr-6">
                        {session.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {(() => {
                          const dateStr = new Date(session.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          if (session.messages.length === 0) return `${dateStr} · No messages yet`;
                          const last = session.messages[session.messages.length - 1];
                          const preview = (last?.content ?? '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\n+/g, ' ').trim();
                          return preview ? `${dateStr} — ${preview}` : `${dateStr} · ${session.messages.length} msgs`;
                        })()}
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
        </div>
      </div>

      {/* Main Chat Area + resizable split */}
      <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="flex flex-col min-w-0 min-h-0 flex-1 overflow-hidden">
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
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0 select-text">
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
                        {userAvatarUrl ? (
                          <AvatarImage src={userAvatarUrl} alt="You" className="object-cover" />
                        ) : null}
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
                        <div className="text-[15px] sm:text-base leading-relaxed relative z-10 font-normal select-text">
                          {formatMessage(message.role === "gm" ? cleanGMMessageContentForDisplay(message.content) : message.content)}
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
                      {voice.isTranscribing ? (
                        <span className="text-sm text-zinc-400">Transcribing...</span>
                      ) : (
                        <VoiceWaveform 
                          analyser={voice.liveAnalyser}
                          duration={voice.duration}
                          className="w-full h-full"
                          barClassName="bg-violet-400/90"
                          waveColor="rgba(192, 132, 252, 0.95)"
                        />
                      )}
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
                          isGMTyping || isStreaming ? "GM is thinking..." : "Chat with Game Master, design your game rules..."
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

      {/* Draggable divider: only shown on lg+ where the preview panel is visible */}
      <div
        role="separator"
        aria-label="Resize rules preview"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingSplit(true);
          splitDragRef.current = { startX: e.clientX, startW: previewWidth };
        }}
        className={`hidden lg:flex flex-shrink-0 w-1.5 h-full bg-white/5 hover:bg-violet-500/30 cursor-col-resize select-none transition-colors ${isDraggingSplit ? "bg-violet-500/40" : ""}`}
      />

      {/* Preview Panel - hidden on narrow screens to prevent layout overflow */}
        <div
          ref={rulesPanelRef}
          className="hidden lg:flex lg:flex-col flex-shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-xl relative z-10 min-w-0 overflow-hidden"
          style={{ width: previewWidth, minWidth: PREVIEW_MIN }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-violet-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="px-4 py-3 border-b border-white/10 relative flex-shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-nowrap min-w-0">
                <div className="min-w-0 flex-1 flex items-center gap-3 overflow-hidden">
                  <h2 className="text-lg font-bold text-white truncate">Game Document</h2>
                  {isRulesBeingEdited && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-md shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs text-amber-400 font-medium whitespace-nowrap">AI editing...</span>
                    </div>
                  )}
                </div>
                {(() => {
                  const isRulesEmpty = !customRules || !customRules.trim() || customRules.trim() === "Custom game rules will be defined through conversation";
                  return (
                    <>
                <Button
                  onClick={async () => {
                    if (isRulesEmpty) {
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
                        setSessions(prev => prev.map(s =>
                          s.id === currentSessionId
                            ? { ...s, generatedHost: host }
                            : s
                        ));
                      } else {
                        const errorText = await response.text();
                        console.error('[Game Master] ❌ Host generation failed. Status:', response.status, 'Response:', errorText);
                        toast.warning("⚠️ Host generation failed. Will use default host (Echo).", { id: startToastId, duration: 4000 });
                      }
                    } catch (error) {
                      console.error('[Game Master] ❌ Failed to generate host:', error);
                      toast.warning("⚠️ Host generation error. Will use default host (Echo).", { id: startToastId, duration: 4000 });
                    }

                    toast.dismiss(startToastId);
                    const tid = selectedTemplate?.id || "custom";
                    const defaultChannelsByTemplate: Record<string, { id: string; name: string }[]> = {
                      werewolf: [
                        { id: "general", name: "General" },
                        { id: "werewolves-only", name: "Werewolves only" },
                      ],
                      mafia: [
                        { id: "general", name: "General" },
                        { id: "mafia-only", name: "Mafia only" },
                      ],
                      undercover: [{ id: "general", name: "General" }],
                      custom: [{ id: "general", name: "General" }],
                    };
                    const gameConfig: GameConfig = {
                      template: tid as "werewolf" | "undercover" | "custom",
                      playerCount: finalPlayerCount || playerCount || (selectedTemplate ? Math.round((selectedTemplate.minPlayers + selectedTemplate.maxPlayers) / 2) - 1 : 6),
                      rules: customRules,
                      name: gameName || selectedTemplate?.name || "Custom Game",
                      hostId: selectedHostId,
                      tone: "balanced", // Default tone
                      hideRolesInPlayerList: tid === "werewolf" || tid === "mafia",
                      configuredPlayers: finalConfiguredPlayers.length > 0 ? finalConfiguredPlayers : undefined,
                      generatedHost: generatedHostData || undefined,
                      channels: (gmChannels && gmChannels.length > 0) ? gmChannels : (defaultChannelsByTemplate[tid] ?? defaultChannelsByTemplate.custom),
                    };
                    await onCreateGame(gameConfig);
                    } finally {
                      setIsStartingGame(false);
                    }
                  }}
                  disabled={isRulesBeingEdited || isStartingGame || isRulesEmpty}
                  className="ml-auto shrink-0 h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingGame ? "Starting…" : "Start Game"}
                </Button>
                {isRulesEmpty && (
                  <p className="w-full text-xs text-zinc-500 mt-1.5 text-right">Chat with GM to generate rules first.</p>
                )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            <div className="flex-1 overflow-auto min-h-0 px-4 py-4">
              <EditorContent editor={gameDocEditor} />
            </div>
          </div>
        </div>
      </div>
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