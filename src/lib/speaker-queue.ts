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
        gameId: ctx.gameId,
      }),
    });
    if (!res.ok) return null;
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
    console.error("Error generating AI player reply:", err);
    return null;
  }
}

// ─── Passive reactions: content-aware AI emoji reactions ─────────────────────

type Sentiment = "funny" | "tense" | "touching" | "question" | "bold" | "sad" | "excited" | "neutral";

const SENTIMENT_PATTERNS: { sentiment: Sentiment; pattern: RegExp; weight: number }[] = [
  { sentiment: "funny",    pattern: /lol|lmao|haha|😂|🤣|joke|hilarious|ridiculous|absurd|can't believe/i, weight: 2 },
  { sentiment: "funny",    pattern: /ironic|sarcas|that's rich|seriously\?|you('re| are) kidding/i, weight: 1 },
  { sentiment: "tense",    pattern: /danger|careful|watch out|run|hide|weapon|blood|scream|dark|shadow|stalker|kill|dead|attack|threat|fear|terrif/i, weight: 2 },
  { sentiment: "tense",    pattern: /suspect|betray|lying|trust no|can't trust|accuse|guilty|caught/i, weight: 1 },
  { sentiment: "touching",  pattern: /thank|grateful|love|miss you|forgive|sorry|beautiful|proud|together|protect|safe|promise/i, weight: 2 },
  { sentiment: "sad",      pattern: /sad|cry|tear|lost|gone|never again|too late|hopeless|mourn|farewell|goodbye/i, weight: 2 },
  { sentiment: "question",  pattern: /\?\s*$|what if|who do you think|why would|how did|does anyone/i, weight: 1 },
  { sentiment: "bold",     pattern: /let's go|follow me|i'll do it|charge|brave|fight|stand up|challenge|dare|confront/i, weight: 2 },
  { sentiment: "excited",  pattern: /amazing|incredible|wow|whoa|no way|found it|brilliant|perfect|yes!|let's go!/i, weight: 2 },
];

function detectSentiment(text: string): Sentiment {
  const scores: Partial<Record<Sentiment, number>> = {};
  for (const { sentiment, pattern, weight } of SENTIMENT_PATTERNS) {
    if (pattern.test(text)) scores[sentiment] = (scores[sentiment] ?? 0) + weight;
  }
  let best: Sentiment = "neutral";
  let bestScore = 0;
  for (const [s, score] of Object.entries(scores) as [Sentiment, number][]) {
    if (score > bestScore) { best = s; bestScore = score; }
  }
  return best;
}

const SENTIMENT_EMOJIS: Record<Sentiment, string[]> = {
  funny:    ["😂", "🤣", "😅", "💀"],
  tense:    ["😨", "😬", "👀", "💀", "😰"],
  touching: ["❤️", "🥹", "👏", "💪"],
  question: ["🤔", "👀", "🧐"],
  bold:     ["💪", "🔥", "👏", "😮"],
  sad:      ["😢", "💔", "🥺"],
  excited:  ["🔥", "😮", "⚡", "👏", "🤩"],
  neutral:  ["👍", "🤔", "👀"],
};

type PersonalityType = "warm" | "playful" | "skeptical" | "quiet" | "bold" | "nervous" | "dramatic" | "calm" | "default";

const PERSONALITY_CLASSIFY: { type: PersonalityType; keywords: RegExp }[] = [
  { type: "warm",      keywords: /warm|trusting|kind|empathetic|supportive|nurturing|caring/i },
  { type: "playful",   keywords: /chaotic|playful|comedian|witty|humorous|funny|joker/i },
  { type: "skeptical",  keywords: /skeptical|analytical|critical|debate|logical/i },
  { type: "quiet",     keywords: /quiet|observant|reserved|stoic|patient|silent/i },
  { type: "bold",      keywords: /bold|confident|aggressive|leader|decisive|brash/i },
  { type: "nervous",   keywords: /nervous|anxious|cautious|worried|timid/i },
  { type: "dramatic",  keywords: /dramatic|expressive|emotional|passionate/i },
  { type: "calm",      keywords: /calm|reassuring|mediator|steady|soothing/i },
];

function classifyPersonality(personality?: string): PersonalityType {
  if (!personality) return "default";
  for (const { type, keywords } of PERSONALITY_CLASSIFY) {
    if (keywords.test(personality)) return type;
  }
  return "default";
}

const PERSONALITY_OVERRIDES: Partial<Record<PersonalityType, Partial<Record<Sentiment, string[]>>>> = {
  warm:     { tense: ["😰", "🥺"], funny: ["😂", "❤️"], sad: ["❤️", "🥺", "😢"] },
  playful:  { tense: ["😅", "💀", "👀"], sad: ["😅", "💔"], touching: ["😂", "❤️"] },
  skeptical: { bold: ["🤔", "👀"], excited: ["🤔", "👀"], funny: ["😏", "🤔"] },
  quiet:    { funny: ["😅"], tense: ["👀"], excited: ["👀"] },
  nervous:  { tense: ["😨", "😰", "😬"], bold: ["😬", "😅"], funny: ["😅"] },
  dramatic: { tense: ["😱", "💀", "😨"], touching: ["😭", "❤️", "🥹"], excited: ["🤩", "🔥", "😮"] },
};

const PERSONALITY_CHANCE: Record<PersonalityType, number> = {
  warm: 0.28, playful: 0.32, skeptical: 0.15, quiet: 0.08,
  bold: 0.22, nervous: 0.18, dramatic: 0.30, calm: 0.18, default: 0.12,
};

function pickEmoji(personality: PersonalityType, sentiment: Sentiment, usedEmojis: Set<string>): string | null {
  const overrides = PERSONALITY_OVERRIDES[personality]?.[sentiment];
  const pool = overrides ?? SENTIMENT_EMOJIS[sentiment];
  const available = pool.filter(e => !usedEmojis.has(e));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

const ENGAGEMENT_RATIO: Record<number, { chanceMultiplier: number; ratio: number }> = {
  1: { chanceMultiplier: 0.1, ratio: 0 },
  2: { chanceMultiplier: 0.5, ratio: 0.15 },
  3: { chanceMultiplier: 1.0, ratio: 0.3 },
  4: { chanceMultiplier: 1.5, ratio: 0.5 },
  5: { chanceMultiplier: 2.0, ratio: 0.7 },
};

export function triggerPassiveReactions(
  ctx: SpeakerQueueContext,
  messageId: string,
  excludePlayerId?: string,
  engagementScore: number = 3,
  messageContent?: string,
): void {
  if (!ctx.addReaction) return;
  const addReaction = ctx.addReaction;
  const candidates = ctx.playersRef.current.filter(
    (p) => p.isAI && !p.isGameMaster && p.id !== excludePlayerId
  );
  if (candidates.length === 0) return;

  const clamped = Math.max(1, Math.min(5, engagementScore));
  const scale = ENGAGEMENT_RATIO[clamped] ?? ENGAGEMENT_RATIO[3];
  const maxReactions = Math.max(0, Math.round(candidates.length * scale.ratio));
  if (maxReactions === 0) return;

  const sentiment = detectSentiment(messageContent ?? "");
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const usedEmojis = new Set<string>();
  let reactionCount = 0;

  for (const player of shuffled) {
    if (reactionCount >= maxReactions) break;
    const pType = classifyPersonality(player.personality);
    const chance = PERSONALITY_CHANCE[pType];
    if (Math.random() > chance * scale.chanceMultiplier) continue;

    const emoji = pickEmoji(pType, sentiment, usedEmojis);
    if (!emoji) continue;

    usedEmojis.add(emoji);
    reactionCount++;
    const delay = 800 + Math.random() * 2500;

    setTimeout(() => {
      addReaction(messageId, emoji, player.name);
    }, delay);
  }
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
  const txt = await runPlayerSpeak(ctx, player, ctx.recentForNext.current);
  const remaining = upcomingPlayers.slice(0, 3).map(toTyping);
  ctx.setTypingUsers(remaining);
  if (txt) {
    const speed = getTypewriterSpeed(player.personality);
    const revealedMsgId = await typewriterReveal(txt, ctx.addStreamingMessage, ctx.updateStreamingMessage, {
      senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", isAI: true,
    }, ctx.channelId, speed);
    if (revealedMsgId) triggerPassiveReactions(ctx, revealedMsgId, player.id, ctx.engagementScore, txt);
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
      // "Everyone" means open-table chatter, not "hand control back to human now".
      // Let outer auto-advance logic continue and decide whether to trigger the next beat.
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
