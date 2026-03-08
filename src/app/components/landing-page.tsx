"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  MessageCircle,
  Users,
  Zap,
  Compass,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { BRAND_CONFIG } from "@/app/config/brand-config";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";
import {
  LANDING_AVATAR_MAP,
  GAME_SCENARIOS,
  FEATURES,
  FEATURED_GAMES,
  MARQUEE_CHARACTERS,
} from "@/data/landing-content";
import dynamic from "next/dynamic";
import { SafeAvatar, PreviewAvatar, StreamingText } from "@/app/components/landing/shared";
const InsideGameSection = dynamic(() => import("@/app/components/landing/InsideGameSection").then(m => m.InsideGameSection), { ssr: false });
const FAQSection = dynamic(() => import("@/app/components/landing/FAQSection").then(m => m.FAQSection));

interface LandingPageProps {
  onSignIn: () => void;
  onCreateGame?: (presetId?: string) => void;
  heroHeadline?: React.ReactNode;
}

// ─── Sequential message list with streaming ───────────────────────────────────
function MessageList({
  messages,
  gameKey,
}: {
  messages: Array<{
    isHost?: boolean;
    name: string;
    role?: string;
    personality?: string;
    gender?: string;
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
        <div key={`${gameKey}-${index}`} className="flex gap-4 animate-fadeIn mt-5 first:mt-0">
          <PreviewAvatar name={msg.name} isHost={msg.isHost} role={msg.role} personality={msg.personality} gender={msg.gender} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-semibold text-sm ${msg.isHost ? "text-amber-300" : "text-white"}`}>{msg.name}</span>
              <span className="text-[11px] text-zinc-500">{msg.time}</span>
            </div>
            <div className={msg.isHost
              ? "text-sm leading-[1.65] rounded-r-lg border-l-2 border-amber-500/40 bg-amber-500/5 pl-3 py-1 -ml-0.5 text-zinc-200"
              : "text-sm leading-relaxed text-zinc-300"
            }>
              <StreamingText
                text={msg.text}
                speed={40}
                onComplete={index === visibleCount - 1 ? handleMessageComplete : undefined}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// Derive current phase from messages (e.g. "Night 1", "Day 2", "Round 1")
function getPhaseLabel(messages: Array<{ time: string; isHost?: boolean }>) {
  const first = messages[0];
  if (!first) return null;
  const t = first.time;
  if (/night/i.test(t)) return { label: t, style: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
  if (/day/i.test(t)) return { label: t, style: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  if (/round/i.test(t)) return { label: t, style: "bg-violet-500/15 text-violet-300 border-violet-500/30" };
  if (/scene/i.test(t)) return { label: t, style: "bg-zinc-600/40 text-zinc-300 border-zinc-500/30" };
  return null;
}

export function LandingPage({ onSignIn, onCreateGame, heroHeadline }: LandingPageProps) {
  const [selectedGame, setSelectedGame] = useState<keyof typeof GAME_SCENARIOS>("werewolf");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const games = Object.keys(GAME_SCENARIOS) as Array<keyof typeof GAME_SCENARIOS>;
    let currentIndex = games.indexOf(selectedGame);
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % games.length;
      setSelectedGame(games[currentIndex]);
    }, 20000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedGame]);

  const currentScenario = GAME_SCENARIOS[selectedGame];
  const phaseInfo = getPhaseLabel(currentScenario.messages);

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      {/* Animated background blobs */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1s" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">

        {/* ── Hero – Two Column ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">

          {/* Left column */}
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  {BRAND_CONFIG.name}
                </h1>
                <p className="text-sm text-zinc-500 font-medium">{BRAND_CONFIG.tagline}</p>
              </div>
            </div>

            {/* Headline — server-rendered slot for LCP (heroHeadline comes from page.tsx server component) */}
            {heroHeadline ?? (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
                Play Werewolf, Mafia & more —{" "}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  AI does the hosting
                </span>
              </h2>
            )}

            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-8 leading-relaxed">
              No moderator needed. AI assigns roles, runs every phase, and fills empty seats with voiced characters.
              <br className="hidden sm:block" />
              Start with a template — or just describe your idea.
            </p>

            {/* Core features – 3 simple rows */}
            <div className="mb-10 space-y-3">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-violet-500/10 rounded-[11px]">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-base">AI characters with unique voices and personalities</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-fuchsia-500/10 rounded-[11px]">
                  <MessageCircle className="h-4 w-4 text-fuchsia-400" />
                </div>
                <span className="text-base">20+ templates — or design your own game</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-[11px]">
                  <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-base">Room ready in 2 minutes — friends join instantly</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }} />
              <Button
                onClick={onSignIn}
                size="lg"
                className="relative w-full bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-lg py-6 !rounded-[11px] shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Get Started with Google
              </Button>
            </div>

            {/* Browse/Discover Button */}
            <div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full bg-transparent hover:bg-zinc-800/50 text-zinc-300 hover:text-white border-2 border-zinc-700 hover:border-violet-500/50 font-semibold text-base py-5 !rounded-[11px] transition-all"
              >
                <Link href="/discover">
                  <Compass className="h-5 w-5 mr-2" />
                  Explore Games
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column – animated chat preview */}
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-blue-900/10 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-b from-blue-950/30 via-[#0a0618]/95 to-zinc-900/90 backdrop-blur-xl border border-violet-900/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
              {/* Channel header — matches real game layout */}
              <div className="h-14 px-5 flex items-center gap-2.5 border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-400 text-lg">#</span>
                <span className="font-semibold text-base text-white">game-room</span>
                {phaseInfo && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${phaseInfo.style}`}>
                    {phaseInfo.label}
                  </span>
                )}
                <span className="ml-auto text-xs text-zinc-500 bg-zinc-800/60 border border-zinc-700/40 rounded-md px-2.5 py-1">
                  {currentScenario.title}
                </span>
              </div>
              {/* Streaming messages */}
              <div className="px-6 py-5 space-y-0 h-[340px] overflow-y-auto">
                <MessageList messages={currentScenario.messages} gameKey={selectedGame} />
                {/* Typing indicator */}
                <div className="flex gap-4 mt-5">
                  <PreviewAvatar
                    name="Drew"
                    role="Villager"
                    personality="Quiet observer"
                    gender="other"
                  />
                  <div className="flex-1 min-w-0 pt-1">
                    <span className="font-semibold text-white text-sm">Drew</span>
                    <div className="flex gap-1 items-center mt-1.5" aria-hidden="true">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-75" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Mock input — mirrors real chat input */}
              <div className="px-4 py-3 border-t border-violet-900/20 bg-zinc-900/40">
                <div className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-4 py-2.5 border border-zinc-700/50">
                  <span className="flex-1 text-sm text-zinc-500">Type your message...</span>
                  <div className="w-7 h-7 rounded-lg bg-violet-600/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-violet-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Character Showcase ─────────────────────────────────── */}
        <div className="mb-32 overflow-hidden">
          <div className="text-center mb-12">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">AI PLAYERS</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Every seat filled with a unique character</h3>
            <p className="text-zinc-400">Each AI player has their own personality, role, and strategy. No two games feel the same.</p>
          </div>

          {/* Scrolling marquee */}
          <div className="relative" aria-hidden="true">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

            <div className="flex gap-4 animate-marquee" style={{ width: "max-content" }}>
              {MARQUEE_CHARACTERS.map((char, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 bg-zinc-900/60 border border-zinc-700/60 rounded-2xl p-4 hover:border-violet-500/50 hover:bg-zinc-800/60 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative">
                      {LANDING_AVATAR_MAP[char.name] ? (
                        <SafeAvatar
                          src={LANDING_AVATAR_MAP[char.name]}
                          fallback={GAME_MASTER_AVATAR}
                          alt={char.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-700/80 group-hover:ring-violet-500/50 transition-all"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 ring-2 ring-zinc-700/80 flex items-center justify-center text-white font-bold text-lg">
                          {char.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-zinc-800 border border-zinc-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                        AI
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{char.name}</div>
                      <div className="text-[11px] text-violet-400 font-semibold mb-1">{char.role}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight">{char.personality}</div>
                    </div>
                    <div className="text-[9px] text-zinc-600 bg-zinc-800/80 rounded-full px-2 py-0.5 w-full truncate">
                      {char.game}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Inside a Game ─────────────────────────────────────────── */}
        <InsideGameSection />

        {/* ── Features ─────────────────────────────────────────────── */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">FEATURES</span>
            </div>
            <h3 className="text-4xl font-black text-white mb-4">Why It&apos;s Different</h3>
            <p className="text-lg text-zinc-400">No moderator, no setup — AI handles everything</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="relative text-lg font-bold text-white mb-2">{feature.title}</h4>
                  <p className="relative text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Trending Games ────────────────────────────────────────── */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">CLASSIC BOARD GAMES</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Your favourite games, hosted by AI</h3>
            <p className="text-lg text-zinc-400">No moderator needed — pick a game and start playing in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURED_GAMES.map((game, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onCreateGame?.(game.presetId)}
                aria-label={`Play ${game.title}`}
                className={`group relative bg-zinc-900/60 border border-zinc-800 ${game.border} rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer overflow-hidden text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
              >
                {/* Cover image */}
                <div className="relative h-40 overflow-hidden">
                  <NextImage
                    src={game.cover}
                    alt={game.title}
                    width={400}
                    height={160}
                    loading="lazy"
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                </div>

                <div className="p-5">
                  <h4 className="font-black text-white text-base mb-2">{game.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{game.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {game.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                        {tag}
                      </span>
                    ))}
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {game.players} players
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Play with AI host →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <FAQSection />

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <div className="mb-24">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-12 md:p-16">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative text-center">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                Start Your First Game — Free
              </h3>
              <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
                Sign in to create a room. Friends join instantly — no account needed.
              </p>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/50 rounded-xl blur-xl opacity-40 animate-pulse" style={{ animationDuration: '3s' }} />
                <Button
                  onClick={onSignIn}
                  size="lg"
                  className="relative bg-white hover:bg-zinc-100 text-violet-600 font-bold text-xl px-12 py-8 !rounded-[11px] shadow-2xl transition-all hover:scale-105"
                >
                  <svg className="h-7 w-7 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started with Google
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
            <p>© 2026 {BRAND_CONFIG.name} • Any game you describe, playable in minutes</p>
            <div className="flex gap-6">
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
