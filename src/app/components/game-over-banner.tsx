"use client";

import { BookOpen, Play, Heart, Trophy, Eye, Scroll, RotateCcw, Target, Search, Award } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { Player } from "@/types/player";
import { isPlayerEliminated } from "@/lib/player-badges";
import { useState, useMemo } from "react";

interface ParsedCaseScore {
  grade: string;
  total: number;
  correctCulprit: boolean;
}

function parseCaseScore(summary: string): ParsedCaseScore | null {
  const gradeMatch = summary.match(/\b([SABCF])\s*(?:Grade|grade|GRADE)/i)
    || summary.match(/(?:Grade|grade|GRADE)\s*[:\-—]\s*([SABCF])\b/i);
  const totalMatch = summary.match(/(\d+)\s*(?:points?|pts?|\/\s*\d+)/i);
  const culpritCorrect = /correct(?:ly)?[\s\w]*(?:culprit|killer|murderer)/i.test(summary)
    || /(?:culprit|killer|murderer)[\s\w]*correct/i.test(summary)
    || /identified the (?:culprit|killer|murderer)/i.test(summary);

  if (!gradeMatch && !totalMatch) return null;

  return {
    grade: gradeMatch?.[1]?.toUpperCase() ?? "?",
    total: totalMatch ? parseInt(totalMatch[1], 10) : 0,
    correctCulprit: culpritCorrect,
  };
}

function getGradeColorClass(grade: string) {
  switch (grade) {
    case "S": return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    case "A": return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    case "B": return "text-blue-400 border-blue-500/40 bg-blue-500/10";
    case "C": return "text-orange-400 border-orange-500/40 bg-orange-500/10";
    case "F": return "text-red-400 border-red-500/40 bg-red-500/10";
    default: return "text-zinc-400 border-zinc-500/40 bg-zinc-500/10";
  }
}

function getGradeLabel(grade: string) {
  switch (grade) {
    case "S": return "Perfect Detective";
    case "A": return "Sharp Investigator";
    case "B": return "Decent Deduction";
    case "C": return "Partial Success";
    case "F": return "Case Cold";
    default: return "Unknown";
  }
}

interface GameOverBannerProps {
  gameOverSummary: string;
  onResumeGame?: () => void;
  onNewGame?: () => void;
  onSaveCharacters?: () => void;
  players?: Player[];
  gameEvents?: string[];
  messageCount?: number;
  userId?: string;
  humanName?: string;
  gameTemplate?: string;
}

