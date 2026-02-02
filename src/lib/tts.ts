'use client';

/** Gap between queue items (ms) for natural "breath" between speakers */
const GAP_BETWEEN_MS = 380;

export interface SpeakOptions {
  /** Pause before this line (ms) — e.g. "character is about to speak" */
  preDelayMs?: number;
  /** TTS speed 0.25–4, default 0.97 for calmer narrative */
  speed?: number;
}

/** Queue item: text, voice, and optional immersion options */
let queue: { text: string; voice: string; speed?: number; preDelayMs?: number }[] = [];
let isPlaying = false;
let audioUnlocked = false;

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
  const { text, voice, speed = 0.97, preDelayMs = 0 } = item;
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
      await playBlob(blob);
      await delay(GAP_BETWEEN_MS);
      playNext();
      return;
    }

    try {
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

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0;
    const rampSteps = 8;
    const stepMs = 15;
    let step = 0;
    const ramp = () => {
      step++;
      audio.volume = Math.min(1, (step / rampSteps) * 1.15);
      if (step < rampSteps) setTimeout(ramp, stepMs);
    };
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      console.warn('[TTS] Audio playback error:', e);
      URL.revokeObjectURL(url);
      resolve(); // Continue to next even on error
    };
    audio.play().then(() => setTimeout(ramp, stepMs)).catch((e) => {
      console.warn('[TTS] Audio play() failed:', e);
      URL.revokeObjectURL(url);
      resolve(); // Continue to next even if play fails
    });
  });
}

/**
 * Unlock audio playback on first user interaction (required by browsers' autoplay policy).
 * Call this when user enables voice for the first time.
 */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const silent = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
    silent.volume = 0.01;
    silent.play().catch(() => {});
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
  });
  if (!isPlaying) playNext();
}

/** Stop current playback and clear queue */
export function stopTTS(): void {
  queue = [];
  isPlaying = false;
}
