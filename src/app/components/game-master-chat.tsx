"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Sparkles, Send, Mic, MicOff, X, Check, MessageSquarePlus, Trash2, MoreVertical, Play, Plus, PanelLeft, FileText, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { GameConfig } from "@/app/components/game-setup-dialog";
import type { DiscoverPreset } from "@/data/discover-templates";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
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
import { HOST_PERSONALITIES, getDefaultHost, getLastSelectedHostId, saveLastSelectedHostId, getHostById } from "@/app/config/host-config";

import { OutOfCreditsModal } from "@/app/components/out-of-credits-modal";
import { HostSelector } from "@/app/components/host-selector";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { useGameMasterSessions } from "@/hooks/useGameMasterSessions";
import { streamAIChatResponse, type ChatMessage as AIChatMessage } from "@/lib/openai";
import { useVoiceInput, useVoiceOutput } from "@/lib/voice";
import { VoiceWaveform } from "@/app/components/voice-waveform";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import type { ChatMessage, GameSession, ConversationState, GameMasterChatProps, ChannelRoomType } from "@/types/game-master";
import {
  formatMessageTime,
  handleGameDocEnter,
  cleanGMMessageContentForDisplay,
  stripChipLabel,
  htmlToMarkdown,
  addContentToSection,
  replaceContentInSection,
} from "@/lib/game-master-utils";
import { parseGMResponseTags, applyRulesUpdates, applyBackgroundToRules, clampPlayerCount } from "@/lib/gm-rules-parser";
import { formatGMMessage as formatMessage } from "@/lib/gm-format-message";
import { useSplitPanel } from "@/hooks/useSplitPanel";
import { GameTemplate } from "@/lib/game-templates";
import { getPreferredModel } from "@/lib/model-prefs";

export type { ChatMessage, GameSession, ConversationState, GameMasterChatProps, ChannelRoomType };

