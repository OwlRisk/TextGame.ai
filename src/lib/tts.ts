'use client';

/** Gap between queue items (ms) for natural "breath" between speakers */
const GAP_BETWEEN_MS = 380;

export interface SpeakOptions {
  /** Pause before this line (ms) — e.g. "character is about to speak" */
  preDelayMs?: number;
  /** TTS speed 0.25–4, default 0.97 for calmer narrative */
  speed?: number;
  /** Called when playback is about to start (use to show message text in sync with voice) */
  onPlaybackStarted?: () => void;
}

/** Queue item: text, voice, and optional immersion options */
let queue: { text: string; voice: string; speed?: number; preDelayMs?: number; onPlaybackStarted?: () => void }[] = [];
let isPlaying = false;
let audioUnlocked = false;

/** Web Audio context — created and resumed only on user gesture (unlockAudio) so Safari allows playback */
let audioContext: AudioContext | null = null;

/** Single Audio element unlocked on user gesture — Safari often allows reuse for subsequent play() */
let unlockedAudioEl: HTMLAudioElement | null = null;

/** Safari: when play() is blocked, store blob here; UI can show "Tap to Play" and call resumeSafariPlayback() */
let pendingSafariBlob: Blob | null = null;

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) || (navigator as any).vendor === 'Apple Computer, Inc.';
}

/** Safari: play blob via Web Audio API (must use context that was resumed on user gesture). Safari may fail on MP3 decode. */
function playBlobViaContext(blob: Blob, ctx: AudioContext): Promise<void> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const buf = fr.result as ArrayBuffer;
      ctx.decodeAudioData(buf).then((decoded) => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.onended = () => resolve();
        src.start(0);
      }).catch((e) => {
        console.warn('[TTS] decodeAudioData failed, fallback to Audio:', e);
        playBlobHtml(blob).then(resolve).catch(reject);
      });
    };
    fr.onerror = () => reject(new Error('FileReader failed'));
    fr.readAsArrayBuffer(blob);
  });
}

/** Check if browser supports streaming MP3 playback via MediaSource */
function supportsStreamingMp3(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg');
}

/** Collect all chunks from reader and play as blob (fallback when streaming not supported) */
async function collectAndPlayBlob(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  const chunks: Uint8Array[] = [];
  let result = await reader.read();
  while (!result.done) {
    if (result.value) chunks.push(result.value);
    result = await reader.read();
  }
  const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
  await playBlob(blob);
}

/** Play streamed MP3: start playback as soon as first chunks arrive (Chrome, Edge). Falls back to buffered playback elsewhere. */
async function playStreamedMp3(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  if (!supportsStreamingMp3()) {
    await collectAndPlayBlob(reader);
    return;
  }

  const mediaSource = new MediaSource();
  const url = URL.createObjectURL(mediaSource);
  const audio = new Audio(url);

  await new Promise<void>((resolve, reject) => {
    mediaSource.addEventListener('sourceopen', () => {
      let sourceBuffer: SourceBuffer;
      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      } catch (e) {
        mediaSource.endOfStream();
        reject(e);
        return;
      }

      const appendNextChunk = async () => {
        try {
          const { value, done } = await reader.read();
          if (done) {
            if (mediaSource.readyState === 'open') mediaSource.endOfStream();
            resolve();
            return;
          }
          if (value && value.length > 0) {
            sourceBuffer.appendBuffer(value as BufferSource);
            sourceBuffer.addEventListener('updateend', () => appendNextChunk(), { once: true });
          } else {
            appendNextChunk();
          }
        } catch (e) {
          if (mediaSource.readyState === 'open') mediaSource.endOfStream();
          reject(e);
        }
      };

      appendNextChunk();
    }, { once: true });

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch(reject);
  });

  await new Promise<void>((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }
  isPlaying = true;
  const item = queue.shift()!;
  const { text, voice, speed = 0.97, preDelayMs = 0, onPlaybackStarted } = item;
  try {
    if (preDelayMs > 0) await delay(preDelayMs);
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 4096),
        voice,
        speed: Math.max(0.25, Math.min(4, speed)),
        stream: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: string }).error ?? 'TTS failed';
      console.warn('[TTS] API error:', msg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tts-error', { detail: msg }));
      }
      playNext();
      return;
    }
    const contentLength = res.headers.get('content-length');
    if (contentLength === '0' || (contentLength && parseInt(contentLength, 10) === 0)) {
      await delay(GAP_BETWEEN_MS);
      playNext();
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const blob = await res.blob();
      onPlaybackStarted?.();
      await playBlob(blob);
      await delay(GAP_BETWEEN_MS);
      playNext();
      return;
    }

    try {
      onPlaybackStarted?.();
      await playStreamedMp3(reader);
    } catch (e) {
      console.warn('[TTS] Streaming playback failed, falling back to buffered:', e);
      reader.releaseLock();
      const res2 = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 4096), voice, speed: Math.max(0.25, Math.min(4, speed)) }),
      });
      if (res2.ok) {
        const blob = await res2.blob();
        onPlaybackStarted?.();
        await playBlob(blob);
      }
    }
    // Natural pause between queue items before starting next
    await delay(GAP_BETWEEN_MS);
    playNext();
  } catch (e) {
    console.warn('[TTS] Play error:', e);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tts-error', { detail: e instanceof Error ? e.message : 'TTS failed' }));
    }
    await delay(GAP_BETWEEN_MS);
    playNext();
  }
}

