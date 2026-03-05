"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { AlertCircle, User, Mail, ChevronDown, ChevronUp, Plus, Lock, Volume2, VolumeX, ArrowDown, Trophy, RotateCcw, Timer, Heart } from "lucide-react";
import type { GameMood, ActiveVote } from "@/app/config/game-phase";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useInworldTTS } from "@/lib/voice";
import { ttsBroadcast } from "@/lib/tts-broadcast";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";
import { useAuth } from "@/app/contexts/AuthContext";
import { Player } from "@/app/components/player-panel";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { parseInlineFormatting } from "@/lib/format-message";
import { formatMessageTime, stripEmotionTags } from "@/lib/chat-utils";
import { ChatInputArea } from "@/app/components/chat-input-area";

const FORMAT_CACHE = new Map<string, React.JSX.Element>();
const FORMAT_CACHE_MAX = 200;

function formatMessage(content: string): React.JSX.Element {
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

/**
 * Split `text` into TTS-ready sentences starting at `fromChar`.
 * Returns completed sentences (ending in . ! ?) and the new char offset.
 * Sentences shorter than 8 chars are skipped to avoid tiny audio fragments.
 * Only the first MAX_TTS_CHARS characters of the message are considered —
 * this keeps voice output short even if the AI generates a long reply.
 */

import { extractTTSSentences, MAX_TTS_CHARS_HOST, MAX_TTS_CHARS_PLAYER } from "@/lib/chat-utils";

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
  /** Quick reply chips shown above input (e.g. "Ready!" when Host asks) */
  quickReplies?: string[];
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
  /** True while quick replies are being fetched */
  quickRepliesLoading?: boolean;
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
  /** Navigate to play again (same template) */
  onPlayAgain?: () => void;
  /** Navigate to new game */
  onNewGame?: () => void;
  /** Save AI characters from this game to user's collection */
  onSaveCharacters?: () => void;
  /** True when this player has been eliminated (spectator mode) */
  isEliminated?: boolean;
  /** Chat area background mood driven by GM */
  mood?: GameMood;
  /** Structured vote from GM via START_VOTE */
  activeVote?: ActiveVote | null;
  /** Called when the user casts a vote */
  onVote?: (choice: string) => void;
  /** Countdown timer end timestamp */
  timerEndsAt?: number | null;
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
  quickReplies = [],
  introYourTurnHint,
  introYourTurnReply,
  introEveryoneSpokenHint,
  aiSuggestedPrompts = [],
  aiSuggestionsLabel = 'AI suggestions',
  quickRepliesLoading = false,
  lastFailedSendContent,
  onRetryLastMessage,
  isRoundInProgress = false,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  isOwner,
  gameOverSummary,
  onPlayAgain,
  onNewGame,
  onSaveCharacters,
  isEliminated = false,
  mood = "neutral",
  activeVote,
  onVote,
  timerEndsAt,
}: ChatAreaProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // ─── TTS Broadcast: setup manager when gameId + isOwner are known ─────────
  // isOwner===undefined → single-player (no broadcast). isOwner===true → owner
  // generates & broadcasts. isOwner===false → guest receives broadcast.
  useEffect(() => {
    if (!gameId || isOwner === undefined) {
      ttsBroadcast.teardown();
      return;
    }
    ttsBroadcast.setup(gameId, isOwner);
    return () => {
      // Only tear down when leaving the game (gameId changes or component unmounts).
      // Do NOT pass cleanup to the isOwner dependency — the channel is stable per gameId.
    };
  }, [gameId, isOwner]);

  // Tear down on unmount
  useEffect(() => {
    return () => { ttsBroadcast.teardown(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auth + player info for avatar rendering
  const { user } = useAuth();
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const humanPlayer = players.find((p) => p.id === userId);
  // Unified style: human players also use generated avatars (anime style) like AI Host/players
  const useGeneratedAvatarForUser = !!(gameId && humanPlayer);
  const userAvatarName = (humanPlayer?.name && humanPlayer.name.trim() && humanPlayer.name !== "You") ? humanPlayer.name : "Player";

  // Inworld TTS: one voice per speaker, streaming-aware (sentences queued as they complete)
  // Default ON; persisted in localStorage so the setting survives page reloads.
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('voice_enabled');
    return stored === null ? true : stored !== 'false';
  });
  const { play: playInworldTTS, stop: stopInworldTTS, queueDeferred: queueDeferredTTS, isPlaying: isTTSPlaying, supported: inworldTTSSupported } = useInworldTTS();

  // Per-message char offset tracking: how many chars have already been queued for TTS
  const ttsProgressRef = useRef<Map<string, number>>(new Map());
  // IDs of messages whose TTS sentences have been SUBMITTED to the queue (prevents re-queuing the same message).
  // Set IMMEDIATELY when we start queuing, so subsequent effect runs don't re-queue while audio is playing.
  const ttsQueuedRef = useRef<Set<string>>(new Set());
  // IDs of messages whose TTS has FULLY FINISHED playing (unlocks the next message in line).
  // Set via queueDeferred, after the last audio sentence completes.
  const ttsCompletedRef = useRef<Set<string>>(new Set());
  // Bumped when any message's TTS finishes, so the effect re-runs and can process the next message.
  const [ttsProcessingTick, setTtsProcessingTick] = useState(0);
  // Message IDs present on first run — cached/history; do not play TTS for these, only for new ones.
  const initialMessageIdsRef = useRef<Set<string> | null>(null);
  // True once we've queued any TTS this session; used to tell "new game (we already played m1)" from "existing room (first paint with 2+ messages)".
  const hasQueuedTTSInSessionRef = useRef(false);
  // Set by the channel-reset effect so the TTS effect knows to snapshot ALL existing messages
  // as historical (including single-message channels) — prevents replaying on channel switch.
  const justSwitchedChannelRef = useRef(false);
  // Text revealed so far per AI message — grows sentence-by-sentence as TTS plays.
  const displayedContentRef = useRef<Map<string, string>>(new Map());
  // Bumped each time a sentence is revealed, to trigger a re-render.
  const [revealTick, setRevealTick] = useState(0);
  // Timeout fallback: if TTS doesn't reveal content in time, show full text so the page doesn't appear stuck.
  const ttsFallbackTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Assign voice by gender + personality similarity (host and each player get a matching voice)
  const voiceIdForMessage = useCallback(
    (m: Message) => {
      const player = players.find(
        (p) => p.id === m.senderId || (p.name || '').trim() === (m.senderName || '').trim()
      );
      const voiceHint = [player?.personality, player?.background].filter(Boolean).join('. ') || undefined;
      return pickVoiceForSpeaker(player?.gender, voiceHint, undefined, player?.name || m.senderName);
    },
    [players]
  );

  // When voice is turned on, restore displayed content for all existing messages so text
  // doesn't flash blank. Also mark them as handled so they won't re-play.
  const prevVoiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => {
    if (voiceEnabled && !prevVoiceEnabledRef.current) {
      ttsProgressRef.current.clear();
      ttsQueuedRef.current.clear();
      ttsCompletedRef.current.clear();
      for (const m of messages) {
        ttsQueuedRef.current.add(m.id);
        ttsCompletedRef.current.add(m.id);
        ttsProgressRef.current.set(m.id, (m.content || '').length);
        if (m.isAI && !m.isSystemMessage && !m.isPrivate) {
          displayedContentRef.current.set(m.id, (m.content || '').trim());
        }
      }
      setRevealTick((t) => t + 1);
    }
    prevVoiceEnabledRef.current = voiceEnabled;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  // Helper: append a spoken sentence to the displayed text for a message.
  const revealSentence = useCallback((messageId: string, sentence: string) => {
    const cur = displayedContentRef.current.get(messageId) ?? '';
    const sep = cur && !/\s$/.test(cur) ? ' ' : '';
    displayedContentRef.current.set(messageId, cur + sep + sentence);
    setRevealTick((t) => t + 1);
  }, []);

  // Stop TTS and reset state when switching game OR channel — historical messages of the new channel
  // must not be played, only newly arriving ones should trigger TTS.
  // Use channelId (stable identifier) rather than channelName (display name that can change case).
  // IMPORTANT: This effect must be declared BEFORE the main TTS processing effect so that React
  // runs it first on the same render. This ensures the refs are cleared before TTS snapshots them.
  const ttsChannelKey = channelId ?? channelName;
  useEffect(() => {
    stopInworldTTS();
    initialMessageIdsRef.current = null;
    hasQueuedTTSInSessionRef.current = false;
    justSwitchedChannelRef.current = true;
    ttsProgressRef.current.clear();
    ttsQueuedRef.current.clear();
    ttsCompletedRef.current.clear();
    displayedContentRef.current.clear();
    ttsFallbackTimeoutsRef.current.forEach((t) => clearTimeout(t));
    ttsFallbackTimeoutsRef.current.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, ttsChannelKey]);

  // Strict one-message-at-a-time TTS queue.
  //
  // Key invariants:
  //   ttsQueuedRef   – set IMMEDIATELY when we push a message's sentences to the audio queue.
  //                    Prevents re-queuing the same message on every messages change.
  //   ttsCompletedRef – set AFTER the last audio sentence finishes playing (via queueDeferred).
  //                    Signals that the next message may now be shown/queued.
  //   ttsProcessingTick – bumped in every queueDeferred callback so this effect re-runs and
  //                    picks up the next pending message after audio finishes.
  //
  // Flow for two consecutive messages M1 → M2:
  //   1. M1 arrives  →  queued immediately (ttsQueuedRef.add(M1)), text shown, audio playing.
  //   2. M2 arrives  →  effect runs; M1 in ttsQueued but NOT completed → we stop and wait.
  //                     M2 text is NOT shown yet.
  //   3. M1 finishes →  queueDeferred: ttsCompletedRef.add(M1), setTtsProcessingTick++.
  //   4. Effect re-runs → M1 skipped (completed). M2 not queued → show text, queue audio.
  useEffect(() => {
    if (!voiceEnabled || !inworldTTSSupported) return;

    // Channel/game just switched: snapshot ALL existing messages as historical so they are
    // never replayed — even if there is only 1 message (e.g. host greeting in General).
    if (justSwitchedChannelRef.current) {
      justSwitchedChannelRef.current = false;
      if (messages.length === 0) return;
      initialMessageIdsRef.current = new Set(messages.map((m) => m.id));
      for (const m of messages) {
        if (!m.isAI || m.isSystemMessage || m.isPrivate) continue;
        ttsQueuedRef.current.add(m.id);
        ttsCompletedRef.current.add(m.id);
        displayedContentRef.current.set(m.id, (m.content || '').trim());
      }
      setRevealTick((t) => t + 1);
      return;
    }

    // First time we see messages: snapshot "initial/cached" IDs — never play TTS for these.
    // Don't snapshot on empty (slow load) or single message (could be first message of new game).
    if (initialMessageIdsRef.current === null) {
      if (messages.length === 0) return;
      if (messages.length >= 2 && !hasQueuedTTSInSessionRef.current) {
        initialMessageIdsRef.current = new Set(messages.map((m) => m.id));
        for (const m of messages) {
          if (!m.isAI || m.isSystemMessage || m.isPrivate) continue;
          ttsQueuedRef.current.add(m.id);
          ttsCompletedRef.current.add(m.id);
          displayedContentRef.current.set(m.id, (m.content || '').trim());
        }
        setRevealTick((t) => t + 1);
        return;
      }
    }

    for (const m of messages) {
      if (!m.isAI || m.isSystemMessage || m.isPrivate) continue;
      if (initialMessageIdsRef.current?.has(m.id)) continue;

      // Already playing or played — skip and continue to next.
      if (ttsCompletedRef.current.has(m.id)) continue;

      // Queued but NOT yet finished → a previous message is still playing.
      // Stop here: do NOT show or queue anything further until it completes.
      if (ttsQueuedRef.current.has(m.id)) return;

      // --- This message has not been queued yet ---
      const content = (m.content || '').trim();
      if (!content) continue;

      if (m.isStreaming) {
        // Message still loading: show current streaming text but don't queue TTS yet.
        displayedContentRef.current.set(m.id, content);
        setRevealTick((t) => t + 1);
        return; // wait for this message to complete before doing anything more
      }

      // Mark as queued RIGHT NOW so subsequent effect runs don't re-queue while audio plays.
      ttsQueuedRef.current.add(m.id);
      hasQueuedTTSInSessionRef.current = true;

      // If this message was shown during streaming, its text is already visible — don't re-reveal.
      // Otherwise: reveal each sentence first (text), then play TTS (voice), so text is slightly ahead of voice.
      const alreadyShown = (displayedContentRef.current.get(m.id) ?? '').length > 0;

      const voiceId = voiceIdForMessage(m);
      const isHostMessage = players.find((p) => p.id === m.senderId)?.isGameMaster === true;
      const ttsCap = isHostMessage ? MAX_TTS_CHARS_HOST : MAX_TTS_CHARS_PLAYER;
      let fromChar = 0;
      for (;;) {
        const { sentences, newOffset } = extractTTSSentences(content, fromChar, ttsCap);
        if (sentences.length === 0) break;
        sentences.forEach((s) => {
          if (alreadyShown) {
            playInworldTTS(s, voiceId, () => {});
          } else {
            revealSentence(m.id, s);
            playInworldTTS(s, voiceId, () => {});
          }
        });
        fromChar = newOffset;
      }
      const remaining = content.slice(fromChar).trim();
      if (remaining.length >= 2) {
        if (alreadyShown) {
          playInworldTTS(remaining, voiceId, () => {});
        } else {
          revealSentence(m.id, remaining);
          playInworldTTS(remaining, voiceId, () => {});
        }
      }

      // After all audio finishes: ensure full text is shown (safety net), mark completed, unlock next.
      const msgId = m.id;
      const fullContent = content;
      queueDeferredTTS(() => {
        displayedContentRef.current.set(msgId, fullContent);
        ttsCompletedRef.current.add(msgId);
        ttsProgressRef.current.delete(msgId);
        setTtsProcessingTick((t) => t + 1);
      });

      return; // process one message per run; next message waits for ttsProcessingTick to bump
    }

    // Prune stale progress entries for messages no longer in the list
    const liveIds = new Set(messages.map((m) => m.id));
    for (const id of ttsProgressRef.current.keys()) {
      if (!liveIds.has(id)) ttsProgressRef.current.delete(id);
    }
  }, [voiceEnabled, inworldTTSSupported, messages, ttsProcessingTick, voiceIdForMessage, playInworldTTS, queueDeferredTTS]);

  useEffect(() => {
    if (!voiceEnabled) {
      stopInworldTTS();
      ttsProgressRef.current.clear();
      ttsQueuedRef.current.clear();
      ttsCompletedRef.current.clear();
      // Don't clear displayedContentRef — keep text visible so messages don't flash blank
      // when toggling voice off. The content will be restored if voice is turned back on.
      ttsFallbackTimeoutsRef.current.forEach((t) => clearTimeout(t));
      ttsFallbackTimeoutsRef.current.clear();
    }
  }, [voiceEnabled, stopInworldTTS]);

  // If TTS doesn't reveal content within 8s, show full text so the page doesn't appear stuck.
  const TTS_FALLBACK_MS = 8000;
  useEffect(() => {
    if (!voiceEnabled || !inworldTTSSupported) return;
    const timeouts = ttsFallbackTimeoutsRef.current;
    const liveIds = new Set(messages.map((m) => m.id));
    for (const m of messages) {
      if (!m.isAI || m.isSystemMessage || m.isPrivate) continue;
      const raw = (m.content ?? '').trim();
      if (!raw) continue;
      const displayed = displayedContentRef.current.get(m.id) ?? '';
      if (displayed.length >= raw.length) {
        const t = timeouts.get(m.id);
        if (t) {
          clearTimeout(t);
          timeouts.delete(m.id);
        }
        continue;
      }
      // Only start a fallback timer once we've actually started queuing this message.
      // Messages waiting in line (not yet queued) don't need a fallback — they'll be processed later.
      if (!ttsQueuedRef.current.has(m.id)) continue;
      if (timeouts.has(m.id)) continue;
      const messageId = m.id;
      const fullText = raw;
      timeouts.set(
        messageId,
        setTimeout(() => {
          timeouts.delete(messageId);
          const cur = displayedContentRef.current.get(messageId) ?? '';
          if (cur.length < fullText.length) {
            displayedContentRef.current.set(messageId, fullText);
            setRevealTick((t) => t + 1);
          }
        }, TTS_FALLBACK_MS)
      );
    }
    for (const [id, t] of timeouts) {
      if (!liveIds.has(id)) {
        clearTimeout(t);
        timeouts.delete(id);
      }
    }
    return () => {};
  }, [voiceEnabled, inworldTTSSupported, messages, revealTick]);

  // Follow scroll when new content appears: new messages, last message content/streaming, TTS reveal,
  // or quick replies expanding (which grow the input area and hide the last message).
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollStateRef = useRef<{ count: number; lastContentLength: number; revealTick: number }>({ count: 0, lastContentLength: 0, revealTick: 0 });
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
      const ttsRevealChanged = revealTick !== prev.revealTick;
      if (scrollRef.current && (countChanged || contentGrew || ttsRevealChanged)) {
        lastScrollStateRef.current = { count: messages.length, lastContentLength, revealTick };
        scrollRef.current.scrollIntoView({ behavior: lastFromUser ? "auto" : "smooth", block: "end" });
      }
    }, lastFromUser ? 50 : 150);
    return () => { if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current); };
  }, [messages, typingUsers, userId, revealTick]);

  // When quick replies expand/collapse, the input area height changes — scroll to keep last message visible.
  useEffect(() => {
    if (!scrollRef.current) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
    return () => clearTimeout(t);
  }, [quickReplies.length]);

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
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsAtBottom(visible);
        if (visible) setUnreadCount(0);
      },
      { threshold: 0.1 }
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
      <div className="h-14 px-6 flex items-center justify-between border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-400 text-lg">#</span>
          <h2 className="font-semibold text-base text-white">{channelName}</h2>
          {gamePhaseLabel && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {gamePhaseLabel}
            </span>
          )}
          {timerDisplay && (
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
              timerEndsAt && timerEndsAt - Date.now() <= 10000
                ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                : "bg-zinc-700/50 text-zinc-300 border-zinc-600/40"
            }`}>
              <Timer className="inline h-3 w-3 mr-1 -mt-0.5" />
              {timerDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inworldTTSSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                localStorage.setItem('voice_enabled', String(next));
                if (!next) stopInworldTTS();
              }}
              className={voiceEnabled ? "hover:bg-zinc-700 text-violet-400 hover:text-violet-300" : "hover:bg-zinc-700 text-zinc-400 hover:text-white"}
              title={voiceEnabled ? "Turn off dialogue voice" : "Turn on dialogue voice (Inworld TTS)"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">{voiceEnabled ? "Sound on" : "Sound off"}</span>
              {isTTSPlaying && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
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
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Trophy className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-amber-200 mb-1">Game Over</h3>
              <p className="text-sm text-amber-100/80 leading-relaxed whitespace-pre-line">{gameOverSummary}</p>
              <div className="flex gap-2 mt-3">
                {onPlayAgain && (
                  <Button size="sm" variant="outline" className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white gap-1.5" onClick={onPlayAgain}>
                    <RotateCcw className="h-3.5 w-3.5" /> Play Again
                  </Button>
                )}
                {onNewGame && (
                  <Button size="sm" variant="outline" className="border-zinc-600 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white gap-1.5" onClick={onNewGame}>
                    <Plus className="h-3.5 w-3.5" /> New Game
                  </Button>
                )}
                {onSaveCharacters && (
                  <Button size="sm" variant="outline" className="border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white gap-1.5" onClick={onSaveCharacters}>
                    <Heart className="h-3.5 w-3.5" /> Save Characters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages - min-h-0 allows flex child to shrink so scroll works; only render last visibleCount, load more on scroll up */}
      <ScrollArea className="flex-1 min-h-0 px-6 relative">
        <div className="py-6 space-y-5">
          {hasMoreOlder && (
            <div ref={loadMoreSentinelRef} className="flex justify-center py-3" aria-hidden>
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
            const showAvatar = index === 0 || visibleMessages[index - 1].senderId !== message.senderId;

            // When voice is on, AI messages are revealed sentence-by-sentence as TTS plays.
            // Human messages and non-TTS modes always show full content immediately.
            const rawContent = message.content ?? '';
            const syncedContent =
              voiceEnabled && inworldTTSSupported && message.isAI && !message.isSystemMessage && !message.isPrivate
                ? (displayedContentRef.current.get(message.id) ?? '')
                : rawContent;
            // revealTick is read here only to ensure re-renders propagate (value unused directly).
            void revealTick;

            if (message.isAnnouncement) {
              return (
                <div key={message.id} className="my-6">
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
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-violet-100 text-sm leading-[1.65] break-words">
                        {(() => {
                          if (syncedContent.trim()) return formatMessage(stripEmotionTags(syncedContent));
                          if (voiceEnabled && inworldTTSSupported && message.isAI && rawContent !== '' && syncedContent === '') return null;
                          if (rawContent.trim()) return formatMessage(stripEmotionTags(rawContent));
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const messagePlayer = showAvatar ? players.find(
              // Match by senderId first; only fall back to name matching for AI messages
              // to prevent a guest's nickname accidentally matching an AI player's name
              p => p.id === message.senderId || (message.isAI && p.name === message.senderName)
            ) : null;
            const isHost = messagePlayer?.isGameMaster || (messagePlayer && getAvatarPropsForPlayer(messagePlayer).type === "host");

            return (
              <div key={message.id} className={showAvatar ? "mt-5" : "mt-2"}>
                {showAvatar ? (
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0" title={message.senderName}>
                      {(() => {
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
                        const player = messagePlayer;
                        const avatarColor = player?.avatar || message.senderAvatar;
                        const avatarProps = getAvatarPropsForPlayer(player);
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
                      <div
                        className={`text-zinc-100 text-sm break-words ${isHost ? "leading-[1.65] rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : "leading-relaxed"}`}
                      >
                        {message.imageUrl && (
                          <div className="my-2 rounded-lg overflow-hidden max-w-[280px] border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={message.imageUrl} alt="" className="w-full h-auto object-cover" />
                          </div>
                        )}
                        {(() => {
                          const activeTTS = voiceEnabled && inworldTTSSupported && message.isAI && syncedContent.length > 0 && syncedContent.length < rawContent.length;
                          if (syncedContent.trim()) return formatMessage(stripEmotionTags(syncedContent));
                          if (voiceEnabled && inworldTTSSupported && message.isAI && rawContent !== '' && syncedContent === '') return null;
                          if (rawContent.trim()) return formatMessage(stripEmotionTags(rawContent));
                          if (!message.isAI && !message.imageUrl && !message.isStreaming) return <span className="italic text-zinc-500">(No content)</span>;
                          return null;
                        })()}
                        {(message.isStreaming || (voiceEnabled && inworldTTSSupported && message.isAI && syncedContent.length > 0 && syncedContent.length < rawContent.length)) && (
                          <span className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-11 flex-shrink-0" />
                    <div className={`flex-1 text-zinc-100 text-sm leading-relaxed break-words ${isHost ? "rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 backdrop-blur-sm pl-3 py-1 -ml-0.5" : ""}`}>
                      {message.imageUrl && (
                        <div className="my-2 rounded-lg overflow-hidden max-w-[280px] border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={message.imageUrl} alt="" className="w-full h-auto object-cover" />
                        </div>
                      )}
                      {(() => {
                        if (syncedContent.trim()) return formatMessage(stripEmotionTags(syncedContent));
                        if (voiceEnabled && inworldTTSSupported && message.isAI && rawContent !== '' && syncedContent === '') return null;
                        if (rawContent.trim()) return formatMessage(stripEmotionTags(rawContent));
                        if (!message.isAI && !message.imageUrl && !message.isStreaming) return <span className="italic text-zinc-500">(No content)</span>;
                        return null;
                      })()}
                      {(message.isStreaming || (voiceEnabled && inworldTTSSupported && message.isAI && syncedContent.length > 0 && syncedContent.length < rawContent.length)) && (
                        <span className="inline-block w-[2px] h-4 bg-violet-400 ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Typing Indicator — shown for any player (human or AI) while generating a reply */}
          {typingUsers && typingUsers.length > 0 && !messages.some(m => 
            m.senderName === typingUsers[0].name && m.isStreaming
          ) && (
            <div className="flex gap-3 mt-4">
              {typingUsers[0].name === "You" ? (
                useGeneratedAvatarForUser && humanPlayer ? (
                  <GeneratedAvatar
                    name={userAvatarName}
                    type="player"
                    gameId={gameId}
                    enabled={true}
                    initialUrl={avatarImageUrls[avatarCacheKey(userAvatarName, "player")]}
                    onAvatarLoaded={onAvatarUrlLoaded}
                    className="h-10 w-10 flex-shrink-0"
                    fallbackColor={typingUsers[0].avatar || humanPlayer.avatar}
                  />
                ) : (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback
                      className="text-sm font-semibold text-white"
                      style={{ backgroundColor: typingUsers[0].avatar }}
                    >
                      {typingUsers[0].name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )
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
                      initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name || typingUsers[0].name, avatarProps.type)]}
                      onAvatarLoaded={onAvatarUrlLoaded}
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
          <div ref={bottomSentinelRef} className="h-1" />
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-zinc-800/90 border border-zinc-600/60 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 shadow-lg backdrop-blur-sm transition-all"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {unreadCount > 0 && <span className="font-semibold text-amber-400">{unreadCount}</span>}
          </button>
        )}
      </ScrollArea>

      {/* Input — isolated in its own component so typing doesn't re-render the message list */}
      <ChatInputArea
        channelName={channelName}
        onSendMessage={onSendMessage}
        players={players}
        userId={userId}
        isGameActive={isGameActive}
        currentSpeakerId={currentSpeakerId}
        isEliminated={isEliminated}
        isRoundInProgress={isRoundInProgress}
        quickReplies={quickReplies}
        quickRepliesLoading={quickRepliesLoading}
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
      />
    </div>
  );
}