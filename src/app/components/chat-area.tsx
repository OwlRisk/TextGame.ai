"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AlertCircle, User, Mic, MicOff, X, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { useVoiceInput } from "@/lib/voice";
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

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isAI: boolean;
  isSystemMessage?: boolean;
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
  lastVotedOutId
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput();
  const { isRecording, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

  const MIN_INPUT_HEIGHT = 44;
  const MAX_INPUT_HEIGHT = 160;

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  // Listen for focus input event (when user is prompted to speak)
  useEffect(() => {
    const handleFocusInput = () => {
      if (inputRef.current && !isRecording) {
        inputRef.current.focus();
        // Flash the input border for attention
        inputRef.current.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2', 'ring-offset-zinc-700');
        setTimeout(() => {
          inputRef.current?.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-2', 'ring-offset-zinc-700');
        }, 2000);
      }
    };
    
    window.addEventListener('focusGameInput', handleFocusInput);
    return () => window.removeEventListener('focusGameInput', handleFocusInput);
  }, [isRecording]);

  const handleSendRef = useRef<(override?: string) => void>();
  handleSendRef.current = (override?: string) => {
    const text = override ?? input.trim();
    if (text) {
      // Clear input immediately to prevent double submission
      setInput("");
      onSendMessage(text);
      // Reset height after clearing input
      requestAnimationFrame(() => {
        resizeInput();
      });
    }
  };
  const handleSend = useCallback((override?: string) => {
    handleSendRef.current?.(override);
  }, [onSendMessage]);

  const canSend = !isGameActive || !currentSpeakerId || currentSpeakerId === userId;

  return (
    <div className="flex-1 flex flex-col bg-zinc-700 min-w-0 h-full overflow-hidden">
      {/* Channel Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-zinc-900/50 bg-zinc-800/50 shadow-sm">
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
          {/* Host Actions menu removed - these actions are now controlled automatically by AI host */}
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

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-5">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            if (message.isSystemMessage) {
              return (
                <div key={message.id} className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-zinc-600" />
                  <div className="flex items-center gap-2 text-xs text-zinc-400 px-3">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{message.content}</span>
                  </div>
                  <div className="flex-1 h-px bg-zinc-600" />
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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5 min-h-[1.375rem]">
                        <span
                          className={`font-semibold text-sm shrink-0 leading-tight ${
                            isHost
                              ? "text-amber-200"
                              : message.senderName === "You"
                                ? "text-violet-300"
                                : "text-white"
                          }`}
                        >
                          {message.senderName}
                        </span>
                        {isHost && (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full shrink-0 bg-amber-500/15 text-amber-300 border border-amber-500/40 h-[1.25rem] box-border">
                            <span className="text-[11px] font-semibold uppercase tracking-wide leading-none">HOST</span>
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 shrink-0 leading-tight" aria-hidden="true">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-zinc-100 text-sm leading-relaxed break-words">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-11 flex-shrink-0" />
                    <div className="flex-1 text-zinc-100 text-sm leading-relaxed break-words">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Typing Indicator */}
          {typingUsers && typingUsers.length > 0 && (
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
      <div className="p-5 border-t border-zinc-900/50">
        {!canSend && isGameActive && !isRecording && (
          <div className="mb-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Wait for your turn to speak
          </div>
        )}
        {voiceError && isRecording && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
            <span className="text-xs text-red-300">{voiceError}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-300 hover:bg-red-500/20" onClick={voiceCancel}>Close</Button>
              <Button size="sm" className="h-7 px-2 bg-red-600 hover:bg-red-500" onClick={() => { voiceCancel(); setTimeout(voiceStart, 100); }}>Retry</Button>
            </div>
          </div>
        )}
        {isRecording && !voiceError && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
            <div className="relative w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
              <Mic className="h-3.5 w-3.5 text-white relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-300 mb-0.5">Recording</p>
              <p className="text-sm text-white truncate">{voiceTranscript || "Listening…"}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-300 hover:bg-red-500/20" onClick={voiceCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8 px-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50" disabled={!voiceTranscript.trim()} onClick={() => { handleSend(voiceTranscript.trim()); voiceConfirm(); }}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={isRecording && voiceTranscript ? voiceTranscript : input}
            onChange={(e) => {
              if (!isRecording) {
                setInput(e.target.value);
                // Immediately resize on change
                requestAnimationFrame(() => {
                  resizeInput();
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend && !isRecording) {
                  handleSend();
                }
              }
            }}
            placeholder={isRecording ? "Speaking…" : `Message #${channelName}`}
            className="bg-zinc-600 border-none text-white placeholder:text-zinc-400 py-2.5 px-3 text-sm flex-1 resize-none leading-relaxed scrollbar-hide"
            style={{ 
              minHeight: `${MIN_INPUT_HEIGHT}px`, 
              maxHeight: `${MAX_INPUT_HEIGHT}px`
            }}
            disabled={!canSend || isRecording}
            rows={1}
          />
          {voiceSupported && (
            <Button
              size="icon"
              className={`h-11 w-11 flex-shrink-0 ${isRecording ? "bg-red-600 hover:bg-red-500" : "bg-zinc-600 hover:bg-zinc-500"}`}
              disabled={!canSend}
              onClick={() => {
                if (isRecording) { voiceCancel(); return; }
                voiceStart();
              }}
              title={isRecording ? "Cancel" : "Voice input"}
            >
              {isRecording ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-zinc-300" />}
            </Button>
          )}
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || !canSend || isRecording}
            size="icon"
            className="bg-violet-600 hover:bg-violet-500 h-11 w-11 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}