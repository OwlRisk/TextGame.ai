import type { Player } from "@/types/player";
import type { SpeakerQueueItem } from "@/lib/host-output-parser";
import type { ConversationMode, StreamMsgMeta } from "@/lib/game-pace";
import { parseHostActions } from "@/lib/host-actions";
import { getPreferredModel } from "@/lib/model-prefs";
import { isPlayerEliminated } from "@/lib/player-badges";
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

  gameId: string;
  gameName: string;
  gameTemplate?: string;
  gameRules?: string;
  gamePhase: string;
  humanName?: string;
  sceneId?: string;
  contentLanguage?: string;
  /** Current phase label set by the host (e.g. "Night Phase", "Day 2") */
  phaseLabel: string;
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
  /** GM engagement score for the current turn (1-5), controls passive reaction intensity */
  engagementScore?: number;
  /** GM whispers to individual characters for this turn */
  characterDirections?: import("@/lib/gm-state").CharacterDirection[];
}

export function isNightPhase(phaseLabel: string | undefined): boolean {
  if (!phaseLabel) return false;
  return /\bnight\b/i.test(phaseLabel);
}

const toTyping = (p: Player) => ({ name: p.name, avatar: p.avatar ?? "#8b5cf6" });

import { getPlayerSentenceLimit, getPlayerCharLimit } from "@/lib/player-speak-prompt";

