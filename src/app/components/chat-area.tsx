"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertCircle, User, Mic, MicOff, X, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { useVoiceInput } from "@/lib/voice";
import { Player } from "@/app/components/player-panel";

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
  onOpenPlayerBoard?: () => void;
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
  onOpenPlayerBoard
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceInput();
  const { isRecording, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const handleSend = (override?: string) => {
    const text = override ?? input.trim();
    if (text) {
      onSendMessage(text);
      setInput("");
    }
  };

  const canSend = !isGameActive || !currentSpeakerId || currentSpeakerId === userId;

  return (
    <div className="flex-1 flex flex-col bg-zinc-700">
      {/* Channel Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-zinc-900/50 bg-zinc-800/50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-400 text-lg">#</span>
          <h2 className="font-semibold text-base text-white">{channelName}</h2>
        </div>
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

            return (
              <div key={message.id} className={showAvatar ? "mt-5" : "mt-2"}>
                {showAvatar ? (
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      {message.senderId === userId || message.senderName === "You" ? (
                        <Avatar className="h-11 w-11">
                          <AvatarFallback
                            className="text-sm font-semibold text-white"
                            style={{ backgroundColor: message.senderAvatar }}
                          >
                            {message.senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        (() => {
                          // Find the player by senderId or senderName to get background
                          const player = players.find(
                            p => p.id === message.senderId || p.name === message.senderName
                          );
                          return (
                            <GeneratedAvatar
                              name={message.senderName}
                              type={message.senderId === "gm-1" ? "host" : "player"}
                              background={
                                player?.isGameMaster
                                  ? (player?.background ?? undefined)
                                  : player?.background ?? `Social deduction game player. Role: ${player?.role ?? "Player"}.`
                              }
                              className="h-11 w-11"
                              fallbackColor={message.senderAvatar}
                            />
                          );
                        })()
                      )}
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-2 ring-zinc-700 hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-semibold text-white text-sm">{message.senderName}</span>
                        <span className="text-xs text-zinc-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-zinc-100 text-sm leading-relaxed break-words">{message.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-11 flex-shrink-0" />
                    <div className="flex-1 text-zinc-100 text-sm leading-relaxed break-words">{message.content}</div>
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
                  // Find the player by name to get background
                  const player = players.find(p => p.name === typingUsers[0].name);
                  return (
                    <GeneratedAvatar
                      name={typingUsers[0].name}
                      type={player?.isGameMaster ? "host" : "player"}
                      background={
                        player?.isGameMaster
                          ? (player?.background ?? undefined)
                          : player?.background ?? `Social deduction game player. Role: ${player?.role ?? "Player"}.`
                      }
                      className="h-10 w-10 flex-shrink-0"
                      fallbackColor={typingUsers[0].avatar}
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
            <Button size="sm" className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50" disabled={!voiceTranscript.trim()} onClick={() => { handleSend(voiceTranscript.trim()); voiceConfirm(); }}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={isRecording && voiceTranscript ? voiceTranscript : input}
            onChange={(e) => !isRecording && setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canSend && !isRecording && handleSend()}
            placeholder={isRecording ? "Speaking…" : `Message #${channelName}`}
            className="bg-zinc-600 border-none text-white placeholder:text-zinc-400 h-11 text-sm flex-1"
            disabled={!canSend || isRecording}
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
            className="bg-indigo-600 hover:bg-indigo-500 h-11 w-11 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}