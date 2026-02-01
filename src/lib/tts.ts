'use client';

/** Queue of { text, voice } to play one after another */
let queue: { text: string; voice: string }[] = [];
let isPlaying = false;
let audioUnlocked = false;

async function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }
  isPlaying = true;
  const { text, voice } = queue.shift()!;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4096), voice, stream: true }),
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
    const reader = res.body?.getReader();
    if (!reader) {
      const blob = await res.blob();
      await playBlob(blob);
      playNext();
      return;
    }
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) chunks.push(value);
    }
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    await playBlob(blob);
    playNext();
  } catch (e) {
    console.warn('[TTS] Play error:', e);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tts-error', { detail: e instanceof Error ? e.message : 'TTS failed' }));
    }
    playNext();
  }
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      console.warn('[TTS] Audio playback error:', e);
      URL.revokeObjectURL(url);
      resolve(); // Continue to next even on error
    };
    audio.play().catch((e) => {
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

/**
 * Enqueue text to be spoken with the given voice. Plays in order; no overlap.
 */
export function speak(text: string, voice: string): void {
  const t = (text || '').trim();
  if (!t) return;
  queue.push({ text: t, voice: voice || 'alloy' });
  if (!isPlaying) playNext();
}

/** Stop current playback and clear queue */
export function stopTTS(): void {
  queue = [];
  isPlaying = false;
}
