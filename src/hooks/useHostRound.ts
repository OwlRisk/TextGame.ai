"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { toast } from "sonner";
import { parseHostActions, resolvePlayerRefToId } from "@/lib/host-actions";
import {
  resolveChannelByName as resolveChannelByNameUtil,
  getStreamingDisplay as getStreamingDisplayUtil,
  splitHostOutput as splitHostOutputUtil,
  sectionId as sectionIdUtil,
} from "@/lib/game-host-utils";
import { getHostModel, SCENE_NARRATOR_MODEL } from "@/lib/model-prefs";
import { getGameTemplate } from "@/lib/game-templates";
import {
  MAX_AUTO_ADVANCES,
  HOST_CONTEXT_WINDOW,
  MAX_STREAM_TOKENS,
  BASE_STREAM_TOKENS,
  TOKENS_PER_PLAYER,
} from "@/lib/game-room-constants";
import {
  getConversationMode,
  hostPace,
  dynamicPace,
} from "@/lib/game-pace";
import { buildHostSystemPrompt, buildSceneDirectorPrompt, buildRpgDirectorPrompt } from "@/lib/host-prompt-builder";
import { getWorldById } from "@/lib/rpg/worlds";
import { getRpgAdventureById } from "@/lib/rpg/adventures";
import { isSceneMode, getScene } from "@/lib/scenes";
import { type GmState, type CharacterDirection, type WorldRooms, parseGmState, parseCharacterDirections, parseRoomUpdate, parseEncountersFired, stripGmDirectives, buildStorySummary, reconcileIngredients, reconcileEncounters, reconcileBossPhase, reconcileNpcIntroductions, getOverdueNpcs, reconcileQuests, detectMissingRoomUpdate, EMPTY_GM_STATE } from "@/lib/gm-state";
import {
  type SpeakerQueueItem,
  parseRoleAssignments,
  parseHostResult as parseHostResultUtil,
} from "@/lib/host-output-parser";
import {
  type SpeakerQueueContext,
  runSpeakerQueue as runSpeakerQueueFn,
  runPrivateChannelConversation as runPrivateChannelConversationFn,
  isNightPhase,
} from "@/lib/speaker-queue";
import { trackEvent } from "@/lib/analytics";
import { AFTERLIFE_CHANNEL_ID } from "@/lib/templates/types";
import { applyRpgUpdate } from "@/types/rpg";
import type { PlayerUpdateEntry } from "@/lib/host-output-parser";
import type { OpeningKickoffState } from "@/hooks/useGameInit";
import type { RpgQuest } from "@/lib/rpg/adventures";

/**
 * Build the markdown shown in the "Quests" sidebar section.
 *
 * Visibility rules:
 *   - Main + side quests are always visible.
 *   - Hidden quests are HIDDEN until they auto-complete, at which point
 *     they pop into view as a discovery — that "✨ Hidden quest" reveal
 *     is one of the more satisfying moments in classic RPGs.
 *   - Returns null when there's nothing to show (no visible quests in
 *     either bucket), so the caller can leave the sidebar untouched.
 */
function renderQuestsSidebar(quests: ReadonlyArray<RpgQuest>, completedIds: ReadonlyArray<string>): string | null {
  const completedSet = new Set(completedIds);
  const visible = quests.filter((q) => q.type !== "hidden" || completedSet.has(q.id));
  if (visible.length === 0) return null;

  const formatReward = (r: RpgQuest["reward"]): string => {
    if (!r) return "";
    const parts: string[] = [];
    if (r.exp) parts.push(`+${r.exp} EXP`);
    if (r.currency) parts.push(`+${r.currency} 💰`);
    if (r.item) parts.push(`📦 ${r.item}`);
    if (r.notes) parts.push(r.notes);
    return parts.length ? ` _(${parts.join(", ")})_` : "";
  };

  const active = visible.filter((q) => !completedSet.has(q.id));
  const completed = visible.filter((q) => completedSet.has(q.id));

  const sections: string[] = [];
  if (active.length > 0) {
    sections.push("**Active**");
    for (const q of active) {
      const tag = q.type === "side" ? " _(side)_" : "";
      sections.push(`- ${q.name}${tag}\n  ${q.objective}`);
    }
  }
  if (completed.length > 0) {
    sections.push("\n**Completed**");
    for (const q of completed) {
      const tag = q.type === "hidden" ? " ✨ _(hidden)_" : q.type === "side" ? " _(side)_" : "";
      sections.push(`- ✓ ~~${q.name}~~${tag}${formatReward(q.reward)}`);
    }
  }
  return sections.join("\n");
}

export interface SendMessageOptions {
  skipAddMessage?: boolean;
  channelId?: string;
  senderId?: string;
  senderName?: string;
}

interface UseHostRoundParams {
  gameId: string;
  channelPermissions: Record<string, string[]>;
  setChannelPermissions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  gameRoomEntries: Array<{ id: string; name: string; roomType?: string }>;
  defaultGameChannelId: string;
  readyKickoffRef: React.MutableRefObject<OpeningKickoffState | null>;
  launchOpeningRound: (kickoff: OpeningKickoffState) => Promise<void>;
  contentLanguage?: string;
}

export interface UseHostRoundReturn {
  handleSendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  handleRetryLastMessage: () => void;
  isRoundInProgress: boolean;
  lastFailedSendContent: string | null;
  handleSendMessageRef: React.MutableRefObject<((content: string, options?: SendMessageOptions) => Promise<void>) | null>;
  msgCountRef: React.MutableRefObject<number>;
  /** Latest `CHANNEL_GOAL:` from the host for this channel (shown above the input). */
  channelTaskHint: string | null;
  /** Dynamic quick action buttons from GM's QUICK_ACTIONS directive */
  dynamicQuickActions: string[] | null;
  /** True when a 402 "insufficient tokens" response was received */
  creditsExhausted: boolean;
  /** Dismiss the credits exhausted state (e.g. after modal closes) */
  dismissCreditsExhausted: () => void;
}

