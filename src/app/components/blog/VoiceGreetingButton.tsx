"use client";

import { useCallback, useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";

interface VoiceGreetingButtonProps {
  text: string;
  label?: string;
}

export function VoiceGreetingButton({ text, label = "Hear the Game Master" }: VoiceGreetingButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleClick = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    // Stop if already playing
    if (state === "playing") {
      window.speechSynthesis.cancel();
      setState("idle");
      return;
    }

    setState("loading");
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 0.9;

    // Pick a deeper voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && /male|daniel|google uk/i.test(v.name)
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setState("playing");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Fallback: voices might not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v2 = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
        if (v2 && utteranceRef.current) utteranceRef.current.voice = v2;
      };
    }
  }, [text, state]);

  if (!("speechSynthesis" in (typeof window !== "undefined" ? window : {}))) return null;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
        state === "playing"
          ? "border-violet-500/60 text-violet-300 bg-violet-500/10"
          : "border-zinc-700 text-zinc-400 hover:text-violet-400 hover:border-violet-500/40 bg-zinc-900/60"
      }`}
    >
      {state === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3 w-3 fill-current" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {state === "playing" ? "Stop" : label}
    </button>
  );
}
