'use client';

/**
 * TTSBroadcastManager
 *
 * In multiplayer games the room owner is the only client who calls the TTS
 * API (and pays for it). After generating audio the owner broadcasts the
 * base64 payload to all other clients via a Supabase Broadcast channel.
 * Guest / non-owner clients subscribe to the channel and receive audio
 * without making any API call.
 *
 * Single-player usage (no guests): owner always broadcasts, nobody listens.
 * Behaviour is identical to the original code — the only overhead is the
 * ignored broadcast message.
 */

import { supabase } from './supabase';

type ResolveAudio = (audio: string | null) => void;

interface PendingEntry {
  resolve: ResolveAudio;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * M-7: djb2 hash so the full text is represented by a compact key.
 * Avoids the collision bug where two sentences sharing the same 48-character
 * prefix would incorrectly hit the same cache entry.
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0; // keep 32-bit signed
  }
  return (hash >>> 0).toString(36); // unsigned hex-like string
}

function makeKey(text: string, voiceId: string): string {
  return `${djb2Hash(text)}||${voiceId}`;
}

/** I-4: Maximum number of audio entries to keep in the in-memory cache. */
const MAX_CACHE_SIZE = 100;

class TTSBroadcastManager {
  private _gameId: string | null = null;
  private _isOwner = false;
  private _channel: ReturnType<typeof supabase.channel> | null = null;
  /** key → audioBase64 (LRU-evicted when > MAX_CACHE_SIZE) */
  private _cache = new Map<string, string>();
  private _pending = new Map<string, PendingEntry>();

  /** True when the manager is active (i.e. a gameId has been configured). */
  get isActive() {
    return !!this._gameId;
  }

  /**
   * Initialise (or re-initialise) the manager for a game room.
   * Safe to call multiple times; no-op if already configured for the same
   * gameId + isOwner combination.
   */
  setup(gameId: string, isOwner: boolean) {
    if (this._gameId === gameId && this._isOwner === isOwner) return;
    this.teardown();
    this._gameId = gameId;
    this._isOwner = isOwner;

    // All clients subscribe so they can receive broadcasts.
    // `self: false` means the owner won't echo its own broadcasts back to itself.
    this._channel = supabase
      .channel(`tts_audio:${gameId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'tts_audio' }, (msg) => {
        const { key, audioBase64 } = msg.payload as { key: string; audioBase64: string };
        if (!key || !audioBase64) return;
        this._setCached(key, audioBase64);
        const entry = this._pending.get(key);
        if (entry) {
          clearTimeout(entry.timeout);
          this._pending.delete(key);
          entry.resolve(audioBase64);
        }
      })
      .subscribe();
  }

  /** Tear down the channel and clear all state. */
  teardown() {
    if (this._channel) {
      supabase.removeChannel(this._channel);
      this._channel = null;
    }
    for (const { timeout } of this._pending.values()) clearTimeout(timeout);
    this._gameId = null;
    this._cache.clear();
    this._pending.clear();
  }

  /**
   * I-4: Insert or update a cache entry.
   * Evicts the oldest entry when the cache exceeds MAX_CACHE_SIZE.
   */
  private _setCached(key: string, audio: string) {
    if (this._cache.has(key)) {
      // Refresh: delete + re-insert to move to end (most-recently-used)
      this._cache.delete(key);
    } else if (this._cache.size >= MAX_CACHE_SIZE) {
      // Evict oldest (first inserted) entry
      const firstKey = this._cache.keys().next().value;
      if (firstKey !== undefined) this._cache.delete(firstKey);
    }
    this._cache.set(key, audio);
  }

  /**
   * Get TTS audio for a sentence.
   *
   * - Owner:  calls `ownerFetcher()` (the real API), then broadcasts the
   *           result so guests receive it immediately.
   * - Guest:  waits up to `timeoutMs` ms for the owner's broadcast, then
   *           returns null (text will still be revealed, just silently).
   */
  async getAudio(
    text: string,
    voiceId: string,
    ownerFetcher: () => Promise<string | null>,
    timeoutMs = 8000
  ): Promise<string | null> {
    const key = makeKey(text, voiceId);

    // Check local cache (owner's own broadcasts are not received by self,
    // so owner fills the cache via the fetcher path below).
    const cached = this._cache.get(key);
    if (cached) return cached;

    if (this._isOwner) {
      const audio = await ownerFetcher();
      if (audio) {
        this._setCached(key, audio);
        // Broadcast to all non-owner clients in the room.
        this._channel?.send({
          type: 'broadcast',
          event: 'tts_audio',
          payload: { key, audioBase64: audio },
        });
      }
      return audio;
    }

    // Guest: wait for the owner to broadcast this sentence.
    return new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        this._pending.delete(key);
        resolve(null);
      }, timeoutMs);
      this._pending.set(key, { resolve, timeout });
    });
  }
}

/** Singleton — one instance shared across all components in the page. */
export const ttsBroadcast = new TTSBroadcastManager();
