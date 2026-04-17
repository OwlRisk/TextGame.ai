"use client";

import { Button } from "@/app/components/ui/button";
import {
  Sparkles,
  Lightbulb,
  LogIn,
  Loader2,
  ChevronRight,
  Save,
  Smartphone,
  Share2,
  MessageSquare,
  FileText,
  Users,
  LayoutTemplate,
  Bot,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { IntroRulesChat } from "@/app/components/intro-rules-chat";

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
  const isGuest = !user && !loading;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060508] relative">
      {/* Background: subtle gradient + soft orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.06),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(139,92,246,0.05),transparent)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />

      <ScrollArea className="flex-1 min-h-0">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 sm:pb-24">
          {/* Jump back in — only when logged in with games */}
          {user && recentGames.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                {t("welcome.jump_back")}
              </span>
              {recentGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => router.push(`/game/${g.id}`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-3 py-2 text-sm text-white transition-colors"
                >
                  <span className="text-lg">{g.icon || "🎮"}</span>
                  <span className="font-medium truncate max-w-[140px]">{g.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t("welcome.loading")}</span>
            </div>
          ) : isGuest ? (
            <>
              {/* Top: Hero + Chat side-by-side on lg, stacked on small (hero then chat) */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.1fr] lg:gap-12 xl:gap-16 items-start mb-16 sm:mb-20">
                {/* Hero */}
                <header className="lg:sticky lg:top-8 text-center sm:text-left order-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-white tracking-tight leading-[1.12] mb-4">
                    {t("welcome.design_game")}
                    <br className="sm:hidden" />
                    <span className="text-amber-400"> {t("welcome.in_conversation")}</span>
                  </h1>
                  <p className="text-zinc-400 text-base sm:text-lg max-w-md mb-6 sm:mb-8">
                    {t("welcome.hero_desc")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={() => router.push("/signin")}
                      size="lg"
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-xl px-6 py-6 h-auto text-base shadow-lg shadow-amber-500/25"
                    >
                      <LogIn className="h-5 w-5 mr-2 shrink-0" />
                      {t("welcome.sign_in_create")}
                    </Button>
                    <Button
                      onClick={onExploreGames}
                      variant="ghost"
                      size="lg"
                      className="text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl px-6 py-6 h-auto text-base"
                    >
                      <Lightbulb className="h-5 w-5 mr-2 shrink-0" />
                      {t("welcome.browse_templates")}
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500">
                    {t("welcome.free_start")}
                  </p>
                  {/* After signing in you can */}
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Save className="h-3.5 w-3.5 text-amber-500/80" />
                      {t("welcome.save_games")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-violet-500/80" />
                      {t("welcome.sync_devices")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-amber-500/80" />
                      {t("welcome.share_friends")}
                    </span>
                  </div>
                </header>

                {/* Try it: chat — right on lg, below hero on mobile */}
                <section className="order-2 min-w-0">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 sm:mb-4">
                    {t("welcome.try_it")}
                  </p>
                  <div className="lg:min-h-[420px] flex flex-col">
                    <IntroRulesChat />
                  </div>
                </section>
              </div>

              {/* Feature highlights */}
              <section className="mb-16 sm:mb-20">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 sm:mb-5">
                  Why GameMaster
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <MessageSquare className="h-6 w-6 text-amber-400/90 mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">Conversation-first</h3>
                    <p className="text-xs text-zinc-500">Design by chatting—no forms or config hell.</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <LayoutTemplate className="h-6 w-6 text-violet-400/90 mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">Templates</h3>
                    <p className="text-xs text-zinc-500">Werewolf, Spy, and more—one click to start.</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <Bot className="h-6 w-6 text-amber-400/90 mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">AI host</h3>
                    <p className="text-xs text-zinc-500">AI runs the game and can fill as players.</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <Users className="h-6 w-6 text-violet-400/90 mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">Multiplayer</h3>
                    <p className="text-xs text-zinc-500">Share a link; friends join in the browser.</p>
                  </div>
                </div>
              </section>

              {/* How it works */}
              <section className="mb-16 sm:mb-20">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-6">
                  How it works
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">1. Describe your idea</h3>
                      <p className="text-sm text-zinc-500">Chat with the AI Game Master. No game design experience needed.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">2. Get roles & rules</h3>
                      <p className="text-sm text-zinc-500">Rules and player roles are generated and shown in real time.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">3. Host & play</h3>
                      <p className="text-sm text-zinc-500">Start a room. Invite friends or play with AI players.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Templates: compact row, consistent card height */}
              <section className="mb-16 sm:mb-20">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 sm:mb-5">
                  Or start from a template
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <button
                    onClick={() => onCreateGame("rpg-jade-peak")}
                    className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 text-left hover:border-violet-500/25 hover:bg-violet-500/5 transition-all flex flex-col min-h-[160px] sm:min-h-[172px]"
                  >
                    <span className="text-4xl block mb-3">⚔️</span>
                    <h3 className="font-semibold text-white mb-1">Jade Peak Tournament</h3>
                    <p className="text-zinc-500 text-sm mb-auto">Wuxia RPG. Solo + AI party.</p>
                    <span className="text-xs text-zinc-500 group-hover:text-violet-400 transition-colors inline-flex items-center gap-1 mt-3">
                      Start adventure <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                  <button
                    onClick={() => onCreateGame("rpg-starfall-dungeon")}
                    className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 text-left hover:border-amber-500/25 hover:bg-amber-500/5 transition-all flex flex-col min-h-[160px] sm:min-h-[172px]"
                  >
                    <span className="text-4xl block mb-3">🐉</span>
                    <h3 className="font-semibold text-white mb-1">Starfall Dungeon</h3>
                    <p className="text-zinc-500 text-sm mb-auto">Fantasy dungeon crawl. Solo + AI party.</p>
                    <span className="text-xs text-zinc-500 group-hover:text-amber-400 transition-colors inline-flex items-center gap-1 mt-3">
                      Start adventure <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                  <button
                    onClick={() => onCreateGame()}
                    className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 text-left hover:border-white/15 hover:bg-white/[0.06] transition-all flex flex-col min-h-[160px] sm:min-h-[172px]"
                  >
                    <span className="text-4xl block mb-3">✨</span>
                    <h3 className="font-semibold text-white mb-1">Custom</h3>
                    <p className="text-zinc-500 text-sm mb-auto">Any theme. 2–20 players.</p>
                    <span className="text-xs text-zinc-500 group-hover:text-white transition-colors inline-flex items-center gap-1 mt-3">
                      Start from scratch <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  {t("welcome.sign_in_save")}
                </p>
              </section>

              {/* Footer */}
              <footer className="pt-8 sm:pt-10 border-t border-white/[0.06] flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-zinc-500">
                <span><span className="font-semibold text-zinc-400">TextGame.ai</span> · Free to start · Sign in to save your games</span>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={onExploreGames}
                    className="hover:text-zinc-300 transition-colors"
                  >
                    Discover
                  </button>
                  <a href="/privacy" className="hover:text-zinc-300 transition-colors">
                    Privacy
                  </a>
                  <a href="/terms" className="hover:text-zinc-300 transition-colors">
                    Terms
                  </a>
                </div>
              </footer>
            </>
          ) : (
            /* Logged-in: minimal CTA (in case redirect is slow) */
            <div className="pt-16 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">{t("welcome.ready")}</h1>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => onCreateGame()}
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-xl"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t("welcome.create_new")}
                </Button>
                <Button
                  onClick={onExploreGames}
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  {t("welcome.browse_templates")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
