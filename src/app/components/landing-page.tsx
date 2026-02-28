"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  MessageCircle,
  Users,
  Crown,
  Zap,
  Star,
  ChevronDown,
  Lightbulb,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { BRAND_CONFIG } from "@/app/config/brand-config";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { GAME_TEMPLATES } from "@/lib/game-templates";

interface LandingPageProps {
  onSignIn: () => void;
  onExploreGames?: () => void;
  onCreateGame?: (presetId?: string) => void;
}

/** Map Tailwind color class (e.g. bg-blue-500) to hex for fallback avatar background */
function colorToHex(twClass: string): string {
  const m = twClass.match(/(?:bg-|from-)(\w+)-(\d+)/);
  if (!m) return "#6366f1";
  const [, color, shade] = m;
  const map: Record<string, string> = {
    blue: "#3b82f6",
    green: "#22c55e",
    purple: "#a855f7",
    pink: "#ec4899",
    red: "#ef4444",
    yellow: "#eab308",
    indigo: "#6366f1",
    teal: "#14b8a6",
    orange: "#f97316",
    violet: "#8b5cf6",
    fuchsia: "#d946ef",
  };
  return map[color] ?? "#6366f1";
}

const GAME_SCENARIOS = {
  werewolf: {
    title: "Werewolf",
    messages: [
      {
        avatar: "GM",
        color: "from-violet-500 to-fuchsia-500",
        name: "Game Master",
        time: "12:30 PM",
        text: "Welcome to Werewolf! I'll be your host today. The villagers must identify the werewolves before it's too late. Let's begin the night phase...",
      },
      {
        avatar: null,
        color: "bg-blue-500",
        name: "Alex",
        time: "12:31 PM",
        text: "I think Blake is acting suspicious...",
      },
      {
        avatar: null,
        color: "bg-green-500",
        name: "Casey",
        time: "12:31 PM",
        text: "I was with Blake during the night phase. It can't be them!",
      },
    ],
  },
  spy: {
    title: "Who's the Spy",
    messages: [
      {
        avatar: "GM",
        color: "from-violet-500 to-fuchsia-500",
        name: "Game Master",
        time: "2:15 PM",
        text: "Your word is 'Coffee'. The spy has a different word. Describe yours without being too obvious!",
      },
      {
        avatar: null,
        color: "bg-purple-500",
        name: "Jordan",
        time: "2:16 PM",
        text: "Mine is a hot beverage people drink in the morning...",
      },
      {
        avatar: null,
        color: "bg-pink-500",
        name: "Riley",
        time: "2:16 PM",
        text: "I think Jordan might be the spy. That's too vague!",
      },
    ],
  },
  mystery: {
    title: "Mystery",
    messages: [
      {
        avatar: "GM",
        color: "from-violet-500 to-fuchsia-500",
        name: "Detective Kate",
        time: "4:20 PM",
        text: "A priceless diamond has been stolen from the museum. Everyone here is a suspect. Let's start investigating...",
      },
      {
        avatar: null,
        color: "bg-red-500",
        name: "Morgan",
        time: "4:21 PM",
        text: "I saw someone near the display case around 9 PM...",
      },
      {
        avatar: null,
        color: "bg-yellow-600",
        name: "Taylor",
        time: "4:22 PM",
        text: "That's impossible! The museum closes at 8 PM!",
      },
    ],
  },
  custom: {
    title: "Custom Game",
    messages: [
      {
        avatar: "GM",
        color: "from-violet-500 to-fuchsia-500",
        name: "Game Master",
        time: "6:00 PM",
        text: "Welcome to 'Time Travelers Council'! Each of you is from a different era. Work together to fix the timeline...",
      },
      {
        avatar: null,
        color: "bg-indigo-500",
        name: "Nova",
        time: "6:01 PM",
        text: "As someone from 2124, I can confirm this paradox is serious.",
      },
      {
        avatar: null,
        color: "bg-teal-500",
        name: "Echo",
        time: "6:01 PM",
        text: "In my timeline, we solved this using quantum mechanics...",
      },
    ],
  },
};