export function GameMasterChat({ onBack, onCreateGame, initialPreset, onPresetApplied }: GameMasterChatProps) {
  const { session, user } = useAuth();
  const authToken = session?.access_token;
  const userAvatarUrl = getUserAvatarUrl(user);

  // Current conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>("greeting");
  const [isGMTyping, setIsGMTyping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false); // Track if currently streaming
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [mobileRulesOpen, setMobileRulesOpen] = useState(false);
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
    avatar_url?: string;
    voice_id?: string;
  }>>([]);
  /** Channels (game rooms) decided by the GM via <CONFIG_CHANNELS>. null = use template default. */
  const [gmChannels, setGmChannels] = useState<{ id: string; name: string; roomType?: ChannelRoomType }[] | null>(null);

  // Host personality - try last selected, then default
  const [selectedHostId, setSelectedHostId] = useState<string>(() => {
    const lastHostId = getLastSelectedHostId();
    if (lastHostId) return lastHostId;
    return getDefaultHost().id;
  });

  // Session management (CRUD, auto-save, load-on-mount, preset handling)
  const {
    sessions, setSessions, currentSessionId,
    deleteDialogOpen, setDeleteDialogOpen,
    sessionToDelete, setSessionToDelete,
    saveCurrentSession, createNewSession, createSessionFromPreset,
    loadSession, deleteSession,
  } = useGameMasterSessions({
    userId: user?.id,
    initialPreset,
    onPresetApplied,
    messages, setMessages,
    conversationState, setConversationState,
    selectedTemplate, setSelectedTemplate,
    playerCount, setPlayerCount,
    customRules, setCustomRules,
    gameName, setGameName,
    selectedHostId, setSelectedHostId,
    setIsGMTyping,
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

  /** No hardcoded chips — all quick replies are generated by the AI
   *  via /api/suggest-gm-replies so they match the conversation context. */

  // Voice output (TTS): GM reads replies aloud. Init false to avoid hydration mismatch;
  // sync from localStorage after mount.
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const voiceOutputEnabledRef = useRef(voiceOutputEnabled);
  voiceOutputEnabledRef.current = voiceOutputEnabled;
  const { speak: speakTTS, speakQueued, stop: stopTTS, supported: ttsSupported } = useVoiceOutput();

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
    const currentRulesSnippet = (customRules || selectedTemplate?.defaultRules || "").slice(0, 800);
    fetch("/api/suggest-gm-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        gameName: gameName || selectedTemplate?.name || "",
        rulesSnippet: currentRulesSnippet,
        playerCount: playerCount,
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
  const MAX_CHIP_DISPLAY_LEN = 38;

  /** Chips to show: LLM suggestions when available, else parsed/default chips so they don't flash away. */
  const displayChips = useMemo(() => {
    if (llmQuickReplies.length > 0) {
      return llmQuickReplies.slice(0, MAX_DISPLAY_CHIPS).map((text) => {
        const clean = stripChipLabel(text);
        return {
          label: clean.length > MAX_CHIP_DISPLAY_LEN ? clean.slice(0, MAX_CHIP_DISPLAY_LEN - 1).trim() + "…" : clean,
          value: clean,
          fullLabel: clean.length > MAX_CHIP_DISPLAY_LEN ? clean : undefined,
        };
      });
    }
    return suggestionChips.slice(0, MAX_DISPLAY_CHIPS).map((c) => ({
      label: c.label.length > MAX_CHIP_DISPLAY_LEN ? c.label.slice(0, MAX_CHIP_DISPLAY_LEN - 1).trim() + "…" : c.label,
      value: c.value,
      fullLabel: c.fullLabel ?? (c.label.length > MAX_CHIP_DISPLAY_LEN ? c.label : undefined),
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

  // Resizable preview panel
  const { previewWidth, isDragging: isDraggingSplit, onDragStart: onSplitDragStart, minWidth: PREVIEW_MIN } = useSplitPanel();
  // Background merged into Rules - no separate tab needed
  const [isRulesBeingEdited, setIsRulesBeingEdited] = useState<boolean>(false); // Track if rules are being edited in real-time
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [creatingStep, setCreatingStep] = useState<string>("");
  // AbortController for the Start Game fetch chain; aborted on component unmount to avoid state
  // updates after the component is gone.
  const startGameAbortRef = useRef<AbortController | null>(null);
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

  // Lock the editor while the GM is streaming rule edits
  useEffect(() => {
    if (!gameDocEditor) return;
    gameDocEditor.setEditable(!isRulesBeingEdited);
  }, [gameDocEditor, isRulesBeingEdited]);

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

  // Abort any in-flight Start Game requests when the component unmounts.
  useEffect(() => {
    return () => { startGameAbortRef.current?.abort(); };
  }, []);

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
                  setPlayerCount(clampPlayerCount(n, selectedTemplate));
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
          
          const displayContent = cleanGMMessageContentForDisplay(fullResponse);

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
            return updated;
          });
          // Auto-scroll to bottom during streaming
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
        },
        () => {
          setIsGMTyping(false);
          setIsStreaming(false);

          const parsed = parseGMResponseTags(fullResponse);

          // Apply rules — EDIT_RULES has highest priority and skips other rule modifications
          if (parsed.configPlayers && parsed.configPlayers.length > 0) {
            setConfiguredPlayers(parsed.configPlayers);
          }
          if (parsed.configChannels) {
            setGmChannels(parsed.configChannels);
          }
          if (parsed.setPlayerCount != null) {
            setPlayerCount(clampPlayerCount(parsed.setPlayerCount, selectedTemplate));
          }

          const hasRulesChange = parsed.editRules || parsed.addToRules.length > 0 || parsed.replaceInRules.length > 0 || parsed.updateRules;
          if (hasRulesChange) {
            flushSync(() => {
              setCustomRules(prevRules =>
                applyRulesUpdates(prevRules, parsed, selectedTemplate?.defaultRules)
              );
            });
            rulesPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          if (parsed.updateGeneral) {
            flushSync(() => {
              setCustomRules(prevRules =>
                applyBackgroundToRules(prevRules, parsed.updateGeneral!, selectedTemplate?.defaultRules)
              );
            });
          }

          setIsRulesBeingEdited(false);

          const cleanedResponse = parsed.cleanedResponse;
          setMessages(prev => {
            if (!cleanedResponse.trim()) {
              return prev.filter(msg => msg.id !== tempMessageId);
            }
            return prev.map(msg =>
              msg.id === tempMessageId
                ? { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, content: cleanedResponse }
                : msg
            );
          });
        },
        // onError: Handle errors
        (error: Error) => {
          console.error('Error streaming AI response:', error);

          const isInsufficientTokens =
            error.message === 'INSUFFICIENT_TOKENS' ||
            (error as any).code === 'INSUFFICIENT_TOKENS';
          const isConfigError = error.message?.includes('OPENAI_API_KEY') || error.message?.includes('API key');

          if (isInsufficientTokens) {
            setShowOutOfCredits(true);
            trackEvent("token_insufficient", { context: "stream" });
          } else if (isConfigError) {
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
            trackEvent("error_shown", { type: "ai_response", message: String(error.message || "unknown").slice(0, 100) });
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
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setIsGMTyping(false);
      setIsStreaming(false);

      const isInsufficientTokens =
        error.message === 'INSUFFICIENT_TOKENS' || error.code === 'INSUFFICIENT_TOKENS';

      if (isInsufficientTokens) {
        setShowOutOfCredits(true);
        trackEvent("token_insufficient", { context: "non_stream" });
      } else if (!isStreaming) {
        toast.error(error.message || 'Failed to get AI response. Please try again.');
        trackEvent("error_shown", { type: "ai_response", message: String(error.message || "unknown").slice(0, 100) });
        addGMMessage(
          "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your message?"
        );
      }
    }
  };

  const checkRulesEmpty = (rules: string | undefined) =>
    !rules?.trim() || rules.trim() === "Custom game rules will be defined through conversation";

  const handleStartGame = async () => {
    if (checkRulesEmpty(customRules)) {
      toast.info("Chat with the Game Master first to generate game rules.");
      return;
    }
    setIsStartingGame(true);
    setCreatingStep("Generating players…");
    const startToastId = "start-game";
    toast.loading("Preparing game...", { id: startToastId });
    startGameAbortRef.current?.abort();
    const abortCtrl = new AbortController();
    startGameAbortRef.current = abortCtrl;
    try {
      let finalConfiguredPlayers = configuredPlayers;
      let finalPlayerCount = configuredPlayers.length > 0 ? configuredPlayers.length : playerCount;

      // Always try to use the character pool (pre-built avatars + voices = faster start).
      // If the GM chat already provided configuredPlayers, enrich them with pool data.
      // Otherwise, fetch the whole batch from the pool.
      toast.loading("Setting up players...", { id: startToastId });
      try {
        const needCount = finalConfiguredPlayers.length > 0 ? finalConfiguredPlayers.length : (playerCount || 6);
        const excludeNames = finalConfiguredPlayers.map((p) => p.name).join(",");
        const poolRes = await fetch(
          `/api/characters/pool?count=${needCount}&exclude=${encodeURIComponent(excludeNames)}&style=${encodeURIComponent(typeof window !== 'undefined' ? (localStorage.getItem('avatar_style_pack') ?? 'semi-realistic') : 'semi-realistic')}`,
          { signal: abortCtrl.signal }
        );
        if (poolRes.ok) {
          const poolData = await poolRes.json();
          const poolChars: Array<{ name: string; gender?: string; personality?: string; background?: string; avatar_url?: string; voice_id?: string }> = poolData.characters ?? [];

          if (finalConfiguredPlayers.length > 0) {
            // Enrich LLM-configured players with pool avatars/voices, matched by index
            finalConfiguredPlayers = finalConfiguredPlayers.map((cp, i) => ({
              ...cp,
              avatar_url: cp.avatar_url ?? poolChars[i]?.avatar_url,
              voice_id: cp.voice_id ?? poolChars[i]?.voice_id,
            }));
          } else if (poolChars.length > 0) {
            // No LLM config: use pool characters directly
            finalConfiguredPlayers = poolChars;
            finalPlayerCount = poolChars.length;
            setConfiguredPlayers(poolChars);
            if (playerCount === 0) setPlayerCount(finalPlayerCount);
          } else {
            // Pool empty — fall back to LLM generation
            throw new Error("Pool empty");
          }
        } else {
          throw new Error(`Pool API ${poolRes.status}`);
        }
      } catch (poolErr) {
        console.warn('[Game Master] Pool fetch failed, falling back to generate-players:', poolErr);
        // Fallback: generate players via LLM if pool is unavailable
        if (finalConfiguredPlayers.length === 0) {
          try {
            const response = await fetch('/api/generate-players', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: abortCtrl.signal,
              body: JSON.stringify({
                playerCount: playerCount || 0,
                gameTemplate: selectedTemplate?.id || "custom",
                rules: customRules,
                minPlayers: selectedTemplate?.minPlayers ?? 2,
                maxPlayers: selectedTemplate?.maxPlayers ?? 20,
              }),
            });
            if (response.ok) {
              const data = await response.json();
              finalConfiguredPlayers = data.players;
              finalPlayerCount = data.players?.length ?? (selectedTemplate ? Math.round((selectedTemplate.minPlayers + selectedTemplate.maxPlayers) / 2) - 1 : 6);
              setConfiguredPlayers(data.players);
              if (playerCount === 0) setPlayerCount(finalPlayerCount);
            } else {
              console.error('[Game Master] ❌ Player generation failed. Status:', response.status);
              toast.warning("⚠️ Player setup failed. The game will start with no AI players.", { id: startToastId, duration: 5000 });
            }
          } catch (genErr) {
            console.error('Error generating players:', genErr);
            toast.warning("⚠️ Player generation error. The game will start with no AI players.", { id: startToastId, duration: 5000 });
          }
        }
      }
      type GeneratedHost = { name: string; personality: string; voiceStyle: string; systemPrompt: string; icon: string; color: string; gender?: 'male' | 'female' | 'other' };
      let generatedHostData: GeneratedHost | null = null;
      setCreatingStep("Generating game host…");
      toast.loading("Generating host...", { id: startToastId });
      try {
        const response = await fetch('/api/generate-host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            gameRules: customRules,
            gameName: gameName || selectedTemplate?.name || "Custom Game"
          })
        });
        if (response.ok) {
          const host = await response.json() as GeneratedHost;
          generatedHostData = host;
          setSessions(prev => prev.map(s =>
            s.id === currentSessionId ? { ...s, generatedHost: host } : s
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
      setCreatingStep("Setting up game room…");
      toast.dismiss(startToastId);
      const tid = selectedTemplate?.id || "custom";
      const defaultChannelsByTemplate: Record<string, NonNullable<GameConfig["channels"]>> = {
        werewolf: [
          { id: "general", name: "General", roomType: "public" },
          { id: "werewolves-only", name: "Werewolves only", roomType: "decision" },
        ],
        mafia: [
          { id: "general", name: "General", roomType: "public" },
          { id: "mafia-only", name: "Mafia only", roomType: "decision" },
        ],
        undercover: [{ id: "general", name: "General", roomType: "public" }],
        custom: [{ id: "general", name: "General", roomType: "public" }],
      };
      const gameConfig: GameConfig = {
        template: tid as "werewolf" | "undercover" | "custom",
        playerCount: finalPlayerCount || playerCount || (selectedTemplate ? Math.round((selectedTemplate.minPlayers + selectedTemplate.maxPlayers) / 2) - 1 : 6),
        rules: customRules,
        name: gameName || selectedTemplate?.name || "Custom Game",
        hostId: selectedHostId,
        tone: "balanced",
        hideRolesInPlayerList: tid === "werewolf" || tid === "mafia",
        configuredPlayers: finalConfiguredPlayers.length > 0 ? finalConfiguredPlayers : undefined,
        generatedHost: generatedHostData || undefined,
        channels: (gmChannels && gmChannels.length > 0) ? gmChannels : (defaultChannelsByTemplate[tid] ?? defaultChannelsByTemplate.custom),
      };
      await onCreateGame(gameConfig);
    } finally {
      setIsStartingGame(false);
      setCreatingStep("");
      startGameAbortRef.current = null;
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
      
      {/* Session History Sidebar — desktop only */}
      <div className="hidden md:flex flex-shrink-0 w-60 border-r border-white/5 bg-black/50 backdrop-blur-xl flex-col relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-4 border-b border-white/10 relative flex-shrink-0">
          <Button
            onClick={createNewSession}
            className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hidden">
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

      {/* Session History Sheet — mobile only */}
      <Sheet open={mobileSessionsOpen} onOpenChange={setMobileSessionsOpen}>
        <SheetContent
          side="left"
          title="Sessions"
          className="w-72 max-w-[85vw] p-0 gap-0 border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl flex flex-col [&>button:last-child]:hidden"
        >
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <Button
              onClick={() => { createNewSession(); setMobileSessionsOpen(false); }}
              className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hidden">
            <div className="p-2 space-y-1 w-full">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-lg transition-all duration-200 overflow-hidden ${
                    currentSessionId === session.id
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <button
                    onClick={() => { loadSession(session.id, undefined, true); setMobileSessionsOpen(false); }}
                    className="w-full min-w-0 p-3 text-left"
                  >
                    <div className="text-sm font-medium text-white mb-0.5 line-clamp-1">
                      {session.title}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
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
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Game Document Sheet — mobile only */}
      <Sheet open={mobileRulesOpen} onOpenChange={setMobileRulesOpen}>
        <SheetContent
          side="right"
          title="Game Document"
          className="w-[85vw] max-w-sm p-0 gap-0 border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl flex flex-col [&>button:last-child]:hidden"
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
            <h2 className="text-base font-bold text-white flex-1">Game Document</h2>
            {isRulesBeingEdited && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-medium">AI editing...</span>
              </div>
            )}
          </div>
          <div className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 transition-opacity ${isRulesBeingEdited ? "opacity-70 pointer-events-none" : ""}`}>
            <EditorContent editor={gameDocEditor} />
          </div>
          {(() => {
            const rulesEmpty = checkRulesEmpty(customRules);
            return (
              <div className="px-4 py-3 border-t border-white/10 flex-shrink-0 flex flex-col gap-1.5">
                <Button
                  onClick={() => { setMobileRulesOpen(false); handleStartGame(); }}
                  disabled={isRulesBeingEdited || isStartingGame || rulesEmpty}
                  className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingGame ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                      Creating…
                    </span>
                  ) : "Create Room"}
                </Button>
                {isStartingGame && creatingStep && (
                  <p className="text-xs text-violet-400/80 text-center animate-pulse">
                    {creatingStep} <span className="text-zinc-500">(~1–2 min)</span>
                  </p>
                )}
                {rulesEmpty && !isStartingGame && (
                  <p className="text-xs text-zinc-500 text-center">Chat with GM to generate rules first.</p>
                )}
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Main Chat Area + resizable split */}
      <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
      <div className="flex flex-col min-w-0 min-h-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-orange-500/5" />
          <div className="h-14 sm:h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between relative gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile sessions toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden flex-shrink-0 h-10 w-10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={() => setMobileSessionsOpen(true)}
                aria-label="View sessions"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-xl rounded-full" />
                <GeneratedAvatar
                  name="Game Master"
                  type="gm"
                  className="h-9 w-9 sm:h-12 sm:w-12 border-2 border-white/10 shadow-xl shadow-amber-500/20 relative"
                  fallbackColor="#f59e0b"
                  fallback={<Sparkles className="h-4 w-4 sm:h-6 sm:w-6 animate-pulse" />}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-semibold text-white tracking-tight truncate">Game Master</h1>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium truncate">
                  {isGMTyping || isStreaming ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-400/90">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Thinking...
                    </span>
                  ) : conversationState === "greeting" || conversationState === "game-type" ? (
                    "Describe a game or browse templates"
                  ) : conversationState === "completed" ? (
                    "Ready to start!"
                  ) : (
                    "Fine-tuning your game rules…"
                  )}
                </p>
              </div>
            </div>
            {/* Browse Templates shortcut */}
            <Link href="/discover" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white hover:bg-white/10 gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Templates
              </Button>
            </Link>
            {/* Right: Game Document + Create Room — mobile only */}
            <div className="lg:hidden flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 relative flex-shrink-0"
                onClick={() => setMobileRulesOpen(true)}
                aria-label="Game Document"
              >
                <FileText className="h-4 w-4" />
                {isRulesBeingEdited && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Button>
              {(() => {
                const rulesEmpty = checkRulesEmpty(customRules);
                return (
                  <Button
                    size="sm"
                    onClick={handleStartGame}
                    disabled={isRulesBeingEdited || isStartingGame || rulesEmpty}
                    className="h-9 px-2.5 sm:px-3.5 rounded-[11px] bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 gap-1.5"
                  >
                    {isStartingGame ? (
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      <>
                        <Play className="h-3 w-3 flex-shrink-0 sm:hidden" />
                        <span>Create Room</span>
                      </>
                    )}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Chat Messages — native scroll for iOS touch support */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain select-text">
          <div className="max-w-none mx-auto py-4 sm:py-10 px-3 sm:px-6 md:px-8 space-y-4 sm:space-y-6">
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
                  className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
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
                      className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-white/10 shadow-lg relative border-amber-500/20"
                      fallbackColor="#f59e0b"
                      fallback={<Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    />
                    ) : (
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 shadow-lg relative border-violet-500/20">
                        {userAvatarUrl ? (
                          <AvatarImage src={userAvatarUrl} alt="You" className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 via-indigo-500 to-violet-600 text-white font-semibold text-[10px] sm:text-xs">
                          YOU
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
                    <div className={`max-w-[88%] sm:max-w-[82%] ${isUser ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`rounded-xl sm:rounded-2xl px-3 py-2.5 sm:px-5 sm:py-4 shadow-lg backdrop-blur-xl relative overflow-hidden ${
                          message.role === "gm"
                            ? "bg-zinc-800/80 border border-white/[0.08] text-zinc-100"
                            : "bg-violet-600/85 border border-white/10 text-white"
                        } ${isStreamingMsg ? "ring-1 ring-amber-500/20" : ""}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                        <div className="text-sm sm:text-[15px] leading-relaxed relative z-10 font-normal select-text">
                          {formatMessage(message.role === "gm" ? cleanGMMessageContentForDisplay(message.content) : message.content)}
                        </div>
                      </div>
                      <div className={`text-[10px] sm:text-[11px] text-zinc-500 mt-1 ${isUser ? "pr-1" : "pl-1"}`}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input */}
        {conversationState !== "completed" && (
          <div className="px-3 py-3 sm:p-5 border-t border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            
            <div className="max-w-none mx-auto relative space-y-2 sm:space-y-3">
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
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1.5">
                        {displayChips.map((chip) => (
                          <button
                            key={chip.value}
                            type="button"
                            title={chip.fullLabel ?? chip.label}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs leading-none transition-all"
                            onClick={() => {
                              const text = chip.fullLabel ?? chip.label;
                              setInput(text);
                              requestAnimationFrame(() => { inputRef.current?.focus(); resizeInput(); });
                            }}
                          >
                            <span className="text-violet-400/60 text-[10px]">⚡</span>
                            {chip.label}
                          </button>
                        ))}
                      </div>
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
                        className="bg-white/5 backdrop-blur-xl border border-white/10 focus:border-violet-500/40 text-white placeholder:text-zinc-500 text-base sm:text-sm rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 font-normal transition-all duration-200 relative shadow-md focus:shadow-lg focus:shadow-violet-500/10 disabled:opacity-70 disabled:cursor-not-allowed resize-none leading-relaxed scrollbar-hide"
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
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-200 disabled:opacity-50 disabled:shadow-none bg-zinc-700/80 hover:bg-zinc-600/80 border border-white/10 hover:border-white/20"
                      title="Voice input"
                    >
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 text-zinc-300" />
                    </Button>
                    <Button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isGMTyping}
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 bg-violet-600 hover:bg-violet-500 border border-violet-500/30 hover:border-violet-400/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
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
          onSplitDragStart(e);
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
                  const rulesEmpty = checkRulesEmpty(customRules);
                  return (
                    <>
                      <Button
                        onClick={handleStartGame}
                        disabled={isRulesBeingEdited || isStartingGame || rulesEmpty}
                        className="ml-auto shrink-0 h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStartingGame ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                            Creating…
                          </span>
                        ) : "Create Room"}
                      </Button>
                      {isStartingGame && creatingStep && (
                        <p className="w-full text-xs text-violet-400/80 mt-1.5 text-right animate-pulse">
                          {creatingStep} <span className="text-zinc-500">(~1–2 min)</span>
                        </p>
                      )}
                      {rulesEmpty && !isStartingGame && (
                        <p className="w-full text-xs text-zinc-500 mt-1.5 text-right">Chat with GM to generate rules first.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            <div className={`flex-1 overflow-auto min-h-0 px-4 py-4 transition-opacity ${isRulesBeingEdited ? "opacity-70 pointer-events-none" : ""}`}>
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

      <OutOfCreditsModal
        open={showOutOfCredits}
        onClose={() => setShowOutOfCredits(false)}
      />
    </div>
  );
}