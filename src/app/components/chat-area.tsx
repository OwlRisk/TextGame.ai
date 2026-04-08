"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { User, ArrowDown, Timer, Volume2, VolumeOff } from "lucide-react";
import type { GameMood, ActiveVote } from "@/app/config/game-phase";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import type { Player } from "@/types/player";
import { stripPrivateNotes } from "@/lib/chat-utils";
import { ChatInputArea } from "@/app/components/chat-input-area";
import { GameOverBanner } from "@/app/components/game-over-banner";
import { TypingIndicator } from "@/app/components/typing-indicator";
import { ChatMessage } from "@/app/components/chat-message";

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
  /** Which game room/channel this message belongs to (e.g. general, werewolves-only). Omitted = legacy "game-room". */
  channelId?: string;
  /** Optional image URL (e.g. Host chose to reply with an image). */
  imageUrl?: string;
  /** True for messages sent by a non-owner guest (via /api/games/[gameId]/message). Used to prevent
   *  name-based player matching from accidentally assigning an AI avatar to a guest message. */
  isGuestMessage?: boolean;
  /** True for announcement banners injected by ANNOUNCE directive */
  isAnnouncement?: boolean;
  /** Emoji reactions added by AI players/GM */
  reactions?: Array<{ emoji: string; from: string }>;
}

interface ChatAreaProps {
  channelName: string;
  /** Stable channel identifier used for TTS reset — prevents spurious resets when display name changes casing. */
  channelId?: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isGameActive: boolean;
  currentSpeakerId?: string | null;
  userId: string;
  players?: Player[];
  typingUsers?: { name: string; avatar: string }[];
  gameId?: string;
  onOpenPlayerBoard?: () => void;
  playerBoardLabel?: string;
  onHostPostEvent?: (eventDescription: string, opts?: { nextSpeakerId?: string | null; setPhase?: string; autoAdvance?: { afterMs: number; nextEvent: string; nextPhase: string } }) => void;
  onHostAssignSpeaker?: (playerId: string | null) => void;
  onHostEliminate?: (playerId: string) => void;
  onHostRevealRole?: (playerId: string) => void;
  isUserHost?: boolean;
  gamePhaseLabel?: string;
  alivePlayers?: Player[];
  /** When it's user's turn in intro (host + others spoke, user hasn't), show this hint */
  introYourTurnHint?: string;
  /** One-click reply text shown next to intro your-turn hint (e.g. "Ready!") */
  introYourTurnReply?: string;
  /** When everyone has spoken in intro, show this hint above quick replies */
  introEveryoneSpokenHint?: string;
  /** AI-generated suggestion prompts (e.g. theme, round length) — shown as tappable chips */
  aiSuggestedPrompts?: string[];
  /** Label for AI suggestions row (e.g. "AI suggestions") */
  aiSuggestionsLabel?: string;
  /** When last send failed, show retry banner with this content */
  lastFailedSendContent?: string | null;
  /** Call to retry sending the last failed message */
  onRetryLastMessage?: () => void;
  /** True while Host + AI are replying (game room); keeps send disabled and shows "Host & AI replying…" */
  isRoundInProgress?: boolean;
  /** Persisted avatar URLs (key = "name|type") for cross-device; pass to GeneratedAvatar as initialUrl. */
  avatarImageUrls?: Record<string, string>;
  /** Call when an avatar URL is loaded so the room can persist it. */
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  /**
   * True when this client is the game owner (created the game).
   * When true:  TTS is generated here and broadcast to guests.
   * When false: TTS audio is received from owner's broadcast (no API call).
   * When undefined (single-player / unknown): each client calls the API directly.
   */
  isOwner?: boolean;
  /** Game Over summary text from GAME_OVER directive */
  gameOverSummary?: string;
  /** Resume the current game (reactivate from ended state) */
  onResumeGame?: () => void;
  /** Navigate to new game */
  onNewGame?: () => void;
  /** Save AI characters from this game to user's collection */
  onSaveCharacters?: () => void;
  /** True when this player has been eliminated (spectator mode) */
  isEliminated?: boolean;
  /** Whether the eliminated player is viewing the afterlife/ghost chat channel */
  isInAfterlife?: boolean;
  /** Chat area background mood driven by GM */
  mood?: GameMood;
  /** Structured vote from GM via START_VOTE */
  activeVote?: ActiveVote | null;
  /** Called when the user casts a vote */
  onVote?: (choice: string) => void;
  /** Countdown timer end timestamp */
  timerEndsAt?: number | null;
  /** Called when user reacts with an emoji to a message */
  onReact?: (messageId: string, emoji: string) => void;
  /** TTS voice enabled state */
  voiceEnabled?: boolean;
  /** Toggle voice on/off */
  onToggleVoice?: () => void;
  /** Whether Inworld TTS is available */
  inworldTTSSupported?: boolean;
  /** Ref to TTS-synced displayed content per message id */
  displayedContentRef?: React.MutableRefObject<Map<string, string>>;
  /** Tick counter that increments when displayed content updates */
  revealTick?: number;
  /** Context-sensitive game actions */
  gameActions?: import("@/hooks/useGameActions").GameAction[];
  /** Game event log entries for game over recap */
  gameEvents?: string[];
  /** Human player display name */
  humanName?: string;
  /** Game template ID — passed to sub-components for template-specific UI */
  gameTemplate?: string;
}

