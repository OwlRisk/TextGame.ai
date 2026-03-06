"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useInworldTTS } from "@/lib/voice";
import { ttsBroadcast } from "@/lib/tts-broadcast";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";
import { extractTTSSentences, MAX_TTS_CHARS_HOST, MAX_TTS_CHARS_PLAYER } from "@/lib/chat-utils";
import type { Player } from "@/app/components/player-panel";

interface TTSMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isAI: boolean;
  isSystemMessage?: boolean;
  isStreaming?: boolean;
  isPrivate?: boolean;
}

interface UseChatTTSOpts {
  messages: TTSMessage[];
  players: Player[];
  gameId?: string;
  channelId?: string;
  channelName: string;
  isOwner?: boolean;
}

export function useChatTTS({ messages, players, gameId, channelId, channelName, isOwner }: UseChatTTSOpts) {
  // ─── TTS Broadcast ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId || isOwner === undefined) {
      ttsBroadcast.teardown();
      return;
    }
    ttsBroadcast.setup(gameId, isOwner);
    return () => {};
  }, [gameId, isOwner]);

  useEffect(() => {
    return () => { ttsBroadcast.teardown(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Voice enabled state ──────────────────────────────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('voice_enabled');
    return stored === null ? true : stored !== 'false';
  });
  const { play: playInworldTTS, stop: stopInworldTTS, queueDeferred: queueDeferredTTS, isPlaying: isTTSPlaying, supported: inworldTTSSupported } = useInworldTTS();

  // ─── Refs for TTS progress tracking ───────────────────────────────────
  const ttsProgressRef = useRef<Map<string, number>>(new Map());
  const ttsQueuedRef = useRef<Set<string>>(new Set());
  const ttsCompletedRef = useRef<Set<string>>(new Set());
  const [ttsProcessingTick, setTtsProcessingTick] = useState(0);
  const initialMessageIdsRef = useRef<Set<string> | null>(null);
  const hasQueuedTTSInSessionRef = useRef(false);
  const justSwitchedChannelRef = useRef(false);
  const displayedContentRef = useRef<Map<string, string>>(new Map());
  const [revealTick, setRevealTick] = useState(0);
  const ttsFallbackTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Voice-per-speaker assignment ─────────────────────────────────────
  const voiceIdForMessage = useCallback(
    (m: TTSMessage) => {
      const player = players.find(
        (p) => p.id === m.senderId || (p.name || '').trim() === (m.senderName || '').trim()
      );
      if (player?.voiceId) return player.voiceId;
      const voiceHint = [player?.personality, player?.background].filter(Boolean).join('. ') || undefined;
      return pickVoiceForSpeaker(player?.gender, voiceHint, undefined, player?.name || m.senderName);
    },
    [players]
  );

  // ─── Restore displayed content when voice is toggled on ───────────────
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

  const revealSentence = useCallback((messageId: string, sentence: string) => {
    const cur = displayedContentRef.current.get(messageId) ?? '';
    const sep = cur && !/\s$/.test(cur) ? ' ' : '';
    displayedContentRef.current.set(messageId, cur + sep + sentence);
    setRevealTick((t) => t + 1);
  }, []);

  // ─── Reset on game/channel switch ─────────────────────────────────────
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

  // ─── Main TTS processing effect ──────────────────────────────────────
  useEffect(() => {
    if (!voiceEnabled || !inworldTTSSupported) return;

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
      if (ttsCompletedRef.current.has(m.id)) continue;
      if (ttsQueuedRef.current.has(m.id)) return;

      const content = (m.content || '').trim();
      if (!content) continue;

      if (m.isStreaming) {
        displayedContentRef.current.set(m.id, content);
        setRevealTick((t) => t + 1);
        return;
      }

      ttsQueuedRef.current.add(m.id);
      hasQueuedTTSInSessionRef.current = true;

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

      const msgId = m.id;
      const fullContent = content;
      queueDeferredTTS(() => {
        displayedContentRef.current.set(msgId, fullContent);
        ttsCompletedRef.current.add(msgId);
        ttsProgressRef.current.delete(msgId);
        setTtsProcessingTick((t) => t + 1);
      });

      return;
    }

    const liveIds = new Set(messages.map((m) => m.id));
    for (const id of ttsProgressRef.current.keys()) {
      if (!liveIds.has(id)) ttsProgressRef.current.delete(id);
    }
  }, [voiceEnabled, inworldTTSSupported, messages, ttsProcessingTick, voiceIdForMessage, playInworldTTS, queueDeferredTTS]);

  // ─── Cleanup when voice disabled ──────────────────────────────────────
  useEffect(() => {
    if (!voiceEnabled) {
      stopInworldTTS();
      ttsProgressRef.current.clear();
      ttsQueuedRef.current.clear();
      ttsCompletedRef.current.clear();
      ttsFallbackTimeoutsRef.current.forEach((t) => clearTimeout(t));
      ttsFallbackTimeoutsRef.current.clear();
    }
  }, [voiceEnabled, stopInworldTTS]);

  // ─── Fallback: reveal full text if TTS stalls ─────────────────────────
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
        if (t) { clearTimeout(t); timeouts.delete(m.id); }
        continue;
      }
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
      if (!liveIds.has(id)) { clearTimeout(t); timeouts.delete(id); }
    }
    return () => {};
  }, [voiceEnabled, inworldTTSSupported, messages, revealTick]);

  return {
    voiceEnabled,
    setVoiceEnabled,
    stopInworldTTS,
    isTTSPlaying,
    inworldTTSSupported,
    displayedContentRef,
    revealTick,
  };
}
