"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { parseInlineFormatting as parseInlineFormattingShared } from "@/lib/format-message";
import { getPreferredModel } from "@/lib/model-prefs";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_CHIPS: { label: string; value: string }[] = [
  { label: "Werewolf", value: "I want to play Werewolf." },
  { label: "Who's the Spy", value: "I want to play Undercover." },
  { label: "Custom game", value: "I'd like a fully custom social deduction game." },
  { label: "What can I do?", value: "What can I do?" },
];

const WELCOME_CONTENT =
  "Hi! I'm your **Game Master**. I help you design games—when you sign in, the rules panel on the right updates in real time as we discuss. Pick an option below or describe your game idea.";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: WELCOME_CONTENT,
};

function parseInlineFormatting(text: string): (string | React.JSX.Element)[] {
  return parseInlineFormattingShared(text, {
    boldClassName: "font-semibold text-zinc-100",
  }) as (string | React.JSX.Element)[];
}

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-2" />;
        if (/^[•\-*]\s+/.test(t)) {
          const rest = t.replace(/^[•\-*]\s+/, "");
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 shrink-0">•</span>
              <span>{parseInlineFormatting(rest).map((p, j) => (typeof p === "string" ? <span key={j}>{p}</span> : p))}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(t)) {
          const [num, ...rest] = t.split(/\.\s+/);
          const restStr = rest.join(". ");
          return (
            <div key={i} className="flex gap-2">
              <span className="text-violet-400 font-semibold shrink-0">{num}.</span>
              <span>{parseInlineFormatting(restStr).map((p, j) => (typeof p === "string" ? <span key={j}>{p}</span> : p))}</span>
            </div>
          );
        }
        return (
          <div key={i} className="leading-relaxed">
            {parseInlineFormatting(t).map((p, j) => (typeof p === "string" ? <span key={j}>{p}</span> : p))}
          </div>
        );
      })}
    </div>
  );
}

export function IntroRulesChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (messageOverride?: string) => {
    const text = (messageOverride ?? input).trim();
    if (!text || loading) return;

    if (!messageOverride) setInput("");
    setError(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, preferredModel: getPreferredModel() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get a reply.");
      }

      const assistantMsg: ChatMessage = {
        id: `gm-${Date.now()}`,
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const showChips = messages.length <= 1 && !loading;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden flex flex-col shadow-xl backdrop-blur-xl">
      <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20 blur-lg rounded-full" />
          <GeneratedAvatar
            name="Game Master"
            type="gm"
            className="h-10 w-10 border-2 border-white/10 shadow-lg relative border-amber-500/20"
            fallbackColor="#f59e0b"
            fallback={<Sparkles className="h-4 w-4" />}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Game Master</h3>
          <p className="text-xs text-zinc-500">Design your game in conversation — try it below</p>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-[260px] max-h-[380px]">
        <div className="p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div className="relative flex-shrink-0">
                  {msg.role === "assistant" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20 blur-xl rounded-full" />
                  )}
                  {msg.role === "user" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-xl rounded-full" />
                  )}
                  {msg.role === "assistant" ? (
                    <GeneratedAvatar
                      name="Game Master"
                      type="gm"
                      className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-white/10 shadow-lg relative border-amber-500/20"
                      fallbackColor="#f59e0b"
                      fallback={<Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    />
                  ) : (
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border-2 border-violet-500/20 flex items-center justify-center text-white font-semibold text-xs shadow-lg">
                      YOU
                    </div>
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
                  <div className={`max-w-[90%] ${isUser ? "flex flex-col items-end" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur-xl relative overflow-hidden ${
                        msg.role === "assistant"
                          ? "bg-zinc-800/80 border border-white/[0.08] text-zinc-100"
                          : "bg-violet-600/85 border border-white/10 text-white"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                      <div className="text-[15px] leading-relaxed relative z-10">
                        {msg.role === "assistant" ? formatMessageContent(msg.content) : msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20 blur-xl rounded-full" />
                <GeneratedAvatar
                  name="Game Master"
                  type="gm"
                  className="h-9 w-9 border-2 border-white/10 relative border-amber-500/20"
                  fallbackColor="#f59e0b"
                  fallback={<Sparkles className="h-3.5 w-3.5 animate-pulse" />}
                />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-zinc-800/80 border border-white/[0.08] text-zinc-500 text-sm">
                Thinking…
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-400/90 px-1">{error}</p>}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] bg-white/[0.02] space-y-2">
        {showChips && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-violet-500/30 text-zinc-400 hover:text-zinc-200 text-sm transition-colors duration-150"
                onClick={() => send(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Chat with Game Master, design your game rules..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="min-h-[44px] max-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500/40 rounded-xl"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/30"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
