"use client";

import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Skull, Vote, Swords, Trophy } from "lucide-react";

export interface GameEvent {
  id: string;
  type: "phase" | "elimination" | "vote_start" | "vote_end" | "game_over";
  text: string;
  subtext?: string;
  mood?: "dark" | "light" | "neutral" | "danger" | "victory";
}

interface GameEventOverlayProps {
  event: GameEvent | null;
  onDismiss: () => void;
}

const MOOD_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode; textColor: string }> = {
  dark: {
    bg: "from-indigo-950/95 via-zinc-900/95 to-indigo-950/95",
    border: "border-indigo-500/30",
    icon: <Moon className="h-8 w-8 text-indigo-400" />,
    textColor: "text-indigo-200",
  },
  light: {
    bg: "from-amber-900/90 via-zinc-900/90 to-amber-900/90",
    border: "border-amber-500/30",
    icon: <Sun className="h-8 w-8 text-amber-400" />,
    textColor: "text-amber-200",
  },
  danger: {
    bg: "from-red-950/95 via-zinc-900/95 to-red-950/95",
    border: "border-red-500/40",
    icon: <Skull className="h-8 w-8 text-red-400" />,
    textColor: "text-red-200",
  },
  victory: {
    bg: "from-emerald-950/95 via-zinc-900/95 to-emerald-950/95",
    border: "border-emerald-500/30",
    icon: <Trophy className="h-8 w-8 text-emerald-400" />,
    textColor: "text-emerald-200",
  },
  neutral: {
    bg: "from-violet-950/90 via-zinc-900/90 to-violet-950/90",
    border: "border-violet-500/30",
    icon: <Swords className="h-8 w-8 text-violet-400" />,
    textColor: "text-violet-200",
  },
};

function getEventMood(event: GameEvent): string {
  if (event.mood) return event.mood;
  const lower = event.text.toLowerCase();
  if (/night|dark|close your eyes/i.test(lower)) return "dark";
  if (/day|dawn|morning|wake/i.test(lower)) return "light";
  if (/eliminat|killed|dead|removed|executed/i.test(lower)) return "danger";
  if (/game over|winner|victory|end/i.test(lower)) return "victory";
  return "neutral";
}

function getEventIcon(event: GameEvent) {
  switch (event.type) {
    case "elimination": return <Skull className="h-8 w-8 text-red-400" />;
    case "vote_start": return <Vote className="h-8 w-8 text-violet-400" />;
    case "game_over": return <Trophy className="h-8 w-8 text-emerald-400" />;
    default: return null;
  }
}

export function GameEventOverlay({ event, onDismiss }: GameEventOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDismiss();
    }, 400);
  }, [onDismiss]);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    setExiting(false);
    const timer = setTimeout(dismiss, event.type === "game_over" ? 5000 : 2500);
    return () => clearTimeout(timer);
  }, [event, dismiss]);

  if (!visible || !event) return null;

  const mood = getEventMood(event);
  const style = MOOD_STYLES[mood] || MOOD_STYLES.neutral;
  const icon = getEventIcon(event) || style.icon;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-400 ${exiting ? "opacity-0" : "opacity-100"}`}
      onClick={dismiss}
    >
      <div className={`pointer-events-auto bg-gradient-to-r ${style.bg} border ${style.border} backdrop-blur-xl rounded-2xl px-8 py-6 shadow-2xl max-w-md mx-4 text-center transform transition-all duration-400 ${exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
        <div className="flex justify-center mb-3">
          {icon}
        </div>
        <h2 className={`text-lg font-black tracking-wide uppercase ${style.textColor}`}>
          {event.text}
        </h2>
        {event.subtext && (
          <p className="mt-2 text-sm text-zinc-400">{event.subtext}</p>
        )}
      </div>
    </div>
  );
}