export function LandingPage({ onSignIn, onExploreGames, onCreateGame }: LandingPageProps) {
  const [selectedGame, setSelectedGame] = useState<
    keyof typeof GAME_SCENARIOS
  >("werewolf");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const quickStarts = [
    { id: "werewolf" as const, emoji: "🐺", label: "Werewolf" },
    { id: "spy" as const, emoji: "🕵️", label: "Who's the Spy" },
    { id: "mystery" as const, emoji: "🔍", label: "Mystery" },
    { id: "custom" as const, emoji: "✨", label: "Custom" },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: "Plain English creation",
      description:
        "Describe your game idea in plain English — the AI builds the rules, roles, and world for you.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Sparkles,
      title: "20+ ready templates",
      description:
        "Jump in with classics like Werewolf, Mafia, or Who's the Spy — or go fully custom.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Crown,
      title: "AI runs the whole game",
      description:
        "A dedicated Game Master hosts every session. AI characters fill every seat.",
      gradient: "from-orange-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Any game, any rules",
      description:
        "Mystery, deduction, roleplay, trivia — if you can describe it, you can play it.",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const howItWorks = [
    { number: "1", title: "Sign up free", subtitle: "Google, one click", icon: "👤" },
    { number: "2", title: "Describe your idea", subtitle: "in plain English", icon: "💬" },
    { number: "3", title: "Play instantly", subtitle: "AI builds & runs your game", icon: "🎮" },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const games = Object.keys(GAME_SCENARIOS) as Array<keyof typeof GAME_SCENARIOS>;
    let currentIndex = games.indexOf(selectedGame);
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % games.length;
      setSelectedGame(games[currentIndex]);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedGame]);

  const currentScenario = GAME_SCENARIOS[selectedGame];

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1s" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        {/* Hero - Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">
          <div>
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                TextGame.ai
              </h1>
              <p className="text-sm text-zinc-400 font-medium mt-1">
                {BRAND_CONFIG.tagline}
              </p>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
              Describe any game idea.{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Play it
              </span>{" "}
              in minutes.
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-6 md:mb-8 leading-relaxed">
              Chat with an AI Game Master to build your rules, roles, and world.
              AI characters fill every seat — start playing the moment you&apos;re done.
            </p>

            <div className="mb-6 p-5 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-700/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-violet-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">AI characters</div>
                    <div className="text-xs text-zinc-500">Up to 10 players</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-fuchsia-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">20+ templates</div>
                    <div className="text-xs text-zinc-500">Ready to use</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Custom rules</div>
                    <div className="text-xs text-zinc-500">Full control</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg">
                    <Star className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Free to start</div>
                    <div className="text-xs text-zinc-500">No setup needed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col items-center">
              <Button
                onClick={onSignIn}
                size="lg"
                className="w-full max-w-xl min-h-[44px] bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-base sm:text-lg py-5 sm:py-6 rounded-xl shadow-lg transition-all"
              >
                <svg className="h-6 w-6 mr-3 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              {onExploreGames && (
                <Button
                  onClick={onExploreGames}
                  size="lg"
                  className="mt-3 w-full max-w-xl min-h-[44px] bg-violet-600/90 hover:bg-violet-500 border border-violet-400/60 text-white font-bold text-base sm:text-lg py-5 sm:py-6 rounded-xl transition-all"
                >
                  <Lightbulb className="h-5 w-5 mr-2 shrink-0" />
                  Browse templates
                </Button>
              )}
              <p className="mt-4 text-center text-sm text-zinc-400">
                Free to start · From idea to game in under 2 minutes
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Zap className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-bold text-zinc-400">Try these examples:</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickStarts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedGame(item.id);
                      setIsAutoPlaying(false);
                    }}
                    className={`group relative bg-zinc-900/50 hover:bg-zinc-800/80 border transition-all duration-300 hover:scale-[1.02] rounded-xl px-4 py-3 overflow-hidden ${
                      selectedGame === item.id
                        ? "border-violet-500 shadow-lg shadow-violet-500/20"
                        : "border-zinc-800 hover:border-violet-500/50"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {selectedGame === item.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                    )}
                    <div className="relative flex items-center gap-3">
                      <span
                        className={`text-3xl transition-transform ${selectedGame === item.id ? "scale-110" : "group-hover:scale-110"}`}
                      >
                        {item.emoji}
                      </span>
                      <span
                        className={`text-sm font-bold transition-colors ${selectedGame === item.id ? "text-white" : "text-zinc-300 group-hover:text-white"}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Chat preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
              <div className="bg-zinc-800/70 px-4 py-3 border-b border-zinc-700/80 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                </div>
                <span className="text-sm font-semibold text-zinc-300"># game-room</span>
                <span className="ml-auto text-xs text-zinc-500 bg-zinc-700/60 rounded-md px-2.5 py-1">
                  {currentScenario.title}
                </span>
              </div>
              <div className="p-4 space-y-3 h-[400px] overflow-y-auto">
                {currentScenario.messages.map((msg, index) => (
                  <div key={index} className="flex gap-3 group">
                    <GeneratedAvatar
                      name={msg.name}
                      type={msg.avatar === "GM" ? "host" : "player"}
                      enabled={false}
                      className="w-9 h-9 flex-shrink-0 ring-1 ring-zinc-600/50"
                      fallback={<></>}
                      fallbackColor={
                        msg.avatar === "GM"
                          ? "#8b5cf6"
                          : colorToHex(msg.color)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-white text-sm">
                          {msg.name}
                        </span>
                        <span className="text-xs text-zinc-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <GeneratedAvatar
                    name="Drew"
                    type="player"
                    enabled={false}
                    className="w-9 h-9 flex-shrink-0 ring-1 ring-zinc-600/50"
                    fallback={<></>}
                    fallbackColor="#f97316"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">Drew</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-75" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-800/70 px-4 py-3 border-t border-zinc-700/80">
                <div className="bg-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-500 border border-zinc-600/50">
                  Type your message...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">
                HOW IT WORKS
              </span>
            </div>
            <h3 className="text-4xl font-black text-white mb-4">
              Get Started in 3 Simple Steps
            </h3>
            <p className="text-lg text-zinc-400">
              From idea to gameplay in under 2 minutes
            </p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full text-white font-black text-xl shadow-xl">
                        {step.number}
                      </div>
                      {index < howItWorks.length - 1 && (
                        <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 w-[calc(100vw/3-8rem)] max-w-[200px]">
                          <div className="flex items-center gap-2 px-4">
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-30" />
                            <svg
                              className="w-4 h-4 text-violet-500 opacity-50"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10">
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg">
                        {step.number === "1" && (
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                        {step.number === "2" && (
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        )}
                        {step.number === "3" && (
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-white mb-2">
                        {step.title}
                      </h4>
                      <p className="text-sm text-zinc-500">{step.subtitle}</p>
                    </div>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="md:hidden flex justify-center my-6">
                      <svg
                        className="w-6 h-6 text-violet-500 opacity-50"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">FEATURES</span>
            </div>
            <h3 className="text-4xl font-black text-white mb-4">
              Everything you need to bring any game to life
            </h3>
            <p className="text-lg text-zinc-400">
              From first idea to full session — no design experience required
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <div
                    className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="relative text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="relative text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Templates — driven by real GAME_TEMPLATES data */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">TEMPLATES</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Start with a template or go custom</h3>
            <p className="text-lg text-zinc-400">Pick a classic or describe something entirely new</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAME_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onCreateGame ? onCreateGame(tpl.id) : onSignIn()}
                className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] text-left"
              >
                {/* hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />

                <div className="relative flex items-start gap-3 mb-3">
                  <span className="text-3xl mt-0.5 transition-transform group-hover:scale-110">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white mb-0.5">{tpl.name}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="relative flex items-center gap-3 mb-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tpl.minPlayers === tpl.maxPlayers
                      ? `${tpl.minPlayers} players`
                      : `${tpl.minPlayers}–${tpl.maxPlayers} players`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tpl.estimatedTime}
                  </span>
                </div>

                {/* Role badges */}
                {tpl.roles && tpl.roles.length > 0 && (
                  <div className="relative flex flex-wrap gap-1.5 mb-3">
                    {tpl.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="relative flex items-center justify-end">
                  <span className="text-xs text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Play this game <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <FAQSection />

        {/* Final CTA */}
        <div className="mb-24">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-12 md:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative text-center">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                Ready to Build Your Game?
              </h3>
              <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
                Any game you can describe, you can play — in minutes
              </p>
              <div className="relative inline-block">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/50 rounded-xl blur-xl opacity-40 animate-pulse"
                  style={{ animationDuration: "3s" }}
                />
                <Button
                  onClick={onSignIn}
                  size="lg"
                  className="relative bg-white hover:bg-zinc-100 text-violet-600 font-bold text-xl px-12 py-8 rounded-xl shadow-2xl transition-all hover:scale-105"
                >
                  <svg className="h-8 w-8 mr-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Get started with Google
                </Button>
              </div>
              <p className="text-sm text-violet-100 mt-4">
                Free to start · From idea to game in under 2 minutes
              </p>
            </div>
          </div>
        </div>

        <footer className="border-t border-zinc-800 pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
            <p>
              © 2026 {BRAND_CONFIG.name} • Made for gamers, by gamers
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    {
      question: "How do I create a game?",
      answer:
        "Sign in with Google, then go to Create. You can either chat with the Game Master to describe your idea in plain English, or pick a template from Discover (e.g. Werewolf, Who's the Spy, Mafia, Tarot). Set player count and optional rules—no coding or complex setup. Your game is ready in about 2 minutes.",
    },
    {
      question: "What is the Game Master and how does it work?",
      answer:
        "The Game Master is an AI host that runs your game: it explains rules, runs day/night or discussion phases, and keeps the flow. You can also add AI players so the room is filled even when playing alone. The host and players use natural dialogue so it feels like a real tabletop session.",
    },
    {
      question: "Can I play with friends or share a game?",
      answer:
        "Yes. From your game room you can copy a share link and send it to friends. They open the link in their browser to join. You can play with a mix of human and AI players. Your saved games appear under My Games when you're signed in.",
    },
    {
      question: "What templates or game types are available?",
      answer:
        "We include templates like Werewolf (social deduction), Who's the Spy (word game), Mafia, and Tarot Reading (single-player). Discover shows these with one-click start. You can also create a fully custom game by describing your own rules and roles to the Game Master.",
    },
    {
      question: "Do I need to sign in? Is it free?",
      answer:
        "You can browse the site without signing in. To create, save, and manage games (and use My Games), sign in with Google. New accounts get free starting credits to try the platform. Your games are stored in your account so you can return anytime.",
    },
    {
      question: "Where are my games saved?",
      answer:
        "When you're signed in, every game you create is saved to your account. Open My Games from the sidebar to see your library, reopen any game, or delete ones you no longer need. Games are tied to your Google account and available across devices.",
    },
  ];
  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">FAQ</span>
        </div>
        <h3 className="text-3xl font-black text-white mb-3">Common Questions</h3>
        <p className="text-lg text-zinc-400">Everything you need to know</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-violet-500/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
            >
              <span className="font-bold text-white group-hover:text-violet-400 transition-colors">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-violet-400" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-80" : "max-h-0"}`}
            >
              <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
