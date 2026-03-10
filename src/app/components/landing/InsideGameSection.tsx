"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NextImage from "next/image";
import {
  MessageCircle,
  Flame,
  Bot,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";


const STEP_ICONS: Record<string, React.ElementType> = {
  design: MessageCircle,
  host: Flame,
  "ai-players": Bot,
  "you-play": Gamepad2,
};
import { INSIDE_GAME_STEPS } from "@/data/landing-content";
import { PreviewAvatar, StreamingText } from "./shared";

function InsideGameMessageList({
  messages,
  gameKey,
}: {
  messages: Array<{
    isHost?: boolean;
    name: string;
    role?: string;
    personality?: string;
    gender?: string;
    badge: string | null;
    time: string;
    text: string;
  }>;
  gameKey: string;
}) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
  }, [gameKey]);

  const handleMessageComplete = () => {
    setVisibleCount((prev) => Math.min(prev + 1, messages.length));
  };

  return (
    <>
      {messages.slice(0, visibleCount).map((msg, index) => (
        <div key={`${gameKey}-${index}`} className="flex gap-3 animate-fadeIn">
          <PreviewAvatar name={msg.name} isHost={msg.isHost} role={msg.role} personality={msg.personality} gender={msg.gender} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-white text-sm">{msg.name}</span>
              {msg.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    msg.badge === "YOU"
                      ? "bg-blue-500/20 text-blue-400"
                      : msg.badge === "GM"
                      ? "bg-fuchsia-500/20 text-fuchsia-400"
                      : "bg-violet-500/20 text-violet-400"
                  }`}
                >
                  {msg.badge}
                </span>
              )}
              <span className="text-xs text-zinc-600">{msg.time}</span>
            </div>
            <StreamingText
              text={msg.text}
              speed={40}
              onComplete={index === visibleCount - 1 ? handleMessageComplete : undefined}
            />
          </div>
        </div>
      ))}
    </>
  );
}

const AUTO_PLAY_INTERVAL = 8000;

function useAutoCarousel(count: number) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pauseAutoPlay = useCallback(() => {
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setPaused(false), AUTO_PLAY_INTERVAL * 2);
  }, []);

  const goTo = useCallback((i: number) => { setCurrent(i); pauseAutoPlay(); }, [pauseAutoPlay]);
  const prev = useCallback(() => { setCurrent((c) => (c === 0 ? count - 1 : c - 1)); pauseAutoPlay(); }, [count, pauseAutoPlay]);
  const next = useCallback(() => { setCurrent((c) => (c === count - 1 ? 0 : c + 1)); pauseAutoPlay(); }, [count, pauseAutoPlay]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((c) => (c === count - 1 ? 0 : c + 1));
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, count]);

  return { current, goTo, prev, next };
}

export function InsideGameSection() {
  const { current: selectedStep, goTo: setSelectedStep, prev: handlePrevious, next: handleNext } = useAutoCarousel(INSIDE_GAME_STEPS.length);
  const currentStep = INSIDE_GAME_STEPS[selectedStep];

  return (
    <div className="mb-16 sm:mb-32">
      <div className="text-center mb-6 sm:mb-12 px-4">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">INSIDE A GAME</span>
        </div>
        <h3 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-4">What actually happens inside a game</h3>
        <p className="text-sm sm:text-lg text-zinc-400">Experience every stage of gameplay</p>
      </div>

      {/* Tab navigation — horizontal scroll on mobile */}
      <div role="tablist" aria-label="Game stages" className="flex gap-2 sm:gap-3 mb-6 sm:mb-12 overflow-x-auto scrollbar-hidden px-4 sm:px-0 sm:justify-center sm:flex-wrap">
        {INSIDE_GAME_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={selectedStep === index}
            onClick={() => setSelectedStep(index)}
            className={`group relative flex-shrink-0 px-4 py-2 sm:px-6 sm:py-3 rounded-full border transition-all duration-300 ${
              selectedStep === index
                ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20"
                : "border-zinc-800 bg-zinc-900/50 hover:border-fuchsia-500/50"
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              {(() => { const Icon = STEP_ICONS[step.id]; return Icon ? <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${selectedStep === index ? "text-fuchsia-400" : "text-zinc-500 group-hover:text-zinc-300"}`} /> : null; })()}
              <span className={`text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${selectedStep === index ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                {step.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative bg-zinc-950/50 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden mx-2 sm:mx-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left – image + heading */}
          <div className="relative p-5 sm:p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-zinc-900/80 to-zinc-950/80">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
                <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
                <span className="text-xs sm:text-sm font-bold text-fuchsia-400">
                  STEP {currentStep.step} / {currentStep.total}
                </span>
              </div>
              <h4 className="text-xl sm:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6 leading-tight">{currentStep.heading}</h4>
              <div className="relative rounded-lg sm:rounded-xl overflow-hidden">
                <NextImage
                  key={currentStep.id}
                  src={currentStep.image}
                  alt={currentStep.imageAlt}
                  width={800}
                  height={500}
                  loading="eager"
                  quality={90}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="w-full h-auto object-cover rounded-lg sm:rounded-xl"
                />
                {/* Preload all other images */}
                {INSIDE_GAME_STEPS.map((step, i) => i !== selectedStep ? (
                  <NextImage
                    key={`preload-${step.id}`}
                    src={step.image}
                    alt=""
                    width={1}
                    height={1}
                    loading="eager"
                    quality={90}
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    aria-hidden="true"
                  />
                ) : null)}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-5 sm:mt-8">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {INSIDE_GAME_STEPS.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to step: ${step.title}`}
                    aria-current={selectedStep === index ? "step" : undefined}
                    onClick={() => setSelectedStep(index)}
                    className={`transition-all duration-300 rounded-full ${
                      selectedStep === index
                        ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-fuchsia-500"
                        : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  aria-label="Previous step"
                  onClick={handlePrevious}
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  onClick={handleNext}
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Right – streaming chat example */}
          <div className="relative bg-zinc-900/50 lg:border-l border-t lg:border-t-0 border-zinc-800">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold text-red-400">LIVE EXAMPLE</span>
              </div>
            </div>
            <div className="h-full flex flex-col min-h-[280px] sm:min-h-[400px] lg:min-h-[600px]">
              <div className="flex-1 p-5 pt-14 sm:p-8 sm:pt-20 space-y-3 sm:space-y-4 overflow-y-auto">
                <InsideGameMessageList
                  messages={currentStep.messages}
                  gameKey={currentStep.id}
                />
              </div>
              <div className="p-3 sm:p-4 border-t border-zinc-800">
                <div className="bg-zinc-950/50 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-zinc-600 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Type your message...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