function playBlobHtml(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const cleanup = () => { URL.revokeObjectURL(url); };

  const playWith = (audio: HTMLAudioElement): Promise<void> => {
    return new Promise((resolve) => {
      audio.volume = 0;
      const rampSteps = 8;
      const stepMs = 15;
      let step = 0;
      const ramp = () => {
        step++;
        audio.volume = Math.min(1, (step / rampSteps) * 1.15);
        if (step < rampSteps) setTimeout(ramp, stepMs);
      };
      const onEnd = () => { cleanup(); resolve(); };
      audio.onended = onEnd;
      audio.onerror = () => { cleanup(); resolve(); };
      audio.play().then(() => setTimeout(ramp, stepMs)).catch((e) => {
        console.warn('[TTS] Audio play() failed:', e);
        cleanup();
        if (e?.name === 'NotAllowedError' && typeof window !== 'undefined') {
          audioUnlocked = false;
          window.dispatchEvent(new CustomEvent('tts-error', { detail: '请先点击「Voice On」以允许声音，或使用 Chrome 浏览器。' }));
        }
        resolve();
      });
    });
  };

  if (unlockedAudioEl && isSafari()) {
    return new Promise((resolve) => {
      const el = unlockedAudioEl!;
      el.src = url;
      el.volume = 1;
      el.onended = () => { cleanup(); resolve(); };
      el.onerror = () => { cleanup(); resolve(); };
      el.oncanplaythrough = () => {
        el.play().then(() => {}).catch((e) => {
          console.warn('[TTS] Reused Audio play() failed:', e);
          if (e?.name === 'NotAllowedError' && typeof window !== 'undefined') {
            pendingSafariBlob = blob;
            window.dispatchEvent(new CustomEvent('safari-play-blocked'));
          }
          cleanup();
          resolve();
        });
      };
    });
  }

  return playWith(new Audio(url));
}

function playBlob(blob: Blob): Promise<void> {
  if (isSafari()) {
    return playBlobHtml(blob);
  }
  if (audioContext && audioContext.state !== 'closed') {
    return (audioContext.state === 'suspended' ? audioContext.resume() : Promise.resolve())
      .then(() => (audioContext!.state === 'running' ? playBlobViaContext(blob, audioContext!) : playBlobHtml(blob)));
  }
  return playBlobHtml(blob);
}

