import type { Player } from "@/app/components/player-panel";
import type { SpeakerQueueItem } from "@/lib/host-output-parser";
import type { ConversationMode, StreamMsgMeta } from "@/lib/game-pace";
import { parseHostActions } from "@/lib/host-actions";
import { getPreferredModel } from "@/lib/model-prefs";
import {
  thinkingDelay,
  getTypewriterSpeed,
  typewriterReveal,
  dynamicPace,
  HOST_PACE_BASE_MS,
  HOST_PACE_PER_50_CHARS_MS,
  HOST_PACE_MAX_MS,
  getPersonalityPaceFactor,
} from "@/lib/game-pace";

export interface SpeakerQueueContext {
  userId: string;
  channelId: string;
  convMode: ConversationMode;
  playersRef: { current: Player[] };
  aiOnly: Player[];

  gameName: string;
  gameTemplate?: string;
  gameRules?: string;
  gamePhase: string;
  myBoardContent: Record<string, string>;
  playerNotes: Record<string, string>;
  sessionToken?: string;

  channelPermissions: Record<string, string[]>;
  gameChannels?: Array<{ id?: string; name: string; roomType?: string }>;
  gameRoomEntries: Array<{ id: string; name: string }>;
  cfgChannelDefaultId: string;
  messages: Array<{ id?: string; channelId?: string; senderName: string; content: string; isSystemMessage?: boolean; isAnnouncement?: boolean; isStreaming?: boolean }>;
  pendingDecisionSummariesRef: { current: string[] };

  /** Mutable ref tracking the running conversation history for the current turn. */
  recentForNext: { current: Array<{ senderName: string; content: string }> };

  setCurrentSpeakerId: (id: string | null) => void;
  setTypingUsers: (users: { name: string; avatar: string }[]) => void;
  setPlayerNotes: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  addStreamingMessage: (msg: StreamMsgMeta, channelId?: string, initialContent?: string) => string;
  updateStreamingMessage: (messageId: string, content: string, isComplete?: boolean) => void;
  addReaction?: (messageId: string, emoji: string, from: string) => void;
}

const toTyping = (p: Player) => ({ name: p.name, avatar: p.avatar ?? "#8b5cf6" });

