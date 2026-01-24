"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertCircle, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";

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
  typingUsers,
  onOpenPlayerBoard
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
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
                      <div 
                        className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ backgroundColor: message.senderAvatar }}
                      >
                        {message.senderName.substring(0, 2).toUpperCase()}
                      </div>
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
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: typingUsers[0].avatar }}
              >
                {typingUsers[0].name.substring(0, 2).toUpperCase()}
              </div>
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
        {!canSend && isGameActive && (
          <div className="mb-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Wait for your turn to speak
          </div>
        )}
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSend && handleSend()}
            placeholder={`Message #${channelName}`}
            className="bg-zinc-600 border-none text-white placeholder:text-zinc-400 h-11 text-sm"
            disabled={!canSend}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || !canSend}
            size="icon"
            className="bg-indigo-600 hover:bg-indigo-500 h-11 w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}