function clampSpokenReply(text: string, template?: string): string {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const { max } = getPlayerSentenceLimit(template);
  const charLimit = getPlayerCharLimit(template);

  const sentenceMatches = normalized.match(/[^.!?]+[.!?]+/g) ?? [];
  const clamped = sentenceMatches.slice(0, max).join(" ").trim();
  if (clamped) {
    return clamped.length > charLimit ? `${clamped.slice(0, charLimit).trimEnd()}…` : clamped;
  }

  if (normalized.length <= charLimit) return normalized;
  const cut = normalized.slice(0, charLimit);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 90 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

export async function runPlayerSpeak(
  ctx: SpeakerQueueContext,
  speaker: Player,
  recent: Array<{ senderName: string; content: string }>,
  channelGoal?: string | null,
): Promise<string | null> {
  if (isPlayerEliminated(speaker)) return null;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ctx.sessionToken) headers.Authorization = `Bearer ${ctx.sessionToken}`;

    // Build player roster so AI sees the same player list as the human sidebar.
    // Only include name and public role (not private board content of others).
    const playerRoster = ctx.playersRef.current
      .filter((p) => !p.isGameMaster)
      .map((p) => ({
        name: p.name,
        // Hidden-role games should not expose private roles through roster context.
        role: p.roleRevealed ? (p.role ?? undefined) : undefined,
        isHuman: !p.isAI,
      }));

    const ac = new AbortController();
    const fetchTimer = setTimeout(() => ac.abort(), 45_000);
    const res = await fetch("/api/chat/player-speak", {
      method: "POST",
      headers,
      signal: ac.signal,
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
          speechStyle: speaker.speechStyle,
          quirk: speaker.quirk,
          boardContent: ctx.myBoardContent[speaker.id] ?? undefined,
        },
        ...(ctx.playerNotes[speaker.id] ? { playerNotes: ctx.playerNotes[speaker.id] } : {}),
        recentMessages: recent,
        playerRoster,
        preferredModel: getPreferredModel(),
        ...(channelGoal ? { channelGoal } : {}),
        ...(ctx.humanName ? { humanName: ctx.humanName } : {}),
        ...(ctx.sceneId ? { sceneId: ctx.sceneId } : {}),
        ...(ctx.contentLanguage ? { contentLanguage: ctx.contentLanguage } : {}),
        ...(ctx.characterDirections?.find((d) => d.name === speaker.name) ? {
          characterDirection: ctx.characterDirections.find((d) => d.name === speaker.name)!.direction,
        } : {}),
        gameId: ctx.gameId,
      }),
    });
    clearTimeout(fetchTimer);
    if (!res.ok) {
      if (res.status === 402) {
        const err = new Error("CREDITS_EXHAUSTED");
        (err as any).status = 402;
        throw err;
      }
      console.warn(`player-speak failed for ${speaker.name}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const rawMessage = (data.message || "").trim();
    if (!rawMessage || /^\.{1,5}$|^\u2026$/.test(rawMessage)) return null;

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

    const publicReply = clampSpokenReply(cleanContent, ctx.gameTemplate);
    return publicReply || null;
  } catch (err) {
    if (err instanceof Error && (err.message === "CREDITS_EXHAUSTED" || (err as unknown as { status?: number }).status === 402)) {
      throw err;
    }
    console.error("Error generating AI player reply:", err);
    return null;
  }
}

// ─── Passive reactions: content-aware emoji reactions from AI players ─────────

type MessageMood = "funny" | "scary" | "sad" | "exciting" | "agreeable" | "question" | "neutral";

const MOOD_RULES: Array<{ mood: MessageMood; pattern: RegExp }> = [
  { mood: "funny",     pattern: /haha|lol|lmao|rofl|😂|🤣|joke|hilarious|ridiculous|crack.?up|funny|laugh/i },
  { mood: "scary",     pattern: /scared|terrified|horror|creep|dark|shadow|scream|run!|danger|behind you|something.s (here|there|watching)|heard a|noise|blood|dead body/i },
  { mood: "sad",       pattern: /sorry|so sad|miss you|gone forever|lost (them|her|him|it)|died|dead|rip|farewell|goodbye|tragic|heartbreak/i },
  { mood: "exciting",  pattern: /!{2,}|wow!|amazing|incredible|let's go|hell yeah|found it|got it|yes!|brilliant|perfect|jackpot|escape|breakthrough/i },
  { mood: "agreeable", pattern: /\bagree\b|right!|exactly|good (point|idea|call)|true|makes sense|same|definitely|100%|absolutely|I'm in/i },
  { mood: "question",  pattern: /\?\s*$/ },
];

const MOOD_EMOJIS: Record<MessageMood, string[]> = {
  funny:     ["😂", "😅", "🤣"],
  scary:     ["😨", "😱", "👀", "😬"],
  sad:       ["😢", "💔", "🥺"],
  exciting:  ["🔥", "😮", "👏", "⚡"],
  agreeable: ["👍", "💯", "🙌"],
  question:  ["🤔", "👀"],
  neutral:   ["👍", "🤔", "😮"],
};

function detectMessageMood(content: string): MessageMood {
  for (const rule of MOOD_RULES) {
    if (rule.pattern.test(content)) return rule.mood;
  }
  return "neutral";
}

type PersonalityBias = "positive" | "skeptical" | "chaotic" | "nervous" | "default";

const PERSONALITY_BIAS_RULES: Array<{ keywords: RegExp; bias: PersonalityBias; reactChance: number }> = [
  { keywords: /warm|trusting|kind|empathetic|supportive|nurturing|caring/i,       bias: "positive",  reactChance: 0.28 },
  { keywords: /chaotic|playful|comedian|witty|humorous|funny|joker/i,             bias: "chaotic",   reactChance: 0.32 },
  { keywords: /skeptical|analytical|critical|debate|logical/i,                     bias: "skeptical", reactChance: 0.12 },
  { keywords: /quiet|observant|reserved|stoic|patient|silent/i,                    bias: "skeptical", reactChance: 0.08 },
  { keywords: /bold|confident|aggressive|leader|decisive|brash/i,                 bias: "positive",  reactChance: 0.22 },
  { keywords: /nervous|anxious|cautious|worried|timid/i,                           bias: "nervous",   reactChance: 0.18 },
  { keywords: /dramatic|expressive|emotional|passionate/i,                         bias: "chaotic",   reactChance: 0.28 },
  { keywords: /calm|reassuring|mediator|steady|soothing/i,                         bias: "positive",  reactChance: 0.18 },
];

const BIAS_EXTRA_EMOJIS: Record<PersonalityBias, Record<string, string[]>> = {
  positive:  { funny: ["❤️"], scary: ["😅"], sad: ["❤️", "🥺"], exciting: ["❤️", "👏"], agreeable: ["❤️"], question: ["👍"], neutral: ["❤️", "👍"] },
  skeptical: { funny: ["🤔"], scary: ["🤔", "👀"], sad: ["🤔"], exciting: ["🤔"], agreeable: ["🤔"], question: ["🤔", "👀"], neutral: ["🤔", "👀"] },
  chaotic:   { funny: ["🤣", "💀"], scary: ["😱", "💀"], sad: ["😅"], exciting: ["🔥", "⚡"], agreeable: ["💯"], question: ["😅", "👀"], neutral: ["😂", "🔥"] },
  nervous:   { funny: ["😅"], scary: ["😨", "😬", "😱"], sad: ["😢"], exciting: ["😅", "😮"], agreeable: ["😅"], question: ["😬"], neutral: ["😅", "😬"] },
  default:   {},
};

function getPersonalityBias(personality?: string): { bias: PersonalityBias; reactChance: number } {
  if (!personality) return { bias: "default", reactChance: 0.10 };
  for (const rule of PERSONALITY_BIAS_RULES) {
    if (rule.keywords.test(personality)) return { bias: rule.bias, reactChance: rule.reactChance };
  }
  return { bias: "default", reactChance: 0.10 };
}

function pickEmojiForPlayer(mood: MessageMood, bias: PersonalityBias): string {
  const base = MOOD_EMOJIS[mood];
  const extras = BIAS_EXTRA_EMOJIS[bias]?.[mood] ?? [];
  const pool = [...base, ...extras];
  return pool[Math.floor(Math.random() * pool.length)];
}

const ENGAGEMENT_RATIO: Record<number, { chanceMultiplier: number; maxRatio: number }> = {
  1: { chanceMultiplier: 0.1, maxRatio: 0 },
  2: { chanceMultiplier: 0.5, maxRatio: 0.15 },
  3: { chanceMultiplier: 1.0, maxRatio: 0.35 },
  4: { chanceMultiplier: 1.4, maxRatio: 0.50 },
  5: { chanceMultiplier: 1.8, maxRatio: 0.65 },
};

const MAX_REACTIONS_PER_MESSAGE = 3;
const recentReactorsByGame = new Map<string, Set<string>>();

export function triggerPassiveReactions(
  ctx: SpeakerQueueContext,
  messageId: string,
  messageContent: string,
  excludePlayerId?: string,
  engagementScore: number = 3,
): void {
  if (!ctx.addReaction) return;
  const addReaction = ctx.addReaction;
  const candidates = ctx.playersRef.current.filter(
    (p) => p.isAI && !p.isGameMaster && p.id !== excludePlayerId
  );
  if (candidates.length === 0) return;

  const gameKey = ctx.gameId;
  if (!recentReactorsByGame.has(gameKey)) recentReactorsByGame.set(gameKey, new Set());
  const recentReactors = recentReactorsByGame.get(gameKey)!;

  const mood = detectMessageMood(messageContent);
  const clamped = Math.max(1, Math.min(5, engagementScore));
  const scale = ENGAGEMENT_RATIO[clamped] ?? ENGAGEMENT_RATIO[3];
  const maxByEngagement = Math.max(0, Math.round(candidates.length * scale.maxRatio));
  const maxReactions = Math.min(maxByEngagement, MAX_REACTIONS_PER_MESSAGE);
  if (maxReactions === 0) { recentReactors.clear(); return; }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  let reactionCount = 0;
  const thisRoundReactors = new Set<string>();

  for (const player of shuffled) {
    if (reactionCount >= maxReactions) break;
    const { bias, reactChance } = getPersonalityBias(player.personality);
    let chance = reactChance * scale.chanceMultiplier;
    if (recentReactors.has(player.id)) chance *= 0.3;
    if (Math.random() > chance) continue;

    reactionCount++;
    thisRoundReactors.add(player.id);
    const emoji = pickEmojiForPlayer(mood, bias);
    const delay = 800 + Math.random() * 2500;

    setTimeout(() => {
      addReaction(messageId, emoji, player.name);
    }, delay);
  }

  recentReactors.clear();
  for (const id of thisRoundReactors) recentReactors.add(id);
}

/** Clean up per-game reaction state when a game ends */
export function clearReactionState(gameId: string): void {
  recentReactorsByGame.delete(gameId);
}

export async function speakAndReveal(
  ctx: SpeakerQueueContext,
  player: Player,
  queueIdx: number,
  upcomingPlayers: Player[],
): Promise<string | null> {
  const isScene = ctx.gameTemplate === "scene";
  await thinkingDelay(queueIdx, ctx.convMode, isScene);
  ctx.setTypingUsers([toTyping(player), ...upcomingPlayers.slice(0, 2).map(toTyping)]);
  let txt: string | null = null;
  try {
    txt = await runPlayerSpeak(ctx, player, ctx.recentForNext.current);
  } catch (err) {
    ctx.setTypingUsers([]);
    throw err;
  }
  ctx.setTypingUsers([]);
  if (txt) {
    const speed = getTypewriterSpeed(player.personality);
    const revealedMsgId = await typewriterReveal(txt, ctx.addStreamingMessage, ctx.updateStreamingMessage, {
      senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", isAI: true,
    }, ctx.channelId, speed);
    if (revealedMsgId) triggerPassiveReactions(ctx, revealedMsgId, txt, player.id, ctx.engagementScore);
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
      await dynamicPace(txt.length, player.personality, ctx.convMode, isScene);
    }
    ctx.recentForNext.current = [...ctx.recentForNext.current, { senderName: player.name, content: txt }].slice(-50);
  }
  return txt;
}

/**
 * Run the speaker queue. During night phase, skip all AI public speech —
 * night actions are handled exclusively through private channels (AUTO_CHANNEL).
 *
 * Throws CREDITS_EXHAUSTED if any player-speak call returns 402 so the
 * caller (useHostRound) can show a toast and abort the round.
 */
export async function runSpeakerQueue(
  ctx: SpeakerQueueContext,
  queue: SpeakerQueueItem[],
): Promise<boolean> {
  const night = isNightPhase(ctx.phaseLabel);

  for (let qi = 0; qi < queue.length; qi++) {
    const item = queue[qi];
    if (item.type === "human") {
      ctx.setCurrentSpeakerId(ctx.userId);
      return true;
    }
    if (item.type === "everyone") {
      ctx.setCurrentSpeakerId(null);
      if (!night && ctx.aiOnly.length > 0) {
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
      continue;
    }

    if (night) continue;

    const freshPlayer = ctx.playersRef.current.find((p) => p.id === item.player.id) ?? item.player;
    if (isPlayerEliminated(freshPlayer)) continue;
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
  maxRounds = 2,
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
    .slice(-50)
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
      if (isPlayerEliminated(freshPlayer)) continue;
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
        await dynamicPace(txt.length, undefined, undefined, ctx.gameTemplate === "scene");
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
