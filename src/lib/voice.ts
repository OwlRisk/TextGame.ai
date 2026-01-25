'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/** Strip markdown to plain text for TTS */
export function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onConfirm, lang } = options;
  const langToUse = lang ?? getDefaultLang();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = typeof window !== 'undefined' ? ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) : undefined;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langToUse;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const results = e.results;
      if (!results?.length) return;
      let full = '';
      for (let i = 0; i < results.length; i++) {
        const r = results[i][0];
        if (r?.transcript) full += (full ? ' ' : '') + r.transcript;
      }
      if (full) {
        setTranscript(full);
        setError(null);
      }
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setError('Microphone access denied. Please allow mic in browser settings.');
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else {
        setError('Voice input failed. Try again.');
      }
    };
    rec.onend = () => {
      // Keep UI in recording state; user confirms or cancels.
    };
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch (_) {}
      recognitionRef.current = null;
    };
  }, [langToUse]);

  const start = useCallback(() => {
    setError(null);
    setTranscript('');
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      setError('Could not start microphone. Please allow mic access.');
      setIsRecording(false);
    }
  }, []);

  const cancel = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsRecording(false);
    setTranscript('');
    setError(null);
  }, []);

  const confirm = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    const t = transcript.trim();
    if (t && onConfirm) onConfirm(t);
    setIsRecording(false);
    setTranscript('');
    setError(null);
  }, [transcript, onConfirm]);

  const supported = typeof window !== 'undefined' && !!((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);

  return { isRecording, transcript, error, start, cancel, confirm, supported };
}

export function useVoiceOutput() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { speak, stop, supported };
}
