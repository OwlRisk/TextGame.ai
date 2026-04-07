"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Users, Clock, Search, Plus, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/app/components/ui/badge";
import {
  type DiscoverPreset,
  type GameTemplate,
  ALL_PRESETS,
  CATEGORIES,
  CATEGORY_MAP,
  buildFallbackRules,
} from "@/data/discover-templates";

export type { DiscoverPreset };

interface DiscoverPageProps {
  onCreateGame: (preset: DiscoverPreset) => void;
  onJoinGame?: (gameId: string) => void;
}

function getDifficultyFromTags(tags: string[]): { label: string; color: string } {
  if (tags.includes("Hard")) return { label: "Hard", color: "bg-red-500/20 text-red-300 border-red-500/30" };
  if (tags.includes("Medium")) return { label: "Medium", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  return { label: "Beginner", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
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
    templateId: t.templateId ?? "custom",
    playerCount: t.playerCount,
  });

  const handleSelect = (t: GameTemplate) => {
    const preset = toPreset(t);
    trackEvent("template_selected", { template: t.id, source: "discover" });
    onCreateGame({ ...preset, rules: preset.rules?.trim() || buildFallbackRules(preset.name) });
  };

  const heroGame = ALL_PRESETS[0];
  const restGames = ALL_PRESETS.slice(1);

  const filteredGames = (() => {
    let pool = activeCategory === "all"
      ? restGames
      : (CATEGORY_MAP[activeCategory] ?? []).filter((t) => t.id !== heroGame?.id);
    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase();
    return pool.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  })();

  const isSearching = searchQuery.trim().length > 0;

  const renderGameCard = (template: GameTemplate) => {
    const difficulty = getDifficultyFromTags(template.tags);
    return (
      <div
        key={template.id}
        data-testid="game-card"
        role="button"
        tabIndex={0}
        className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
        onClick={() => handleSelect(template)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(template);
          }
        }}
      >
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
            <Badge className={`${difficulty.color} border text-[10px]`}>{difficulty.label}</Badge>
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
            </div>
            <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Play →
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
            Discover <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Games</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
            Pick a murder mystery to start — or create your own game from scratch.
          </p>
        </div>

        {/* Hero: Featured Game + Create Your Own */}
        {!isSearching && heroGame && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-10">
            {/* Featured game — takes 3 cols */}
            <div
              role="button"
              tabIndex={0}
              className="lg:col-span-3 group relative rounded-2xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-violet-500/40 transition-all duration-300"
              onClick={() => handleSelect(heroGame)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(heroGame);
                }
              }}
            >
              <div className="relative h-56 sm:h-72">
                {heroGame.cover ? (
                  <Image
                    src={heroGame.cover}
                    alt={heroGame.name}
                    fill
                    priority
                    quality={90}
                    sizes="(min-width: 1024px) 60vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${heroGame.color}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] mb-2">
                  {getDifficultyFromTags(heroGame.tags).label}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-1 group-hover:text-violet-300 transition-colors">
                  {heroGame.name}
                </h2>
                <p className="text-sm text-zinc-400 mb-3 max-w-lg line-clamp-2">{heroGame.description}</p>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                    Start Playing <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> {heroGame.players}
                    <span className="text-zinc-700 mx-0.5">·</span>
                    <Clock className="h-3 w-3" /> {heroGame.duration}
                  </span>
                </div>
              </div>
            </div>

            {/* Create Your Own — takes 2 cols */}
            <Link
              href="/create"
              className="lg:col-span-2 group relative rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-violet-500/50 bg-zinc-900/30 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 sm:p-8 min-h-[200px]"
            >
              <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-colors">
                <Sparkles className="h-7 w-7 text-violet-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">Create Your Own Game</p>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">Describe any idea — the AI designs the rules, roles, and characters for you.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        )}

        {/* Category Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
