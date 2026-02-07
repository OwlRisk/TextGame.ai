"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Send, AlertCircle, User, Mic, MicOff, X, Check, Mail, ChevronDown, ChevronUp, Plus, Lock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { useVoiceInput } from "@/lib/voice";
import { VoiceWaveform } from "@/app/components/voice-waveform";
import { Player } from "@/app/components/player-panel";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";

// Helper function to parse inline formatting (bold, italic, code)
function parseInlineFormatting(text: string): JSX.Element[] {
  const parts: (string | JSX.Element)[] = [];
  let currentIndex = 0;
  
  // Match **bold**, *italic*, `code`, and ~~strikethrough~~
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
    { regex: /\*(.*?)\*/g, type: 'italic' },
    { regex: /`(.*?)`/g, type: 'code' },
    { regex: /~~(.*?)~~/g, type: 'strikethrough' },
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
      parts.push(<em key={`italic-${i}`} className="italic text-zinc-200">{match.content}</em>);
    } else if (match.type === 'code') {
      parts.push(<code key={`code-${i}`} className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-[13px] font-mono text-violet-300 border border-zinc-700/50">{match.content}</code>);
    } else if (match.type === 'strikethrough') {
      parts.push(<span key={`strike-${i}`} className="line-through text-zinc-400">{match.content}</span>);
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

// Format message content with markdown-like syntax
function formatMessage(content: string): JSX.Element {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      elements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    // Headers
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

    // Lists
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
    
    // Regular paragraph
    elements.push(
      <div key={index} className="mb-1.5 leading-relaxed">
        {parseInlineFormatting(trimmedLine)}
      </div>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

function PrivateMessagesSection({ messages, label = "Private from Host" }: { messages: Array<{ id: string; from: string; content: string; timestamp: Date }>; label?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-lg border border-violet-500/40 bg-gradient-to-br from-violet-950/40 via-[#1a0820]/40 to-violet-900/30 overflow-hidden backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-violet-200 hover:bg-violet-500/10"
      >
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {label} ({messages.length})
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-40 overflow-y-auto">
          {messages.map((pm) => (
            <div key={pm.id} className="rounded-md bg-zinc-800/80 px-2.5 py-2 text-sm">
              <div className="flex items-center gap-2 text-xs text-violet-400 mb-1">
                <span>{pm.from}</span>
                <span>{pm.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-zinc-200 break-words">{pm.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
  isSystemMessage?: boolean;
  isStreaming?: boolean; // True while message is being generated (typewriter effect)
  isPrivate?: boolean; // True for private messages from Host to this player only
}

interface ChatAreaProps {
  channelName: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isGameActive: boolean;
  currentSpeakerId?: string | null;
  userId: string;
  players?: Player[];
  typingUsers?: { name: string; avatar: string }[];
  gameId?: string;
  onOpenPlayerBoard?: () => void;
  onHostPostEvent?: (eventDescription: string, opts?: { nextSpeakerId?: string | null; setPhase?: string; autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: string } }) => void;
  onHostAssignSpeaker?: (playerId: string | null) => void;
  onHostEliminate?: (playerId: string) => void;
  onHostRevealRole?: (playerId: string) => void;
  isUserHost?: boolean;
  gamePhaseLabel?: string;
  alivePlayers?: Player[];
  lastVotedOutId?: string | null;
  /** Quick reply chips shown above input (e.g. "Ready!" when Host asks) */
  quickReplies?: string[];
  /** When it's user's turn in intro (host + others spoke, user hasn't), show this hint */
  introYourTurnHint?: string;
  /** One-click reply text shown next to intro your-turn hint (e.g. "准备好了！" / "Ready!") */
  introYourTurnReply?: string;
  /** When everyone has spoken in intro, show this hint above quick replies */
  introEveryoneSpokenHint?: string;
  /** AI-generated suggestion prompts (e.g. theme, round length) — shown as tappable chips */
  aiSuggestedPrompts?: string[];
  /** Label for AI suggestions row (e.g. "AI 建议" or "AI suggestions") */
  aiSuggestionsLabel?: string;
}

export function ChatArea({ 
  channelName, 
  messages, 
  onSendMessage,
  isGameActive,
  currentSpeakerId,
  userId,
  players = [],
  typingUsers,
  gameId,
  onOpenPlayerBoard,
  onHostPostEvent,
  onHostAssignSpeaker,
  onHostEliminate,
  onHostRevealRole,
  isUserHost = false,
  gamePhaseLabel,
  alivePlayers = [],
  lastVotedOutId,
  quickReplies = [],
  introYourTurnHint,
  introYourTurnReply,
  introEveryoneSpokenHint,
  aiSuggestedPrompts = [],
  aiSuggestionsLabel = 'AI suggestions',
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [quickReplyOpen, setQuickReplyOpen] = useState(true);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput();
  const { isRecording, isTranscribing, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

  const MIN_INPUT_HEIGHT = 40;
  const MAX_INPUT_HEIGHT = 120;

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
    const newH = Math.min(Math.max(scrollH, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT);
    
    // Set the new height
    el.style.height = `${newH}px`;
    
    // Show overflow only if content exceeds max height
    el.style.overflow = scrollH > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
    
    // Restore scroll position if needed
    if (scrollTop > 0) {
      el.scrollTop = scrollTop;
    }
  }, []);

  // Resize on input change (fallback for voice input)
  useEffect(() => {
    if (isRecording && voiceTranscript) {
      requestAnimationFrame(() => {
        resizeInput();
      });
    }
  }, [voiceTranscript, isRecording, resizeInput]);

  // Initialize height on mount
  useEffect(() => {
    if (inputRef.current) {
      resizeInput();
    }
  }, [resizeInput]);

  // Debounce scroll to prevent flickering when many messages arrive rapidly
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollMessagesRef = useRef(0);
  useEffect(() => {
    if (!scrollRef.current) return;
    const lastFromUser = messages.length > 0 && messages[messages.length - 1]?.senderId === userId;
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      if (scrollRef.current && messages.length !== lastScrollMessagesRef.current) {
        lastScrollMessagesRef.current = messages.length;
        // Use instant scroll when user just sent (avoid smooth animation jitter)
        scrollRef.current.scrollIntoView({ behavior: lastFromUser ? "auto" : "smooth", block: "end" });
      }
    }, lastFromUser ? 50 : 150);
    return () => { if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current); };
  }, [messages, typingUsers, userId]);

  // Listen for focus input event (when user is prompted to speak)
  useEffect(() => {
    const handleFocusInput = () => {
      if (inputRef.current && !isRecording) {
        inputRef.current.focus();
        // Subtle focus highlight (outline doesn't cause layout shift)
        inputRef.current.classList.add('outline', 'outline-2', 'outline-amber-500', 'outline-offset-2');
        setTimeout(() => {
          inputRef.current?.classList.remove('outline', 'outline-2', 'outline-amber-500', 'outline-offset-2');
        }, 2000);
      }
    };
    
    window.addEventListener('focusGameInput', handleFocusInput);
    return () => window.removeEventListener('focusGameInput', handleFocusInput);
  }, [isRecording]);

  const handleSendRef = useRef<(override?: string) => void>();
  const sendingLockRef = useRef(false);
  handleSendRef.current = (override?: string) => {
    if (sendingLockRef.current) return;
    const text = (override ?? input.trim()).trim();
    if (text) {
      sendingLockRef.current = true;
      flushSync(() => setInput(""));
      onSendMessage(text);
      requestAnimationFrame(() => resizeInput());
      setTimeout(() => {
        sendingLockRef.current = false;
      }, 400);
    }
  };

  // Safety: clear input when user's message was just added and input still shows it (handles edge cases)
  const prevMsgLenRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgLenRef.current) {
      prevMsgLenRef.current = messages.length;
      const last = messages[messages.length - 1];
      if (last?.senderId === userId && input.trim() && last.content.trim() === input.trim()) {
        setInput("");
      }
    } else {
      prevMsgLenRef.current = messages.length;
    }
  }, [messages, userId, input]);
  const handleSend = useCallback((override?: string) => {
    handleSendRef.current?.(override);
  }, [onSendMessage]);

  const canSend = !isGameActive || !currentSpeakerId || currentSpeakerId === userId;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-zinc-900/90 via-[#0f0818]/95 to-zinc-900/90 min-w-0 h-full overflow-hidden backdrop-blur-sm">
      {/* Channel Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-400 text-lg">#</span>
          <h2 className="font-semibold text-base text-white">{channelName}</h2>
          {gamePhaseLabel && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {gamePhaseLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onOpenPlayerBoard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenPlayerBoard}
              className="hover:bg-zinc-700 text-zinc-300 hover:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              My Board
            </Button>
          )}
        </div>
      </div>

      {/* Messages - min-h-0 allows flex child to shrink so scroll works */}
      <ScrollArea className="flex-1 min-h-0 px-6">
        <div className="py-6 space-y-5">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            if (message.isSystemMessage) {
              return (
                <div key={message.id} className="my-5">
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#1a0f0a]/10 to-orange-500/5 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-amber-100/95 leading-snug">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            }

            // Private message styling (🔒 only visible to you)
            if (message.isPrivate) {
              return (
                <div key={message.id} className="my-5">
                  <div className="flex items-start gap-3 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/50 via-[#1a0820]/40 to-violet-900/20 px-4 py-3 shadow-md backdrop-blur-sm">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                      <Lock className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-violet-300">{message.senderName}</span>
                        <span className="inline-flex items-center justify-center leading-none min-h-[18px] px-2 py-0.5 bg-violet-500/30 border border-violet-400/40 rounded shrink-0 text-[10px] font-bold text-violet-200 uppercase tracking-wide">
                          Private
                        </span>
                        <span className="text-[11px] text-violet-400/60 ml-auto shrink-0">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-violet-100 text-sm leading-[1.65] break-words">
                        {message.content?.trim() ? formatMessage(message.content) : <span className="italic text-violet-400/60">(No content)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const messagePlayer = showAvatar ? players.find(
              p => p.id === message.senderId || p.name === message.senderName
            ) : null;
            const isHost = messagePlayer?.isGameMaster || (messagePlayer && getAvatarPropsForPlayer(messagePlayer).type === "host");

            return (
              <div key={message.id} className={showAvatar ? "mt-5" : "mt-2"}>
                {showAvatar ? (
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0" title={message.senderName}>
                      {(() => {
                        const player = messagePlayer;
                        const avatarColor = player?.avatar || message.senderAvatar;
                        const avatarProps = getAvatarPropsForPlayer(player);
                        return (
                          <GeneratedAvatar
                            {...avatarProps}
                            name={avatarProps.name || message.senderName}
                            gameId={gameId}
                            enabled={true}
                            className="h-11 w-11"
                            fallbackColor={avatarColor}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                          <span
                            className={`font-semibold text-sm shrink-0 ${
                              isHost ? "text-amber-300" : message.senderId === userId ? "text-blue-200" : "text-white"
                            }`}
                          >
                            {message.senderName}
                          </span>
                          {isHost && (
                            <span className="inline-flex items-center justify-center leading-none min-h-[20px] px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shrink-0 text-[10px] font-bold text-white uppercase tracking-wide shadow-sm">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500 shrink-0" aria-hidden="true">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`text-zinc-100 text-sm break-words ${isHost ? "leading-[1.65] rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : "leading-relaxed"}`}
                      >
                        {message.content?.trim() ? formatMessage(message.content) : <span className="italic text-zinc-500">(No content)</span>}
                        {message.isStreaming && (
                          <span className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-11 flex-shrink-0" />
                    <div className={`flex-1 text-zinc-100 text-sm leading-relaxed break-words ${isHost ? "rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : ""}`}>
                      {message.content?.trim() ? formatMessage(message.content) : <span className="italic text-zinc-500">(No content)</span>}
                      {message.isStreaming && (
                        <span className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Typing Indicator - hide when that user already has a streaming message (avoid duplicate display) */}
          {typingUsers && typingUsers.length > 0 && !messages.some(m => 
            m.senderName === typingUsers[0].name && m.isStreaming
          ) && (
            <div className="flex gap-3 mt-4">
              {typingUsers[0].name === "You" ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback
                    className="text-sm font-semibold text-white"
                    style={{ backgroundColor: typingUsers[0].avatar }}
                  >
                    {typingUsers[0].name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                (() => {
                  // Find the player by name to get background and avatar
                  const player = players.find(p => p.name === typingUsers[0].name);
                  // Use player.avatar if available, otherwise fall back to typingUsers avatar
                  const avatarColor = player?.avatar || typingUsers[0].avatar;
                  const avatarProps = getAvatarPropsForPlayer(player);
                  return (
                    <GeneratedAvatar
                      {...avatarProps}
                      name={avatarProps.name || typingUsers[0].name}
                      gameId={gameId}
                      enabled={true}
                      className="h-10 w-10 flex-shrink-0"
                      fallbackColor={avatarColor}
                    />
                  );
                })()
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{typingUsers[0].name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-5 border-t border-violet-900/20 bg-zinc-900/50 backdrop-blur-md">
        {!canSend && isGameActive && !isRecording && (
          <div className="mb-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Wait for your turn to speak
          </div>
        )}
        {voiceError && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 px-3 py-2 backdrop-blur-sm">
            <span className="text-xs text-red-300">{voiceError}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-300 hover:bg-red-500/20" onClick={voiceCancel}>Close</Button>
              <Button size="sm" className="h-7 px-2 bg-red-600 hover:bg-red-500" onClick={() => { voiceCancel(); setTimeout(voiceStart, 100); }}>Retry</Button>
            </div>
          </div>
        )}
        {introYourTurnHint && canSend && !isRecording && (
          <div className="mb-2 flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-sm">
            <span className="text-sm text-amber-200">{introYourTurnHint}</span>
            {introYourTurnReply && (
              <Button
                size="sm"
                className="h-8 px-4 text-sm bg-amber-500 hover:bg-amber-500/90 text-zinc-900 font-medium shrink-0"
                onClick={() => handleSend(introYourTurnReply)}
              >
                {introYourTurnReply}
              </Button>
            )}
          </div>
        )}
        {introEveryoneSpokenHint && canSend && !isRecording && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-sm text-emerald-200 backdrop-blur-sm">
            {introEveryoneSpokenHint}
          </div>
        )}
        {aiSuggestedPrompts.length > 0 && canSend && !isRecording && (
          <div className="mb-2 rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-zinc-500">✨</span>
                {aiSuggestionsLabel} ({aiSuggestedPrompts.length})
              </span>
              {aiSuggestionsOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </button>
            {aiSuggestionsOpen && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {aiSuggestedPrompts.map((text) => (
                    <Button
                      key={text}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm border-zinc-600/80 bg-zinc-700/40 hover:bg-zinc-600/50 text-zinc-300 hover:text-zinc-200"
                      onClick={() => handleSend(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {quickReplies.length > 0 && canSend && !isRecording && (
          <div className="mb-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setQuickReplyOpen(!quickReplyOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-zinc-500">⚡</span>
                Quick reply ({quickReplies.length})
              </span>
              {quickReplyOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </button>
            {quickReplyOpen && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((text) => (
                    <Button
                      key={text}
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-sm border-zinc-600/80 bg-zinc-700/40 hover:bg-zinc-600/50 text-zinc-300 hover:text-zinc-200 rounded-lg transition-colors"
                      onClick={() => handleSend(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {(isRecording || isTranscribing) && !voiceError ? (
          <div className="relative w-full px-1">
            <div
              className="flex items-center gap-2 w-full rounded-full bg-zinc-800/90 border border-violet-900/30 px-2 py-2 shadow-lg backdrop-blur-md"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors"
                onClick={voiceCancel}
                disabled={isTranscribing}
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0 relative flex items-center h-10 px-3">
                <VoiceWaveform 
                  analyser={voice.liveAnalyser}
                  duration={voice.duration}
                  className="w-full h-full"
                  waveColor="rgba(255, 255, 255, 0.85)"
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="flex-shrink-0 h-10 w-10 rounded-full bg-white hover:bg-zinc-100 text-zinc-900 disabled:opacity-40 shadow-lg transition-all"
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
          <div className="flex gap-2 items-end">
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
                  if (canSend) handleSend();
                }
              }}
              placeholder={`Message #${channelName}`}
              className="min-h-0 bg-zinc-800/80 backdrop-blur-sm border border-violet-900/30 focus:border-amber-500/40 text-white placeholder:text-zinc-500 py-2 px-3 text-sm flex-1 resize-none leading-relaxed scrollbar-hide rounded-lg transition-colors"
              style={{ 
                minHeight: `${MIN_INPUT_HEIGHT}px`, 
                maxHeight: `${MAX_INPUT_HEIGHT}px`
              }}
              disabled={!canSend}
              rows={1}
            />
            {voiceSupported && (
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0 bg-zinc-700/80 hover:bg-zinc-600 backdrop-blur-sm border border-violet-900/20"
                disabled={!canSend}
                onClick={voiceStart}
                title="Voice input"
              >
                <Mic className="h-4 w-4 text-zinc-300" />
              </Button>
            )}
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || !canSend}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-500 h-10 w-10 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}