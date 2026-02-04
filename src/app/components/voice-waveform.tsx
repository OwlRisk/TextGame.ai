"use client";

import { useEffect, useRef } from "react";

const NUM_BARS = 60;

/**
 * Real-time voice visualization using an AnalyserNode created by the parent (on user gesture).
 * Parent must pass a connected AnalyserNode (e.g. from useVoiceInput's liveAnalyser).
 */
export function VoiceWaveform({
  analyser,
  duration,
  className,
  barClassName = "bg-zinc-400",
  waveColor = "rgba(161, 161, 170, 0.9)",
}: {
  analyser?: AnalyserNode | null;
  duration?: number;
  className?: string;
  barClassName?: string;
  waveColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || analyser.context.state === "closed") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let rafId = 0;
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      analyser.getByteFrequencyData(dataArray);

      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w <= 0 || h <= 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      const barW = Math.max(1, w / NUM_BARS - 1.5);
      const step = Math.floor(dataArray.length / NUM_BARS) || 1;

      for (let i = 0; i < NUM_BARS; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] ?? 0;
        }
        const avg = step > 0 ? sum / step : 0;
        const normalized = avg / 255;
        const barH = Math.max(2, Math.min(h, normalized * normalized * h * 1.5 + 2));
        const x = i * (w / NUM_BARS);
        const y = (h - barH) / 2;
        ctx.fillStyle = waveColor;
        ctx.fillRect(x, y, barW, barH);
      }
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [analyser, waveColor]);

  if (analyser) {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div
        className={`flex-1 min-w-0 flex items-center gap-3 overflow-hidden ${className ?? ""}`}
        aria-hidden
      >
        <canvas
          ref={canvasRef}
          className="block flex-1"
          style={{ width: "100%", height: "28px", minHeight: "28px" }}
        />
        {duration !== undefined && (
          <span className="text-sm font-mono text-zinc-400 tabular-nums flex-shrink-0">
            {formatTime(duration)}
          </span>
        )}
      </div>
    );
  }

  const bars = 24;
  return (
    <div className={`flex items-center justify-center gap-0.5 sm:gap-1 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-0.5 sm:w-1 min-w-[2px] rounded-full animate-voice-bar origin-center ${barClassName}`}
          style={{
            height: "12px",
            animationDelay: `${(i * 40) % 400}ms`,
            animationDuration: "600ms",
          }}
        />
      ))}
    </div>
  );
}
