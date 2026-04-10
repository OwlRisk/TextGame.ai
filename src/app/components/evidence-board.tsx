"use client";

import React, { useMemo } from "react";
import { Fingerprint, FileText, Monitor, MessageSquareQuote, User, HelpCircle } from "lucide-react";
import { t, getBrowserLanguage } from "@/lib/i18n";

interface EvidenceBoardProps {
  boardContent: string;
  caseTitle?: string;
}

interface ParsedEvidence {
  name: string;
  type: string;
  description: string;
}

interface ParsedSuspect {
  name: string;
  relationship: string;
  alibi: string;
  notes: string[];
}

interface ParsedBoard {
  title: string;
  victim: string;
  causeOfDeath: string;
  evidence: ParsedEvidence[];
  suspects: ParsedSuspect[];
}

function getEvidenceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("physical")) return <Fingerprint className="h-4 w-4" />;
  if (t.includes("document")) return <FileText className="h-4 w-4" />;
  if (t.includes("digital")) return <Monitor className="h-4 w-4" />;
  if (t.includes("testimony")) return <MessageSquareQuote className="h-4 w-4" />;
  return <HelpCircle className="h-4 w-4" />;
}

function getEvidenceColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("physical")) return "border-amber-500/30 bg-amber-950/20";
  if (t.includes("document")) return "border-blue-500/30 bg-blue-950/20";
  if (t.includes("digital")) return "border-cyan-500/30 bg-cyan-950/20";
  if (t.includes("testimony")) return "border-purple-500/30 bg-purple-950/20";
  return "border-zinc-500/30 bg-zinc-950/20";
}

function getEvidenceIconColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("physical")) return "text-amber-400";
  if (t.includes("document")) return "text-blue-400";
  if (t.includes("digital")) return "text-cyan-400";
  if (t.includes("testimony")) return "text-purple-400";
  return "text-zinc-400";
}

function parseBoard(content: string): ParsedBoard {
  const board: ParsedBoard = {
    title: "",
    victim: "",
    causeOfDeath: "",
    evidence: [],
    suspects: [],
  };

  const lines = content.split("\n");
  let section: "none" | "evidence" | "suspects" = "none";
  let currentEvidence: Partial<ParsedEvidence> | null = null;
  let currentSuspect: Partial<ParsedSuspect> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      board.title = trimmed.replace(/^#\s+/, "");
      continue;
    }

    if (/^\*\*Victim:\*\*/i.test(trimmed)) {
      board.victim = trimmed.replace(/^\*\*Victim:\*\*\s*/i, "");
      continue;
    }
    if (/^\*\*Cause of Death:\*\*/i.test(trimmed)) {
      board.causeOfDeath = trimmed.replace(/^\*\*Cause of Death:\*\*\s*/i, "");
      continue;
    }

    if (/^##\s*Evidence/i.test(trimmed)) {
      section = "evidence";
      if (currentEvidence?.name) board.evidence.push(currentEvidence as ParsedEvidence);
      currentEvidence = null;
      continue;
    }
    if (/^##\s*Suspect/i.test(trimmed)) {
      section = "suspects";
      if (currentEvidence?.name) board.evidence.push(currentEvidence as ParsedEvidence);
      currentEvidence = null;
      if (currentSuspect?.name) board.suspects.push(currentSuspect as ParsedSuspect);
      currentSuspect = null;
      continue;
    }

    if (section === "evidence") {
      const headerMatch = trimmed.match(/^\*\*(.+?)\*\*\s*(?:_\((.+?)\)_)?/);
      if (headerMatch) {
        if (currentEvidence?.name) board.evidence.push(currentEvidence as ParsedEvidence);
        currentEvidence = {
          name: headerMatch[1],
          type: headerMatch[2] || "unknown",
          description: "",
        };
        continue;
      }
      if (currentEvidence && trimmed && !trimmed.startsWith("---")) {
        currentEvidence.description = currentEvidence.description
          ? `${currentEvidence.description} ${trimmed}`
          : trimmed;
      }
    }

    if (section === "suspects") {
      const suspectHeader = trimmed.match(/^\*\*(.+?)\*\*\s*(?:—|--|-)\s*(.+)/);
      if (suspectHeader) {
        if (currentSuspect?.name) board.suspects.push(currentSuspect as ParsedSuspect);
        currentSuspect = {
          name: suspectHeader[1],
          relationship: suspectHeader[2],
          alibi: "",
          notes: [],
        };
        continue;
      }
      if (currentSuspect) {
        const alibiMatch = trimmed.match(/^_Alibi:_\s*(.+)/i);
        if (alibiMatch) {
          currentSuspect.alibi = alibiMatch[1];
          continue;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          if (!currentSuspect.notes) currentSuspect.notes = [];
          currentSuspect.notes.push(trimmed.replace(/^[-*]\s*/, ""));
        }
      }
    }
  }

  if (currentEvidence?.name) board.evidence.push(currentEvidence as ParsedEvidence);
  if (currentSuspect?.name) board.suspects.push(currentSuspect as ParsedSuspect);

  return board;
}

export const EvidenceBoard = React.memo(function EvidenceBoard({
  boardContent,
  caseTitle,
}: EvidenceBoardProps) {
  const board = useMemo(() => parseBoard(boardContent), [boardContent]);
  const lang = getBrowserLanguage();
  const title = caseTitle || board.title || t("board.evidence_board", lang);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
        {board.victim && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500 font-medium">{t("board.victim", lang)}:</span> {board.victim}
            </p>
            {board.causeOfDeath && (
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500 font-medium">{t("board.cause_of_death", lang)}:</span> {board.causeOfDeath}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Evidence Cards */}
      {board.evidence.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            {t("board.evidence_collected", lang)} ({board.evidence.length})
          </h3>
          <div className="grid gap-2">
            {board.evidence.map((e, i) => (
              <div
                key={i}
                className={`rounded-lg border px-4 py-3 ${getEvidenceColor(e.type)}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 ${getEvidenceIconColor(e.type)}`}>
                    {getEvidenceIcon(e.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{e.name}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {e.type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{e.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspect Notes */}
      {board.suspects.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("board.suspect_notes", lang)} ({board.suspects.length})
          </h3>
          <div className="grid gap-2">
            {board.suspects.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-white">{s.name}</span>
                  <span className="text-xs text-zinc-500">— {s.relationship}</span>
                </div>
                {s.alibi && (
                  <p className="text-xs text-zinc-400 mb-1">
                    <span className="text-zinc-500 font-medium">{t("board.alibi", lang)}:</span> {s.alibi}
                  </p>
                )}
                {s.notes && s.notes.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {s.notes.map((n, j) => (
                      <li key={j} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {board.evidence.length === 0 && board.suspects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
          <p className="text-sm font-medium">{t("board.no_evidence_yet", lang)}</p>
          <p className="text-xs mt-1">{t("board.no_evidence_hint", lang)}</p>
        </div>
      )}
    </div>
  );
});
