"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MYSTERY_CASES } from "@/data/mystery-cases";
import type { MysteryCase } from "@/types/mystery-case";
import { Clock, Users, Star, ChevronRight, Search, Skull, Lock } from "lucide-react";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Standard",
  3: "Hard",
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  2: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  3: "bg-red-500/20 text-red-300 border-red-500/30",
};

const DIFFICULTY_STARS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
};

export function CaseLibrary() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  const filteredCases = selectedDifficulty
    ? MYSTERY_CASES.filter((c) => c.difficulty === selectedDifficulty)
    : MYSTERY_CASES;

  function handlePlayCase(caseData: MysteryCase) {
    const presetId = `script-kill-${caseData.id.replace("moonlight-inn", "moonlight").replace("silk-gallery", "gallery").replace("midnight-express", "express")}`;
    router.push(`/create?preset=${presetId}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20">
            <Search className="h-6 w-6 text-rose-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Script Kill</h1>
        </div>
        <p className="text-zinc-400 text-base mt-3 max-w-xl">
          AI-powered murder mystery cases. You are the detective — interrogate suspects, collect evidence, and solve the crime. Each case takes 10-20 minutes.
        </p>

        {/* Difficulty filter */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setSelectedDifficulty(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDifficulty === null
                ? "bg-white/10 text-white border border-white/20"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            All Cases ({MYSTERY_CASES.length})
          </button>
          {[1, 2, 3].map((d) => {
            const count = MYSTERY_CASES.filter((c) => c.difficulty === d).length;
            return (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDifficulty === d
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                {DIFFICULTY_LABELS[d]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid gap-4">
          {filteredCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              caseData={caseData}
              onPlay={() => handlePlayCase(caseData)}
            />
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <Lock className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No cases at this difficulty yet.</p>
            <p className="text-sm mt-1">More cases coming soon.</p>
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 px-8 py-10 text-center">
          <Skull className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-bold text-zinc-400">More Cases Coming Soon</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            New cases are added regularly. Each case is a unique murder mystery with its own suspects, evidence, and twists.
          </p>
        </div>
      </div>
    </div>
  );
}

function CaseCard({ caseData, onPlay }: { caseData: MysteryCase; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all duration-200 p-5 group"
    >
      <div className="flex items-start gap-4">
        {/* Left: case info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-rose-200 transition-colors truncate">
              {caseData.title}
            </h3>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${DIFFICULTY_COLORS[caseData.difficulty]}`}
            >
              {DIFFICULTY_LABELS[caseData.difficulty]}
            </span>
          </div>

          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
            {caseData.setting.split(".").slice(0, 2).join(".")}.
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {caseData.suspects.length} suspects
            </span>
            <span className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              {caseData.evidence.length} clues
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{caseData.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              {Array.from({ length: DIFFICULTY_STARS[caseData.difficulty] }, (_, i) => (
                <Star key={i} className="h-3 w-3 fill-current text-amber-400" />
              ))}
            </span>
          </div>
        </div>

        {/* Right: play arrow */}
        <div className="shrink-0 self-center">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
            <ChevronRight className="h-5 w-5 text-rose-400" />
          </div>
        </div>
      </div>
    </button>
  );
}
