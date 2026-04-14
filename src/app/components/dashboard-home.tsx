"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Clock, Sparkles, Play, ChevronRight, Compass, TrendingUp, Shuffle, History } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { t, getAppLanguage } from "@/lib/i18n";
import { getTemplateI18n } from "@/data/template-i18n";
import { type GameTemplate, ALL_PRESETS } from "@/data/discover-templates";
import type { Game } from "@/app/contexts/GameContext";

interface DashboardHomeProps {
  userName: string;
  games?: Game[];
  onCreateGame: (presetId: string) => void;
  onNavigateToDiscover: () => void;
  onSelectGame?: (gameId: string) => void;
}

const POPULAR_IDS = ["werewolf-classic", "script-kill-moonlight", "codenames", "spyfall", "mafia-classic", "avalon"];

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return "home.greeting_morning";
  if (h < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

export function DashboardHome({ userName, games = [], onCreateGame, onNavigateToDiscover, onSelectGame }: DashboardHomeProps) {
  const lang = getAppLanguage();

  const recentGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
    [games],
  );

  const popularTemplates = useMemo(
    () => POPULAR_IDS.map((id) => ALL_PRESETS.find((p) => p.id === id)).filter(Boolean) as GameTemplate[],
    [],
  );

  const handleSelect = (tmpl: GameTemplate) => {
    trackEvent("dashboard_template_click", { template: tmpl.id });
    onCreateGame(tmpl.id);
  };

  const handleSurprise = () => {
    const idx = Math.floor(Math.random() * ALL_PRESETS.length);
    trackEvent("dashboard_surprise", { template: ALL_PRESETS[idx].id });
    onCreateGame(ALL_PRESETS[idx].id);
  };

  return (
    <div className="flex-1 bg-zinc-900 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            {t(getGreetingKey(), lang, { name: userName })}
          </h1>
          <p className="text-base sm:text-lg text-zinc-400">
            {t("home.subtitle", lang)}
          </p>
        </div>

        {/* Quick Actions — two big cards */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">{t("home.quick_start", lang)}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create New Game */}
            <button
              onClick={handleSurprise}
              className="group relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Shuffle className="h-7 w-7 text-white" />
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/80 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t("home.create_new", lang)}</h3>
                <p className="text-violet-100">{t("home.create_new_desc", lang)}</p>
              </div>
            </button>

            {/* Discover / Game Plaza */}
            <button
              onClick={onNavigateToDiscover}
              className="group relative bg-zinc-800 border border-zinc-700 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Compass className="h-7 w-7 text-white" />
                </div>
                <ChevronRight className="h-6 w-6 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t("home.game_plaza", lang)}</h3>
              <p className="text-zinc-400">{t("home.game_plaza_desc", lang)}</p>
            </button>
          </div>
        </div>

        {/* Recent Games */}
        {recentGames.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-white">{t("home.recent_games", lang)}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    trackEvent("dashboard_recent_click", { game: game.id });
                    onSelectGame?.(game.id);
                  }}
                  className="group relative bg-zinc-800/60 border border-zinc-700 hover:border-amber-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className={`relative h-20 overflow-hidden bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                    {game.icon && (game.icon.startsWith("/") || game.icon.startsWith("http")) ? (
                      <img src={game.icon} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{game.icon}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-amber-300 transition-colors truncate">
                      {game.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        {game.config?.template ?? ""}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-3 w-3" />
                        {t("home.continue_game", lang)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Templates */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">{t("home.featured_title", lang)}</h2>
            </div>
            <Link
              href="/discover"
              className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              {t("home.browse_all", lang)}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelect(tmpl)}
                className="group relative bg-zinc-800/60 border border-zinc-700 hover:border-violet-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  {tmpl.cover ? (
                    <Image
                      src={tmpl.cover}
                      alt={getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                      fill
                      quality={80}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${tmpl.color} flex items-center justify-center text-4xl`}>
                      {tmpl.icon}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">
                    {getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed mb-2">
                    {getTemplateI18n(tmpl.id, "desc", lang) ?? tmpl.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Users className="h-3 w-3" />
                      <span>{tmpl.players}</span>
                      <span className="text-zinc-700">·</span>
                      <Clock className="h-3 w-3" />
                      <span>{tmpl.duration}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-3 w-3" />
                      {t("home.play_now", lang)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800/60 pt-6 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-zinc-600">
            <p>© 2026 TextGame.ai</p>
            <div className="flex gap-4">
              <Link href="/blog" className="hover:text-white transition-colors">{t("landing.blog", lang)}</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">{t("landing.privacy", lang)}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{t("landing.terms", lang)}</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
