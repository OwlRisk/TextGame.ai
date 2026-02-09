"use client";

import { Button } from "@/app/components/ui/button";
import {
  Sparkles,
  Lightbulb,
  MessageSquare,
  Wand2,
  ChevronRight,
  Gamepad2,
  LogIn,
  Loader2,
  Users,
  Target,
} from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export interface WelcomeGame {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface WelcomePageProps {
  onCreateGame: (presetId?: string) => void;
  onExploreGames: () => void;
  user: User | null;
  loading: boolean;
  games?: WelcomeGame[];
}

export function WelcomePage({
  onCreateGame,
  onExploreGames,
  user,
  loading,
  games = [],
}: WelcomePageProps) {
  const router = useRouter();
  const recentGames = games.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#08070a] relative">
      {/* 背景：更柔和的光晕 */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,191,36,0.04)_0%,transparent_35%,transparent_65%,rgba(139,92,246,0.05)_100%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[70%] max-w-4xl h-[80vh] bg-amber-500/[0.07] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/5 left-0 w-[50%] max-w-2xl h-[60vh] bg-violet-500/[0.06] rounded-full blur-[160px] pointer-events-none" />

      <ScrollArea className="flex-1 min-h-0 h-full">
        <div className="relative z-10">
          {/* 顶栏：Continue（仅登录且有游戏时） */}
          {user && !loading && recentGames.length > 0 && (
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 sm:px-8 lg:px-12 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm font-semibold text-zinc-500 uppercase tracking-[0.18em]">Jump back in</span>
                <div className="flex flex-wrap gap-2">
                  {recentGames.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => router.push(`/game/${g.id}`)}
                      className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-4 py-2.5 text-left transition-colors min-w-0"
                    >
                      <span className="text-xl shrink-0">{g.icon || "🎮"}</span>
                      <span className="font-medium text-white truncate text-base">{g.name}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hero：左右分栏，更大留白与字号 */}
          <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 sm:pt-28 pb-20 sm:pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-5 py-2.5 text-base font-medium text-amber-300/90 mb-7">
                  <Sparkles className="h-5 w-5" />
                  Design a game in minutes
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                  Turn an idea into a{" "}
                  <span className="text-amber-400">playable game</span>.
                  <br className="hidden sm:block" />
                  In one conversation.
                </h1>
                <p className="text-zinc-300/90 text-xl sm:text-2xl max-w-2xl leading-relaxed">
                  Describe the vibe. We’ll generate roles, rules, and flow—then host the session with AI players so you can start immediately.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-5 min-w-[260px]">
                {loading ? (
                  <div className="flex items-center gap-2 text-zinc-500 py-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-base">Loading…</span>
                  </div>
                ) : !user ? (
                  <Button
                    onClick={() => router.push("/signin")}
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-6 sm:px-8 lg:px-10 py-6 sm:py-7 lg:py-8 h-auto rounded-2xl w-full sm:w-auto lg:w-full text-lg sm:text-xl"
                  >
                    <LogIn className="h-5 w-5 sm:h-6 sm:w-6 mr-2 shrink-0" />
                    Sign in to start
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => onCreateGame()}
                      size="lg"
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-10 py-8 h-auto rounded-2xl w-full sm:w-auto lg:w-full text-lg"
                    >
                      <Sparkles className="h-6 w-6 mr-2 shrink-0" />
                      Create a new game
                    </Button>
                    <Button
                      onClick={onExploreGames}
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl px-10 py-8 h-auto w-full sm:w-auto lg:w-full text-lg"
                    >
                      <Lightbulb className="h-6 w-6 mr-2 shrink-0" />
                      Browse templates
                    </Button>
                  </>
                )}
                {!loading && (
                  <p className="text-base text-zinc-500 lg:text-right">
                    {!user ? (
                      <span className="text-amber-400/90 font-medium">New here?</span>
                    ) : (
                      <span className="text-amber-400/90 font-medium">Tip:</span>
                    )}{" "}
                    {!user ? "Sign in to create and save your games." : "Start with a template, then customize anything."}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 步骤：更大留白与圆角 */}
          <section className="border-y border-white/[0.06] bg-white/[0.02] py-16 sm:py-24">
            <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-12">
                From idea to play
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 font-bold text-xl">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-xl">
                      <MessageSquare className="h-6 w-6 text-violet-400" />
                      Describe your game
                    </h3>
                    <p className="text-zinc-300/90 leading-relaxed text-lg">
                      Tell the Game Master the theme, player count, and what “fun” looks like.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 font-bold text-xl">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-xl">
                      <Wand2 className="h-6 w-6 text-amber-400" />
                      Shape the rules
                    </h3>
                    <p className="text-zinc-300/90 leading-relaxed text-lg">
                      We’ll draft roles, phases, and win conditions—then you tweak anything you want.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-xl">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-xl">
                      <Gamepad2 className="h-6 w-6 text-emerald-400" />
                      Start the session
                    </h3>
                    <p className="text-zinc-300/90 leading-relaxed text-lg">
                      The host runs the flow, AI players participate, and you jump in when it’s your turn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 模板：Bento，更大字更大块 */}
          <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-24 sm:py-32">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-[0.22em] mb-14">
              Pick a starting point
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
              <button
                onClick={() => onCreateGame("werewolf-classic")}
                className="group lg:col-span-2 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[88px] leading-none -mt-1">🐺</span>
                  <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase text-violet-300">
                    Classic
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-4 text-2xl">Werewolf</h3>
                <p className="text-zinc-400 mb-6 flex-1 leading-relaxed">
                  Classic social deduction. Bluff, accuse, survive.
                </p>
                <div className="flex items-center gap-2 text-base text-violet-400 font-medium">
                  <Users className="h-5 w-5" />
                  <span>5–12 players</span>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-base text-zinc-500 group-hover:text-violet-400 transition-colors">
                  Create this game <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-7">
                <button
                  onClick={() => onCreateGame("undercover-party")}
                  className="group rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-6xl">🕵️</span>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase text-amber-300">
                      Party
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-3 text-xl">Who&apos;s the Spy</h3>
                  <p className="text-zinc-300/90 mb-5 leading-relaxed text-lg">
                    Quick rounds. One word is different. Spot the spy.
                  </p>
                  <div className="flex items-center gap-2 text-base text-amber-400 font-medium">
                    <Users className="h-5 w-5" />
                    <span>4–10 players</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-base text-zinc-500 group-hover:text-amber-400 transition-colors">
                    Create <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => onCreateGame()}
                  className="group rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7 text-left hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.04] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-6xl">✨</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-zinc-300">
                      Custom
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-3 text-xl">Your own game</h3>
                  <p className="text-zinc-300/90 mb-5 leading-relaxed text-lg">
                    Any theme. Any mechanics. Start from a blank page.
                  </p>
                  <div className="flex items-center gap-2 text-base text-zinc-300/90 font-medium">
                    <Target className="h-5 w-5" />
                    <span>2–20 players</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-base text-zinc-500 group-hover:text-white transition-colors">
                    Start from scratch <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* 底部数据条：更大字号与留白 */}
          <section className="border-t border-white/[0.06] py-12 sm:py-16">
            <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-10 sm:gap-16 text-center sm:text-left">
                <div>
                  <span className="text-4xl sm:text-5xl font-bold text-amber-400">Describe</span>
                  <span className="text-zinc-500 text-lg sm:text-xl ml-2">your idea</span>
                </div>
                <div>
                  <span className="text-4xl sm:text-5xl font-bold text-amber-400">∞</span>
                  <span className="text-zinc-500 text-lg sm:text-xl ml-2">possibilities</span>
                </div>
                <div>
                  <span className="text-4xl sm:text-5xl font-bold text-amber-400">~2 min</span>
                  <span className="text-zinc-500 text-lg sm:text-xl ml-2">to start playing</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
