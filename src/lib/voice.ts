'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ttsBroadcast } from './tts-broadcast';

/** Strip markdown to plain text for TTS */
export function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prepare text for immersive TTS: strip markdown, links, code blocks, and normalize
 * for natural speech (ellipsis, em-dash, extra spaces). Use this for all spoken content.
 */
export function prepareTextForTTS(text: string, maxLength = 4096): string {
  if (!text || typeof text !== 'string') return '';
  let out = text
    // Inline formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Links: [label](url) -> "label"; bare URLs can stay or be dropped
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '')
    // Headers and list markers
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Code blocks: replace with pause (optional: say "code" or skip)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    // Normalize for speech
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\u2026/g, '...')
    .replace(/\u2014|\u2013/g, ', ')
    .trim();
  if (maxLength > 0 && out.length > maxLength) {
    out = out.slice(0, maxLength).trim();
    const lastSpace = out.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) out = out.slice(0, lastSpace + 1);
  }
  return out;
}

export interface UseVoiceInputOptions {
  onConfirm?: (transcript: string) => void;
  lang?: string;
}

function getDefaultLang(): string {
  if (typeof window === 'undefined') return 'en-US';
  const L = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (L.startsWith('zh')) return 'zh-CN';
  return 'en-US';
}

/** Map full locale to Whisper language code (e.g. zh-CN -> zh, en-US -> en) */
function langToWhisperCode(lang: string): string {
  const base = lang.split('-')[0].toLowerCase();
  return base || 'en';
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onConfirm, lang } = options;
  const langToUse = lang ?? getDefaultLang();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** AnalyserNode for waveform viz; created synchronously with stream to avoid zero data */
  const [liveAnalyser, setLiveAnalyser] = useState<AnalyserNode | null>(null);
  /** Recording duration in seconds */
  const [duration, setDuration] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  /** Release stream and context so the next start() gets a clean device. Call at start of start() to fix "second time" failures. */
  const releaseOnly = useCallback(() => {
    const stream = streamRef.current;
    const ctx = audioContextRef.current;
    const sourceNode = sourceNodeRef.current;
    streamRef.current = null;
    audioContextRef.current = null;
    sourceNodeRef.current = null;
    recorderRef.current = null;
    setLiveAnalyser(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
    try {
      sourceNode?.disconnect();
    } catch (_) {}
    stream?.getTracks().forEach((t) => t.stop());
    try {
      ctx?.close();
    } catch (_) {}
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setDuration(0);
    chunksRef.current = [];
    releaseOnly();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      audioContextRef.current = ctx;

      const streamForViz = stream.clone();
      const source = ctx.createMediaStreamSource(streamForViz);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyser.minDecibels = -80;
      analyser.maxDecibels = -10;
      source.connect(analyser);

      sourceNodeRef.current = source;
      setLiveAnalyser(analyser);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(200);
      setIsRecording(true);

      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (e) {
      setError('Could not start microphone. Please allow mic access.');
      releaseOnly();
    }
  }, [releaseOnly]);

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    const stream = streamRef.current;
    const ctx = audioContextRef.current;
    const sourceNode = sourceNodeRef.current;
    recorderRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    sourceNodeRef.current = null;
    setLiveAnalyser(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
    try {
      sourceNode?.disconnect();
    } catch (_) {}
    try {
      if (rec?.state !== 'inactive') rec?.stop();
    } catch (_) {}
    stream?.getTracks().forEach((t) => t.stop());
    try {
      ctx?.close();
    } catch (_) {}
  }, []);

  const cancel = useCallback(() => {
    stopRecording();
    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setTranscript('');
    setError(null);
    setDuration(0);
  }, [stopRecording]);

  const confirm = useCallback(async (): Promise<string | null> => {
    const rec = recorderRef.current;
    const stream = streamRef.current;
    const ctx = audioContextRef.current;
    const sourceNode = sourceNodeRef.current;
    recorderRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    sourceNodeRef.current = null;
    setLiveAnalyser(null);
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
    try {
      sourceNode?.disconnect();
    } catch (_) {}
    // Wait for recorder 'stop' so ondataavailable has flushed; then read chunks before releasing stream
    const chunks = await new Promise<Blob[]>((resolve) => {
      if (!rec || rec.state === 'inactive') {
        resolve(chunksRef.current);
        return;
      }
      rec.onstop = () => resolve([...chunksRef.current]);
      rec.stop();
    });
    chunksRef.current = [];
    stream?.getTracks().forEach((t) => t.stop());
    try {
      ctx?.close();
    } catch (_) {}

    if (!chunks.length) {
      setError('No audio recorded. Try again.');
      return null;
    }
    const blob = new Blob(chunks, { type: 'audio/webm' });
    if (blob.size < 1000) {
      setError('Recording too short. Speak for at least a second.');
      return null;
    }
    setIsTranscribing(true);
    setError(null);
    try {
      const file = new File([blob], 'audio.webm', { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      // Don't send language: Whisper auto-detects, so all languages are supported
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Transcription failed';
        setError(msg);
        return null;
      }
      const text = (data?.text ?? '').trim();
      setTranscript(text);
      if (text && onConfirm) onConfirm(text);
      return text || null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      setError(msg);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [onConfirm]);

  const supported =
    typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!window.MediaRecorder;

  return { isRecording, isTranscribing, transcript, error, start, cancel, confirm, supported, liveAnalyser, duration };
}

export function useVoiceOutput() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** Speak and replace any current utterance (cancels previous) */
  const speak = useCallback((text: string, options?: { lang?: string; rate?: number }) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const plain = stripMarkdownForTTS(text);
    if (!plain) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = options?.lang ?? 'en-US';
    u.rate = options?.rate ?? 1;
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, []);

  /** Queue utterance without cancelling current — use for sentence-by-sentence TTS during streaming */
  const speakQueued = useCallback((text: string, options?: { lang?: string; rate?: number }) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const plain = stripMarkdownForTTS(text);
    if (!plain) return;
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = options?.lang ?? 'en-US';
    u.rate = options?.rate ?? 1;
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { speak, speakQueued, stop, supported };
}

/** Inworld TTS voice IDs (host = 0, then players in order). From Inworld docs. */
export const INWORLD_VOICE_IDS = [
  'Dennis',  // 0 host – calm, friendly
  'Ashley',  // 1 warm female
  'Alex',    // 2 energetic male
] as const;

interface TTSQueueItem {
  audioPromise: Promise<string | null>; // pre-fetched base64 audio
  /** Called the moment this sentence begins playing (or is skipped on error). */
  onPlay?: () => void;
}

/**
 * Strip Inworld emotion/sound tags from text before sending to the API.
 * Inworld handles them natively, but if the model/voice doesn't support
 * them they would be spoken aloud. Stripping here keeps speech clean
 * while still passing the tag inline so supported models can use it.
 *
 * Strategy: keep the tag inline for Inworld (it processes them if supported),
 * but also send a clean fallback version if needed. For now we pass the tag
 * as-is and let Inworld handle it — no extra stripping at API level.
 * If a user hears the tag spoken, they should switch to a model that supports it.
 */
async function prefetchTTSAudio(text: string, voiceId: string): Promise<string | null> {
  const modelId = (typeof window !== 'undefined' ? localStorage.getItem('tts_model') : null) ?? 'inworld-tts-1.5-max';

  /** Raw API call — used directly by the owner (or single-player). */
  const callApi = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/inworld-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000), voiceId, modelId }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { audioBase64?: string };
      return data.audioBase64 ?? null;
    } catch {
      return null;
    }
  };

  // In multiplayer mode route through the broadcast manager so that:
  //   owner  → calls API + broadcasts result to guests
  //   guests → wait for owner's broadcast (no API call, no token deduction)
  if (ttsBroadcast.isActive) {
    return ttsBroadcast.getAudio(text, voiceId, callApi);
  }

  // Single-player fallback: call API directly (unchanged behaviour).
  return callApi();
}

