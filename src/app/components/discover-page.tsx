"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Users, Clock, Play, Crown, Search } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  type DiscoverPreset,
  type GameTemplate,
  FEATURED_TEMPLATE,
  ALL_PRESETS,
  CATEGORIES,
  CATEGORY_MAP,
  buildFallbackRules,
  getStyleColor,
} from "@/data/discover-templates";

export type { DiscoverPreset };

interface DiscoverPageProps {
  onCreateGame: (preset: DiscoverPreset) => void;
  onJoinGame?: (gameId: string) => void;
}

export function DiscoverPage({ onCreateGame }: DiscoverPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
    trackEvent("discover_filter", { type: "category", value: id });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) setActiveCategory("all");
    clearTimeout(searchTimerRef.current);
    if (value.trim()) {
      searchTimerRef.current = setTimeout(() => {
        trackEvent("discover_filter", { type: "search", value: value.trim().slice(0, 50) });
      }, 800);
    }
  }, []);

  const toPreset = (t: GameTemplate): DiscoverPreset => ({
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: (t.templateId ?? "custom") as DiscoverPreset["templateId"],
    playerCount: t.playerCount,
  });

  const handleSelect = (t: GameTemplate) => {
    const preset = toPreset(t);
    onCreateGame({ ...preset, rules: preset.rules?.trim() || buildFallbackRules(preset.name) });
  };

  const renderGameCard = (template: GameTemplate) => {
    return (
      <div
        key={template.id}
        data-testid="game-card"
        className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
        onClick={() => handleSelect(template)}
      >
        {/* Cover */}
        <div className="relative h-36 overflow-hidden">
          {template.cover ? (
            <Image
              src={template.cover}
              alt={template.name}
              fill
              quality={90}
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${template.color} flex items-center justify-center text-4xl`}>
              {template.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
          <div className="absolute top-2.5 right-2.5">
            <Badge className={`${getStyleColor(template.style)} border text-[10px]`}>{template.style}</Badge>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-black text-white mb-1 group-hover:text-violet-300 transition-colors leading-tight">
            {template.name}
          </h3>

          <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{template.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Users className="h-3 w-3" />
              <span>{template.players}</span>
              <span className="text-zinc-700">·</span>
              <Clock className="h-3 w-3" />
              <span>{template.duration}</span>
              {parseInt(template.players) > 1 && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="text-emerald-500 font-semibold">Multiplayer</span>
                </>
              )}
            </div>
            <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Play →
            </span>
          </div>
        </div>
      </div>
    );
  };

  const showFeatured = activeCategory === "all" && !searchQuery;

  const filteredGames = (() => {
    let pool = activeCategory === "all"
      ? ALL_PRESETS
      : (CATEGORY_MAP[activeCategory] ?? []);
    if (showFeatured) pool = pool.filter((t) => t.id !== FEATURED_TEMPLATE.id);
    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase();
    return pool.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  })();

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            Discover <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Games</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-5">
            AI-powered game templates. Pick one and start playing in seconds.
          </p>
        </div>

        {/* Featured Template — only show on "all" tab with no search */}
        {showFeatured && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-black text-white">Featured</h2>
            </div>

            <div
              className="relative group rounded-2xl overflow-hidden border border-zinc-800 hover:border-violet-500/50 transition-all cursor-pointer"
              onClick={() => handleSelect(FEATURED_TEMPLATE)}
            >
              {FEATURED_TEMPLATE.cover && (
                <div className="absolute inset-0">
                  <Image
                    src={FEATURED_TEMPLATE.cover}
                    alt={FEATURED_TEMPLATE.name}
                    fill
                    priority
                    quality={90}
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/50" />
                </div>
              )}

              <div className="relative p-8 flex gap-8 min-h-[240px] items-center">
                <div className="flex-1 max-w-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{FEATURED_TEMPLATE.icon}</span>
                    <div className="flex gap-2">
                      {FEATURED_TEMPLATE.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[11px] font-bold px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 group-hover:text-violet-300 transition-colors">
                    {FEATURED_TEMPLATE.name}
                  </h3>
                  <p className="text-zinc-300 mb-4 text-base leading-relaxed">{FEATURED_TEMPLATE.longDescription}</p>
                  {FEATURED_TEMPLATE.features && (
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {FEATURED_TEMPLATE.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-zinc-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-5 text-sm text-zinc-400">
                      <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{FEATURED_TEMPLATE.players}</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{FEATURED_TEMPLATE.duration}</span></div>
                      <Badge className={`${getStyleColor(FEATURED_TEMPLATE.style)} border text-xs font-bold`}>{FEATURED_TEMPLATE.style}</Badge>
                    </div>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleSelect(FEATURED_TEMPLATE); }}
                      className="ml-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-900/40"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
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
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="discover-search"
              name="discover-search"
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Game Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((template) => renderGameCard(template))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No games found</p>
            <p className="text-sm mt-1">Try a different keyword or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
