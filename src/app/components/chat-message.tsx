"use client";

import React from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { formatMessageTime, stripEmotionTags } from "@/lib/chat-utils";
import { parseInlineFormatting } from "@/lib/format-message";
import { stripDirectiveLines } from "@/lib/game-host-utils";
import type { Player } from "@/app/components/player-panel";

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
  const clean = (s: string) => stripDirectiveLines(stripEmotionTags(s));
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
}

export const ChatMessage = React.memo(function ChatMessage({
  message, showAvatar, syncedContent, rawContent, isShowingCursor,
  userId, userAvatarUrl, useGeneratedAvatarForUser, humanPlayer, userAvatarName,
  gameId, players, avatarImageUrls, onAvatarUrlLoaded,
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

  const cursor = isShowingCursor
    ? <span key="streaming-cursor" className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 align-text-bottom animate-pulse" />
    : null;

  const contentBlock = (() => {
    let formatted: React.ReactNode = null;
    if (syncedContent.trim()) formatted = formatMessage(stripEmotionTags(syncedContent));
    else if (rawContent.trim()) formatted = formatMessage(stripEmotionTags(rawContent));
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

  return (
    <div className={showAvatar ? "mt-5" : "mt-2"}>
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
                    GM
                  </span>
                )}
                {message.senderId === userId && !isHost && (
                  <span className="inline-flex items-center justify-center leading-none min-h-[20px] px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shrink-0 text-[10px] font-bold text-white uppercase tracking-wide shadow-sm">
                    YOU
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-500 shrink-0" aria-hidden="true">
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
            <div className={`text-zinc-100 text-sm break-words ${hostStyle}`}>
              {contentBlock}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="w-11 flex-shrink-0" />
          <div className={`flex-1 text-zinc-100 text-sm leading-relaxed break-words ${isHost ? "rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : ""}`}>
            {contentBlock}
          </div>
        </div>
      )}
    </div>
  );
});

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