export function ChatArea({ 
  channelName, 
  channelId,
  messages, 
  onSendMessage,
  isGameActive,
  currentSpeakerId,
  userId,
  players = [],
  typingUsers,
  gameId,
  onOpenPlayerBoard,
  playerBoardLabel = "My Board",
  onHostPostEvent,
  onHostAssignSpeaker,
  onHostEliminate,
  onHostRevealRole,
  isUserHost = false,
  gamePhaseLabel,
  alivePlayers = [],
  introYourTurnHint,
  introYourTurnReply,
  introEveryoneSpokenHint,
  aiSuggestedPrompts = [],
  aiSuggestionsLabel = 'AI suggestions',
  lastFailedSendContent,
  onRetryLastMessage,
  isRoundInProgress = false,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  isOwner,
  gameOverSummary,
  onResumeGame,
  onNewGame,
  onSaveCharacters,
  isEliminated = false,
  isInAfterlife = false,
  mood = "neutral",
  activeVote,
  onVote,
  timerEndsAt,
  onReact,
  voiceEnabled = false,
  onToggleVoice,
  inworldTTSSupported = false,
  displayedContentRef,
  revealTick,
  gameActions = [],
  gameEvents = [],
  humanName,
  gameTemplate,
}: ChatAreaProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Immediately scroll to bottom on first mount (before first paint) so users
  // land at the latest message when entering a game room.
  useLayoutEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, []);

  // Lazy-load messages: show last N first, load more when user scrolls up
  const INITIAL_PAGE_SIZE = 40;
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const scrollPreserveRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const visibleMessages = useMemo(
    () => messages.slice(-Math.min(visibleCount, messages.length)),
    [messages, visibleCount]
  );
  const hasMoreOlder = messages.length > visibleCount;
  const streamingNames = useMemo(
    () => new Set(messages.filter(m => m.isStreaming).map(m => m.senderName)),
    [messages]
  );

  // Auth + player info for avatar rendering
  const { user } = useAuth();
  const userAvatarUrl = getUserAvatarUrl(user);
  const humanPlayer = players.find((p) => p.id === userId);
  const useGeneratedAvatarForUser = !!(gameId && humanPlayer);
  const userAvatarName = (humanPlayer?.name && humanPlayer.name.trim() && humanPlayer.name !== "You") ? humanPlayer.name : "Player";

  // Follow scroll when new content appears: new messages, last message content/streaming,
  // or quick replies expanding (which grow the input area and hide the last message).
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollStateRef = useRef<{ count: number; lastContentLength: number; typingCount: number }>({ count: 0, lastContentLength: 0, typingCount: 0 });
  const typingCount = typingUsers?.length ?? 0;
  useEffect(() => {
    if (!scrollRef.current) return;
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastContentLength = lastMsg ? (lastMsg.content?.length ?? 0) : 0;
    const lastFromUser = lastMsg?.senderId === userId;
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      const prev = lastScrollStateRef.current;
      const countChanged = messages.length !== prev.count;
      const contentGrew = messages.length > 0 && lastContentLength !== prev.lastContentLength;
      const typingChanged = typingCount !== prev.typingCount;
      if (scrollRef.current && (countChanged || contentGrew || typingChanged)) {
        lastScrollStateRef.current = { count: messages.length, lastContentLength, typingCount };
        scrollRef.current.scrollIntoView({ behavior: lastFromUser ? "auto" : "smooth", block: "end" });
      }
    }, lastFromUser ? 50 : 150);
    return () => { if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current); };
  }, [messages, typingUsers, userId, typingCount]);

  // When input area height changes (quick replies, hints, etc.), scroll to keep last message visible.
  const inputAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = inputAreaRef.current;
    if (!el) return;
    let prevHeight = el.offsetHeight;
    const observer = new ResizeObserver(() => {
      const newHeight = el.offsetHeight;
      if (newHeight !== prevHeight) {
        prevHeight = newHeight;
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load more when user scrolls up: IntersectionObserver on top sentinel
  useEffect(() => {
    if (!hasMoreOlder || !loadMoreSentinelRef.current) return;
    const sentinel = loadMoreSentinelRef.current;
    const viewport = sentinel.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    if (!viewport) return;
    viewportRef.current = viewport;
    const observer = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (!e?.isIntersecting) return;
        if (visibleCount >= messages.length) return;
        scrollPreserveRef.current = { scrollTop: viewport.scrollTop, scrollHeight: viewport.scrollHeight };
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, messages.length));
      },
      { root: viewport, rootMargin: "100px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreOlder, visibleCount, messages.length]);

  // Keep scroll position when prepending older messages
  useLayoutEffect(() => {
    const preserve = scrollPreserveRef.current;
    const viewport = viewportRef.current;
    if (!preserve || !viewport) return;
    viewport.scrollTop = preserve.scrollTop + (viewport.scrollHeight - preserve.scrollHeight);
    scrollPreserveRef.current = null;
  }, [visibleCount]);

  // ─── Scroll-to-bottom detection via IntersectionObserver ─────────────────
  // Positive bottom rootMargin extends the detection zone so the button only
  // appears after the user scrolls a meaningful distance (200px) from the bottom.
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;
    const scrollViewport = sentinel.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsAtBottom(visible);
        if (visible) setUnreadCount(0);
      },
      { root: scrollViewport, rootMargin: "0px 0px 200px 0px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isAtBottom && messages.length > 0) {
      setUnreadCount((c) => c + 1);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ─── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEndsAt) { setTimerDisplay(""); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimerDisplay(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  // (canSend / sendDisabled now computed inside ChatInputArea)

  const moodBg = mood === "dark"
    ? "bg-gradient-to-b from-blue-950/30 via-[#0a0618]/95 to-zinc-900/90"
    : mood === "light"
      ? "bg-gradient-to-b from-amber-900/10 via-[#1a1008]/95 to-zinc-900/90"
      : "bg-gradient-to-b from-zinc-900/90 via-[#0f0818]/95 to-zinc-900/90";

  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden backdrop-blur-sm transition-colors duration-1000 ${moodBg}`}>
      {/* Channel Header */}
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2 border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-zinc-400 text-lg flex-shrink-0">#</span>
          <h2 className="font-semibold text-base text-white truncate">{channelName}</h2>
          {gamePhaseLabel && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex-shrink-0">
              {gamePhaseLabel}
            </span>
          )}
          {timerDisplay && (
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
              timerEndsAt && timerEndsAt - Date.now() <= 10000
                ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                : "bg-zinc-700/50 text-zinc-300 border-zinc-600/40"
            }`}>
              <Timer className="inline h-3 w-3 mr-1 -mt-0.5" />
              {timerDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleVoice && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVoice}
              className="h-8 w-8 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              title={voiceEnabled ? "Mute voice" : "Enable voice"}
              aria-label={voiceEnabled ? "Mute voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeOff className="h-4 w-4" />}
            </Button>
          )}
          {onOpenPlayerBoard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenPlayerBoard}
              className="md:hidden hover:bg-zinc-700 text-zinc-300 hover:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              {playerBoardLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Game Over Banner */}
      {gameOverSummary && (
        <GameOverBanner
          gameOverSummary={gameOverSummary}
          onResumeGame={onResumeGame}
          onNewGame={onNewGame}
          onSaveCharacters={onSaveCharacters}
          players={players}
          gameEvents={gameEvents}
          messageCount={messages.length}
          userId={userId}
          humanName={humanName}
          gameTemplate={gameTemplate}
        />
      )}

      {/* Messages - min-h-0 allows flex child to shrink so scroll works; only render last visibleCount, load more on scroll up */}
      <ScrollArea className="flex-1 min-h-0 px-6 relative" role="log" aria-label="Chat messages">
        <div className="py-6 space-y-5" aria-live="polite" aria-relevant="additions">
          {hasMoreOlder && (
            <div ref={loadMoreSentinelRef} className="flex justify-center py-3" role="status" aria-label="Loading older messages">
              <span className="text-xs text-zinc-500">Pull up for older messages</span>
            </div>
          )}
          {messages.length === 0 && !isRoundInProgress && (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
              <div className="text-4xl mb-4 opacity-40">💬</div>
              <p className="text-zinc-500 text-sm font-medium">No messages yet</p>
              <p className="text-zinc-600 text-xs mt-1">Start the conversation!</p>
            </div>
          )}
          {messages.length === 0 && isRoundInProgress && (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <span className="h-3.5 w-3.5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin flex-shrink-0" />
                Game is starting…
              </div>
            </div>
          )}
          {visibleMessages.map((message, index) => {
            const rawContent = stripPrivateNotes(message.content ?? '');
            const ttsSynced = (voiceEnabled && inworldTTSSupported && displayedContentRef)
              ? (displayedContentRef.current.get(message.id) ?? '')
              : rawContent;
            const showAvatar = index === 0 || visibleMessages[index - 1].senderId !== message.senderId;
            const isShowingCursor = !!message.isStreaming;

            return (
              <ChatMessage
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                syncedContent={ttsSynced}
                rawContent={rawContent}
                isShowingCursor={isShowingCursor}
                userId={userId}
                userAvatarUrl={userAvatarUrl}
                useGeneratedAvatarForUser={useGeneratedAvatarForUser}
                humanPlayer={humanPlayer}
                userAvatarName={userAvatarName}
                gameId={gameId}
                players={players}
                avatarImageUrls={avatarImageUrls ?? {}}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                onReact={onReact}
                gameTemplate={gameTemplate}
              />
            );
          })}
          {/* Typing Indicator — hide narrator in scene mode */}
          {typingUsers && typingUsers.length > 0 && (() => {
            const hostNames = new Set(players.filter(p => p.isGameMaster).map(p => p.name));
            const filtered = gameTemplate === "scene"
              ? typingUsers.filter(u => !hostNames.has(u.name))
              : typingUsers;
            if (filtered.length === 0) return null;
            return (
            <TypingIndicator
              typingUsers={filtered}
              streamingNames={streamingNames}
              players={players}
                    gameId={gameId}
              userId={userId}
              humanPlayer={humanPlayer}
              useGeneratedAvatarForUser={useGeneratedAvatarForUser}
              userAvatarName={userAvatarName}
              avatarImageUrls={avatarImageUrls}
              onAvatarUrlLoaded={onAvatarUrlLoaded}
            />
            );
          })()}
          
          <div ref={scrollRef} />
          <div ref={bottomSentinelRef} className="h-1" />
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to latest messages"
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-zinc-800/90 border border-zinc-600/60 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 shadow-lg backdrop-blur-sm transition-all"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {unreadCount > 0 && <span className="font-semibold text-amber-400">{unreadCount}</span>}
          </button>
        )}
      </ScrollArea>

      {/* Input — isolated in its own component so typing doesn't re-render the message list */}
      <div ref={inputAreaRef}>
      <ChatInputArea
        channelName={channelName}
        onSendMessage={onSendMessage}
        players={players}
        userId={userId}
        isGameActive={isGameActive}
        currentSpeakerId={currentSpeakerId}
        isEliminated={isEliminated}
        isInAfterlife={isInAfterlife}
        isRoundInProgress={isRoundInProgress}
        introYourTurnHint={introYourTurnHint}
        introYourTurnReply={introYourTurnReply}
        introEveryoneSpokenHint={introEveryoneSpokenHint}
        aiSuggestedPrompts={aiSuggestedPrompts}
        aiSuggestionsLabel={aiSuggestionsLabel}
        lastFailedSendContent={lastFailedSendContent}
        onRetryLastMessage={onRetryLastMessage}
        activeVote={activeVote}
        onVote={onVote}
        alivePlayers={alivePlayers}
        gameActions={gameActions}
      />
      </div>
    </div>
  );
}