/**
 * Unlock audio playback on first user interaction (required by browsers' autoplay policy).
 * Call this when user enables voice for the first time.
 * Safari: create and play one Audio element so we can reuse it for TTS (same-element playback often allowed).
 */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (typeof window === 'undefined') return;
  const silentMp3 = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  if (isSafari()) {
    try {
      unlockedAudioEl = new Audio(silentMp3);
      unlockedAudioEl.volume = 0.01;
      unlockedAudioEl.play().then(() => {}).catch(() => {});
    } catch (e) {}
    return;
  }
  try {
    const silent = new Audio(silentMp3);
    silent.volume = 0.01;
    silent.play().catch(() => {});
  } catch (e) {}
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return;
  try {
    audioContext = new Ctx();
    audioContext.resume().then(() => {}).catch(() => {});
  } catch (e) {}
}

/** Cartesia rejects "empty or only punctuation" — don't enqueue such text */
function hasSpeakableContent(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /[\p{L}\p{N}]/u.test(t);
}

/**
 * Enqueue text to be spoken with the given voice. Plays in order; no overlap.
 * Options: preDelayMs (pause before speaking), speed (0.25–4, default 0.97 for calmer narrative).
 */
export function speak(text: string, voice: string, options?: SpeakOptions): void {
  const t = (text || '').trim();
  if (!t || !hasSpeakableContent(t)) return;
  queue.push({
    text: t,
    voice: voice || 'alloy',
    speed: options?.speed ?? 0.97,
    preDelayMs: options?.preDelayMs ?? 0,
    onPlaybackStarted: options?.onPlaybackStarted,
  });
  if (!isPlaying) playNext();
}

/**
 * Safari: play a blob in the current user gesture (must be called from click handler).
 * Uses a new Audio element and play() synchronously so Safari allows playback.
 */
function playBlobInUserGesture(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const cleanup = () => URL.revokeObjectURL(url);
    audio.volume = 1;
    audio.onended = () => { cleanup(); resolve(); };
    audio.onerror = () => { cleanup(); resolve(); };
    audio.play().then(() => {}).catch(() => { cleanup(); resolve(); });
  });
}

/** Safari: manually play the pending blob (must be called from UI button click — user gesture). */
export function resumeSafariPlayback(): void {
  if (!pendingSafariBlob) return;
  const blob = pendingSafariBlob;
  pendingSafariBlob = null;
  playBlobInUserGesture(blob).finally(() => {
    isPlaying = false;
    playNext();
  });
}

/** Stop current playback and clear queue */
export function stopTTS(): void {
  queue = [];
  isPlaying = false;
  pendingSafariBlob = null;
}

/**
 * Split text into sentences for TTS (keep punctuation with sentence).
 * Handles Chinese (。！？) and English (. ! ?).
 */
function splitIntoSentences(text: string): string[] {
  const t = (text || '').trim();
  if (!t) return [];
  // Split after sentence-ending punctuation, keep delimiter with previous part
  const parts = t.split(/(?<=[。！？.!?])\s+/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

export interface SpeakBySentencesOptions {
  speed?: number;
  /** Called when each sentence starts playing, with all text shown so far */
  onSentenceShown?: (textSoFar: string) => void;
  /** Called when the last sentence has started playing */
  onComplete?: () => void;
}

/**
 * Speak text sentence-by-sentence; call onSentenceShown as each sentence starts so UI can show text in sync with voice.
 */
export function speakBySentences(
  text: string,
  voice: string,
  options?: SpeakBySentencesOptions
): void {
  const plain = (text || '').trim();
  if (!plain || !hasSpeakableContent(plain)) {
    options?.onComplete?.();
    return;
  }
  const sentences = splitIntoSentences(plain);
  if (sentences.length === 0) {
    speak(plain, voice, {
      speed: options?.speed ?? 0.97,
      onPlaybackStarted: () => {
        options?.onSentenceShown?.(plain);
        options?.onComplete?.();
      },
    });
    return;
  }
  let accumulated = '';
  sentences.forEach((s, i) => {
    accumulated += (i === 0 ? '' : ' ') + s;
    const isLast = i === sentences.length - 1;
    speak(s, voice, {
      speed: options?.speed ?? 0.97,
      onPlaybackStarted: () => {
        options?.onSentenceShown?.(accumulated);
        if (isLast) options?.onComplete?.();
      },
    });
  });
}
