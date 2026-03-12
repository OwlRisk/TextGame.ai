"use client";

import { useEffect, useState } from "react";
import type { DiceRollResult } from "@/lib/rpg-mechanics";

interface DiceRollProps {
  roll: DiceRollResult;
  onComplete?: () => void;
}

export function DiceRollAnimation({ roll, onComplete }: DiceRollProps) {
  const [phase, setPhase] = useState<"spinning" | "result" | "done">("spinning");
  const [displayNumber, setDisplayNumber] = useState(1);

  useEffect(() => {
    let frame = 0;
    const maxFrames = 12;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      frame++;
      if (frame >= maxFrames) {
        clearInterval(interval);
        setDisplayNumber(roll.roll);
        setPhase("result");
        setTimeout(() => {
          setPhase("done");
          onComplete?.();
        }, 2000);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [roll, onComplete]);

  if (phase === "done") return null;

  const resultColor = roll.isCritical ? "text-amber-300 border-amber-500 bg-amber-500/20" :
    roll.isFumble ? "text-red-300 border-red-500 bg-red-500/20" :
    roll.total >= 15 ? "text-green-300 border-green-500 bg-green-500/20" :
    roll.total <= 5 ? "text-red-300 border-red-500 bg-red-500/20" :
    "text-zinc-200 border-zinc-500 bg-zinc-500/20";

  const bgGlow = roll.isCritical ? "shadow-amber-500/30" :
    roll.isFumble ? "shadow-red-500/30" :
    "shadow-zinc-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/90 border shadow-2xl ${resultColor} ${bgGlow} animate-in zoom-in-90 duration-300`}>
        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">
          {roll.character} — {roll.diceType}
        </div>

        <div className={`text-4xl font-black tabular-nums transition-all duration-200 ${
          phase === "spinning" ? "animate-pulse scale-110" : "scale-100"
        } ${phase === "result" ? resultColor.split(" ")[0] : "text-zinc-300"}`}>
          {displayNumber}
        </div>

        {phase === "result" && (
          <div className="flex flex-col items-center gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-xs font-mono text-zinc-400">
              {roll.roll} {roll.modifier >= 0 ? "+" : ""}{roll.modifier} = <span className="text-white font-bold">{roll.total}</span>
            </div>
            {roll.context && (
              <div className="text-[10px] text-zinc-500 max-w-[200px] text-center">{roll.context}</div>
            )}
            {roll.isCritical && (
              <div className="text-xs font-bold text-amber-400 animate-pulse mt-1">⚡ CRITICAL HIT!</div>
            )}
            {roll.isFumble && (
              <div className="text-xs font-bold text-red-400 animate-pulse mt-1">💥 FUMBLE!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DiceRollNotificationProps {
  rolls: DiceRollResult[];
  onDismiss: (index: number) => void;
}

export function DiceRollNotifications({ rolls, onDismiss }: DiceRollNotificationProps) {
  if (rolls.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-1.5 max-w-[280px]">
      {rolls.map((roll, i) => (
        <DiceRollBadge key={`${roll.character}-${roll.roll}-${i}`} roll={roll} onDone={() => onDismiss(i)} />
      ))}
    </div>
  );
}

function DiceRollBadge({ roll, onDone }: { roll: DiceRollResult; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const color = roll.isCritical ? "border-amber-500/50 bg-amber-500/10" :
    roll.isFumble ? "border-red-500/50 bg-red-500/10" :
    "border-zinc-700 bg-zinc-800/80";

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border backdrop-blur-sm text-xs animate-in slide-in-from-right-5 duration-300 ${color}`}>
      <span className="text-lg font-black tabular-nums text-white">{roll.roll}</span>
      <div className="flex-1 min-w-0">
        <div className="text-zinc-300 font-medium truncate">{roll.character}</div>
        <div className="text-[10px] text-zinc-500">
          {roll.roll}{roll.modifier >= 0 ? "+" : ""}{roll.modifier} = {roll.total}
          {roll.context ? ` · ${roll.context}` : ""}
        </div>
      </div>
      {roll.isCritical && <span className="text-amber-400">⚡</span>}
      {roll.isFumble && <span className="text-red-400">💥</span>}
    </div>
  );
}