export function useHostRound({
  gameId,
  channelPermissions,
  setChannelPermissions,
  gameRoomEntries,
  defaultGameChannelId,
  readyKickoffRef,
  launchOpeningRound,
  contentLanguage,
}: UseHostRoundParams): UseHostRoundReturn {
  const { session } = useAuth();
  const { games, touchGame, updateGame } = useGameContext();
  const {
    messages,
    setMessages,
    players,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    setPlayers,
    gamePhase,
    setGamePhase,
    selectedChannelId,
    setSelectedChannelId,
    userId,
    currentSpeakerId,
    setCurrentSpeakerId,
    setTypingUsers,
    humanGameIdentity,
    myBoardContent,
    setMyBoardContent,
    playerNotes,
    setPlayerNotes,
    setSections,
    gameEvents,
    setGameEvents,
    saveNow,
    phaseLabel,
    setPhaseLabel,
    setMood,
    setActiveVote,
    setTimerEndsAt,
    setGameOverSummary,
    roundNumber,
    setRoundNumber,
    addReaction,
    gmState: persistedGmState,
    setGmState,
    storySummary,
    setStorySummary,
  } = useGameRoomContext();

  const currentGame = games.find((g) => g.id === gameId);

  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const [channelTaskHint, setChannelTaskHint] = useState<string | null>(null);
  const [dynamicQuickActions, setDynamicQuickActions] = useState<string[] | null>(null);
  const msgCountRef = useRef(0);
  const pendingHumanMsgRef = useRef<string | null>(null);
  const interruptRef = useRef(false);
  const gmStateRef = useRef<GmState | null>(persistedGmState);
  const storySummaryRef = useRef(storySummary);
  useEffect(() => { storySummaryRef.current = storySummary; }, [storySummary]);
  // Track resumed session: storySummary is only injected on the first host call after resume
  const resumedSessionRef = useRef(!!persistedGmState);
  useEffect(() => {
    if (persistedGmState && !gmStateRef.current) gmStateRef.current = persistedGmState;
  }, [persistedGmState]);
  const characterDirectionsRef = useRef<CharacterDirection[]>([]);
  /** Ingredients the GM tried to re-introduce despite already being in
   *  `ingredientsUsed`. Surfaced into the NEXT prompt as a "Already used"
   *  warning so the GM stops re-using consumed plot elements. */
  const repeatedIngredientsRef = useRef<string[]>([]);
  /** Encounter ids the GM tried to re-fire despite already being in the
   *  ledger. Surfaced into the next prompt as a "DO NOT re-fire" warning. */
  const repeatedEncountersRef = useRef<string[]>([]);
  /** When the boss just crossed an HP threshold, the next prompt gets a
   *  "BOSS PHASE TRANSITION: enter Phase N" reminder so the GM actually
   *  narrates the transition the adventure brief promised. */
  const pendingBossPhaseRef = useRef<number | null>(null);
  /** When the GM's last narration described a movement (entering a new
   *  room) without emitting ROOM_UPDATE, the next prompt reminds them.
   *  Without this the room panel goes stale and QUICK_ACTIONS reference
   *  exits to rooms that don't exist. */
  const missingRoomUpdateRef = useRef<boolean>(false);
  /** Adventure NPCs whose `appearsInAct` has been reached but who haven't
   *  been introduced in narration yet. Surfaced into the next prompt as
   *  "should have appeared by now" so the GM stops forgetting plotted
   *  characters that are gating story progress. */
  const overdueNpcsRef = useRef<Array<{ id: string; name: string }>>([]);
  /** Quests that became complete THIS turn — held for the NEXT prompt as
   *  a "🎯 QUEST COMPLETE — narrate resolution + grant reward" reminder
   *  so the GM actually awards what the adventure promised. */
  const newlyCompletedQuestsRef = useRef<Array<{ id: string; name: string; reward?: unknown }>>([]);
  const roundAbortRef = useRef<AbortController | null>(null);
  const roundWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ROUND_TIMEOUT_MS = 120_000;
  const FETCH_TIMEOUT_MS = 45_000;
  const STREAM_STALL_MS = 30_000;

  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);

  const phaseLabelRef = useRef(phaseLabel);
  useEffect(() => { phaseLabelRef.current = phaseLabel; }, [phaseLabel]);

  const pendingDecisionSummariesRef = useRef<string[]>([]);

  const handleSendMessageRef = useRef<((content: string, options?: SendMessageOptions) => Promise<void>) | null>(null);

  const handleSendMessage = async (content: string, options?: SendMessageOptions) => {
    if (!content.trim()) return;
    if (gamePhase === "ended") return;

    if (isRoundInProgress) {
      // Queue the new message and signal interrupt to all in-flight loops.
      pendingHumanMsgRef.current = content;
      interruptRef.current = true;
      // Abort the in-flight Host stream + speaker queue so we don't keep burning
      // tokens on a turn the user has already moved past. The `finally` block
      // of the active round will pick up `pendingHumanMsgRef` and re-trigger.
      try { roundAbortRef.current?.abort(); } catch { /* noop */ }
      if (!options?.skipAddMessage) {
        addMessage(
          { senderId: userId, senderName: humanGameIdentity?.name || "You", senderAvatar: "#6366f1", content, isAI: false },
          options?.channelId ?? selectedChannelId ?? "game-room"
        );
      }
      return;
    }

    msgCountRef.current += 1;
    if (msgCountRef.current === 1) {
      trackEvent("first_message_sent", { template: currentGame?.config?.template || "custom" });
    }
    trackEvent("message_sent", { message_number: msgCountRef.current });

    if (gameId) touchGame(gameId);

    const cfgChannels = currentGame?.config?.channels;
    const roomIds = cfgChannels?.length ? new Set(cfgChannels.map((c: { id: string }) => c.id)) : new Set(["game-room"]);
    const channelId = options?.channelId
      ?? (selectedChannelId && roomIds.has(selectedChannelId) ? selectedChannelId : (cfgChannels?.[0]?.id ?? "game-room"));

    if (!options?.skipAddMessage) {
      addMessage(
        {
          senderId: userId,
          senderName: humanGameIdentity?.name || "You",
          senderAvatar: "#6366f1",
          content,
          isAI: false,
        },
        channelId
      );
    }

    if (gamePhase === "lobby") return;

    setLastFailedSendContent(null);
    roundAbortRef.current?.abort();
    const ac = new AbortController();
    roundAbortRef.current = ac;
    if (roundWatchdogRef.current) clearTimeout(roundWatchdogRef.current);
    roundWatchdogRef.current = setTimeout(() => {
      console.warn("Round watchdog: force-aborting stuck round after", ROUND_TIMEOUT_MS, "ms");
      ac.abort();
    }, ROUND_TIMEOUT_MS);
    setIsRoundInProgress(true);
    try {
      const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentSlice = channelMessages.slice(-HOST_CONTEXT_WINDOW);
      const recentContext =
        recentSlice.length === 0
          ? "(No prior messages in this channel.)"
          : recentSlice
              .map((m) => {
                let line = `- ${m.senderName}: ${m.content}`;
                if (m.reactions?.length) {
                  line += ` [reactions: ${m.reactions.map((r: { emoji: string; from: string }) => `${r.emoji} ${r.from}`).join(", ")}]`;
                }
                return line;
              })
              .join("\n");

      const isRpgMode = !!currentGame?.config?.rpgWorldId;
      const gmName = isRpgMode ? "Chronicle" : "Narrator";
      const gmColor = isRpgMode ? "#7c3aed" : "#52525b";

      const channelPermsForAiOnly = channelPermissions[channelId];
      const freshPlayers = playersRef.current;
      const aiOnly = freshPlayers.filter(
        (p) =>
          p.isAI &&
          !p.isGameMaster &&
          (!channelPermsForAiOnly ||
            channelPermsForAiOnly.includes("*") ||
            channelPermsForAiOnly.includes(p.id))
      );

      const humanPlayer = freshPlayers.find((p) => p.id === userId);
      const humanName = humanGameIdentity?.name || humanPlayer?.name || "You";

      const rulesText = currentGame?.config?.rules ?? "";
      const tmplId = currentGame?.config?.template ?? "";
      const tmplDef = getGameTemplate(tmplId);
      const hasVotingPhase = tmplDef?.hasVotingPhase ??
        /\bvot(e|ing)\b.*\b(eliminat|kill|remove|kick|expel)\b/i.test(rulesText);
      const hasNightPhase = tmplDef?.hasNightPhase ??
        /\bnight\s*(phase|action|round)\b/i.test(rulesText);
      const hasMultipleRooms = gameRoomEntries.length > 1;

      const recentNonHostTurns = channelMessages
        .slice(-12)
        .filter((m) => !m.isSystemMessage && m.senderName !== gmName).length;

      const sceneId = (currentGame?.config as unknown as Record<string, unknown> | undefined)?.sceneId as string | undefined;

      // Initialize GM state from scene data on first round.
      if (isSceneMode(tmplId) && sceneId && !gmStateRef.current) {
        const sceneData = getScene(sceneId);
        if (sceneData?.initialGmState) {
          gmStateRef.current = { ...sceneData.initialGmState };
        }
      }

      // Initialize GM state from RPG adventure on first round. Mirrors the
      // scene-mode init above. Without this, RPG mode starts with no
      // ingredients / encounters tracked, and `reconcileIngredients` (the
      // GM auto-validator) has nothing to validate against — the GM ends up
      // re-introducing key plot beats and re-firing the same encounters.
      const rpgAdventureId = currentGame?.config?.rpgAdventureId;
      if (rpgAdventureId && !gmStateRef.current) {
        const adventure = getRpgAdventureById(rpgAdventureId);
        if (adventure?.initialGmState) {
          gmStateRef.current = { ...adventure.initialGmState };
          // Seed the Quests sidebar so the player sees objectives from
          // turn 1, not only after the first quest completes.
          const initialQuestContent = renderQuestsSidebar(adventure.quests, []);
          if (initialQuestContent !== null) {
            const initialQuestSectionId = sectionIdUtil("Quests");
            setSections((prev) => {
              if (prev.some((s) => s.id === initialQuestSectionId)) return prev;
              return [...prev, { id: initialQuestSectionId, name: "Quests", content: initialQuestContent }];
            });
          }
        }
      }

      const buildFreshHostPrompt = () => {
        const freshP = playersRef.current;
        const freshNonHost = freshP.filter((p) => !p.isGameMaster);
        const freshRoster = freshNonHost.map((p) => {
          const isH = p.id === userId;
          const n = isH ? humanName : p.name;
          const r = p.role ? `Role: ${p.role}` : "Role: not assigned";
          const s = (p.stats?.Status as string | undefined) ?? "alive";
          if (isH) return `  • ${n} [YOU/HUMAN] | ${r} | Status: ${s}`;
          const pers = p.personality ? `Personality: ${p.personality}` : "";
          const back = p.background ? `Background: ${p.background}` : "";
          const ex = [pers, back].filter(Boolean).join(" | ");
          return `  • ${n} [AI] | ${r} | Status: ${s}${ex ? ` | ${ex}` : ""}`;
        }).join("\n");

        const freshEvents = gameEvents.length > 0
          ? gameEvents.map((e, i) => `  ${i + 1}. ${e}`).join("\n")
          : "(No events recorded yet)";

        const rpgWorldId = currentGame?.config?.rpgWorldId;
        if (rpgWorldId) {
          const world = getWorldById(rpgWorldId);
          const rpgRoster = freshNonHost.map((p) => {
            const isH = p.id === userId;
            const n = isH ? humanName : p.name;
            const rpg = p.rpg;
            if (!rpg) return `  • ${n} [${isH ? "HUMAN" : "AI"}]`;
            return `  • ${n} [${isH ? "HUMAN" : "AI"}] | Lv.${rpg.level} ${rpg.class} | HP: ${rpg.hp}/${rpg.maxHp} | MP: ${rpg.mp}/${rpg.maxMp} | ATK: ${rpg.attack} DEF: ${rpg.defense} SPD: ${rpg.speed}${rpg.faction ? ` | ${rpg.faction}` : ""}`;
          }).join("\n");
          // Inject the running story summary on every Host turn (not just on
          // resume). As the recent-message window slides forward, the summary
          // is the GM's only stable handle on what happened earlier in the
          // session — withholding it after the first turn caused continuity
          // drift in long sessions.
          const resumeSummary = storySummaryRef.current;
          if (resumedSessionRef.current) resumedSessionRef.current = false;
          return buildRpgDirectorPrompt({
            worldId: rpgWorldId,
            worldName: world?.name ?? rpgWorldId,
            humanName,
            nonHostPlayerNames: freshNonHost.filter(p => p.id !== userId).map((p) => p.name),
            playerRoster: rpgRoster,
            eventLogSummary: freshEvents,
            contentLanguage,
            previousGmState: gmStateRef.current,
            adventureNotes: currentGame?.config?.rpgAdventureNotes,
            world,
            storySummary: resumeSummary || undefined,
            recentlyRepeatedIngredients: repeatedIngredientsRef.current,
            recentlyRepeatedEncounters: repeatedEncountersRef.current,
            pendingBossPhaseTransition: pendingBossPhaseRef.current,
            roomUpdateMissingLastTurn: missingRoomUpdateRef.current,
            overdueNpcs: overdueNpcsRef.current,
            newlyCompletedQuests: newlyCompletedQuestsRef.current as Array<{
              id: string; name: string;
              reward?: { exp?: number; currency?: number; item?: string; notes?: string };
            }>,
          });
        }

        if (isSceneMode(tmplId) && sceneId) {
          return buildSceneDirectorPrompt({
            sceneId,
            humanName,
            nonHostPlayerNames: freshNonHost.map((p) => (p.id === userId ? humanName : p.name)),
            playerRoster: freshRoster,
            eventLogSummary: freshEvents,
            recentNonHostTurns,
            contentLanguage,
            previousGmState: gmStateRef.current,
            recentlyRepeatedIngredients: repeatedIngredientsRef.current,
          });
        }

        const freshBoard = Object.entries(myBoardContent)
          .map(([pid, bc]) => {
            if (!bc?.trim()) return null;
            if (pid === "_host_") return `  [_Host_ (your private notes)]\n${bc.trim()}`;
            const pl = freshP.find((pp) => pp.id === pid);
            const nm = pl ? (pl.id === userId ? humanName : pl.name) : pid;
            return `  [${nm}]\n${bc.trim()}`;
          }).filter(Boolean);

        return buildHostSystemPrompt({
          gameName: currentGame?.name ?? "",
          gameTemplate: tmplId,
          humanName,
          nonHostPlayerNames: freshNonHost.map((p) => (p.id === userId ? humanName : p.name)),
          hasVotingPhase,
          hasNightPhase,
          hasMultipleRooms,
          channels: (currentGame?.config?.channels ?? gameRoomEntries).map((c: { name: string; roomType?: string }) => ({
            name: c.name,
            roomType: c.roomType,
          })),
          gamePhase: gamePhaseRef.current || "waiting",
          phaseLabel: phaseLabel ?? "",
          playerRoster: freshRoster,
          eventLogSummary: freshEvents,
          boardSummary: freshBoard.length > 0 ? freshBoard.join("\n\n") : "(No private board content yet)",
          rulesText,
          hostName: currentGame?.config?.generatedHost?.name || undefined,
          hostPersonality: currentGame?.config?.generatedHost?.personality || undefined,
          hostCustomSystemPrompt: currentGame?.config?.generatedHost?.systemPrompt || undefined,
          recentNonHostTurns,
          quickGame: (() => { try { return !localStorage.getItem("tg_game_completed"); } catch { return false; } })(),
          roundNumber,
          configQuickActions: currentGame?.config?.quickActions ?? undefined,
          contentLanguage,
          previousGmState: gmStateRef.current,
        });
      };

      let hostSystemPrompt = buildFreshHostPrompt();

      const applyHostRoleAssignments = (roleContent: string): string => {
        const result = parseRoleAssignments(roleContent, playersRef.current, userId, humanName, humanGameIdentity?.name ?? null);
        if (result.isGameOver && !isRpgMode) {
          updateGame(gameId, { isActive: false });
          setGamePhase("ended");
          setGameOverSummary(result.gameOverSummary || "Game over!");
          try { localStorage.setItem("tg_game_completed", "1"); } catch {}
          trackEvent("game_completed", {
            template: currentGame?.config?.template || "custom",
            messages_sent: msgCountRef.current,
          });
        }
        if (result.roleUpdates.length > 0 || result.revealIds.length > 0 || result.eliminateIds.length > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              const roleUp = result.roleUpdates.find((r) => r.playerId === p.id);
              const reveal = result.revealIds.includes(p.id);
              const eliminate = result.eliminateIds.includes(p.id);
              const updates: Partial<typeof p> = {};
              if (roleUp) updates.role = roleUp.role;
              if (reveal) updates.roleRevealed = true;
              if (eliminate) updates.stats = { ...(p.stats ?? {}), Status: "eliminated" };
              return Object.keys(updates).length ? { ...p, ...updates } : p;
            })
          );
        }
        if (result.eliminateIds.length > 0) {
          const tmplDef = getGameTemplate(currentGame?.config?.template || "");
          const hasAfterlife = tmplDef?.channels?.some(c => c.id === AFTERLIFE_CHANNEL_ID);
          if (hasAfterlife) {
            setChannelPermissions((prev) => {
              const next = { ...prev };
              const afterlifeList = new Set(prev[AFTERLIFE_CHANNEL_ID] ?? []);
              for (const eid of result.eliminateIds) {
                afterlifeList.add(eid);
                for (const [chId, members] of Object.entries(next)) {
                  if (chId === AFTERLIFE_CHANNEL_ID) continue;
                  next[chId] = members.filter(id => id !== eid);
                }
              }
              next[AFTERLIFE_CHANNEL_ID] = [...afterlifeList];
              return next;
            });
          }
        }
        if (result.newEvents.length > 0) {
          setGameEvents((prev) => [...prev, ...result.newEvents]);
        }
        return result.cleanedContent;
      };

      const resolveChannelByName = (name: string): string | null =>
        resolveChannelByNameUtil(name, gameRoomEntries);

      const parseHostResult = (raw: string) =>
        parseHostResultUtil(raw, playersRef.current, humanName, gameRoomEntries);

      let latestEngagementScore = 3;
      const seenAnnouncements = new Set<string>();

      const applyHostActionsAndClean = (actionContent: string): string => {
        const { cleanContent, actions } = parseHostActions(actionContent);
        const currentPlayers = playersRef.current;
        for (const a of actions) {
          if (a.type === "my_board") {
            const playerId = resolvePlayerRefToId(a.playerRef, currentPlayers, userId, humanGameIdentity?.name);
            if (playerId) setMyBoardContent((prev) => ({ ...prev, [playerId]: a.content }));
          } else if (a.type === "access") {
            const chId = resolveChannelByName(a.channelRef);
            if (!chId) continue;

            if (a.playerRefs.includes("*")) {
              setChannelPermissions((prev) => {
                const next = { ...prev };
                delete next[chId];
                return next;
              });
            } else {
              const resolvedIds = a.playerRefs
                .map((ref) => resolvePlayerRefToId(ref, currentPlayers, userId, humanGameIdentity?.name))
                .filter((id): id is string => id !== null);
              setChannelPermissions((prev) => ({ ...prev, [chId]: resolvedIds }));

              if (!resolvedIds.includes(userId)) {
                setSelectedChannelId((cur) => (cur === chId ? defaultGameChannelId : cur));
              }
            }
          } else if (a.type === "section") {
            const id = sectionIdUtil(a.title);
            setSections((prev) => {
              const idx = prev.findIndex((s) => s.id === id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], content: a.content };
                return next;
              }
              return [...prev, { id, name: a.title, content: a.content }];
            });
          } else if (a.type === "game_over") {
            // For RPG worlds, GAME_OVER means "this adventure has reached a
            // narrative conclusion" — we still want the room to render the
            // game-over banner and stop accepting new turns. The original
            // gating skipped this branch for RPG, leaving the room alive while
            // the GM had already announced the end of the story.
            updateGame(gameId, { isActive: false });
            setGameOverSummary(a.summary || (isRpgMode ? "Adventure complete." : "Game over!"));
            setGamePhase("ended");
            try { localStorage.setItem("tg_game_completed", "1"); } catch {}
            trackEvent("game_completed", {
              template: currentGame?.config?.template || "custom",
              is_rpg: isRpgMode,
              messages_sent: msgCountRef.current,
            });
          } else if (a.type === "phase") {
            const prevLabel = phaseLabelRef.current;
            const nextIsNight = isNightPhase(a.label);
            if (prevLabel && !isNightPhase(prevLabel) && nextIsNight) {
              setRoundNumber(n => n + 1);
            }
            phaseLabelRef.current = a.label;
            setPhaseLabel(a.label);
          } else if (a.type === "announce") {
            const key = a.text.trim().toLowerCase();
            if (!seenAnnouncements.has(key)) {
              seenAnnouncements.add(key);
              addMessage({
                senderId: "system",
                senderName: "Announcement",
                senderAvatar: "#8b5cf6",
                content: a.text,
                isAI: false,
                isAnnouncement: true,
              });
            }
          } else if (a.type === "mood") {
            setMood(a.value);
          } else if (a.type === "start_vote") {
            setActiveVote({ question: a.question, options: a.options });
          } else if (a.type === "end_vote") {
            setActiveVote(null);
          } else if (a.type === "timer") {
            if (a.seconds === "stop") {
              setTimerEndsAt(null);
            } else {
              setTimerEndsAt(Date.now() + a.seconds * 1000);
            }
          } else if (a.type === "react") {
            const currentMessages = messagesRef.current;
            const targetMsg = a.targetSender
              ? [...currentMessages].reverse().find(
                  (m) => !m.isSystemMessage && !m.isAnnouncement && !m.isStreaming &&
                    m.senderName.toLowerCase() === a.targetSender!.toLowerCase()
                )
              : [...currentMessages].reverse().find(
                  (m) => !m.isSystemMessage && !m.isAnnouncement && !m.isStreaming
                );
            if (targetMsg) addReaction(targetMsg.id, a.emoji, gmName);
          } else if (a.type === "engagement") {
            latestEngagementScore = a.score;
          } else if (a.type === "begin_game") {
            const kickoff = readyKickoffRef.current;
            if (kickoff) {
              launchOpeningRound(kickoff);
            }
          }
        }
        return cleanContent;
      };

      const getStreamingDisplay = getStreamingDisplayUtil;
      const splitHostOutput = splitHostOutputUtil;

      const applyPlayerUpdates = (entries: PlayerUpdateEntry[]) => {
        if (entries.length === 0) return;
        setPlayers((prev) =>
          prev.map((p) => {
            const entry = entries.find((e) => e.playerName === p.name || (p.id === userId && e.playerName === humanName));
            if (!entry || !p.rpg) return p;
            return { ...p, rpg: applyRpgUpdate(p.rpg, entry.update) };
          })
        );
      };

      const callHostStream = async (userContent: string, chId: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: null | string; autoChannelGoal: string | null; channelGoal: string | null; quickActions: string[] | null; playerUpdates: PlayerUpdateEntry[]; imageUrl?: string }> => {
        const isScene = isSceneMode(tmplId);
        const streamTokenBudget = isScene
          ? 2048
          : Math.min(MAX_STREAM_TOKENS, BASE_STREAM_TOKENS + players.length * TOKENS_PER_PLAYER);
        let messageId: string | null = null;
        setTypingUsers([{ name: gmName, avatar: gmColor }]);
        const emptyResult = { hostContent: "", who: null, speakerQueue: [] as SpeakerQueueItem[], autoChannelId: null, autoChannelGoal: null, channelGoal: null, quickActions: null as string[] | null, playerUpdates: [] as PlayerUpdateEntry[] };
        try {
          const ac = roundAbortRef.current;
          const fetchTimer = setTimeout(() => ac?.abort(), FETCH_TIMEOUT_MS);
          let res: Response;
          try {
            res = await fetch("/api/chat/stream", {
              method: "POST",
              signal: ac?.signal,
              headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
              body: JSON.stringify({
                systemPrompt: hostSystemPrompt,
                messages: [{ role: "user", content: userContent }],
                maxCompletionTokens: streamTokenBudget,
                preferredModel: isScene ? SCENE_NARRATOR_MODEL : getHostModel(),
                gameId,
              }),
            });
          } finally {
            clearTimeout(fetchTimer);
          }
          if (!res.ok) {
            setTypingUsers([]);
            if (res.status === 402) {
              setCreditsExhausted(true);
            } else {
              console.error(`Host stream error: ${res.status}`);
              toast.error("Failed to reach Game Master — please try again.", { duration: 5000 });
            }
            return emptyResult;
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body");
          const decoder = new TextDecoder();
          let sseBuffer = '';
          let acc = '';

          while (true) {
            if (ac?.signal.aborted) throw new DOMException("Stream aborted", "AbortError");
            const stallTimer = setTimeout(() => ac?.abort(), STREAM_STALL_MS);
            let chunk: ReadableStreamReadResult<Uint8Array>;
            try {
              chunk = await reader.read();
            } finally {
              clearTimeout(stallTimer);
            }
            if (chunk.done) break;
            sseBuffer += decoder.decode(chunk.value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const payload = trimmed.slice(6);
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.content) {
                  acc += parsed.content;
                  const preview = getStreamingDisplay(acc);
                  if (preview && messageId) {
                    updateStreamingMessage(messageId, preview, false);
                  } else if (preview && !messageId) {
                    setTypingUsers([]);
                    messageId = addStreamingMessage(
                      { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
                      chId,
                      preview,
                    );
                  }
                }
              } catch (parseErr) {
                if (parseErr instanceof Error && parseErr.message !== payload) throw parseErr;
              }
            }
          }

          // Full directive parsing on the complete response
          const { message: rawSplitMessage, directives } = splitHostOutput(acc);

          const newGmState = parseGmState(directives);
          if (newGmState) {
            // Reconcile against the narration the GM actually produced. This
            // catches three common GM mistakes that would otherwise corrupt
            // the ledgers / boss phase tracking:
            //   1. Introduced an ingredient in narration but forgot to move
            //      it from `ingredientsAvailable` → `ingredientsUsed`.
            //   2. Re-introduced something already in `ingredientsUsed` →
            //      captured into `repeatedIngredientsRef`.
            //   3. Re-fired an authored encounter (ENCOUNTER_FIRED) →
            //      captured into `repeatedEncountersRef`.
            //   4. Boss crossed an HP threshold → pendingBossPhaseRef so the
            //      next prompt nudges the GM to narrate the transition.
            const { state: ingredientReconciled, autoMarked, repeatedIngredients } = reconcileIngredients({
              narration: rawSplitMessage,
              previousState: gmStateRef.current,
              parsedState: newGmState,
            });
            if (autoMarked.length > 0) {
              console.debug(`[gm-state] auto-migrated ingredients to used: ${autoMarked.join(", ")}`);
            }
            if (repeatedIngredients.length > 0) {
              console.debug(`[gm-state] GM re-introduced already-used ingredients: ${repeatedIngredients.join(", ")}`);
            }
            repeatedIngredientsRef.current = repeatedIngredients;

            const firedThisTurn = parseEncountersFired(directives);
            const { state: encounterReconciled, newlyFired, repeatedEncounters } = reconcileEncounters({
              firedThisTurn,
              parsedState: ingredientReconciled,
            });
            if (newlyFired.length > 0) {
              console.debug(`[gm-state] encounters fired: ${newlyFired.join(", ")}`);
            }
            if (repeatedEncounters.length > 0) {
              console.debug(`[gm-state] GM tried to re-fire encounters: ${repeatedEncounters.join(", ")}`);
            }
            repeatedEncountersRef.current = repeatedEncounters;

            // Boss phase tracking — sync HP from the enemies array (which
            // gets updated by COMBAT_START / PLAYER_UPDATE), then advance
            // currentPhase if HP crossed the next threshold.
            const boss = encounterReconciled.activeBoss;
            const enemies = encounterReconciled.enemies ?? [];
            const bossEnemy = boss
              ? enemies.find((e) => e.name === boss.name)
              : undefined;
            const { state: bossReconciled, transitionedTo } = reconcileBossPhase({
              parsedState: encounterReconciled,
              bossEnemy: bossEnemy
                ? { name: bossEnemy.name, hp: bossEnemy.hp, maxHp: bossEnemy.maxHp }
                : null,
            });
            if (transitionedTo !== null) {
              console.debug(`[gm-state] boss phase transition → Phase ${transitionedTo}`);
            }
            pendingBossPhaseRef.current = transitionedTo;

            // RPG-mode NPC introduction tracker — when the adventure has a
            // structured roster, mark any NPCs whose names showed up in the
            // narration this turn as introduced. Used by the next prompt to
            // (a) tell the GM which NPCs are already on-stage so they stay
            // consistent, and (b) flag NPCs the adventure said should have
            // appeared by now but haven't.
            const rpgAdventureIdForNpc = currentGame?.config?.rpgAdventureId;
            const adventureForNpc = rpgAdventureIdForNpc ? getRpgAdventureById(rpgAdventureIdForNpc) : undefined;
            let stateAfterNpc: GmState = bossReconciled;
            if (adventureForNpc) {
              const { state: npcReconciled, newlyIntroduced } = reconcileNpcIntroductions({
                narration: rawSplitMessage,
                npcRoster: adventureForNpc.keyNpcs,
                parsedState: bossReconciled,
              });
              if (newlyIntroduced.length > 0) {
                console.debug(`[gm-state] NPCs introduced: ${newlyIntroduced.join(", ")}`);
              }
              overdueNpcsRef.current = getOverdueNpcs({
                currentAct: npcReconciled.act,
                npcRoster: adventureForNpc.keyNpcs,
                npcsIntroduced: npcReconciled.npcsIntroduced ?? [],
              });
              stateAfterNpc = npcReconciled;
            } else {
              overdueNpcsRef.current = [];
            }

            // Quest auto-completion — runs after encounter + ingredient
            // reconciliation since quests trigger off those ledgers. The GM
            // never has to mark a quest complete; it falls out of the
            // existing structured state.
            let finalState: GmState = stateAfterNpc;
            if (adventureForNpc) {
              const { state: questReconciled, newlyCompleted } = reconcileQuests({
                quests: adventureForNpc.quests,
                parsedState: stateAfterNpc,
              });
              if (newlyCompleted.length > 0) {
                console.debug(`[gm-state] quests completed: ${newlyCompleted.map((q) => q.id).join(", ")}`);
              }
              newlyCompletedQuestsRef.current = newlyCompleted as Array<{ id: string; name: string; reward?: unknown }>;
              finalState = questReconciled;

              // Render the quest sidebar from the reconciled state so the
              // player sees progress without the GM having to emit a
              // SECTION block. Hidden quests stay hidden until completed,
              // then they pop in as a discovery.
              const questsSectionContent = renderQuestsSidebar(adventureForNpc.quests, finalState.questsCompleted ?? []);
              if (questsSectionContent !== null) {
                const questSectionId = sectionIdUtil("Quests");
                setSections((prev) => {
                  const idx = prev.findIndex((s) => s.id === questSectionId);
                  if (idx >= 0) {
                    if (prev[idx].content === questsSectionContent) return prev;
                    const next = [...prev];
                    next[idx] = { ...next[idx], content: questsSectionContent };
                    return next;
                  }
                  return [...prev, { id: questSectionId, name: "Quests", content: questsSectionContent }];
                });
              }
            } else {
              newlyCompletedQuestsRef.current = [];
            }

            gmStateRef.current = finalState;
            setGmState(finalState);
          }

          const roomUpdate = parseRoomUpdate(directives);
          if (roomUpdate) {
            const current = gmStateRef.current ?? EMPTY_GM_STATE;
            const worldRooms: WorldRooms = current.worldRooms ?? { currentRoomId: roomUpdate.id, rooms: {} };
            worldRooms.currentRoomId = roomUpdate.id;
            worldRooms.rooms[roomUpdate.id] = roomUpdate;
            const updated = { ...current, worldRooms, location: roomUpdate.name };
            gmStateRef.current = updated;
            setGmState(updated);
          }
          // RPG mode: warn the GM next turn if narration described a movement
          // but no ROOM_UPDATE was emitted. Only meaningful when we're in a
          // worldRooms-aware game.
          if (currentGame?.config?.rpgWorldId) {
            const narrationImpliesMove = detectMissingRoomUpdate({
              narration: rawSplitMessage,
              directivesContainRoomUpdate: !!roomUpdate,
            });
            missingRoomUpdateRef.current = narrationImpliesMove;
            if (narrationImpliesMove) {
              console.debug("[gm-state] narration implies room change but no ROOM_UPDATE emitted");
            }
          }

          characterDirectionsRef.current = parseCharacterDirections(directives);
          const cleanedDirectives = stripGmDirectives(directives);

          const splitMessage = applyHostActionsAndClean(applyHostRoleAssignments(rawSplitMessage));
          const { hostContent: directivesClean, who, speakerQueue, autoChannelId, autoChannelGoal, channelGoal, quickActions, playerUpdates, combatStart, combatEnd } = parseHostResult(cleanedDirectives);
          const afterActions = applyHostActionsAndClean(directivesClean);
          const afterRoles = applyHostRoleAssignments(afterActions);
          const displayContent = splitMessage || afterRoles;
          if (displayContent && messageId) {
            updateStreamingMessage(messageId, displayContent, true);
          } else if (displayContent && !messageId) {
            setTypingUsers([]);
            messageId = addStreamingMessage(
              { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
              chId,
              displayContent,
            );
            updateStreamingMessage(messageId, displayContent, true);
          } else if (messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
          setTypingUsers([]);
          applyPlayerUpdates(playerUpdates);
          if (quickActions) setDynamicQuickActions(quickActions);
          if (combatStart) {
            const updated = { ...(gmStateRef.current ?? EMPTY_GM_STATE), combatActive: true, enemies: combatStart };
            gmStateRef.current = updated;
            setGmState(updated);
          }
          if (combatEnd) {
            const updated = { ...(gmStateRef.current ?? EMPTY_GM_STATE), combatActive: false, enemies: undefined };
            gmStateRef.current = updated;
            setGmState(updated);
          }
          return { hostContent: displayContent, who, speakerQueue, autoChannelId, autoChannelGoal, channelGoal, quickActions, playerUpdates };
        } catch (e) {
          setTypingUsers([]);
          if (e instanceof DOMException && e.name === "AbortError") throw e;
          console.error("Host stream error:", e);
          toast.error("Game Master stream interrupted — retrying…");
          if (messageId) updateStreamingMessage(messageId, "…", true);
          try {
            const retryAc = roundAbortRef.current;
            if (retryAc?.signal.aborted) throw new DOMException("Aborted", "AbortError");
            const retryFetchTimer = setTimeout(() => retryAc?.abort(), FETCH_TIMEOUT_MS);
            let retryRes: Response;
            try {
              retryRes = await fetch("/api/chat/stream", {
                method: "POST",
                signal: retryAc?.signal,
                headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                body: JSON.stringify({
                  systemPrompt: hostSystemPrompt,
                  messages: [{ role: "user", content: userContent }],
                  maxCompletionTokens: streamTokenBudget,
                  preferredModel: isScene ? SCENE_NARRATOR_MODEL : getHostModel(),
                  gameId,
                }),
              });
            } finally {
              clearTimeout(retryFetchTimer);
            }
            if (!retryRes.ok) throw new Error("retry failed");
            const retryReader = retryRes.body?.getReader();
            if (!retryReader) throw new Error("No retry body");
            const retryDecoder = new TextDecoder();
            let retrySSEBuf = '';
            let retryAcc = '';
            while (true) {
              if (retryAc?.signal.aborted) throw new DOMException("Stream aborted", "AbortError");
              const retryStallTimer = setTimeout(() => retryAc?.abort(), STREAM_STALL_MS);
              let retryChunk: ReadableStreamReadResult<Uint8Array>;
              try {
                retryChunk = await retryReader.read();
              } finally {
                clearTimeout(retryStallTimer);
              }
              if (retryChunk.done) break;
              retrySSEBuf += retryDecoder.decode(retryChunk.value, { stream: true });
              const retryLines = retrySSEBuf.split('\n');
              retrySSEBuf = retryLines.pop() ?? '';
              for (const rl of retryLines) {
                const rt = rl.trim();
                if (!rt || !rt.startsWith('data: ')) continue;
                const rp = rt.slice(6);
                if (rp === '[DONE]') continue;
                try { const rj = JSON.parse(rp); if (rj.content) retryAcc += rj.content; } catch {}
              }
            }
            const { message: rawRetryMsg, directives: retryDir } = splitHostOutput(retryAcc);

            const retryGm = parseGmState(retryDir);
            if (retryGm) { gmStateRef.current = retryGm; setGmState(retryGm); }

            const retryRoom = parseRoomUpdate(retryDir);
            if (retryRoom) {
              const current = gmStateRef.current ?? EMPTY_GM_STATE;
              const worldRooms: WorldRooms = current.worldRooms ?? { currentRoomId: retryRoom.id, rooms: {} };
              worldRooms.currentRoomId = retryRoom.id;
              worldRooms.rooms[retryRoom.id] = retryRoom;
              const updated = { ...current, worldRooms, location: retryRoom.name };
              gmStateRef.current = updated;
              setGmState(updated);
            }

            characterDirectionsRef.current = parseCharacterDirections(retryDir);
            const retryDirCleaned = stripGmDirectives(retryDir);

            const retryMsg = applyHostActionsAndClean(applyHostRoleAssignments(rawRetryMsg));
            const { hostContent: retryClean, who: retryWho, speakerQueue: retrySQ, autoChannelId: retryACId, autoChannelGoal: retryACGoal, channelGoal: retryChannelGoal, quickActions: retryQA, playerUpdates: retryPU } = parseHostResult(retryDirCleaned);
            const retryAfterActions = applyHostActionsAndClean(retryClean);
            const retryAfterRoles = applyHostRoleAssignments(retryAfterActions);
            const retryDisplay = retryMsg || retryAfterRoles;
            if (retryDisplay && messageId) {
              updateStreamingMessage(messageId, retryDisplay, true);
            } else if (retryDisplay && !messageId) {
              messageId = addStreamingMessage({ senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true }, chId, retryDisplay);
              updateStreamingMessage(messageId, retryDisplay, true);
            } else if (messageId) {
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            }
            applyPlayerUpdates(retryPU);
            if (retryQA) setDynamicQuickActions(retryQA);
            return { hostContent: retryDisplay, who: retryWho, speakerQueue: retrySQ, autoChannelId: retryACId, autoChannelGoal: retryACGoal, channelGoal: retryChannelGoal, quickActions: retryQA, playerUpdates: retryPU };
          } catch (retryErr) {
            if (retryErr instanceof DOMException && retryErr.name === "AbortError") throw retryErr;
            return emptyResult;
          }
        }
      };

      const rpgWorldIdCtx = currentGame?.config?.rpgWorldId;

      const buildSpeakerCtx = (recentRef: { current: Array<{ senderName: string; content: string }> }, currentChannelGoal?: string | null): SpeakerQueueContext => ({
        userId, channelId,
        convMode: getConversationMode(currentGame?.config?.template),
        playersRef, aiOnly,
        gameId,
        gameName: currentGame?.name ?? "",
        gameTemplate: currentGame?.config?.template,
        gameRules: currentGame?.config?.rules,
        gamePhase,
        humanName,
        sceneId,
        contentLanguage,
        phaseLabel: phaseLabel ?? "",
        myBoardContent,
        playerNotes,
        sessionToken: session?.access_token,
        channelPermissions,
        gameChannels: currentGame?.config?.channels as Array<{ id?: string; name: string; roomType?: string }> | undefined,
        gameRoomEntries,
        cfgChannelDefaultId: cfgChannels?.[0]?.id ?? "game-room",
        messages,
        pendingDecisionSummariesRef,
        recentForNext: recentRef,
        setCurrentSpeakerId, setTypingUsers, setPlayerNotes,
        addStreamingMessage, updateStreamingMessage,
        addReaction,
        rpgWorldId: rpgWorldIdCtx,
        engagementScore: latestEngagementScore,
        characterDirections: characterDirectionsRef.current,
        channelGoal: currentChannelGoal,
        interruptRef,
      });

      const decisionSummaryPrefix = pendingDecisionSummariesRef.current.length > 0
        ? `[System: cross-channel decisions since last turn]\n${pendingDecisionSummariesRef.current.join("\n")}\n\n`
        : "";
      pendingDecisionSummariesRef.current = [];

      const firstUserContent = `${decisionSummaryPrefix}Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      const firstHostResult = await callHostStream(firstUserContent, channelId);
      let { hostContent, who, speakerQueue } = firstHostResult;
      const { autoChannelId: firstAutoChannelId, autoChannelGoal: firstAutoChannelGoal, channelGoal: firstChannelGoal } = firstHostResult;
      if (firstChannelGoal?.trim()) setChannelTaskHint(firstChannelGoal.trim());
      let isSilentTurn = !hostContent;
      if (isSilentTurn && speakerQueue.length === 0) {
        if (tmplDef?.hostAnswersQuestions && content.includes("?")) {
          const retryResult = await callHostStream(
            `[System: A player just asked a yes/no question. You are the Thinker — you MUST answer it now. Answer with "Q<n>: Yes/No/Sometimes" and then pick the next Guesser via NEXT_SPEAKER.]\n\nThe question: ${content}`,
            channelId
          );
          if (retryResult.hostContent || retryResult.speakerQueue.length > 0) {
            hostContent = retryResult.hostContent;
            who = retryResult.who;
            speakerQueue = retryResult.speakerQueue;
            if (retryResult.channelGoal?.trim()) setChannelTaskHint(retryResult.channelGoal.trim());
            isSilentTurn = !hostContent;
          } else {
            setCurrentSpeakerId(null);
            setIsRoundInProgress(false);
            return;
          }
        } else {
          setCurrentSpeakerId(null);
          setIsRoundInProgress(false);
          return;
        }
      }

      // Fallback: if GM spoke but didn't queue any AI players, inject AI speakers.
      // In RPG mode the GM controls speakers via NEXT_SPEAKER + CHARACTER_DIRECTION,
      // so we only inject a single companion as a safety net (not random bulk).
      const hasAiInQueue = speakerQueue.some((s) => s.type === "ai" || s.type === "everyone");
      if (!hasAiInQueue && aiOnly.length > 0 && gamePhaseRef.current === "active") {
        if (rpgWorldIdCtx) {
          const one = aiOnly[Math.floor(Math.random() * aiOnly.length)];
          const humanIdx = speakerQueue.findIndex((s) => s.type === "human");
          const aiItem: SpeakerQueueItem = { type: "ai" as const, player: one };
          if (humanIdx >= 0) speakerQueue.splice(humanIdx, 0, aiItem);
          else speakerQueue.push(aiItem, { type: "human" });
        } else {
          const count = Math.min(aiOnly.length, 2 + Math.floor(Math.random() * 2));
          const shuffled = [...aiOnly].sort(() => Math.random() - 0.5).slice(0, count);
          const humanIdx = speakerQueue.findIndex((s) => s.type === "human");
          const aiItems: SpeakerQueueItem[] = shuffled.map((p) => ({ type: "ai" as const, player: p }));
          if (humanIdx >= 0) {
            speakerQueue.splice(humanIdx, 0, ...aiItems);
          } else {
            speakerQueue.push(...aiItems, { type: "human" });
          }
        }
      }

      const firstInQueue = speakerQueue[0];
      if (firstInQueue?.type === "human") setCurrentSpeakerId(userId);
      else if (firstInQueue?.type === "everyone") setCurrentSpeakerId(null);
      else if (firstInQueue?.type === "ai") setCurrentSpeakerId(firstInQueue.player.id);
      else if (!firstInQueue) {
        const whoLower = who?.toLowerCase() ?? "";
        if (whoLower === "you" || (humanName && whoLower === humanName.toLowerCase())) setCurrentSpeakerId(userId);
      }

      if (!isSilentTurn) await hostPace(isSceneMode(tmplId));
      const recentForNextRef = { current: [
        ...channelMessages.slice(-18).map((m) => ({
          senderName: m.senderName,
          content: m.reactions?.length
            ? `${m.content} [reactions: ${m.reactions.map((r: { emoji: string; from: string }) => `${r.emoji} ${r.from}`).join(", ")}]`
            : m.content,
        })),
        { senderName: humanName, content },
        ...(hostContent ? [{ senderName: gmName, content: hostContent }] : []),
      ] as Array<{ senderName: string; content: string }> };

      const sqCtx = buildSpeakerCtx(recentForNextRef, firstChannelGoal);

      // Auto-trigger template-defined private conversations when night phase begins
      const autoTriggerTemplateChannels = async (explicitAutoChannelId: string | null) => {
        const tmplDef = getGameTemplate(tmplId || "");
        if (!tmplDef?.channels || !isNightPhase(phaseLabelRef.current ?? "")) return;
        for (const ch of tmplDef.channels) {
          if (!ch.autoConverse) continue;
          if (ch.id === explicitAutoChannelId) continue;
          const perms = channelPermissions[ch.id];
          if (!perms || perms.includes("*")) continue;
          await runPrivateChannelConversationFn(sqCtx, ch.id, ch.autoConverse.goal, ch.autoConverse.maxRounds);
        }
      };

      if (firstAutoChannelId) {
        await runPrivateChannelConversationFn(sqCtx, firstAutoChannelId, firstAutoChannelGoal);
      }
      await autoTriggerTemplateChannels(firstAutoChannelId);

      let currentQueue = speakerQueue;
      let humanReached = currentQueue.length === 0
        ? (() => { setCurrentSpeakerId(null); return true; })()
        : await runSpeakerQueueFn(sqCtx, currentQueue);

      // NOTE: do NOT clear `interruptRef`/`pendingHumanMsgRef` here.
      // The `finally` block needs them so a queued user message can re-trigger
      // a new round. Resetting early was causing the round to silently die.
      let lastBeatContentLen = hostContent?.length ?? 0;
      for (let i = 0; i < MAX_AUTO_ADVANCES && !humanReached && gamePhaseRef.current !== "ended" && !interruptRef.current; i++) {
        hostSystemPrompt = buildFreshHostPrompt();
        await dynamicPace(lastBeatContentLen, undefined, undefined, isSceneMode(tmplId));
        const recentSummary = recentForNextRef.current.slice(-10)
          .map((m) => `${m.senderName}: ${m.content}`).join("\n");
        const autoAdvanceHint = tmplDef?.hostAnswersQuestions
          ? `[System: AI players have spoken. If a yes/no question was asked, answer it now. Do NOT repeat yourself.]`
          : `[System: Advance to the next beat. Do NOT repeat any prior announcement.]`;
        const advanced = await callHostStream(
          `${autoAdvanceHint}\n\nRecent messages for context:\n${recentSummary}`,
          channelId
        );
        if (advanced.channelGoal?.trim()) setChannelTaskHint(advanced.channelGoal.trim());
        if (!advanced.hostContent && advanced.speakerQueue.length === 0 && !advanced.autoChannelId) break;
        if (advanced.hostContent) {
          lastBeatContentLen = advanced.hostContent.length;
          recentForNextRef.current = [
            ...recentForNextRef.current,
            { senderName: gmName, content: advanced.hostContent },
          ].slice(-30);
        }
        if (advanced.autoChannelId) {
          await runPrivateChannelConversationFn(sqCtx, advanced.autoChannelId, advanced.autoChannelGoal);
        }
        await autoTriggerTemplateChannels(advanced.autoChannelId);
        currentQueue = advanced.speakerQueue;
        humanReached = await runSpeakerQueueFn(sqCtx, currentQueue);
      }

      if (tmplDef?.hostAnswersQuestions && gamePhase !== "ended") {
        const tail = recentForNextRef.current.slice(-6);
        const lastHostIdx = tail.map(m => m.senderName).lastIndexOf(gmName);
        const questionAfterHost = tail.slice(lastHostIdx + 1).some(m => m.content.includes("?"));
        if (questionAfterHost) {
          const recentSummary = recentForNextRef.current.slice(-10)
            .map((m) => `${m.senderName}: ${m.content}`).join("\n");
          const answerResult = await callHostStream(
            `[System: There are unanswered yes/no questions from players. You are the Thinker — answer each one now (Q<n>: Yes/No/Sometimes). Then pick exactly ONE Guesser via NEXT_SPEAKER.]\n\nRecent messages:\n${recentSummary}`,
            channelId
          );
          if (answerResult.channelGoal?.trim()) setChannelTaskHint(answerResult.channelGoal.trim());
          if (answerResult.hostContent) {
            recentForNextRef.current = [
              ...recentForNextRef.current,
              { senderName: gmName, content: answerResult.hostContent },
            ].slice(-30);
          }
          if (answerResult.speakerQueue.length > 0) {
            await runSpeakerQueueFn(sqCtx, answerResult.speakerQueue);
          }
        }
      }

      if (!humanReached) setCurrentSpeakerId((id) => (id === userId ? id : null));
    } catch (error) {
      setTypingUsers([]);
      setCurrentSpeakerId(null);
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const is402 = error instanceof Error && (error.message === "CREDITS_EXHAUSTED" || (error as Error & { status?: number }).status === 402);
      if (is402) {
        console.warn("Credits exhausted during AI player speak");
        setCreditsExhausted(true);
      } else if (isAbort) {
        console.warn("Round aborted (timeout or user interrupt)");
        toast.error("Game Master response timed out — please send your message again.", { duration: 5000 });
      } else {
        console.error("Error getting AI response:", error);
        toast.error("Failed to get response from Game Master. Please try again.", { duration: 5000 });
      }
      setLastFailedSendContent(content);
    } finally {
      if (roundWatchdogRef.current) { clearTimeout(roundWatchdogRef.current); roundWatchdogRef.current = null; }
      roundAbortRef.current = null;
      setIsRoundInProgress(false);

      // Update story summary for session resume (RPG games only)
      if (gmStateRef.current && currentGame?.config?.rpgWorldId) {
        const recent = messagesRef.current
          .filter((m) => !m.isSystemMessage && !m.isAnnouncement && !m.isStreaming)
          .slice(-10)
          .map((m) => ({ senderName: m.senderName, content: m.content }));
        setStorySummary(buildStorySummary(gmStateRef.current, recent));
      }

      saveNow();

      const queued = pendingHumanMsgRef.current;
      pendingHumanMsgRef.current = null;
      interruptRef.current = false;
      if (queued && gamePhaseRef.current !== "ended") {
        setTimeout(() => handleSendMessageRef.current?.(queued, { skipAddMessage: true }), 100);
      }
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  // Scene mode: auto-continue when user is silent for 20 seconds
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const tmplId = currentGame?.config?.template;
    if (!isSceneMode(tmplId)) return;
    if (gamePhase !== "active") return;
    if (currentSpeakerId !== userId) {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      return;
    }
    if (isRoundInProgress) return;

    silenceTimerRef.current = setTimeout(() => {
      handleSendMessageRef.current?.("[Continue]", { skipAddMessage: true });
    }, 20_000);

    return () => { if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; } };
  }, [currentSpeakerId, userId, gamePhase, isRoundInProgress, currentGame?.config?.template]);

  const handleRetryLastMessage = useCallback(() => {
    if (lastFailedSendContent) {
      handleSendMessageRef.current?.(lastFailedSendContent);
      setLastFailedSendContent(null);
    }
  }, [lastFailedSendContent]);

  return {
    handleSendMessage,
    handleRetryLastMessage,
    isRoundInProgress,
    lastFailedSendContent,
    handleSendMessageRef,
    msgCountRef,
    channelTaskHint,
    dynamicQuickActions,
    creditsExhausted,
    dismissCreditsExhausted: () => setCreditsExhausted(false),
  };
}