export function GameOverBanner({
  gameOverSummary,
  onResumeGame,
  onNewGame,
  onSaveCharacters,
  players = [],
  gameEvents = [],
  messageCount = 0,
  userId,
  humanName,
  gameTemplate,
}: GameOverBannerProps) {
  const [showRoles, setShowRoles] = useState(true);
  const caseScore = useMemo(
    () => (gameTemplate === "script-kill" ? parseCaseScore(gameOverSummary) : null),
    [gameTemplate, gameOverSummary],
  );

  const nonGMPlayers = players.filter((p) => !p.isGameMaster);
  const hasRoles = nonGMPlayers.some((p) => p.role);
  const humanPlayer = nonGMPlayers.find((p) => p.id === userId);
  const survived = humanPlayer ? !isPlayerEliminated(humanPlayer) : true;
  const eliminatedCount = nonGMPlayers.filter((p) => isPlayerEliminated(p)).length;
  const totalRounds = gameEvents.filter((e) => /round|phase|night|day/i.test(e)).length || 1;

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-violet-500/10 px-5 py-5 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-amber-500/20">
          {gameTemplate === "script-kill" ? (
            <Search className="h-6 w-6 text-amber-400" />
          ) : (
            <Trophy className="h-6 w-6 text-amber-400" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-black text-amber-200 tracking-wide uppercase">
            {gameTemplate === "script-kill" ? "Case Closed" : "Game Over"}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {gameTemplate === "script-kill"
              ? `${messageCount} messages · Investigation complete`
              : `${survived ? "You survived!" : "You were eliminated."} · ${messageCount} messages · ${totalRounds} phase${totalRounds !== 1 ? "s" : ""}`
            }
          </p>
        </div>
      </div>

      {/* Case Score Card (script-kill only) */}
      {caseScore && (
        <div className="mb-4 rounded-xl border border-zinc-700/50 bg-zinc-800/40 overflow-hidden">
          <div className="flex items-stretch">
            <div className={`flex flex-col items-center justify-center px-5 py-3 border-r border-zinc-700/40 ${getGradeColorClass(caseScore.grade)}`}>
              <span className="text-3xl font-black">{caseScore.grade}</span>
              <span className="text-[10px] uppercase tracking-wider mt-0.5 opacity-80">{getGradeLabel(caseScore.grade)}</span>
            </div>
            <div className="flex-1 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-sm text-zinc-300">
                  Culprit: {caseScore.correctCulprit
                    ? <span className="text-emerald-400 font-semibold">Correct</span>
                    : <span className="text-red-400 font-semibold">Wrong</span>
                  }
                </span>
              </div>
              {caseScore.total > 0 && (
                <div className="flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-sm text-zinc-300">Score: <span className="font-semibold text-white">{caseScore.total}</span> pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 mb-4">
        <div className="flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100/90 leading-relaxed whitespace-pre-line">{gameOverSummary}</p>
        </div>
      </div>

      {/* Role Reveals */}
      {hasRoles && (
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            onClick={() => setShowRoles(!showRoles)}
          >
            <Eye className="h-3.5 w-3.5" />
            Role Reveals {showRoles ? "▾" : "▸"}
          </button>
          {showRoles && (
            <div className="grid grid-cols-2 gap-1.5">
              {nonGMPlayers.map((p) => {
                const isHuman = p.id === userId;
                const eliminated = isPlayerEliminated(p);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${eliminated ? "bg-red-950/30 border border-red-500/20" : "bg-zinc-800/50 border border-zinc-700/30"}`}
                  >
                    <span className={`font-medium truncate ${isHuman ? "text-amber-300" : "text-zinc-200"}`}>
                      {isHuman ? (humanName || "You") : p.name}
                      {isHuman && " (you)"}
                    </span>
                    {p.role && (
                      <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${eliminated ? "bg-red-500/20 text-red-300" : "bg-violet-500/20 text-violet-300"}`}>
                        {p.role}
                      </span>
                    )}
                    {eliminated && <span className="text-red-400 text-[10px]">✕</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Key Moments */}
      {gameEvents.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400">
            <Scroll className="h-3.5 w-3.5" />
            Key Moments
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
            {gameEvents.slice(-8).map((event, i) => (
              <div key={i} className="text-xs text-zinc-400 pl-3 border-l-2 border-zinc-700/50">
                {event}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-4 text-center">
        <div className="flex-1 rounded-lg bg-zinc-800/40 px-3 py-2">
          <div className="text-lg font-bold text-white">{messageCount}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Messages</div>
        </div>
        <div className="flex-1 rounded-lg bg-zinc-800/40 px-3 py-2">
          <div className="text-lg font-bold text-white">{totalRounds}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Phases</div>
        </div>
        <div className="flex-1 rounded-lg bg-zinc-800/40 px-3 py-2">
          <div className="text-lg font-bold text-white">{eliminatedCount}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Eliminated</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {onNewGame && (
          <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold gap-1.5 flex-1 sm:flex-none" onClick={onNewGame}>
            <RotateCcw className="h-3.5 w-3.5" /> Play Again
          </Button>
        )}
        {onResumeGame && (
          <Button size="sm" variant="outline" className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white gap-1.5" onClick={onResumeGame}>
            <Play className="h-3.5 w-3.5" /> Resume
          </Button>
        )}
        {onSaveCharacters && (
          <Button size="sm" variant="outline" className="border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white gap-1.5" onClick={onSaveCharacters}>
            <Heart className="h-3.5 w-3.5" /> Save Characters
          </Button>
        )}
      </div>
    </div>
  );
}
