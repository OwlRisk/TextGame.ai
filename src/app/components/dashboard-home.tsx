"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Clock, Search, Shuffle, Sparkles, Play } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { trackEvent } from "@/lib/analytics";
import { t, tStyle, tCategory, getAppLanguage } from "@/lib/i18n";
import { getTemplateI18n } from "@/data/template-i18n";
import {
  type GameTemplate,
  type DiscoverPreset,
  ALL_PRESETS,
  CATEGORIES,
  CATEGORY_MAP,
  buildFallbackRules,
  getStyleColor,
} from "@/data/discover-templates";

interface DashboardHomeProps {
  userName: string;
  onCreateGame: (presetId: string) => void;
}

const QUICK_START_IDS = ["werewolf-classic", "script-kill-moonlight", "spyfall"];

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return "home.greeting_morning";
  if (h < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

export function DashboardHome({ userName, onCreateGame }: DashboardHomeProps) {
  const lang = getAppLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const quickStartTemplates = useMemo(
    () => QUICK_START_IDS.map((id) => ALL_PRESETS.find((p) => p.id === id)).filter(Boolean) as GameTemplate[],
    [],
  );

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
    trackEvent("dashboard_filter", { type: "category", value: id });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) setActiveCategory("all");
    clearTimeout(searchTimerRef.current);
    if (value.trim()) {
      searchTimerRef.current = setTimeout(() => {
        trackEvent("dashboard_filter", { type: "search", value: value.trim().slice(0, 50) });
      }, 800);
    }
  }, []);

  const toPreset = (tmpl: GameTemplate): DiscoverPreset => ({
    id: tmpl.id,
    name: tmpl.name,
    rules: tmpl.rules,
    templateId: tmpl.templateId ?? "custom",
    playerCount: tmpl.playerCount,
  });

  const handleSelect = (tmpl: GameTemplate) => {
    const preset = toPreset(tmpl);
    onCreateGame(preset.id);
  };

  const handleSurprise = () => {
    const idx = Math.floor(Math.random() * ALL_PRESETS.length);
    trackEvent("dashboard_surprise", { template: ALL_PRESETS[idx].id });
    onCreateGame(ALL_PRESETS[idx].id);
  };

  const filteredGames = useMemo(() => {
    let pool = activeCategory === "all" ? ALL_PRESETS : (CATEGORY_MAP[activeCategory] ?? []);
    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase();
    return pool.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [activeCategory, searchQuery]);

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">

        {/* Greeting Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t(getGreetingKey(), lang, { name: userName })}
          </h1>
          <Button
            onClick={handleSurprise}
            variant="outline"
            className="bg-zinc-800/60 border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            {t("home.random_game", lang)}
          </Button>
        </div>

        {/* Quick Start */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-violet-400 uppercase tracking-wider">
              {t("home.quick_start", lang)}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickStartTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelect(tmpl)}
                className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  {tmpl.cover ? (
                    <Image
                      src={tmpl.cover}
                      alt={getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                      fill
                      quality={90}
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
                  <h3 className="font-bold text-white text-base mb-1 group-hover:text-violet-300 transition-colors">
                    {getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
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

        {/* All Games */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-1">
              {t("home.featured_title", lang)}
            </h2>
            <p className="text-sm text-zinc-500">{t("home.featured_desc", lang)}</p>
          </div>

          {/* Category Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleCategoryChange(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeCategory === id
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                      : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tCategory(id)}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="dashboard-search"
                name="dashboard-search"
                type="text"
                placeholder={t("discover.search", lang)}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((tmpl) => (
                <div
                  key={tmpl.id}
                  role="button"
                  tabIndex={0}
                  className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
                  onClick={() => handleSelect(tmpl)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(tmpl);
                    }
                  }}
                >
                  <div className="relative h-36 overflow-hidden">
                    {tmpl.cover ? (
                      <Image
                        src={tmpl.cover}
                        alt={getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                        fill
                        quality={90}
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${tmpl.color} flex items-center justify-center text-4xl`}>
                        {tmpl.icon}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {tmpl.badge && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">{tmpl.badge}</Badge>
                      )}
                      <Badge className={`${getStyleColor(tmpl.style)} border text-[10px]`}>{tStyle(tmpl.style)}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black text-white mb-1 group-hover:text-violet-300 transition-colors leading-tight">
                      {getTemplateI18n(tmpl.id, "name", lang) ?? tmpl.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">
                      {getTemplateI18n(tmpl.id, "desc", lang) ?? tmpl.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <Users className="h-3 w-3" />
                        <span>{tmpl.players}</span>
                        <span className="text-zinc-700">·</span>
                        <Clock className="h-3 w-3" />
                        <span>{tmpl.duration}</span>
                        {parseInt(tmpl.players) > 1 && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="text-emerald-500 font-semibold">{t("discover.multiplayer", lang)}</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("discover.play", lang)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-semibold">{t("discover.no_results", lang)}</p>
              <p className="text-sm mt-1">{t("discover.try_different", lang)}</p>
            </div>
          )}

          {/* Browse All link */}
          <div className="text-center mt-8 mb-6">
            <Link
              href="/discover"
              className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              {t("home.browse_all", lang)}
            </Link>
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
