"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Send, AlertCircle, User, Mic, MicOff, X, Check, Mail, ChevronDown, ChevronUp, Plus, Lock, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useVoiceInput, useInworldTTS } from "@/lib/voice";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";
import { useAuth } from "@/app/contexts/AuthContext";
import { VoiceWaveform } from "@/app/components/voice-waveform";
import { Player } from "@/app/components/player-panel";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { parseInlineFormatting, EMOTION_EMOJI } from "@/lib/format-message";

/**
 * Returns a human-readable timestamp for a chat message.
 * - Today      → "07:29 PM"
 * - Yesterday  → "Yesterday 07:29 PM"
 * - Older      → "Mar 1, 07:29 PM"
 */
function formatMessageTime(date: Date): string {
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return timeStr;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

// Format message content with markdown-like syntax

/** Replace Inworld emotion/sound tags with their corresponding emoji in display text.
 *  Handles both underscore-form [clear_throat] and space-form [clears throat].
 *  Unknown tags (no matching emoji) are stripped entirely. */
function stripEmotionTags(text: string): string {
  return text
    // Match [word], [word_word], and [word word] — but not markdown links [text](url)
    .replace(/\[([a-z][a-z _]*)\](?!\()/gi, (_, tag: string) => {
      const key = tag.toLowerCase();
      const emoji = EMOTION_EMOJI[key] ?? EMOTION_EMOJI[key.replace(/ /g, '_')];
      return emoji ?? '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

/**
 * Split `text` into TTS-ready sentences starting at `fromChar`.
 * Returns completed sentences (ending in . ! ?) and the new char offset.
 * Sentences shorter than 8 chars are skipped to avoid tiny audio fragments.
 * Only the first MAX_TTS_CHARS characters of the message are considered —
 * this keeps voice output short even if the AI generates a long reply.
 */

/** Max characters TTS will read for the Host narrator (~2-3 sentences, ~20-30s). */
const MAX_TTS_CHARS_HOST = 300;
/** Max characters TTS will read for AI players (~1 sentence, ~10s). */
const MAX_TTS_CHARS_PLAYER = 150;

function extractTTSSentences(
  text: string,
  fromChar: number,
  maxChars: number = MAX_TTS_CHARS_HOST
): { sentences: string[]; newOffset: number } {
  // Hard cap: never read beyond maxChars into the message
  const cappedText = text.slice(0, maxChars);
  const slice = cappedText.slice(fromChar);
  const sentences: string[] = [];
  // Match anything up to and including . ! ? (greedy per sentence)
  const re = /[^.!?]*[.!?]+(?:\s+|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(slice)) !== null) {
    const s = match[0].trim();
    if (s.length >= 8) sentences.push(s);
    lastIndex = match.index + match[0].length;
  }
  return { sentences, newOffset: fromChar + lastIndex };
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
  /** Which game room/channel this message belongs to (e.g. general, werewolves-only). Omitted = legacy "game-room". */
  channelId?: string;
  /** Optional image URL (e.g. Host chose to reply with an image). */
  imageUrl?: string;
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
  lastVotedOutId?: string | null;
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
  lastVotedOutId,
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
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // @ mention / / command autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);

  const popupRef = useRef<HTMLDivElement>(null);

  // Keep the highlighted item visible when navigating with arrow keys
  useEffect(() => {
    if (!popupRef.current) return;
    const active = popupRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [popupIndex]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return players
      .filter(p => !p.isGameMaster && p.id !== userId && p.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  }, [mentionQuery, players, userId]);

  const showPopup = mentionQuery !== null && mentionMatches.length > 0;

  const voice = useVoiceInput();
  const { user } = useAuth();
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const humanPlayer = players.find((p) => p.id === userId);
  // 统一风格：在游戏房间内用户玩家也使用与 AI Host/玩家相同的生成头像（动漫风）
  const useGeneratedAvatarForUser = !!(gameId && humanPlayer);
  const userAvatarName = (humanPlayer?.name && humanPlayer.name.trim() && humanPlayer.name !== "You") ? humanPlayer.name : "Player";
  const { isRecording, isTranscribing, transcript: voiceTranscript, error: voiceError, start: voiceStart, cancel: voiceCancel, confirm: voiceConfirm, supported: voiceSupported } = voice;

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
      return pickVoiceForSpeaker(player?.gender, player?.personality);
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

  const applyMention = useCallback((player: Player) => {
    const cursorPos = inputRef.current?.selectionStart ?? input.length;
    const before = input.slice(0, mentionAnchor);
    const after = input.slice(cursorPos);
    const newText = `${before}@${player.name} ${after}`;
    setInput(newText);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const pos = before.length + player.name.length + 2;
      inputRef.current?.setSelectionRange(pos, pos);
      resizeInput();
    });
  }, [input, mentionAnchor, resizeInput]);

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
      setIsSending(true);
      flushSync(() => setInput(""));
      onSendMessage(text);
      requestAnimationFrame(() => resizeInput());
      setTimeout(() => {
        sendingLockRef.current = false;
        setIsSending(false);
      }, 500);
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
  const sendDisabled = !canSend || isSending || isRoundInProgress;

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

      {/* Messages - min-h-0 allows flex child to shrink so scroll works; only render last visibleCount, load more on scroll up */}
      <ScrollArea className="flex-1 min-h-0 px-6">
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
              p => p.id === message.senderId || p.name === message.senderName
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
          {/* Typing Indicator - only show for current user ("You"); hide for other players to avoid dots when they speak */}
          {typingUsers && typingUsers.length > 0 && typingUsers[0].name === "You" && !messages.some(m => 
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
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-5 border-t border-violet-900/20 bg-zinc-900/50 backdrop-blur-md">
        {canSend && isGameActive && currentSpeakerId === userId && (
          <div className="mb-3 text-sm font-medium text-emerald-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            It's your turn to speak
          </div>
        )}
        {!canSend && isGameActive && !isRecording && (
          <div className="mb-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Wait for your turn to speak
          </div>
        )}
        {lastFailedSendContent && onRetryLastMessage && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
            <span className="text-xs text-red-300">Send failed. Try again?</span>
            <Button size="sm" variant="outline" className="h-7 px-3 border-red-500/50 text-red-300 hover:bg-red-500/20" onClick={onRetryLastMessage}>
              Retry
            </Button>
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
                disabled={sendDisabled}
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
                      disabled={sendDisabled}
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
        {(quickRepliesLoading || quickReplies.length > 0) && canSend && !isRecording && (
          <div className="mb-2">
            {quickRepliesLoading && quickReplies.length === 0 && (
              <div className="flex items-center gap-1.5 px-0.5 text-xs text-zinc-600">
                <span className="inline-block w-2.5 h-2.5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                <span>Suggesting…</span>
              </div>
            )}
            {quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.slice(0, 3).map((text) => {
                  const label = text.length > 38 ? text.slice(0, 37) + "…" : text;
                  return (
                    <button
                      key={text}
                      type="button"
                      title={text}
                      disabled={sendDisabled}
                      onClick={() => {
                        setInput(text);
                        setTimeout(() => {
                          const ta = document.querySelector<HTMLTextAreaElement>("textarea[placeholder]");
                          ta?.focus();
                          ta?.setSelectionRange(ta.value.length, ta.value.length);
                        }, 0);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs leading-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="text-amber-500/60 text-[10px]">⚡</span>
                      {label}
                    </button>
                  );
                })}
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
            <div className="relative flex-1 min-w-0">
              {/* @ mention popup */}
              {showPopup && (
                <div ref={popupRef} className="absolute bottom-full mb-1.5 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-y-auto shadow-2xl z-50 max-h-52">
                  {mentionMatches.map((player, i) => (
                    <button
                      key={player.id}
                      type="button"
                      data-selected={i === popupIndex ? "true" : undefined}
                      onMouseDown={(e) => { e.preventDefault(); applyMention(player); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${i === popupIndex ? 'bg-violet-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}
                    >
                      <span className="text-violet-300 font-bold text-xs w-4 shrink-0">@</span>
                      <span className="font-medium truncate">{player.name}</span>
                      {player.role && <span className={`ml-auto text-xs shrink-0 ${i === popupIndex ? 'text-violet-200' : 'text-zinc-500'}`}>{player.role}</span>}
                    </button>
                  ))}
                </div>
              )}
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                const cursor = e.target.selectionStart ?? val.length;
                setInput(val);
                requestAnimationFrame(() => resizeInput());
                // Detect @ mention
                const beforeCursor = val.slice(0, cursor);
                const mentionMatch = beforeCursor.match(/@([^@\s]*)$/);
                if (mentionMatch) {
                  setMentionQuery(mentionMatch[1]);
                  setMentionAnchor(mentionMatch.index!);
                  setPopupIndex(0);
                } else {
                  setMentionQuery(null);
                }
              }}
              onKeyDown={(e) => {
                if (showPopup) {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setPopupIndex(i => (i - 1 + mentionMatches.length) % mentionMatches.length);
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setPopupIndex(i => (i + 1) % mentionMatches.length);
                    return;
                  }
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    if (mentionMatches[popupIndex]) {
                      applyMention(mentionMatches[popupIndex]);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
                    setMentionQuery(null);
                    return;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendDisabled) handleSend();
                }
              }}
              placeholder={isRoundInProgress ? "Host & AI replying…" : `Message #${channelName}`}
              className="min-h-0 bg-zinc-800/80 backdrop-blur-sm border border-violet-900/30 focus:border-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 text-white placeholder:text-zinc-500 py-2 px-3 text-sm w-full resize-none leading-relaxed scrollbar-hide rounded-lg transition-colors"
              style={{ 
                minHeight: `${MIN_INPUT_HEIGHT}px`, 
                maxHeight: `${MAX_INPUT_HEIGHT}px`
              }}
              disabled={sendDisabled}
              rows={1}
            />
            </div>
            {voiceSupported && (
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0 bg-zinc-700/80 hover:bg-zinc-600 backdrop-blur-sm border border-violet-900/20 focus-visible:ring-2 focus-visible:ring-amber-500/50"
                disabled={sendDisabled}
                onClick={voiceStart}
                title="Voice input"
              >
                <Mic className="h-4 w-4 text-zinc-300" />
              </Button>
            )}
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || sendDisabled}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-500 h-10 w-10 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              title={isRoundInProgress ? "Host & AI replying…" : isSending ? "Sending…" : "Send"}
            >
              {(isSending || isRoundInProgress) ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}