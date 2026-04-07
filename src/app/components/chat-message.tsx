"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { AlertCircle, Lock, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { formatMessageTime, stripEmotionTags, stripPrivateNotes } from "@/lib/chat-utils";
import { parseInlineFormatting } from "@/lib/format-message";
import { stripDirectiveLines } from "@/lib/game-host-utils";
import type { Player } from "@/types/player";

// ─── Cursor injection ─────────────────────────────────────────────────────
/** Append a trailing node (blinking cursor) inside the last line of formatted content. */
function withCursor(content: React.ReactNode, cursor: React.ReactNode): React.ReactNode {
  if (!content || !React.isValidElement(content)) return <>{content}{cursor}</>;
  const wrapper = content as React.ReactElement<{ children?: React.ReactNode }>;
  const lines = React.Children.toArray(wrapper.props.children);
  if (lines.length === 0) return React.cloneElement(wrapper, {}, cursor);
  const lastLine = lines[lines.length - 1];
  if (!React.isValidElement(lastLine)) {
    return React.cloneElement(wrapper, {}, ...lines, cursor);
  }
  const lastEl = lastLine as React.ReactElement<{ children?: React.ReactNode }>;
  const kids = React.Children.toArray(lastEl.props.children);
  lines[lines.length - 1] = React.cloneElement(lastEl, {}, ...kids, cursor);
  return React.cloneElement(wrapper, {}, ...lines);
}

// ─── Formatting helpers (LRU-cached) ──────────────────────────────────────
const FORMAT_CACHE = new Map<string, React.JSX.Element>();
const FORMAT_CACHE_MAX = 200;

export function formatMessage(content: string): React.JSX.Element {
  const cached = FORMAT_CACHE.get(content);
  if (cached) return cached;
  const result = formatMessageUncached(content);
  FORMAT_CACHE.set(content, result);
  if (FORMAT_CACHE.size > FORMAT_CACHE_MAX) {
    const first = FORMAT_CACHE.keys().next().value;
    if (first !== undefined) FORMAT_CACHE.delete(first);
  }
  return result;
}

