"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Scroll, CheckCircle2, XCircle, Circle } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import type { QuestState } from "@/app/config/game-phase";

interface QuestLogProps {
  quests: QuestState[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuestLog({ quests, isOpen, onClose }: QuestLogProps) {
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeQuests = quests.filter((q) => q.status === "active");
  const completedQuests = quests.filter((q) => q.status === "completed");
  const failedQuests = quests.filter((q) => q.status === "failed");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 border-l border-zinc-800">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Scroll className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Quest Log</span>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 h-4">
            {activeQuests.length} active
          </Badge>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs p-1">✕</button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {activeQuests.length === 0 && completedQuests.length === 0 && failedQuests.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-6">
              No quests yet. Explore the world to find quests!
            </div>
          )}

          {activeQuests.length > 0 && (
            <QuestSection
              title="Active Quests"
              quests={activeQuests}
              expandedQuest={expandedQuest}
              onToggleQuest={setExpandedQuest}
              defaultExpanded
            />
          )}

          {completedQuests.length > 0 && (
            <CollapsibleSection
              title={`Completed (${completedQuests.length})`}
              isOpen={showCompleted}
              onToggle={() => setShowCompleted(!showCompleted)}
            >
              <QuestSection
                quests={completedQuests}
                expandedQuest={expandedQuest}
                onToggleQuest={setExpandedQuest}
                dimmed
              />
            </CollapsibleSection>
          )}

          {failedQuests.length > 0 && (
            <CollapsibleSection
              title={`Failed (${failedQuests.length})`}
              isOpen={showFailed}
              onToggle={() => setShowFailed(!showFailed)}
            >
              <QuestSection
                quests={failedQuests}
                expandedQuest={expandedQuest}
                onToggleQuest={setExpandedQuest}
                dimmed
              />
            </CollapsibleSection>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function QuestSection({ title, quests, expandedQuest, onToggleQuest, defaultExpanded, dimmed }: {
  title?: string;
  quests: QuestState[];
  expandedQuest: string | null;
  onToggleQuest: (id: string | null) => void;
  defaultExpanded?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className={dimmed ? "opacity-60" : ""}>
      {title && (
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{title}</div>
      )}
      <div className="space-y-1.5">
        {quests.map((quest) => {
          const isExpanded = expandedQuest === quest.id;
          const statusIcon = quest.status === "completed"
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            : quest.status === "failed"
            ? <XCircle className="h-3.5 w-3.5 text-red-400" />
            : <Circle className="h-3.5 w-3.5 text-amber-400" />;

          return (
            <div key={quest.id} className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden">
              <button
                onClick={() => onToggleQuest(isExpanded ? null : quest.id)}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-zinc-700/30 transition-colors"
              >
                {statusIcon}
                <span className="flex-1 text-xs font-medium text-zinc-200 truncate">{quest.name}</span>
                {isExpanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
              </button>
              {isExpanded && quest.description && (
                <div className="px-2.5 pb-2 text-[11px] text-zinc-400 border-t border-zinc-700/30 pt-1.5">
                  {quest.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, isOpen, onToggle, children }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide hover:text-zinc-400 transition-colors mb-1"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {isOpen && children}
    </div>
  );
}