export function useInworldTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  // Queue items hold a pre-fetched audio promise rather than raw text
  const queueRef = useRef<Array<TTSQueueItem>>([]);
  const processingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) {
      if (queueRef.current.length === 0) setIsPlaying(false);
      return;
    }
    processingRef.current = true;
    setIsPlaying(true);
    const next = queueRef.current.shift()!;
    try {
      // Audio may already be fully fetched if processing the previous sentence took
      // longer than the fetch — await resolves instantly in that case.
      const audioBase64 = await next.audioPromise;
      if (!audioBase64) {
        // Still reveal text even when audio fails.
        next.onPlay?.();
        processingRef.current = false;
        processQueue();
        return;
      }
      // Convert base64 to Blob URL so CSP "media-src 'self' blob:" allows playback
      // (data: URIs are blocked by CSP in production)
      const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrlRef.current = blobUrl;
      const audio = new Audio(blobUrl);
      const storedSpeed = typeof window !== 'undefined'
        ? parseFloat(localStorage.getItem('tts_speed') ?? '1') || 1
        : 1;
      audio.playbackRate = Math.min(1.5, Math.max(0.5, storedSpeed));
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          currentBlobUrlRef.current = null;
          URL.revokeObjectURL(blobUrl);
          // Reveal text only after this sentence has finished playing (progressive reveal)
          next.onPlay?.();
          resolve();
        };
        audio.onerror = () => {
          currentBlobUrlRef.current = null;
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Playback failed'));
        };
        audio.play().catch((err: unknown) => {
          currentBlobUrlRef.current = null;
          URL.revokeObjectURL(blobUrl);
          if (err instanceof Error && err.name === 'NotAllowedError') {
            next.onPlay?.();
            resolve();
          } else {
            reject(err);
          }
        });
      });
    } catch (e) {
      console.warn('[Inworld TTS]', e);
    } finally {
      audioRef.current = null;
      processingRef.current = false;
      processQueue();
    }
  }, []);

  const play = useCallback((text: string, voiceId: string, onPlay?: () => void) => {
    const plain = stripMarkdownForTTS(text?.trim() ?? '');
    if (!plain || !voiceId) {
      // No audio — reveal text immediately so it's never hidden.
      onPlay?.();
      return;
    }
    // Kick off fetch immediately — audio is being downloaded while the previous
    // sentence is still playing, eliminating the gap between sentences.
    const audioPromise = prefetchTTSAudio(plain, voiceId);
    queueRef.current.push({ audioPromise, onPlay });
    processQueue();
  }, [processQueue]);

  /**
   * Enqueue a zero-audio sentinel. The callback fires after all items
   * already in the queue have finished playing — useful for ensuring text
   * is fully revealed only after the last sentence's audio completes.
   */
  const queueDeferred = useCallback((callback: () => void) => {
    queueRef.current.push({ audioPromise: Promise.resolve(null), onPlay: callback });
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setIsPlaying(false);
    processingRef.current = false;
  }, []);

  // Stop audio when the component using this hook unmounts (e.g. navigating away)
  useEffect(() => {
    return () => {
      queueRef.current = [];
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      processingRef.current = false;
    };
  }, []);

  const supported = typeof window !== 'undefined';

  return { play, stop, queueDeferred, isPlaying, supported };
}
