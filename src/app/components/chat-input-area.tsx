"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Send, ChevronDown, ChevronUp, Vote, Zap } from "lucide-react";
import type { ActiveVote } from "@/app/config/game-phase";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import type { Player } from "@/types/player";
import type { GameAction } from "@/hooks/useGameActions";
import { InterrogationBudget } from "@/app/components/interrogation-budget";

export interface ChatInputAreaProps {
  channelName: string;
  onSendMessage: (content: string) => void;
  players: Player[];
  userId: string;
  isGameActive: boolean;
  currentSpeakerId?: string | null;
  isEliminated: boolean;
  /** Whether the eliminated player is viewing the afterlife/ghost chat channel */
  isInAfterlife?: boolean;
  isRoundInProgress: boolean;
  introYourTurnHint?: string;
  introYourTurnReply?: string;
  introEveryoneSpokenHint?: string;
  aiSuggestedPrompts: string[];
  aiSuggestionsLabel: string;
  lastFailedSendContent?: string | null;
  onRetryLastMessage?: () => void;
  activeVote?: ActiveVote | null;
  onVote?: (choice: string) => void | Promise<void>;
  alivePlayers: Player[];
  gameActions?: GameAction[];
  /** Game template ID — used to show script-kill specific UI */
  gameTemplate?: string;
  /** Current phase label from game state */
  phaseLabel?: string;
  /** Content from [SECTION:Investigation Status] for budget tracking */
  investigationSectionContent?: string;
}

const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 120;

