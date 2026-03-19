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
import { getPreferredModel } from "@/lib/model-prefs";
import { buildRuntimeProgressionGuard } from "@/lib/game-template-driver";
import { getTemplateHexColor } from "@/lib/game-templates";
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
import { buildHostSystemPrompt } from "@/lib/host-prompt-builder";
import {
  type SpeakerQueueItem,
  parseRoleAssignments,
  parseHostResult as parseHostResultUtil,
} from "@/lib/host-output-parser";
import {
  type SpeakerQueueContext,
  runSpeakerQueue as runSpeakerQueueFn,
  runPrivateChannelConversation as runPrivateChannelConversationFn,
} from "@/lib/speaker-queue";
import { trackEvent } from "@/lib/analytics";
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
  roomMembers: Array<{ id: string; guest_id?: string | null; player_id?: string | null; is_owner?: boolean; nickname?: string }>;
  gameRoomEntries: Array<{ id: string; name: string; roomType?: string }>;
  defaultGameChannelId: string;
  readyKickoffRef: React.MutableRefObject<{ channelId: string } | null>;
  launchOpeningRound: (kickoff: any) => Promise<void>;
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
  roomMembers,
  gameRoomEntries,
  defaultGameChannelId,
  readyKickoffRef,
  launchOpeningRound,
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
    addReaction,
  } = useGameRoomContext();

  const currentGame = games.find((g) => g.id === gameId);

  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const msgCountRef = useRef(0);

  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const pendingDecisionSummariesRef = useRef<string[]>([]);

  const handleSendMessageRef = useRef<((content: string, options?: SendMessageOptions) => Promise<void>) | null>(null);

  const handleSendMessage = async (content: string, options?: SendMessageOptions) => {
    if (!content.trim()) return;
    if (isRoundInProgress) return;
    if (gamePhase === "ended") return;

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

      const gmName = currentGame?.config?.generatedHost?.name || "Game Master";
      const gmColor = currentGame?.config?.generatedHost?.color || getTemplateHexColor(currentGame?.config?.template || "custom");

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
        const boundGuest = roomMembers.find((m) => m.player_id === p.id && !m.is_owner);
        const personality = p.personality ? `Personality: ${p.personality}` : "";
        const background = p.background ? `Background: ${p.background}` : "";
        const extras = [personality, background].filter(Boolean).join(" | ");
        const typeLabel = boundGuest ? `GUEST: ${boundGuest.nickname}` : "AI";
        return `  • ${name} [${typeLabel}] | ${role} | ${statusStr}${extras ? ` | ${extras}` : ""}`;
      }).join("\n");

      const boardEntries = Object.entries(myBoardContent)
        .map(([playerId, boardContent]) => {
          if (!boardContent?.trim()) return null;
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
      const tmpl = currentGame?.config?.template ?? "";
      const hasVotingPhase =
        ["werewolf", "mafia"].includes(tmpl) ||
        /\bvot(e|ing)\b/i.test(rulesText);
      const hasNightPhase =
        ["werewolf", "mafia"].includes(tmpl) ||
        /\bnight\s*(phase|action|round)?\b/i.test(rulesText);
      const hasMultipleRooms = gameRoomEntries.length > 1;

      const generatedHost = currentGame?.config?.generatedHost as { name?: string; personality?: string; systemPrompt?: string } | undefined;
      const hostSystemPrompt = buildHostSystemPrompt({
        gameName: currentGame?.name ?? "",
        gameTemplate: tmpl,
        humanName,
        nonHostPlayerNames: nonHostPlayers.map((p) => (p.id === userId ? humanName : p.name)),
        hasVotingPhase,
        hasNightPhase,
        hasMultipleRooms,
        channels: (currentGame?.config?.channels ?? gameRoomEntries).map((c: { name: string; roomType?: string }) => ({
          name: c.name,
          roomType: c.roomType,
        })),
        gamePhase: gamePhase || "waiting",
        phaseLabel: phaseLabel ?? "",
        playerRoster,
        eventLogSummary,
        boardSummary,
        rulesText,
        hostName: generatedHost?.name ?? "Game Master",
        hostPersonality: generatedHost?.personality ?? undefined,
        hostCustomSystemPrompt: generatedHost?.systemPrompt ?? undefined,
      });

      const applyHostRoleAssignments = (roleContent: string): string => {
        const result = parseRoleAssignments(roleContent, playersRef.current, userId, humanName, humanGameIdentity?.name ?? null);
        if (result.isGameOver) {
          setGamePhase("ended");
          setGameOverSummary(result.gameOverSummary || "Game over!");
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
            trackEvent("game_completed", {
              template: currentGame?.config?.template || "custom",
              messages_sent: msgCountRef.current,
            });
          } else if (a.type === "phase") {
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
        const streamTokenBudget = Math.min(MAX_STREAM_TOKENS, BASE_STREAM_TOKENS + players.length * TOKENS_PER_PLAYER);
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
              preferredModel: getPreferredModel(),
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
          const resData = await res.json() as { content?: string };
          const acc = resData.content ?? "";
          const { message: rawSplitMessage, directives } = splitHostOutput(acc);
          const splitMessage = applyHostActionsAndClean(applyHostRoleAssignments(rawSplitMessage));
          const { hostContent: directivesClean, who, speakerQueue, autoChannelId, autoChannelGoal } = parseHostResult(directives);
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
                preferredModel: getPreferredModel(),
              }),
            });
            if (!retryRes.ok) throw new Error("retry failed");
            const retryData = await retryRes.json() as { content?: string };
            const retryAcc = retryData.content ?? "";
            let retryMsgId: string | null = null;
            const { message: rawRetryMsg, directives: retryDir } = splitHostOutput(retryAcc);
            const retryMsg = applyHostActionsAndClean(applyHostRoleAssignments(rawRetryMsg));
            const { hostContent: retryClean, who: retryWho, speakerQueue: retrySQ, autoChannelId: retryACId, autoChannelGoal: retryACGoal } = parseHostResult(retryDir);
            const retryAfterActions = applyHostActionsAndClean(retryClean);
            const retryAfterRoles = applyHostRoleAssignments(retryAfterActions);
            const retryDisplay = retryMsg || retryAfterRoles;
            if (retryDisplay && retryMsgId) {
              updateStreamingMessage(retryMsgId, retryDisplay, true);
            } else if (retryDisplay && !retryMsgId) {
              retryMsgId = addStreamingMessage({ senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true }, chId, retryDisplay);
              updateStreamingMessage(retryMsgId, retryDisplay, true);
            } else if (retryMsgId) {
              setMessages((prev) => prev.filter((m) => m.id !== retryMsgId));
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
        gameName: currentGame?.name ?? "",
        gameTemplate: currentGame?.config?.template,
        gameRules: currentGame?.config?.rules,
        gamePhase,
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
      });

      const channelMessagesForRecent = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentNonHostTurns = channelMessagesForRecent
        .slice(-12)
        .filter((m) => !m.isSystemMessage && m.senderName !== gmName).length;
      const progressionGuardCore = buildRuntimeProgressionGuard(currentGame?.config?.template, recentNonHostTurns);
      const progressionGuard = progressionGuardCore ? `${progressionGuardCore}\n\n` : "";
      const decisionSummaryPrefix = pendingDecisionSummariesRef.current.length > 0
        ? `[System: cross-channel decisions since last turn]\n${pendingDecisionSummariesRef.current.join("\n")}\n\n`
        : "";
      pendingDecisionSummariesRef.current = [];

      const firstUserContent = `${decisionSummaryPrefix}${progressionGuard}Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, speakerQueue, autoChannelId: firstAutoChannelId, autoChannelGoal: firstAutoChannelGoal, imageUrl: firstImageUrl } = await callHostStream(firstUserContent, channelId);
      let isSilentTurn = !hostContent && !firstImageUrl;
      if (isSilentTurn && speakerQueue.length === 0) {
        if (tmpl === "20-questions" && content.includes("?")) {
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

      if (!isSilentTurn) await hostPace();
      const recentForNextRef = { current: [
        ...channelMessagesForRecent.slice(-18).map((m) => ({
          senderName: m.senderName,
          content: m.reactions?.length
            ? `${m.content} [reactions: ${m.reactions.map((r: { emoji: string; from: string }) => `${r.emoji} ${r.from}`).join(", ")}]`
            : m.content,
        })),
        { senderName: humanName, content },
        ...(hostContent ? [{ senderName: gmName, content: hostContent }] : []),
      ] as Array<{ senderName: string; content: string }> };

      const sqCtx = buildSpeakerCtx(recentForNextRef);

      if (firstAutoChannelId) {
        await runPrivateChannelConversationFn(sqCtx, firstAutoChannelId, firstAutoChannelGoal);
      }

      let currentQueue = speakerQueue;
      let humanReached = currentQueue.length === 0
        ? (() => { setCurrentSpeakerId(null); return true; })()
        : await runSpeakerQueueFn(sqCtx, currentQueue);

      let lastBeatContentLen = hostContent?.length ?? 0;
      for (let i = 0; i < MAX_AUTO_ADVANCES && !humanReached && gamePhase !== "ended"; i++) {
        await dynamicPace(lastBeatContentLen);
        const recentSummary = recentForNextRef.current.slice(-10)
          .map((m) => `${m.senderName}: ${m.content}`).join("\n");
        const autoAdvanceHint = tmpl === "20-questions"
          ? `[System: AI players have spoken. If any player asked a yes/no question, answer it immediately as the Thinker (Q<n>: Yes/No/Sometimes). Then pick the next Guesser. Do NOT repeat any announcement you already made.]`
          : `[System: all pending AI actions in this beat are done — advance the game to the next beat automatically. Do NOT repeat any announcement or phase transition you already made.]`;
        const advanced = await callHostStream(
          `${autoAdvanceHint}\n\nRecent messages for context:\n${recentSummary}`,
          channelId
        );
        if (!advanced.hostContent && advanced.speakerQueue.length === 0) break;
        if (advanced.hostContent) {
          lastBeatContentLen = advanced.hostContent.length;
          recentForNextRef.current = [
            ...recentForNextRef.current,
            { senderName: gmName, content: advanced.hostContent },
          ].slice(-30);
        }
        currentQueue = advanced.speakerQueue;
        humanReached = await runSpeakerQueueFn(sqCtx, currentQueue);
      }

      if (!humanReached) setCurrentSpeakerId((id) => (id === userId ? id : null));
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
      setLastFailedSendContent(content);
    } finally {
      setIsRoundInProgress(false);
      saveNow();
    }
  };

  handleSendMessageRef.current = handleSendMessage;

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
