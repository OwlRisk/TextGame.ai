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
    title: "🐺 Werewolf",
    rule: "Villagers debate and vote to eliminate werewolves by day. Werewolves hunt at night. Find them first.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "Warden Lunaris", time: "Night 1", text: "Night falls. The village sleeps — but the wolves are awake. Werewolves, choose your target." },
      { avatar: null, color: "bg-blue-500", name: "Alex", time: "Day 2", text: "I think Blake is acting suspicious. They barely said anything last round." },
      { avatar: null, color: "bg-green-500", name: "Casey", time: "Day 2", text: "I was watching Blake during the night phase. It can't be them!" },
    ],
  },
  mafia: {
    title: "🎭 Mafia",
    rule: "Townspeople vote out suspects by day. The hidden Mafia eliminates one citizen each night. Trust no one.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "Don Ferrante", time: "Night 1", text: "The city sleeps. Mafia members — open your eyes and choose tonight's target." },
      { avatar: null, color: "bg-red-500", name: "Lucia", time: "Day 2", text: "Marco was found outside the bakery at midnight. That's not a coincidence." },
      { avatar: null, color: "bg-yellow-600", name: "Marco", time: "Day 2", text: "I was getting bread for my family! Ask anyone!" },
    ],
  },
  spy: {
    title: "🕵️ Who's the Spy",
    rule: "Everyone gets the same word except the spy, who has a different one. Describe your word without saying it — and find the spy.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "Game Master", time: "Round 1", text: "Your secret word has been sent to each of you. Describe it in one sentence — don't make it too obvious!" },
      { avatar: null, color: "bg-purple-500", name: "Jordan", time: "Round 1", text: "Mine is something warm people reach for on a slow morning..." },
      { avatar: null, color: "bg-pink-500", name: "Riley", time: "Round 1", text: "That's suspiciously vague, Jordan. I'm watching you." },
    ],
  },
  mystery: {
    title: "🔍 Murder Mystery",
    rule: "A crime has been committed. Question suspects, find clues, and name the killer — before they escape.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "Detective Kate", time: "Scene 1", text: "A priceless diamond has vanished from the museum. Every person in this room is a suspect." },
      { avatar: null, color: "bg-red-500", name: "Morgan", time: "Scene 1", text: "I saw someone near the display case around 9 PM..." },
      { avatar: null, color: "bg-yellow-600", name: "Taylor", time: "Scene 1", text: "That's impossible — the museum closes at 8!" },
    ],
  },
  tarot: {
    title: "🃏 Tarot Reading",
    rule: "Ask a question and receive a personal card reading. The AI host draws, interprets, and reflects with you.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "The Oracle", time: "Reading", text: "Take a breath. What question or intention do you bring to this reading today?" },
      { avatar: null, color: "bg-amber-500", name: "You", time: "Reading", text: "I'm at a crossroads with my career and don't know which path to take." },
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "The Oracle", time: "Reading", text: "I draw The Fool — a leap of faith, a fresh start. This card asks: what would you do if you weren't afraid?" },
    ],
  },
  roleplay: {
    title: "🧙 Fantasy Roleplay",
    rule: "Step into a character in a living world. The AI Game Master narrates and reacts to every choice you make.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "The Chronicler", time: "Chapter 1", text: "You stand at the gates of Ironhold. The city is under siege and the king is missing. What do you do?" },
      { avatar: null, color: "bg-indigo-500", name: "Nova", time: "Chapter 1", text: "I slip through the side gate and head for the castle's east tower." },
      { avatar: null, color: "bg-teal-500", name: "Echo", time: "Chapter 1", text: "I'll create a distraction at the main gate — buy you some time." },
    ],
  },
  custom: {
    title: "✨ Your Own Game",
    rule: "Describe any idea in plain English — the AI designs the rules, roles, and world, then runs the entire session.",
    messages: [
      { avatar: "GM", color: "from-violet-500 to-fuchsia-500", name: "Game Master", time: "Setup", text: "Welcome to 'Time Travelers Council'! Each of you is from a different era — work together to fix the paradox before it unravels history." },
      { avatar: null, color: "bg-indigo-500", name: "Nova", time: "Turn 1", text: "As someone from 2124, I can confirm this paradox is already catastrophic." },
      { avatar: null, color: "bg-teal-500", name: "Echo", time: "Turn 1", text: "In my timeline we solved this with quantum anchoring — but we need the 1987 code first." },
    ],
  },
};