export async function runPlayerSpeak(
  ctx: SpeakerQueueContext,
  speaker: Player,
  recent: Array<{ senderName: string; content: string }>,
  channelGoal?: string | null,
): Promise<string | null> {
  const speakerStatus = (speaker.stats?.Status as string | undefined)?.toLowerCase();
  if (speakerStatus === "eliminated" || speakerStatus === "dead") return null;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ctx.sessionToken) headers.Authorization = `Bearer ${ctx.sessionToken}`;

    const res = await fetch("/api/chat/player-speak", {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameName: ctx.gameName,
        gameTemplate: ctx.gameTemplate,
        rules: ctx.gameRules,
        gamePhase: ctx.gamePhase,
        player: {
          name: speaker.name,
          role: speaker.role,
          personality: speaker.personality,
          background: speaker.background,
          boardContent: ctx.myBoardContent[speaker.id] ?? undefined,
        },
        ...(ctx.playerNotes[speaker.id] ? { playerNotes: ctx.playerNotes[speaker.id] } : {}),
        recentMessages: recent,
        preferredModel: getPreferredModel(),
        ...(channelGoal ? { channelGoal } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawMessage = (data.message || "").trim();
    if (!rawMessage) return null;

    const { cleanContent, actions } = parseHostActions(rawMessage);
    const notesAction = actions.find((a) => a.type === "player_notes");
    if (notesAction && notesAction.type === "player_notes") {
      ctx.setPlayerNotes((prev) => ({ ...prev, [speaker.id]: notesAction.content }));
    }

    if (ctx.addReaction) {
      for (const a of actions) {
        if (a.type === "react") {
          const targetMsg = a.targetSender
            ? [...ctx.messages].reverse().find(
                (m) => !m.isSystemMessage && !m.isAnnouncement && !m.isStreaming &&
                  m.senderName.toLowerCase() === a.targetSender!.toLowerCase()
              )
            : [...ctx.messages].reverse().find(
                (m) => !m.isSystemMessage && !m.isAnnouncement && !m.isStreaming
              );
          if (targetMsg?.id) ctx.addReaction(targetMsg.id, a.emoji, speaker.name);
        }
      }
    }

    return cleanContent || null;
  } catch (err) {
    console.error("Error generating AI player reply:", err);
    return null;
  }
}

export async function speakAndReveal(
  ctx: SpeakerQueueContext,
  player: Player,
  queueIdx: number,
  upcomingPlayers: Player[],
): Promise<string | null> {
  await thinkingDelay(queueIdx, ctx.convMode);
  ctx.setTypingUsers([toTyping(player), ...upcomingPlayers.slice(0, 2).map(toTyping)]);
  const txt = await runPlayerSpeak(ctx, player, ctx.recentForNext.current);
  const remaining = upcomingPlayers.slice(0, 3).map(toTyping);
  ctx.setTypingUsers(remaining);
  if (txt) {
    const speed = getTypewriterSpeed(player.personality);
    await typewriterReveal(txt, ctx.addStreamingMessage, ctx.updateStreamingMessage, {
      senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", isAI: true,
    }, ctx.channelId, speed);
    const totalPace = Math.min(
      HOST_PACE_BASE_MS + Math.floor(txt.length / 50) * HOST_PACE_PER_50_CHARS_MS,
      HOST_PACE_MAX_MS,
    ) * getPersonalityPaceFactor(player.personality);
    if (upcomingPlayers.length > 0) {
      const preTypingAt = Math.floor(totalPace * 0.6);
      await new Promise<void>((r) => setTimeout(r, preTypingAt));
      ctx.setTypingUsers(upcomingPlayers.slice(0, 3).map(toTyping));
      await new Promise<void>((r) => setTimeout(r, Math.max(200, totalPace - preTypingAt)));
    } else {
      await dynamicPace(txt.length, player.personality, ctx.convMode);
    }
    ctx.recentForNext.current = [...ctx.recentForNext.current, { senderName: player.name, content: txt }];
  }
  return txt;
}

export async function runSpeakerQueue(
  ctx: SpeakerQueueContext,
  queue: SpeakerQueueItem[],
): Promise<boolean> {
  for (let qi = 0; qi < queue.length; qi++) {
    const item = queue[qi];
    if (item.type === "human") {
      ctx.setCurrentSpeakerId(ctx.userId);
      return true;
    }
    if (item.type === "everyone") {
      ctx.setCurrentSpeakerId(null);
      if (ctx.aiOnly.length > 0) {
        const count = ctx.convMode === "freeform"
          ? Math.min(ctx.aiOnly.length, 2 + Math.floor(Math.random() * 2))
          : 1;
        const shuffled = [...ctx.aiOnly].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, count);
        for (let pi = 0; pi < picks.length; pi++) {
          const freshPick = ctx.playersRef.current.find((p) => p.id === picks[pi].id) ?? picks[pi];
          const upcoming = picks.slice(pi + 1).map(p => ctx.playersRef.current.find(pp => pp.id === p.id) ?? p);
          await speakAndReveal(ctx, freshPick, pi, upcoming);
        }
      }
      ctx.setTypingUsers([]);
      return true;
    }
    const freshPlayer = ctx.playersRef.current.find((p) => p.id === item.player.id) ?? item.player;
    const itemStatus = (freshPlayer.stats?.Status as string | undefined)?.toLowerCase();
    if (itemStatus === "eliminated" || itemStatus === "dead") continue;
    const upcomingAiPlayers: Player[] = [];
    for (let ni = qi + 1; ni < queue.length; ni++) {
      const next = queue[ni];
      if (next.type === "ai") {
        upcomingAiPlayers.push(ctx.playersRef.current.find((p) => p.id === next.player.id) ?? next.player);
        if (upcomingAiPlayers.length >= 3) break;
      }
      if (next.type === "human" || next.type === "everyone") break;
    }
    await speakAndReveal(ctx, freshPlayer, qi, upcomingAiPlayers);
    const nextItem = queue[qi + 1];
    if (nextItem?.type === "human") ctx.setCurrentSpeakerId(ctx.userId);
    else if (nextItem?.type === "ai") ctx.setCurrentSpeakerId(nextItem.player.id);
    else if (!nextItem) ctx.setCurrentSpeakerId(null);
  }
  return false;
}

