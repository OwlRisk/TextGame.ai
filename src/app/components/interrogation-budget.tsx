"use client";

import React from "react";
import { Search, MessageCircleQuestion, Swords, Scale } from "lucide-react";

interface InterrogationBudgetProps {
  phaseLabel: string;
  /** Section content from [SECTION:Investigation Status] — parsed for question count */
  sectionContent?: string;
}

interface ActInfo {
  act: number;
  name: string;
  maxQuestions: number;
  icon: React.ReactNode;
}

const ACTS: ActInfo[] = [
  { act: 1, name: "Crime Scene", maxQuestions: 3, icon: <Search className="h-3.5 w-3.5" /> },
  { act: 2, name: "Interrogation", maxQuestions: 5, icon: <MessageCircleQuestion className="h-3.5 w-3.5" /> },
  { act: 3, name: "Confrontation", maxQuestions: 3, icon: <Swords className="h-3.5 w-3.5" /> },
];

function parseAct(phaseLabel: string): ActInfo | null {
  const label = phaseLabel.toLowerCase();
  if (/act\s*1|crime\s*scene/i.test(label)) return ACTS[0];
  if (/act\s*2|interrogation/i.test(label)) return ACTS[1];
  if (/act\s*3|confrontation/i.test(label)) return ACTS[2];
  if (/accus/i.test(label)) return { act: 4, name: "Accusation", maxQuestions: 0, icon: <Scale className="h-3.5 w-3.5" /> };
  return null;
}

function parseQuestionsRemaining(sectionContent?: string): number | null {
  if (!sectionContent) return null;
  const match = sectionContent.match(/(\d+)\s*question/i);
  return match ? parseInt(match[1], 10) : null;
}

export const InterrogationBudget = React.memo(function InterrogationBudget({
  phaseLabel,
  sectionContent,
}: InterrogationBudgetProps) {
  const actInfo = parseAct(phaseLabel);
  if (!actInfo) return null;

  const questionsRemaining = parseQuestionsRemaining(sectionContent);
  const totalActs = 3;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-500/20 mb-2">
      {/* Act progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalActs }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i + 1 < actInfo.act
                ? "bg-rose-400"
                : i + 1 === actInfo.act
                ? "bg-rose-400 ring-2 ring-rose-400/40"
                : "bg-zinc-600"
            }`}
          />
        ))}
      </div>

      {/* Act label */}
      <div className="flex items-center gap-1.5 text-rose-300">
        {actInfo.icon}
        <span className="text-xs font-semibold">
          {actInfo.act <= 3 ? `Act ${actInfo.act}` : ""} — {actInfo.name}
        </span>
      </div>

      {/* Question budget */}
      {actInfo.maxQuestions > 0 && (
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">Questions:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: actInfo.maxQuestions }, (_, i) => {
              const remaining = questionsRemaining ?? actInfo.maxQuestions;
              const used = actInfo.maxQuestions - remaining;
              return (
                <div
                  key={i}
                  className={`w-1.5 h-4 rounded-sm transition-colors ${
                    i < used ? "bg-zinc-600" : "bg-rose-400"
                  }`}
                />
              );
            })}
          </div>
          {questionsRemaining !== null && (
            <span className={`text-xs font-mono font-bold ${
              questionsRemaining <= 1 ? "text-red-400" : "text-rose-300"
            }`}>
              {questionsRemaining}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