function formatMessageUncached(content: string): React.JSX.Element {
  const lines = content.split('\n');
  const elements: React.JSX.Element[] = [];

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

    elements.push(
      <div key={index} className="mb-1.5 leading-relaxed">
        {parseInlineFormatting(trimmedLine)}
      </div>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Message content resolver (handles TTS sync) ─────────────────────────
function resolveContent(syncedContent: string, rawContent: string, voiceEnabled: boolean, inworldTTSSupported: boolean, isAI: boolean) {
  const clean = (s: string) => stripDirectiveLines(stripEmotionTags(stripPrivateNotes(s)));
  if (syncedContent.trim()) {
    const c = clean(syncedContent);
    return c ? formatMessage(c) : null;
  }
  if (voiceEnabled && inworldTTSSupported && isAI && rawContent !== '' && syncedContent === '') return null;
  if (rawContent.trim()) {
    const c = clean(rawContent);
    return c ? formatMessage(c) : null;
  }
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🤔", "😬", "😅"];

export interface ChatMessageProps {
  message: {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    timestamp: Date;
    isAI: boolean;
    isSystemMessage?: boolean;
    isStreaming?: boolean;
    isPrivate?: boolean;
    isAnnouncement?: boolean;
    imageUrl?: string;
    reactions?: Array<{ emoji: string; from: string }>;
  };
  showAvatar: boolean;
  syncedContent: string;
  rawContent: string;
  isShowingCursor: boolean;
  userId: string;
  userAvatarUrl?: string;
  useGeneratedAvatarForUser: boolean;
  humanPlayer?: Player | null;
  userAvatarName: string;
  gameId?: string;
  players: Player[];
  avatarImageUrls: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  gameTemplate?: string;
}

export const ChatMessage = React.memo(function ChatMessage({
  message, showAvatar, syncedContent, rawContent, isShowingCursor,
  userId, userAvatarUrl, useGeneratedAvatarForUser, humanPlayer, userAvatarName,
  gameId, players, avatarImageUrls, onAvatarUrlLoaded, onReact, gameTemplate,
}: ChatMessageProps) {
  if (message.isAnnouncement) {
    return (
      <div className="my-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <span className="text-sm font-bold text-violet-300 uppercase tracking-wider px-3 whitespace-nowrap">
            {message.content}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>
      </div>
    );
  }

  if (message.isSystemMessage) {
    return (
      <div className="my-5">
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

  if (message.isPrivate) {
    return (
      <div className="my-5">
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
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
            <div className="text-violet-100 text-sm leading-[1.65] break-words">
              {resolveContent(syncedContent, rawContent, true, true, message.isAI)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Regular message ──────────────────────────────────────────────────
  const messagePlayer = showAvatar ? players.find(
    p => p.id === message.senderId || (message.isAI && p.name === message.senderName)
  ) : null;
  const isHost = messagePlayer?.isGameMaster || (messagePlayer && getAvatarPropsForPlayer(messagePlayer).type === "host");
  const isSceneNarrator = isHost && gameTemplate === "scene";

  // Scene narrator: render as atmospheric italic narration without avatar/name
  if (isSceneNarrator && !message.isStreaming) {
    const cleanRaw = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(rawContent)));
    if (!cleanRaw.trim()) return null;
    return (
      <div className="my-4 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <div className="text-zinc-300 text-sm italic leading-relaxed [&_strong]:text-zinc-100 [&_em]:text-zinc-200">
          {formatMessage(cleanRaw)}
        </div>
      </div>
    );
  }

  const cursor = isShowingCursor
    ? <span key="streaming-cursor" className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 align-text-bottom animate-pulse" />
    : null;

  const contentBlock = (() => {
    let formatted: React.ReactNode = null;
    const cleanSynced = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(syncedContent)));
    const cleanRaw = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(rawContent)));
    if (cleanSynced.trim()) formatted = formatMessage(cleanSynced);
    else if (cleanRaw.trim()) formatted = formatMessage(cleanRaw);
    else if (!message.isAI && !message.imageUrl && !message.isStreaming) formatted = <span className="italic text-zinc-500">(No content)</span>;

    const body = cursor ? withCursor(formatted, cursor) : formatted;

    return message.imageUrl ? (
      <>
        <div className="my-2 rounded-lg overflow-hidden max-w-[280px] border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={message.imageUrl} alt="" className="w-full h-auto object-cover" />
        </div>
        {body}
      </>
    ) : body;
  })();

  const hostStyle = isHost
    ? "leading-[1.65] rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5"
    : "leading-relaxed";

  // Random delays per emoji — seeded by message id + emoji so they're stable across re-renders
  const reactionDelays = useMemo(() => {
    if (!message.reactions) return {};
    const emojis = [...new Set(message.reactions.map((r) => r.emoji))];
    const delays: Record<string, number> = {};
    emojis.forEach((emoji) => {
      // 1.2s base + 0~2s random, each emoji gets its own stable value
      delays[emoji] = 1.2 + Math.random() * 2;
    });
    return delays;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  const reactionsBlock = message.reactions && message.reactions.length > 0 ? (() => {
    const grouped = new Map<string, string[]>();
    for (const r of message.reactions) {
      const names = grouped.get(r.emoji) ?? [];
      names.push(r.from);
      grouped.set(r.emoji, names);
    }
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {[...grouped.entries()].map(([emoji, names]) => (
          <button
            key={emoji}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 select-none hover:bg-white/10 transition-colors cursor-pointer animate-fade-in"
            style={{ animationDelay: `${reactionDelays[emoji] ?? 1.2}s`, animationFillMode: 'both', opacity: 0 }}
            title={names.join(", ")}
            onClick={() => onReact?.(message.id, emoji)}
          >
            <span className="text-[22px] leading-none">{emoji}</span>
            {names.length > 1 && (
              <span className="text-sm text-zinc-400 font-medium leading-none">{names.length}</span>
            )}
          </button>
        ))}
      </div>
    );
  })() : null;

  const canReact = !!onReact && !message.isStreaming;

  return (
    <div className={`group/msg relative ${showAvatar ? "mt-5" : "mt-2"}`}>
      {canReact && (
        <ReactionPicker
          messageId={message.id}
          onReact={onReact}
        />
      )}
      {showAvatar ? (
        <div className="flex gap-4">
          <div className="relative flex-shrink-0" title={message.senderName}>
            <MessageAvatar
              message={message}
              userId={userId}
              userAvatarUrl={userAvatarUrl}
              useGeneratedAvatarForUser={useGeneratedAvatarForUser}
              humanPlayer={humanPlayer}
              userAvatarName={userAvatarName}
              gameId={gameId}
              messagePlayer={messagePlayer}
              avatarImageUrls={avatarImageUrls}
              onAvatarUrlLoaded={onAvatarUrlLoaded}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 mb-2">
                <span
                  className={`font-semibold text-[15px] shrink-0 ${
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
                {message.senderId === userId && !isHost && (
                  <span className="inline-flex items-center justify-center leading-none min-h-[20px] px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shrink-0 text-[10px] font-bold text-white uppercase tracking-wide shadow-sm">
                    YOU
                  </span>
                )}
                <span className="text-xs text-zinc-500 shrink-0" aria-hidden="true">
                  {formatMessageTime(message.timestamp)}
                </span>
            </div>
            <div className={`text-zinc-100 text-[15px] break-words ${hostStyle}`}>
              {contentBlock}
            </div>
            {reactionsBlock}
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="w-11 flex-shrink-0" />
          <div className={`flex-1 text-zinc-100 text-[15px] leading-relaxed break-words ${isHost ? "rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : ""}`}>
            {contentBlock}
            {reactionsBlock}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Emoji grid for the "+" popover ────────────────────────────────────
const EMOJI_GRID = [
  ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊"],
  ["😇","🥰","😍","🤩","😘","😗","😋","😛","😜","🤪"],
  ["😎","🤓","🧐","😏","😒","😞","😔","😟","😕","🙁"],
  ["😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡"],
  ["🤯","😳","🥵","🥶","😱","😨","😰","😥","🤫","🤭"],
  ["🤗","🤔","🫡","🤐","🤨","😐","😑","😶","😬","🙄"],
  ["😮","😲","🥱","😴","🤤","😷","🤒","🤕","🤑","🤠"],
  ["👍","👎","👏","🙌","🤝","🤞","✌️","🤟","🫶","💪"],
  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💯","💥"],
  ["🔥","⭐","✨","💫","🎉","🎊","👀","💀","👻","🫠"],
];

// ─── Reaction picker (appears on hover) ────────────────────────────────
function ReactionPicker({ messageId, onReact }: { messageId: string; onReact: (messageId: string, emoji: string) => void }) {
  const [justReacted, setJustReacted] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = useCallback((emoji: string) => {
    onReact(messageId, emoji);
    setJustReacted(emoji);
    setPickerOpen(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustReacted(null), 800);
  }, [messageId, onReact]);

  return (
    <div className={`absolute -top-3 right-2 z-10 transition-opacity duration-150 ${
      pickerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
    }`}>
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-zinc-800/95 border border-white/10 shadow-lg backdrop-blur-sm">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-xl hover:bg-white/10 active:scale-125 transition-all duration-100 ${
              justReacted === emoji ? "scale-125 bg-white/10" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-all duration-100"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-auto p-2 border-white/10 bg-zinc-900/95 backdrop-blur-sm shadow-xl"
          >
            <div className="grid grid-cols-10 gap-0.5">
              {EMOJI_GRID.flat().map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 active:scale-110 transition-all duration-75 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// ─── Avatar sub-component ──────────────────────────────────────────────
function MessageAvatar({
  message, userId, userAvatarUrl, useGeneratedAvatarForUser,
  humanPlayer, userAvatarName, gameId, messagePlayer,
  avatarImageUrls = {}, onAvatarUrlLoaded,
}: {
  message: ChatMessageProps["message"];
  userId: string;
  userAvatarUrl?: string;
  useGeneratedAvatarForUser: boolean;
  humanPlayer?: Player | null;
  userAvatarName: string;
  gameId?: string;
  messagePlayer?: Player | null;
  avatarImageUrls: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
}) {
  const isCurrentUser = message.senderId === userId;
  if (isCurrentUser) {
    if (useGeneratedAvatarForUser && humanPlayer) {
      return (
        <GeneratedAvatar
          name={userAvatarName}
          type="player"
          gameId={gameId}
          enabled={true}
          initialUrl={avatarImageUrls[avatarCacheKey(userAvatarName, "player")]}
          onAvatarLoaded={onAvatarUrlLoaded}
          className="h-11 w-11"
          fallbackColor={humanPlayer.avatar}
        />
      );
    }
    return (
      <Avatar className="h-11 w-11 border-2 border-violet-500/20">
        <AvatarImage src={userAvatarUrl} alt="You" className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-semibold">
          YOU
        </AvatarFallback>
      </Avatar>
    );
  }
  const avatarColor = messagePlayer?.avatar || message.senderAvatar;
  const avatarProps = getAvatarPropsForPlayer(messagePlayer);
  return (
    <GeneratedAvatar
      {...avatarProps}
      name={avatarProps.name || message.senderName}
      gameId={gameId}
      enabled={true}
      initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name || message.senderName, avatarProps.type)]}
      onAvatarLoaded={onAvatarUrlLoaded}
      className="h-11 w-11"
      fallbackColor={avatarColor}
    />
  );
}