export function LandingPage({ onSignIn, onExploreGames, onCreateGame }: LandingPageProps) {
  const [selectedGame, setSelectedGame] = useState<
    keyof typeof GAME_SCENARIOS
  >("werewolf");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const quickStarts = [
    { id: "werewolf" as const,  emoji: "🐺", label: "Werewolf"     },
    { id: "mafia" as const,     emoji: "🎭", label: "Mafia"        },
    { id: "spy" as const,       emoji: "🕵️", label: "Who's the Spy" },
    { id: "mystery" as const,   emoji: "🔍", label: "Mystery"      },
    { id: "tarot" as const,     emoji: "🃏", label: "Tarot"        },
    { id: "roleplay" as const,  emoji: "🧙", label: "Roleplay"     },
    { id: "custom" as const,    emoji: "✨", label: "Custom"       },
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

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Zap className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-bold text-zinc-400">See how it plays — pick a game type:</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]">
                {quickStarts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedGame(item.id);
                      setIsAutoPlaying(false);
                    }}
                    className={`group relative flex-shrink-0 bg-zinc-900/50 hover:bg-zinc-800/80 border transition-all duration-200 rounded-xl px-3 py-2 overflow-hidden ${
                      selectedGame === item.id
                        ? "border-violet-500 shadow-lg shadow-violet-500/20 bg-zinc-800/80"
                        : "border-zinc-800 hover:border-violet-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-lg transition-transform ${selectedGame === item.id ? "scale-110" : "group-hover:scale-110"}`}>
                        {item.emoji}
                      </span>
                      <span className={`text-xs font-bold whitespace-nowrap transition-colors ${selectedGame === item.id ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                        {item.label}
                      </span>
                    </div>
                    {selectedGame === item.id && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full" />
                    )}
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
              {/* Rule explanation bar */}
              <div className="px-4 py-2.5 bg-violet-500/10 border-b border-violet-500/20 flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-300/90 leading-relaxed">{currentScenario.rule}</p>
              </div>
              <div className="p-4 space-y-3 h-[340px] overflow-y-auto">
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

        <HowGameWorksSection />

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

// ─── Mini chat bubble used inside the explainer panels ───────────────────────
function MiniChat({ messages }: {
  messages: Array<{
    name: string;
    color: string;   // hex
    text: string;
    badge?: string;  // optional label like "HOST" "AI" "YOU"
    badgeColor?: string;
  }>;
}) {
  return (
    <div className="space-y-2.5 mt-3">
      {messages.map((m, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white mt-0.5"
            style={{ background: m.color }}
          >
            {m.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-bold text-zinc-300">{m.name}</span>
              {m.badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0 rounded-full"
                  style={{ background: `${m.badgeColor ?? m.color}30`, color: m.badgeColor ?? m.color }}
                >
                  {m.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{m.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HowGameWorksSection() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1); // animation direction
  const [animKey, setAnimKey] = useState(0);

  const panels = [
    {
      step: "01",
      emoji: "💬",
      title: "Design with the Game Master",
      desc: "Describe your game idea in plain English. The GM asks a few questions, writes the rules, picks player roles, and sets up the room — all in a conversation. No forms, no configuration.",
      accent: "#8b5cf6",
      chat: [
        { name: "You", color: "#6366f1", badge: "YOU", badgeColor: "#6366f1", text: "I want a werewolf game with 6 players, with a Seer and a Doctor." },
        { name: "Game Master", color: "#8b5cf6", badge: "GM", badgeColor: "#8b5cf6", text: "Got it! I've written the rules and set up two rooms: General (everyone) and Werewolves only (private). Ready to start?" },
        { name: "You", color: "#6366f1", badge: "YOU", badgeColor: "#6366f1", text: "Looks great — let's go!" },
      ],
    },
    {
      step: "02",
      emoji: "👑",
      title: "The Host runs every phase",
      desc: "Once the game starts, an AI Host takes over as the permanent moderator. It announces phases, assigns secret roles, narrates events, and decides who speaks next — you never need to manage logistics.",
      accent: "#f59e0b",
      chat: [
        { name: "Warden Lunaris", color: "#7c3aed", badge: "HOST", badgeColor: "#7c3aed", text: "Night falls. Villagers close their eyes. 🌙" },
        { name: "Warden Lunaris", color: "#7c3aed", badge: "HOST", badgeColor: "#7c3aed", text: "Werewolves, open your eyes — your private room is now active. Choose your target." },
        { name: "Warden Lunaris", color: "#7c3aed", badge: "HOST", badgeColor: "#7c3aed", text: "Dawn breaks. Tomas Vance was found eliminated. Day phase begins." },
      ],
    },
    {
      step: "03",
      emoji: "🤖",
      title: "AI players think, argue, and bluff",
      desc: "Every seat is filled by an AI character with a unique name, personality, and secret role. They discuss, accuse, defend themselves, and vote — autonomously. The game flows even when you're silent.",
      accent: "#10b981",
      chat: [
        { name: "Maribel", color: "#3b82f6", badge: "AI", badgeColor: "#10b981", text: "I've been watching Gideon. He was way too quiet last night." },
        { name: "Gideon", color: "#ef4444", badge: "AI", badgeColor: "#10b981", text: "That's rich coming from you. Where were you during the vote?" },
        { name: "Juno", color: "#8b5cf6", badge: "AI", badgeColor: "#10b981", text: "Both of you are deflecting. I'm voting Maribel." },
      ],
    },
    {
      step: "04",
      emoji: "🎮",
      title: "You play your role — the AI reacts",
      desc: "Type anything as your character. Accuse, defend, vote, or stay silent. The Host and AI players respond to what you say and adapt the game around your choices in real time.",
      accent: "#ec4899",
      chat: [
        { name: "You", color: "#6366f1", badge: "YOU", badgeColor: "#6366f1", text: "I used my Seer ability last night. Gideon is a Werewolf — I'm certain." },
        { name: "Gideon", color: "#ef4444", badge: "AI", badgeColor: "#10b981", text: "Lies! The Seer wouldn't reveal themselves this early — you're panicking." },
        { name: "Warden Lunaris", color: "#7c3aed", badge: "HOST", badgeColor: "#7c3aed", text: "The village votes. Gideon Hale is eliminated. His role is revealed: Werewolf. 🐺 Villagers win!" },
      ],
    },
  ];

  const go = (next: number, d: 1 | -1) => {
    setDir(d);
    setAnimKey((k) => k + 1);
    setCurrent(next);
  };

  const p = panels[current];

  return (
    <div className="mb-32">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">HOW IT WORKS</span>
        </div>
        <h3 className="text-4xl font-black text-white mb-4">What actually happens inside a game</h3>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Four things run simultaneously — shown with real in-game messages.
        </p>
      </div>

      {/* Step indicator tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {panels.map((panel, i) => (
          <button
            key={i}
            onClick={() => go(i, i > current ? 1 : -1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200"
            style={
              i === current
                ? { background: `${panel.accent}18`, borderColor: `${panel.accent}60`, color: panel.accent }
                : { background: "transparent", borderColor: "#3f3f46", color: "#71717a" }
            }
          >
            <span className="text-base">{panel.emoji}</span>
            <span className="text-xs font-bold hidden sm:inline">{panel.title.split(" ").slice(0, 2).join(" ")}</span>
            <span
              className="text-[10px] font-black"
              style={i === current ? { color: p.accent } : { color: "#52525b" }}
            >
              {panel.step}
            </span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="max-w-3xl mx-auto">
        <div
          key={animKey}
          className="relative bg-zinc-900/60 border rounded-2xl p-8 transition-all"
          style={{
            borderColor: `${p.accent}40`,
            boxShadow: `0 0 40px ${p.accent}10`,
            animation: `slideIn${dir > 0 ? "Right" : "Left"} 0.25s ease both`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[11px] font-black px-2.5 py-0.5 rounded-full"
                  style={{ background: `${p.accent}20`, color: p.accent }}
                >
                  STEP {p.step} / 04
                </span>
                <span className="text-2xl">{p.emoji}</span>
              </div>
              <h4 className="text-2xl font-black text-white">{p.title}</h4>
            </div>
          </div>
          <p className="text-base text-zinc-400 leading-relaxed mb-6">{p.desc}</p>

          {/* Chat mockup */}
          <div
            className="rounded-xl p-4"
            style={{ background: `${p.accent}08`, border: `1px solid ${p.accent}20` }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent }} />
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: p.accent }}>
                Live example
              </span>
            </div>
            <MiniChat messages={p.chat} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => go(current - 1, -1)}
              disabled={current === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
            >
              ← Previous
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {panels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > current ? 1 : -1)}
                  className="rounded-full transition-all duration-200"
                  style={
                    i === current
                      ? { width: "20px", height: "8px", background: p.accent }
                      : { width: "8px", height: "8px", background: "#3f3f46" }
                  }
                />
              ))}
            </div>

            <button
              onClick={() => go(current + 1, 1)}
              disabled={current === panels.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={
                current < panels.length - 1
                  ? { borderColor: `${p.accent}60`, color: p.accent, background: `${p.accent}10` }
                  : { borderColor: "#3f3f46", color: "#52525b" }
              }
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
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