export const ChatInputArea = React.memo(function ChatInputArea({
  channelName,
  onSendMessage,
  players,
  userId,
  isGameActive,
  currentSpeakerId,
  isEliminated,
  isInAfterlife = false,
  isRoundInProgress,
  introYourTurnHint,
  introYourTurnReply,
  introEveryoneSpokenHint,
  aiSuggestedPrompts,
  aiSuggestionsLabel,
  lastFailedSendContent,
  onRetryLastMessage,
  activeVote,
  onVote,
  alivePlayers,
  gameActions = [],
  gameTemplate,
  phaseLabel = "",
  investigationSectionContent,
}: ChatInputAreaProps) {
  const [input, setInput] = useState("");
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [pendingAction, setPendingAction] = useState<GameAction | null>(null);
  const [myVoteChoice, setMyVoteChoice] = useState<string | null>(null);

  useEffect(() => { if (!activeVote) setMyVoteChoice(null); }, [activeVote]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const sendingLockRef = useRef(false);
  const composingRef = useRef(false);

  useEffect(() => {
    if (!popupRef.current) return;
    const active = popupRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [popupIndex]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return players.filter(
      (p) =>
        !p.isGameMaster &&
        p.id !== userId &&
        p.name.toLowerCase().includes(mentionQuery.toLowerCase()),
    );
  }, [mentionQuery, players, userId]);

  const showPopup = mentionQuery !== null && mentionMatches.length > 0;

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    el.style.overflow = "hidden";
    el.style.height = "auto";
    const scrollH = el.scrollHeight;
    const newH = Math.min(Math.max(scrollH, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT);
    el.style.height = `${newH}px`;
    el.style.overflow = scrollH > MAX_INPUT_HEIGHT ? "auto" : "hidden";
    if (scrollTop > 0) el.scrollTop = scrollTop;
  }, []);

  const applyMention = useCallback(
    (player: Player) => {
      const cursorPos = inputRef.current?.selectionStart ?? input.length;
      const before = input.slice(0, mentionAnchor);
      const after = input.slice(cursorPos);
      const newText = `${before}@${player.name} ${after}`;
      setInput(newText);
      setMentionQuery(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const pos = before.length + player.name.length + 2;
        inputRef.current?.setSelectionRange(pos, pos);
        resizeInput();
      });
    },
    [input, mentionAnchor, resizeInput],
  );

  useEffect(() => {
    if (inputRef.current) resizeInput();
  }, [resizeInput]);

  useEffect(() => {
    const handleFocusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.classList.add("outline", "outline-2", "outline-amber-500", "outline-offset-2");
        setTimeout(() => {
          inputRef.current?.classList.remove("outline", "outline-2", "outline-amber-500", "outline-offset-2");
        }, 2000);
      }
    };
    window.addEventListener("focusGameInput", handleFocusInput);
    return () => window.removeEventListener("focusGameInput", handleFocusInput);
  }, []);

  const handleSendRef = useRef<(override?: string) => void>(undefined);
  handleSendRef.current = (override?: string) => {
    if (sendingLockRef.current) return;
    const text = (override ?? input.trim()).trim();
    if (text) {
      sendingLockRef.current = true;
      setIsSending(true);
      flushSync(() => setInput(""));
      onSendMessage(text);
      requestAnimationFrame(() => resizeInput());
      setTimeout(() => {
        sendingLockRef.current = false;
        setIsSending(false);
      }, 500);
    }
  };

  const handleSend = useCallback(
    (override?: string) => {
      handleSendRef.current?.(override);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSendMessage],
  );

  const canSend = isGameActive && (!currentSpeakerId || currentSpeakerId === userId || isRoundInProgress);
  const effectivelyEliminated = isEliminated && !isInAfterlife;
  const inputDisabled = !isGameActive || effectivelyEliminated || isSending;
  const sendDisabled = !isGameActive || effectivelyEliminated || isSending;

  return (
    <div className="p-5 border-t border-violet-900/20 bg-zinc-900">
      {isEliminated && !isInAfterlife && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800/80 border border-zinc-600/40 text-zinc-400">
          <span className="text-lg">👁️</span>
          <span className="text-sm font-medium">You&apos;ve been eliminated — watching as spectator. Switch to Afterlife to chat with other ghosts.</span>
        </div>
      )}
      {isEliminated && isInAfterlife && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-violet-900/30 border border-violet-500/30 text-violet-300">
          <span className="text-lg">👻</span>
          <span className="text-sm font-medium">Ghost chat — only eliminated players can see this</span>
        </div>
      )}
      {gameTemplate === "script-kill" && phaseLabel && isGameActive && !isEliminated && (
        <InterrogationBudget phaseLabel={phaseLabel} sectionContent={investigationSectionContent} />
      )}
      {activeVote && onVote && !isEliminated && (
        <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-950/30 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <Vote className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-200">{activeVote.question}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(activeVote.options === "players"
              ? alivePlayers.filter((p) => !p.isGameMaster).map((p) => p.name)
              : activeVote.options
            ).map((option) => {
              const isMyChoice = myVoteChoice === option;
              return (
              <Button
                key={option}
                size="sm"
                variant="outline"
                className={isMyChoice
                  ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/40"
                  : "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/25 text-violet-300 hover:text-white"}
                disabled={!!myVoteChoice}
                onClick={() => {
                  setMyVoteChoice(option);
                  Promise.resolve(onVote(option)).catch(() => setMyVoteChoice(null));
                }}
              >
                {isMyChoice ? `${option} ✓` : option}
              </Button>
              );
            })}
          </div>
        </div>
      )}
      {canSend && !isEliminated && isGameActive && currentSpeakerId === userId && (
        <div className="mb-3 text-sm font-medium text-emerald-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          It&apos;s your turn to speak
        </div>
      )}
      {isRoundInProgress && !isEliminated && isGameActive && (
        <div className="mb-3 text-xs text-violet-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          AI players are responding — you can type ahead
        </div>
      )}
      {lastFailedSendContent && onRetryLastMessage && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
          <span className="text-xs text-red-300">Send failed. Try again?</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 border-red-500/50 text-red-300 hover:bg-red-500/20"
            onClick={onRetryLastMessage}
          >
            Retry
          </Button>
        </div>
      )}
      {introYourTurnHint && canSend && (
        <div className="mb-2 flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-sm">
          <span className="text-sm text-amber-200">{introYourTurnHint}</span>
          {introYourTurnReply && (
            <Button
              size="sm"
              className="h-8 px-4 text-sm bg-amber-500 hover:bg-amber-500/90 text-zinc-900 font-medium shrink-0"
              disabled={sendDisabled}
              onClick={() => handleSend(introYourTurnReply)}
            >
              {introYourTurnReply}
            </Button>
          )}
        </div>
      )}
      {introEveryoneSpokenHint && canSend && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-sm text-emerald-200 backdrop-blur-sm">
          {introEveryoneSpokenHint}
        </div>
      )}
      {aiSuggestedPrompts.length > 0 && canSend && (
        <div className="mb-2 rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-zinc-500">✨</span>
              {aiSuggestionsLabel} ({aiSuggestedPrompts.length})
            </span>
            {aiSuggestionsOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          {aiSuggestionsOpen && (
            <div className="px-3 pb-3">
              <div className="flex flex-wrap gap-2">
                {aiSuggestedPrompts.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm border-zinc-600/80 bg-zinc-700/40 hover:bg-zinc-600/50 text-zinc-300 hover:text-zinc-200"
                    disabled={sendDisabled}
                    onClick={() => handleSend(text)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {gameActions.length > 0 && !isEliminated && isGameActive && !isRoundInProgress && (
        pendingAction?.needsTarget ? (
          <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">{pendingAction.label} — pick a target:</span>
              <button type="button" className="ml-auto text-xs text-zinc-500 hover:text-zinc-300" onClick={() => setPendingAction(null)}>Cancel</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {alivePlayers.filter(p => !p.isGameMaster && p.id !== userId).map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/25 text-amber-200 hover:text-white"
                  onClick={() => {
                    const msg = pendingAction.template.replace(/\{player\}/g, p.name);
                    setInput(msg);
                    setPendingAction(null);
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                      inputRef.current?.setSelectionRange(msg.length, msg.length);
                    });
                  }}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {gameActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-zinc-600/60 bg-zinc-800/40 hover:bg-zinc-700/50 text-zinc-300 hover:text-white gap-1"
                disabled={sendDisabled}
                onClick={() => {
                  if (action.needsTarget) {
                    setPendingAction(action);
                  } else {
                    setInput(action.template);
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                      const len = action.template.length;
                      inputRef.current?.setSelectionRange(len, len);
                    });
                  }
                }}
              >
                {action.icon && <span className="text-xs">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )
      )}
      <div className="flex gap-2 items-end">
        <div className="relative flex-1 min-w-0">
          {showPopup && (
            <div
              ref={popupRef}
              className="absolute bottom-full mb-1.5 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-y-auto shadow-2xl z-50 max-h-52"
            >
              {mentionMatches.map((player, i) => (
                <button
                  key={player.id}
                  type="button"
                  data-selected={i === popupIndex ? "true" : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyMention(player);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${i === popupIndex ? "bg-violet-600 text-white" : "text-zinc-200 hover:bg-zinc-800"}`}
                >
                  <span className="text-violet-300 font-bold text-xs w-4 shrink-0">@</span>
                  <span className="font-medium truncate">{player.name}</span>
                  {player.role && (
                    <span className={`ml-auto text-xs shrink-0 ${i === popupIndex ? "text-violet-200" : "text-zinc-500"}`}>
                      {player.role}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              const cursor = e.target.selectionStart ?? val.length;
              setInput(val);
              requestAnimationFrame(() => resizeInput());
              const beforeCursor = val.slice(0, cursor);
              const mentionMatch = beforeCursor.match(/@([^@\s]*)$/);
              if (mentionMatch) {
                setMentionQuery(mentionMatch[1]);
                setMentionAnchor(mentionMatch.index!);
                setPopupIndex(0);
              } else {
                setMentionQuery(null);
              }
            }}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => { composingRef.current = false; }}
            onKeyDown={(e) => {
              if (composingRef.current) return;
              if (showPopup) {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setPopupIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setPopupIndex((i) => (i + 1) % mentionMatches.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  if (mentionMatches[popupIndex]) applyMention(mentionMatches[popupIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  setMentionQuery(null);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!sendDisabled) handleSend();
              }
            }}
            placeholder={isRoundInProgress ? "Host & AI replying…" : `Message #${channelName}`}
            className="min-h-0 bg-zinc-800/80 backdrop-blur-sm border border-violet-900/30 focus:border-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 text-white placeholder:text-zinc-500 py-2 px-3 text-base sm:text-sm w-full resize-none leading-relaxed scrollbar-hide rounded-lg transition-colors"
            style={{ minHeight: `${MIN_INPUT_HEIGHT}px`, maxHeight: `${MAX_INPUT_HEIGHT}px` }}
            disabled={sendDisabled}
            rows={1}
          />
        </div>
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || sendDisabled}
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-500 h-10 w-10 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          title={isRoundInProgress ? "Host & AI replying…" : isSending ? "Sending…" : "Send"}
          aria-label={isRoundInProgress ? "Host and AI replying" : isSending ? "Sending" : "Send message"}
        >
          {isSending || isRoundInProgress ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
});
