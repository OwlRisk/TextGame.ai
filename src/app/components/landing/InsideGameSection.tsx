"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import {
  MessageCircle,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

export function InsideGameSection() {
  const [selectedStep, setSelectedStep] = useState(0);
  const currentStep = INSIDE_GAME_STEPS[selectedStep];

  const handlePrevious = () => {
    setSelectedStep((prev) => (prev === 0 ? INSIDE_GAME_STEPS.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setSelectedStep((prev) => (prev === INSIDE_GAME_STEPS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-32">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">INSIDE A GAME</span>
        </div>
        <h3 className="text-4xl font-black text-white mb-4">What actually happens inside a game</h3>
        <p className="text-lg text-zinc-400">Experience every stage of gameplay</p>
      </div>

      {/* Tab navigation */}
      <div role="tablist" aria-label="Game stages" className="flex flex-wrap justify-center gap-3 mb-12">
        {INSIDE_GAME_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={selectedStep === index}
            onClick={() => setSelectedStep(index)}
            className={`group relative px-6 py-3 rounded-full border transition-all duration-300 ${
              selectedStep === index
                ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20"
                : "border-zinc-800 bg-zinc-900/50 hover:border-fuchsia-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              <span className={`text-sm font-bold transition-colors ${selectedStep === index ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                {step.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative bg-zinc-950/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left – image + heading */}
          <div className="relative p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-zinc-900/80 to-zinc-950/80">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Gamepad2 className="h-5 w-5 text-fuchsia-400" />
                <span className="text-sm font-bold text-fuchsia-400">
                  STEP {currentStep.step} / {currentStep.total}
                </span>
              </div>
              <h4 className="text-3xl lg:text-4xl font-black text-white mb-6 leading-tight">{currentStep.heading}</h4>
              <div className="relative rounded-xl overflow-hidden">
                <NextImage
                  src={currentStep.image}
                  alt={currentStep.imageAlt}
                  width={800}
                  height={500}
                  loading="lazy"
                  quality={75}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="w-full h-auto object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2">
                {INSIDE_GAME_STEPS.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to step: ${step.title}`}
                    aria-current={selectedStep === index ? "step" : undefined}
                    onClick={() => setSelectedStep(index)}
                    className={`transition-all duration-300 rounded-full ${
                      selectedStep === index
                        ? "w-8 h-2 bg-fuchsia-500"
                        : "w-2 h-2 bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous step"
                  onClick={handlePrevious}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  onClick={handleNext}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronRight className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Right – streaming chat example */}
          <div className="relative bg-zinc-900/50 border-l border-zinc-800">
            <div className="absolute top-6 right-6 z-10">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-400">LIVE EXAMPLE</span>
              </div>
            </div>
            <div className="h-full flex flex-col">
              <div className="flex-1 p-8 pt-20 space-y-4 overflow-y-auto">
                <InsideGameMessageList
                  messages={currentStep.messages}
                  gameKey={currentStep.id}
                />
              </div>
              <div className="p-4 border-t border-zinc-800">
                <div className="bg-zinc-950/50 rounded-lg px-4 py-3 text-sm text-zinc-600 flex items-center gap-2">
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