export async function runPrivateChannelConversation(
  ctx: SpeakerQueueContext,
  targetChannelId: string,
  goal: string | null,
  maxRounds = 3,
): Promise<void> {
  const perms = ctx.channelPermissions[targetChannelId];
  if (!perms || perms.includes("*")) return;
  const channelAiPlayers = ctx.playersRef.current.filter(
    (p) => p.isAI && !p.isGameMaster && perms.includes(p.id)
  );
  if (channelAiPlayers.length === 0) return;

  const roomType = ctx.gameChannels?.find((c) => c.id === targetChannelId)?.roomType ?? "private_ai";

  const channelRecent = ctx.messages
    .filter((m) => (m.channelId ?? ctx.cfgChannelDefaultId) === targetChannelId)
    .slice(-15)
    .map((m) => ({ senderName: m.senderName, content: m.content }));
  let recentContext = channelRecent;

  const checkConsensusAndSummarise = async (
    context: Array<{ senderName: string; content: string }>,
    channelName: string,
  ): Promise<string | null> => {
    if (context.length === 0) return null;
    try {
      const transcript = context.map((m) => `${m.senderName}: ${m.content}`).join("\n");
      const goalLine = goal ? `Task: ${goal}\n` : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ctx.sessionToken) headers.Authorization = `Bearer ${ctx.sessionToken}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'You decide whether a group conversation has reached a clear consensus. ' +
                'If yes, reply with exactly "YES: <one sentence stating the decision, including specific names/choices>". ' +
                'If no, reply with exactly "NO". No other output.',
            },
            {
              role: "user",
              content: `${goalLine}Channel: ${channelName}\n\n${transcript}\n\nHas the group reached a decision?`,
            },
          ],
          preferredModel: getPreferredModel(),
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const msg = (data.message || "").trim();
      if (msg.toUpperCase().startsWith("YES:")) {
        return msg.slice(4).trim();
      }
    } catch {
      // Non-critical
    }
    return null;
  };

  let earlyDecisionSummary: string | null = null;
  const toTyp = (p: Player) => ({ name: p.name, avatar: p.avatar ?? "#8b5cf6" });

  for (let round = 0; round < maxRounds && !earlyDecisionSummary; round++) {
    for (let pi = 0; pi < channelAiPlayers.length; pi++) {
      if (earlyDecisionSummary) break;
      const player = channelAiPlayers[pi];
      const freshPlayer = ctx.playersRef.current.find((p) => p.id === player.id) ?? player;
      const status = (freshPlayer.stats?.Status as string | undefined)?.toLowerCase();
      if (status === "eliminated" || status === "dead") continue;
      ctx.setCurrentSpeakerId(freshPlayer.id);
      const upcoming = channelAiPlayers.slice(pi + 1).slice(0, 2)
        .map(p => ctx.playersRef.current.find(pp => pp.id === p.id) ?? p);
      ctx.setTypingUsers([toTyp(freshPlayer), ...upcoming.map(toTyp)]);
      const txt = await runPlayerSpeak(ctx, freshPlayer, recentContext, goal);
      ctx.setTypingUsers(upcoming.map(toTyp));
      if (txt) {
        await typewriterReveal(txt, ctx.addStreamingMessage, ctx.updateStreamingMessage, {
          senderId: freshPlayer.id, senderName: freshPlayer.name, senderAvatar: freshPlayer.avatar ?? "#8b5cf6", isAI: true,
        }, targetChannelId);
        await dynamicPace(txt.length);
        recentContext = [...recentContext, { senderName: freshPlayer.name, content: txt }];
      }
    }
    if (roomType === "decision" && round > 0) {
      const channelName = ctx.gameRoomEntries.find((c) => c.id === targetChannelId)?.name ?? targetChannelId;
      earlyDecisionSummary = await checkConsensusAndSummarise(recentContext, channelName);
    }
  }
  ctx.setCurrentSpeakerId(null);

  if (roomType === "decision") {
    const channelName = ctx.gameRoomEntries.find((c) => c.id === targetChannelId)?.name ?? targetChannelId;
    const summary =
      earlyDecisionSummary ??
      await (async () => {
        if (recentContext.length === 0) return null;
        try {
          const transcript = recentContext.map((m) => `${m.senderName}: ${m.content}`).join("\n");
          const goalLine = goal ? ` (task: ${goal})` : "";
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (ctx.sessionToken) headers.Authorization = `Bearer ${ctx.sessionToken}`;
          const res = await fetch("/api/chat", {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages: [
                { role: "system", content: "Summarise the group's decision in exactly one concise sentence. Include specific names and choices. No preamble." },
                { role: "user", content: `Channel: ${channelName}${goalLine}\n\n${transcript}\n\nSummarise:` },
              ],
              preferredModel: getPreferredModel(),
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return (data.message || "").trim() || null;
        } catch { return null; }
      })();
    if (summary) {
      ctx.pendingDecisionSummariesRef.current.push(`[${channelName}] ${summary}`);
    }
  }
}
