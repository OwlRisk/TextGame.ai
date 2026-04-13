"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Search, Swords, ScrollText, ChevronDown } from "lucide-react";
import { ARCHETYPES, type CharacterArchetype } from "@/lib/rpg/archetypes";
import { t, getAppLanguage } from "@/lib/i18n";
import { useGameContext } from "@/app/contexts/GameContext";

const SUPABASE_AVATAR_BASE =
  "https://hazjbhhreltgjexxaazn.supabase.co/storage/v1/object/public/avatars/pool/archetype";

type WorldFilter = "all" | "western-fantasy" | "wuxia";

const WORLD_FILTERS: { id: WorldFilter; labelKey: string }[] = [
  { id: "all", labelKey: "gallery.filter_all" },
  { id: "western-fantasy", labelKey: "gallery.filter_western" },
  { id: "wuxia", labelKey: "gallery.filter_wuxia" },
];

function avatarUrl(id: string, gender: "male" | "female") {
  return `${SUPABASE_AVATAR_BASE}/${id}_${gender}.webp`;
}

function ArchetypeCard({ archetype, lang }: { archetype: CharacterArchetype; lang: string }) {
  const isZh = lang.startsWith("zh");
  const name = isZh ? archetype.labelZh : archetype.label;
  const hasBothGenders = archetype.genders.length > 1;
  const [gender, setGender] = useState<"male" | "female">(archetype.genders[0]);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const worldLabels: Record<string, string> = {
    "western-fantasy": isZh ? "西方奇幻" : "Fantasy",
    wuxia: isZh ? "武侠" : "Wuxia",
  };

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10"
    >
      {/* Avatar */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
        {!imgError ? (
          <Image
            src={avatarUrl(archetype.id, gender)}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/40 to-zinc-900">
            <Swords className="h-12 w-12 text-zinc-600" />
          </div>
        )}

        {/* Gender toggle pill */}
        {hasBothGenders && (
          <button
            onClick={() => {
              setGender((g) => (g === "male" ? "female" : "male"));
              setImgError(false);
            }}
            className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-zinc-200 border border-zinc-700/50 hover:bg-violet-600/70 hover:border-violet-500/60 transition-colors"
          >
            {gender === "male" ? "♂" : "♀"}
          </button>
        )}

        {/* World badges */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {archetype.worlds.map((w) => (
            <span
              key={w}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                w === "western-fantasy"
                  ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                  : "bg-amber-500/30 text-amber-200 border border-amber-400/30"
              }`}
            >
              {worldLabels[w] ?? w}
            </span>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold text-zinc-100 leading-tight">{name}</h3>

        {/* Visual tags */}
        <div className="flex flex-wrap gap-1">
          {archetype.visualTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-700/40"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Personality snippet */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {archetype.personality}
        </p>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors mt-auto pt-1"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? (isZh ? "收起" : "Less") : (isZh ? "详情" : "Details")}
        </button>

        {expanded && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">
                {t("gallery.goal", lang)}
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">{archetype.goal}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400/80">
                {t("gallery.fear", lang)}
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">{archetype.fear}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {isZh ? "对玩家态度" : "Attitude"}
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">{archetype.attitudeToPlayer}</p>
            </div>

            {/* All visual tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              {archetype.visualTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-700/40"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Room tags */}
            {archetype.roomTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {archetype.roomTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-violet-900/30 px-1.5 py-0.5 text-[10px] text-violet-300/70 border border-violet-700/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryClient() {
  const [worldFilter, setWorldFilter] = useState<WorldFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lang, setLang] = useState("en");
  const { selectGame } = useGameContext();

  useEffect(() => {
    selectGame("gallery");
    setLang(getAppLanguage());
  }, [selectGame]);

  const isZh = lang.startsWith("zh");

  const filtered = useMemo(() => {
    let list: CharacterArchetype[] = ARCHETYPES;

    if (worldFilter !== "all") {
      list = list.filter((a) => a.worlds.includes(worldFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.labelZh.includes(q) ||
          a.personality.toLowerCase().includes(q) ||
          a.visualTags.some((tag) => tag.toLowerCase().includes(q)) ||
          a.worlds.some((w) => w.toLowerCase().includes(q)) ||
          a.roomTags.some((rt) => rt.toLowerCase().includes(q))
      );
    }

    return list;
  }, [worldFilter, searchQuery]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText className="h-8 w-8 text-violet-400" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              {t("gallery.title", lang)}
            </h1>
          </div>
          <p className="text-zinc-400 text-sm sm:text-base ml-11">
            {t("gallery.subtitle", lang)}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("gallery.search_placeholder", lang)}
              className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          {/* World filter tabs */}
          <div className="flex gap-1.5 rounded-xl bg-zinc-900/60 border border-zinc-700/40 p-1">
            {WORLD_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setWorldFilter(f.id)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                  worldFilter === f.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                {t(f.labelKey, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-zinc-500 mb-4">
          {filtered.length} {isZh ? "个角色" : filtered.length === 1 ? "character" : "characters"}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((archetype) => (
            <ArchetypeCard key={archetype.id} archetype={archetype} lang={lang} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Swords className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">{isZh ? "未找到角色" : "No characters found"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
