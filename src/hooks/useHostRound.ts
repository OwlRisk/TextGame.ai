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
import { getPreferredModel, SCENE_NARRATOR_MODEL } from "@/lib/model-prefs";
import { getTemplateHexColor, getGameTemplate } from "@/lib/game-templates";
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
import { buildHostSystemPrompt, buildSceneDirectorPrompt } from "@/lib/host-prompt-builder";
import { isSceneMode, getScene } from "@/lib/scenes";
import { type GmState, type CharacterDirection, parseGmState, parseCharacterDirections, stripGmDirectives, EMPTY_GM_STATE } from "@/lib/gm-state";
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
import type { Player } from "@/types/player";

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
  readyKickoffRef: React.MutableRefObject<{ channelId: string } | null>;
  launchOpeningRound: (kickoff: any) => Promise<void>;
  contentLanguage?: string;
}

export interface UseHostRoundReturn {
  handleSendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  handleRetryLastMessage: () => void;
  isRoundInProgress: boolean;
  lastFailedSendContent: string | null;
  handleSendMessageRef: React.MutableRefObject<((content: string, options?: SendMessageOptions) => Promise<void>) | null>;
  msgCountRef: React.MutableRefObject<number>;
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
    sections,
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
  } = useGameRoomContext();

  const currentGame = games.find((g) => g.id === gameId);

  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const msgCountRef = useRef(0);
  const pendingHumanMsgRef = useRef<string | null>(null);
  const interruptRef = useRef(false);
  const gmStateRef = useRef<GmState | null>(null);
  const characterDirectionsRef = useRef<CharacterDirection[]>([]);

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
      pendingHumanMsgRef.current = content;
      interruptRef.current = true;
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

      const gmName = "Narrator";
      const gmColor = "#52525b";

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
      const nonHostPlayers = freshPlayers.filter((p) => !p.isGameMaster);
      const playerRoster = nonHostPlayers.map((p) => {
        const isHuman = p.id === userId;
        const name = isHuman ? humanName : p.name;
        const role = p.role ? `Role: ${p.role}` : "Role: not assigned";
        const status = (p.stats?.Status as string | undefined) ?? "alive";
        const statusStr = `Status: ${status}`;
        if (isHuman) {
          return `  • ${name} [YOU/HUMAN] | ${role} | ${statusStr}`;
        }
        const personality = p.personality ? `Personality: ${p.personality}` : "";
        const background = p.background ? `Background: ${p.background}` : "";
        const extras = [personality, background].filter(Boolean).join(" | ");
        return `  • ${name} [AI] | ${role} | ${statusStr}${extras ? ` | ${extras}` : ""}`;
      }).join("\n");

      const boardEntries = Object.entries(myBoardContent)
        .map(([playerId, boardContent]) => {
          if (!boardContent?.trim()) return null;
          if (playerId === "_host_") return `  [_Host_ (your private notes)]\n${boardContent.trim()}`;
          const p = players.find((pl) => pl.id === playerId);
          const name = p ? (p.id === userId ? humanName : p.name) : playerId;
          return `  [${name}]\n${boardContent.trim()}`;
        })
        .filter(Boolean);
      const boardSummary = boardEntries.length > 0
        ? boardEntries.join("\n\n")
        : "(No private board content yet)";

      const eventLogSummary = gameEvents.length > 0
        ? gameEvents.map((e, i) => `  ${i + 1}. ${e}`).join("\n")
        : "(No events recorded yet)";

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

      // Initialize GM state from scene data on first round
      if (isSceneMode(tmplId) && sceneId && !gmStateRef.current) {
        const sceneData = getScene(sceneId);
        if (sceneData?.initialGmState) {
          gmStateRef.current = { ...sceneData.initialGmState };
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
        if (result.isGameOver) {
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
            updateGame(gameId, { isActive: false });
            setGameOverSummary(a.summary || "Game over!");
            setGamePhase("ended");
            try { localStorage.setItem("tg_game_completed", "1"); } catch {}
            trackEvent("game_completed", {
              template: currentGame?.config?.template || "custom",
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

      const callHostStream = async (userContent: string, chId: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: string | null; autoChannelGoal: string | null; imageUrl?: string }> => {
        const isScene = isSceneMode(tmplId);
        const isDeductionGame = tmplDef?.category === "deduction";
        const streamTokenBudget = isScene
          ? 2048
          : Math.min(MAX_STREAM_TOKENS, BASE_STREAM_TOKENS + players.length * TOKENS_PER_PLAYER);
        let messageId: string | null = null;
        setTypingUsers([{ name: gmName, avatar: gmColor }]);
        try {
          const res = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            body: JSON.stringify({
              systemPrompt: hostSystemPrompt,
              messages: [{ role: "user", content: userContent }],
              maxCompletionTokens: streamTokenBudget,
              preferredModel: isScene ? SCENE_NARRATOR_MODEL : getPreferredModel(),
              gameId,
            }),
          });
          if (!res.ok) {
            setTypingUsers([]);
            if (res.status === 402) {
              toast.error("Token balance insufficient. Please top up to continue the game.", { duration: 8000 });
              return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
            }
            return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
          }

          // Read SSE stream and accumulate full content
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body");
          const decoder = new TextDecoder();
          let sseBuffer = '';
          let acc = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });
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

          // Extract GM brain state before stripping (scene + deduction games)
          if (isScene || isDeductionGame) {
            const newGmState = parseGmState(directives);
            if (newGmState) gmStateRef.current = newGmState;
            characterDirectionsRef.current = parseCharacterDirections(directives);
          }
          const cleanedDirectives = (isScene || isDeductionGame) ? stripGmDirectives(directives) : directives;

          const splitMessage = applyHostActionsAndClean(applyHostRoleAssignments(rawSplitMessage));
          const { hostContent: directivesClean, who, speakerQueue, autoChannelId, autoChannelGoal } = parseHostResult(cleanedDirectives);
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
          return { hostContent: displayContent, who, speakerQueue, autoChannelId, autoChannelGoal };
        } catch (e) {
          setTypingUsers([]);
          console.error("Host stream error:", e);
          toast.error("Game Master stream interrupted — retrying…");
          if (messageId) updateStreamingMessage(messageId, "…", true);
          try {
            const retryRes = await fetch("/api/chat/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
              body: JSON.stringify({
                systemPrompt: hostSystemPrompt,
                messages: [{ role: "user", content: userContent }],
                maxCompletionTokens: streamTokenBudget,
                preferredModel: isScene ? SCENE_NARRATOR_MODEL : getPreferredModel(),
                gameId,
              }),
            });
            if (!retryRes.ok) throw new Error("retry failed");
            const retryReader = retryRes.body?.getReader();
            if (!retryReader) throw new Error("No retry body");
            const retryDecoder = new TextDecoder();
            let retrySSEBuf = '';
            let retryAcc = '';
            while (true) {
              const { done, value } = await retryReader.read();
              if (done) break;
              retrySSEBuf += retryDecoder.decode(value, { stream: true });
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

            if (isScene || isDeductionGame) {
              const retryGm = parseGmState(retryDir);
              if (retryGm) gmStateRef.current = retryGm;
              characterDirectionsRef.current = parseCharacterDirections(retryDir);
            }
            const retryDirCleaned = (isScene || isDeductionGame) ? stripGmDirectives(retryDir) : retryDir;

            const retryMsg = applyHostActionsAndClean(applyHostRoleAssignments(rawRetryMsg));
            const { hostContent: retryClean, who: retryWho, speakerQueue: retrySQ, autoChannelId: retryACId, autoChannelGoal: retryACGoal } = parseHostResult(retryDirCleaned);
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
            return { hostContent: retryDisplay, who: retryWho, speakerQueue: retrySQ, autoChannelId: retryACId, autoChannelGoal: retryACGoal };
          } catch {
            return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
          }
        }
      };

      const buildSpeakerCtx = (recentRef: { current: Array<{ senderName: string; content: string }> }): SpeakerQueueContext => ({
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
        engagementScore: latestEngagementScore,
        characterDirections: characterDirectionsRef.current,
      });

      const decisionSummaryPrefix = pendingDecisionSummariesRef.current.length > 0
        ? `[System: cross-channel decisions since last turn]\n${pendingDecisionSummariesRef.current.join("\n")}\n\n`
        : "";
      pendingDecisionSummariesRef.current = [];

      const firstUserContent = `${decisionSummaryPrefix}Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, speakerQueue, autoChannelId: firstAutoChannelId, autoChannelGoal: firstAutoChannelGoal, imageUrl: firstImageUrl } = await callHostStream(firstUserContent, channelId);
      let isSilentTurn = !hostContent && !firstImageUrl;
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

      const sqCtx = buildSpeakerCtx(recentForNextRef);

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

      interruptRef.current = false;
      pendingHumanMsgRef.current = null;
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
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
      setLastFailedSendContent(content);
    } finally {
      setIsRoundInProgress(false);
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
  };
}
