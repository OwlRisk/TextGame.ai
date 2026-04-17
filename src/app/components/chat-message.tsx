"use client";

import React from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { formatMessageTime, stripEmotionTags, stripPrivateNotes } from "@/lib/chat-utils";
import { parseInlineFormatting, type InlineFormattingOptions } from "@/lib/format-message";
import { stripDirectiveLines } from "@/lib/game-host-utils";
import type { Player } from "@/types/player";
import { t, getBrowserLanguage } from "@/lib/i18n";

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

const SCENE_FORMAT_CACHE = new Map<string, React.JSX.Element>();

/** Scene-mode variant: renders *italic* as amber action text to distinguish from speech. */
export function formatSceneMessage(content: string): React.JSX.Element {
  const cached = SCENE_FORMAT_CACHE.get(content);
  if (cached) return cached;
  const result = formatMessageUncached(content, {
    sceneActionClassName: "italic text-amber-200/80",
  });
  SCENE_FORMAT_CACHE.set(content, result);
  if (SCENE_FORMAT_CACHE.size > FORMAT_CACHE_MAX) {
    const first = SCENE_FORMAT_CACHE.keys().next().value;
    if (first !== undefined) SCENE_FORMAT_CACHE.delete(first);
  }
  return result;
}

function formatMessageUncached(content: string, fmtOpts?: InlineFormattingOptions): React.JSX.Element {
  const fmt = (text: string) => parseInlineFormatting(text, fmtOpts);
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
          {fmt(text)}
        </h3>
      );
      return;
    }
    if (trimmedLine.startsWith('##')) {
      const text = trimmedLine.replace(/^##+\s*/, '');
      elements.push(
        <h2 key={index} className="font-bold text-lg text-violet-200 mt-4 mb-2 first:mt-0">
          {fmt(text)}
        </h2>
      );
      return;
    }
    if (trimmedLine.startsWith('#')) {
      const text = trimmedLine.replace(/^#+\s*/, '');
      elements.push(
        <h1 key={index} className="font-bold text-xl text-violet-100 mt-4 mb-3 first:mt-0">
          {fmt(text)}
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
          <div className="flex-1 min-w-0">{fmt(text)}</div>
        </div>
      );
      return;
    }
    if (/^[•\-\*]\s+/.test(trimmedLine)) {
      const text = trimmedLine.replace(/^[•\-\*]\s+/, '');
      elements.push(
        <div key={index} className="flex gap-2.5 mb-1.5">
          <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 min-w-0">{fmt(text)}</div>
        </div>
      );
      return;
    }

    elements.push(
      <div key={index} className="mb-1.5 leading-relaxed">
        {fmt(trimmedLine)}
      </div>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

function resolveContent(syncedContent: string, rawContent: string) {
  const clean = (s: string) => stripDirectiveLines(stripEmotionTags(stripPrivateNotes(s)));
  if (syncedContent.trim()) {
    const c = clean(syncedContent);
    return c ? formatMessage(c) : null;
  }
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
  gameTemplate?: string;
  avatarStyle?: string;
  onPlayerClick?: (player: Player) => void;
}

export const ChatMessage = React.memo(function ChatMessage({
  message, showAvatar, syncedContent, rawContent, isShowingCursor,
  userId, userAvatarUrl, useGeneratedAvatarForUser, humanPlayer, userAvatarName,
  gameId, players, avatarImageUrls, onAvatarUrlLoaded, gameTemplate, avatarStyle,
  onPlayerClick,
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
                {t("label.private")}
              </span>
              <span className="text-[11px] text-violet-400/60 ml-auto shrink-0">
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
            <div className="text-violet-100 text-sm leading-[1.65] break-words">
              {resolveContent(syncedContent, rawContent)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Regular message ──────────────────────────────────────────────────
  const messagePlayer = players.find(
    p => p.id === message.senderId || (message.isAI && p.name === message.senderName)
  ) ?? null;
  const isHost =
    message.senderId === "gm-1" ||
    messagePlayer?.isGameMaster === true ||
    (messagePlayer != null && getAvatarPropsForPlayer(messagePlayer).type === "host");

  // Narrator: render all host/GM messages as atmospheric narration without avatar/name
  if (isHost) {
    const cleanSynced = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(syncedContent)));
    const cleanRaw = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(rawContent)));
    const displayText = cleanSynced.trim() ? cleanSynced : cleanRaw;
    if (!displayText.trim() && !message.isStreaming) return null;
    const narratorCursor = isShowingCursor
      ? <span key="streaming-cursor" className="inline-block w-[2px] h-4 bg-zinc-400 ml-0.5 align-text-bottom animate-pulse" />
      : null;
    return (
      <div className="my-4 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <div className="text-zinc-300 text-sm italic leading-relaxed [&_strong]:text-zinc-100 [&_em]:text-amber-200/80">
          {formatSceneMessage(displayText)}{narratorCursor}
        </div>
      </div>
    );
  }

  const cursor = isShowingCursor
    ? <span key="streaming-cursor" className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 align-text-bottom animate-pulse" />
    : null;

  const cleanSynced = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(syncedContent)));
  const cleanRaw = stripDirectiveLines(stripEmotionTags(stripPrivateNotes(rawContent)));
  let displayText = cleanSynced.trim() || cleanRaw.trim();

  // Strip [SAY]/[ACTION]/[ACTION:type ...] prefixes from messages.
  // Track whether this was an action for distinct visual rendering.
  let isTaggedAction = false;
  let _actionMeta = "";
  if (displayText) {
    const structuredMatch = displayText.match(/^\[ACTION:([^\]]*)\]\s*/i);
    if (structuredMatch) {
      isTaggedAction = true;
      _actionMeta = structuredMatch[1].trim();
      displayText = displayText.replace(structuredMatch[0], "");
    } else if (/^\[ACTION\]\s*/i.test(displayText)) {
      isTaggedAction = true;
      displayText = displayText.replace(/^\[ACTION\]\s*/i, "");
    } else if (/^\[SAY\]\s*/i.test(displayText)) {
      displayText = displayText.replace(/^\[SAY\]\s*/i, "");
    }
  }

  // Scene-mode italic actions: *does something*
  const isSceneStyleAction = gameTemplate === "scene" && displayText &&
    !isTaggedAction && /^\*[^*]+\*$/.test(displayText.trim());

  const isActionMessage = isTaggedAction || isSceneStyleAction;

  if (isActionMessage && !message.isStreaming) {
    const actionText = isSceneStyleAction
      ? displayText.trim().slice(1, -1)
      : displayText.trim();
    const lang = getBrowserLanguage();
    // Human [ACTION:…] lines use templates that read like GM narration; don't lead with the
    // detective's name — it looks like the player is narrating NPCs. AI characters keep their name.
    let actionLead = message.senderName;
    if (!message.isAI && isTaggedAction) {
      const targetMatch = _actionMeta.match(/\btarget\s*=\s*([^\s\]]+)/i);
      const target = targetMatch?.[1]?.trim();
      actionLead = target
        ? t("chat.action_you_toward", lang, { target })
        : t("chat.action_you", lang);
    }
    return (
      <div className={`${showAvatar ? "mt-5" : "mt-1"}`}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
          <span className="text-amber-400 text-xs flex-shrink-0">⚡</span>
          <div className="flex-1 min-w-0 text-sm text-amber-200/90 italic leading-relaxed">
            <span className="font-medium not-italic text-amber-300/80">{actionLead}</span>
            {" "}
            {actionText}
          </div>
          <span className="text-[11px] text-zinc-600 shrink-0">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  const contentBlock = (() => {
    const fmt = gameTemplate === "scene" ? formatSceneMessage : formatMessage;
    let formatted: React.ReactNode = null;
    if (cleanSynced.trim()) formatted = fmt(cleanSynced);
    else if (cleanRaw.trim()) formatted = fmt(cleanRaw);
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

  const hostStyle = "leading-relaxed";

  return (
    <div className={`group/msg relative ${showAvatar ? "mt-5" : "mt-2"}`}>
      {showAvatar ? (
        <div className="flex gap-4">
          <button
            className="relative flex-shrink-0 cursor-pointer rounded-xl transition-opacity hover:opacity-80"
            title={message.senderName}
            onClick={() => messagePlayer && onPlayerClick?.(messagePlayer)}
          >
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
              avatarStyle={avatarStyle}
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 mb-2">
                <span
                  className={`font-semibold text-[15px] shrink-0 ${
                    message.senderId === userId ? "text-blue-200" : "text-white"
                  }`}
                >
                  {message.senderName}
                </span>
                {message.senderId === userId && (
                  <span className="inline-flex items-center justify-center leading-none min-h-[20px] px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shrink-0 text-[10px] font-bold text-white uppercase tracking-wide shadow-sm">
                    {t("label.you")}
                  </span>
                )}
                <span className="text-xs text-zinc-500 shrink-0" aria-hidden="true">
                  {formatMessageTime(message.timestamp)}
                </span>
            </div>
            <div className={`text-zinc-100 text-[15px] break-words ${hostStyle}`}>
              {contentBlock}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="w-11 flex-shrink-0" />
          <div className={`flex-1 text-zinc-100 text-[15px] leading-relaxed break-words ${isHost ? "rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : ""}`}>
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
  avatarImageUrls = {}, onAvatarUrlLoaded, avatarStyle,
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
  avatarStyle?: string;
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
          {t("label.you")}
        </AvatarFallback>
      </Avatar>
    );
  }
  const avatarColor = messagePlayer?.avatar || message.senderAvatar;
  const avatarProps = getAvatarPropsForPlayer(messagePlayer, avatarStyle as any);
  return (
    <GeneratedAvatar
      {...avatarProps}
      name={avatarProps.name || message.senderName}
      gameId={gameId}
      enabled={true}
      initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name || message.senderName, avatarProps.type, undefined, avatarProps.gender)]}
      onAvatarLoaded={onAvatarUrlLoaded}
      className="h-11 w-11"
      fallbackColor={avatarColor}
    />
  );
}
