"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import { PlayerPanelWithBoard } from "@/app/components/player-panel-with-board";
import type { PlayerBoardData } from "@/app/components/player-board";
import { parseHostActions, resolvePlayerRefToId } from "@/lib/host-actions";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { Menu, Hash, Users } from "lucide-react";
import { SlashCommandsDialog } from "@/app/components/slash-commands-dialog";
/** Delay (ms) between Host/AI messages so the pace feels human, not instant AI. */
const HOST_PACE_MS = 2200;
const hostPace = () => new Promise<void>((r) => setTimeout(r, HOST_PACE_MS));

/** Number of AI players to reply right after the host's initial greeting */
const INITIAL_PLAYER_REPLIES = 3;

/** After host greeting, have a few AI players reply so the room feels active from the start. */
async function seedInitialPlayerReplies(
  opts: {
    channelId: string;
    hostName: string;
    hostContent: string;
    aiPlayers: Array<{ id: string; name: string; avatar?: string; role?: string; personality?: string; background?: string }>;
    gameName: string;
    rules?: string;
    addMessage: (msg: { senderId: string; senderName: string; senderAvatar: string; content: string; isAI: boolean }, channelId: string) => void;
    sessionToken: string | undefined;
    /** Return true to abort (e.g. gameId changed, component unmounted). */
    isCancelled?: () => boolean;
  }
) {
  const { channelId, hostName, hostContent, aiPlayers, gameName, rules, addMessage, sessionToken, isCancelled } = opts;
  if (!sessionToken || aiPlayers.length === 0) return;
  const toReply = aiPlayers.slice(0, INITIAL_PLAYER_REPLIES);
  const recent = [{ senderName: hostName, content: hostContent }];
  for (const player of toReply) {
    if (isCancelled?.()) return;
    try {
      const res = await fetch("/api/chat/player-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          gameName,
          rules: rules ?? "",
          player: { name: player.name, role: player.role, personality: player.personality, background: player.background },
          recentMessages: recent,
        }),
      });
      if (!res.ok || isCancelled?.()) continue;
      const data = (await res.json()) as { message?: string };
      const text = (data.message ?? "").trim();
      if (text && !isCancelled?.()) {
        addMessage(
          { senderId: player.id, senderName: player.name, senderAvatar: player.avatar ?? "#8b5cf6", content: text, isAI: true },
          channelId
        );
        recent.push({ senderName: player.name, content: text });
        await hostPace();
      }
    } catch (e) {
      console.warn("[seedInitialReplies]", e);
    }
  }
}

export default function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { session } = useAuth();
  const { games, selectedGameId, selectGame, updateGame, touchGame, addGame, gamesLoading } = useGameContext();
  const {
    messages,
    players,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    setPlayers,
    gamePhase,
    setGamePhase,
    selectedChannelId,
    setSelectedChannelId,
    gameProgress,
    userId,
    currentSpeakerId,
    setCurrentSpeakerId,
    humanGameIdentity,
    setHumanGameIdentity,
    avatarImageUrls,
    onAvatarUrlLoaded,
    isRoomLoading,
    myBoardContent,
    setMyBoardContent,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  /** True while Host + AI replies are being generated (prevents double-send and shows loading) */
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const { gameId } = use(params);
  const pathname = usePathname();

  // Cancels seedInitialPlayerReplies when gameId changes or component unmounts
  const seedCancelledRef = useRef(false);
  useEffect(() => {
    seedCancelledRef.current = false;
    return () => { seedCancelledRef.current = true; };
  }, [gameId]);

  /** 移动端左侧抽屉：'app' 应用导航 | 'channels' 频道列表 */
  const [mobileLeftDrawer, setMobileLeftDrawer] = useState<"app" | "channels" | null>(null);
  const [mobileRightDrawer, setMobileRightDrawer] = useState(false);
  /** 右侧玩家面板当前 Tab：Players | My Board（仅自己可见、仅 Host 可编辑） */
  const [rightPanelTab, setRightPanelTab] = useState<"players" | "board">("players");
  const [editCommandsGameId, setEditCommandsGameId] = useState<string | null>(null);

  useEffect(() => {
    setMobileLeftDrawer(null);
    setMobileRightDrawer(false);
  }, [pathname]);

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  useEffect(() => {
    selectGame(gameId);
  }, [gameId, selectGame]);

  // If game is not in my list but has a share link, load it so "Open in GameMaster" from /play/[token] works.
  // Wait until gamesLoading is done before deciding the game is truly absent (avoids spurious 404 for owners).
  const [sharedLoadPending, setSharedLoadPending] = useState(false);
  const sharedLoadTriedRef = useRef(false);
  useEffect(() => {
    if (gamesLoading || currentGame || !gameId || sharedLoadTriedRef.current) return;
    // Only attempt after games have loaded and game is still missing
    sharedLoadTriedRef.current = true;
    setSharedLoadPending(true);
    fetch(`/api/games/${gameId}/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => {
        if (row?.id) {
          addGame({
            id: row.id,
            name: row.name,
            icon: row.icon,
            color: row.color,
            config: row.config ?? {},
            isActive: true,
            updatedAt: row.updated_at ?? new Date().toISOString(),
          });
        }
      })
      .catch((e) => console.error('[game] Failed to load shared game:', e))
      .finally(() => setSharedLoadPending(false));
  }, [gamesLoading, currentGame, gameId, addGame]);

  // When game has GM-defined channels and context still has legacy "game-room", switch to first channel
  useEffect(() => {
    if (selectedChannelId === "game-room" && currentGame?.config?.channels?.length && currentGame.config.channels[0].id !== "game-room") {
      setSelectedChannelId(currentGame.config.channels[0].id);
    }
  }, [currentGame?.config?.channels, selectedChannelId, setSelectedChannelId]);

  // Initialize game room only if there's no saved state.
  // CRITICAL: wait until room state has loaded (isRoomLoading=false) OR we already have
  // players from the local-first cache (players.length > 0).
  // Without this guard, a race condition causes initializeGame() to fire for existing rooms
  // when currentGame loads before the DB/localStorage state arrives — flooding the room with
  // duplicate "initial greeting" messages on every visit from a new device / cleared cache.
  useEffect(() => {
    // If still loading and nothing cached yet, wait — we can't tell if it's a new or existing room.
    if (isRoomLoading && players.length === 0) return;

    // Check if we have a saved game room in localStorage
    const hasSavedState = (() => {
      try {
        const saved = localStorage.getItem(`gameRoom_${gameId}`);
        if (saved) {
          const state = JSON.parse(saved);
          return state.players && state.players.length > 0;
        }
      } catch (e) {
        console.error("Error checking saved state:", e);
      }
      return false;
    })();

    // Only initialize if no saved state and no players loaded yet
    if (!isInitialized && currentGame && players.length === 0 && !hasSavedState) {
      initializeGame();
      setIsInitialized(true);
    } else if (!isInitialized && players.length > 0) {
      // Players came from saved state (DB or localStorage) — mark initialized, don't re-init
      setIsInitialized(true);
    }
  }, [currentGame, isInitialized, players.length, gameId, isRoomLoading]);

  // Fetch human in-game identity when missing (persisted with room state).
  // Wait for room to load first — if the room has a saved identity we must not overwrite it.
  useEffect(() => {
    if (isRoomLoading) return; // wait for saved identity to arrive from DB/cache
    if (!currentGame?.config || !session?.access_token || humanGameIdentity !== null) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["Authorization"] = `Bearer ${session.access_token}`;
    fetch("/api/generate-human-game-identity", {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data: { name?: string }) => {
        const name = (data.name && data.name.trim()) ? data.name.trim().slice(0, 40) : "Player";
        setHumanGameIdentity({ name });
      })
      .catch(() => setHumanGameIdentity({ name: "Player" }));
  }, [isRoomLoading, currentGame?.id, currentGame?.name, currentGame?.config?.rules, session?.access_token, humanGameIdentity, setHumanGameIdentity]);

  // When humanGameIdentity or session changes, sync human player display name
  useEffect(() => {
    if (players.length === 0) return;
    const name = humanGameIdentity?.name || (session?.user ? (session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0])?.trim() : null) || "You";
    setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, name } : p)));
  }, [humanGameIdentity?.name, session?.user, players.length, userId, setPlayers]);

  const initializeGame = () => {
    if (!currentGame || !currentGame.config) return;

    const config = currentGame.config;
    const AI_COLORS = [
      "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", 
      "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
    ];

    // Host: use AI-generated name, avatar (same pipeline as AI players), and color/personality/gender from generate-host
    const hostColor = config.generatedHost?.color || (config.template === "werewolf"
      ? "#7c3aed"
      : config.template === "undercover"
      ? "#0ea5e9"
      : config.template === "tarot"
      ? "#b45309"
      : "#ec4899");
    const hostName = (config.generatedHost?.name || "Game Master").trim() || "Game Master";
    const hostPersonality = config.generatedHost?.personality || "A mysterious game master";

    const gameMaster = {
      id: "gm-1",
      name: hostName,
      avatar: hostColor,
      role: "Host",
      status: config.generatedHost?.voiceStyle || "Host",
      isGameMaster: true,
      isAI: true,
      isMuted: false,
      background: hostPersonality,
      personality: config.generatedHost?.voiceStyle || config.generatedHost?.personality,
      gender: (config.generatedHost as any)?.gender as "male" | "female" | "other" | undefined,
    };

    // Create AI players from configured players
    const aiPlayers = (config.configuredPlayers || []).map((configPlayer: any, i: number) => {
      const role = configPlayer.role || undefined;
      const stats: Record<string, string | number> = {};
      
      if (role && (config.template === "werewolf" || config.template === "mafia")) {
        stats.Status = "Alive";
      }
      if (configPlayer.word && config.template === "undercover") {
        stats.Word = configPlayer.word;
      }

      return {
        id: `ai-${i + 1}`,
        name: configPlayer.name,
        avatar: AI_COLORS[i % AI_COLORS.length],
        role: role || undefined,
        stats,
        isAI: true,
        isMuted: false,
        personality: configPlayer.personality || "Friendly and observant",
        background: configPlayer.background || "A game enthusiast",
        gender: configPlayer.gender as "male" | "female" | "other" | undefined,
        status: "online" as const,
      };
    });

    const userName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "You";
    // Create user player (use userId so host-assigned "NEXT_SPEAKER: You" enables this player). Role is left unset; Host assigns it via ASSIGN_ROLE in a message.
    const userPlayer = {
      id: userId,
      name: userName,
      avatar: "#6366f1",
      role: undefined as string | undefined,
      stats: config.template === "werewolf" || config.template === "mafia" ? { Status: "Alive" } : undefined,
      isAI: false,
      isMuted: false,
      status: "online" as const,
    };

    setPlayers([gameMaster, ...aiPlayers, userPlayer]);

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    const hostGreeting = config.template === "tarot"
      ? `Welcome. I'm ${hostName}, your reader today. Take a moment, then share a question or an area of your life you'd like insight on—or say you'd like a general reading. The cards are ready when you are.`
      : `Hey everyone, ${hostName} here. Rules are in the Rules section—ready when you are, let's go!`;
    addMessage(
      {
        senderId: "gm-1",
        senderName: hostName,
        senderAvatar: hostColor,
        content: hostGreeting,
        isAI: true,
      },
      defaultChannelId
    );

    // No speaker assigned yet: anyone can speak until host assigns with NEXT_SPEAKER in their reply
    setCurrentSpeakerId(null);
    setGamePhase("intro");

    // Let a few AI players reply to the host so the room feels active from the start
    seedInitialPlayerReplies({
      channelId: defaultChannelId,
      hostName,
      hostContent: hostGreeting,
      aiPlayers,
      gameName: currentGame.name,
      rules: config.rules,
      addMessage,
      sessionToken: session?.access_token,
      isCancelled: () => seedCancelledRef.current,
    }).catch((e) => console.warn("Initial player replies failed", e));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Move this game to the top of the sidebar (only triggered when player speaks)
    if (gameId) touchGame(gameId);

    const cfgChannels = currentGame?.config?.channels;
    const roomIds = cfgChannels?.length ? new Set(cfgChannels.map((c) => c.id)) : new Set(["game-room"]);
    const channelId = selectedChannelId && roomIds.has(selectedChannelId) ? selectedChannelId : (cfgChannels?.[0]?.id ?? "game-room");

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

    // Get AI response (host reply in same channel)
    setLastFailedSendContent(null);
    setIsRoundInProgress(true);
    try {
      // Build recent context so Host can choose next speaker based on current discussion
      const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentSlice = channelMessages.slice(-25);
      const recentContext =
        recentSlice.length === 0
          ? "(No prior messages in this channel.)"
          : recentSlice
              .map((m) => `- ${m.senderName}: ${m.content}`)
              .join("\n");

      const gmName = currentGame?.config?.generatedHost?.name || "Game Master";
      const gmColor = currentGame?.config?.template === "werewolf"
        ? "#7c3aed"
        : currentGame?.config?.template === "undercover"
          ? "#0ea5e9"
          : "#ec4899";
      const aiOnly = players.filter((p) => p.isAI && !p.isGameMaster);

      // Build player roster for host context
      const humanPlayer = players.find((p) => p.id === userId);
      const humanName = humanGameIdentity?.name || humanPlayer?.name || "You";
      const nonHostPlayers = players.filter((p) => !p.isGameMaster);
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

      // Build "My Board" summary: what has already been privately written to each player
      const boardEntries = Object.entries(myBoardContent)
        .map(([playerId, content]) => {
          if (!content?.trim()) return null;
          const p = players.find((pl) => pl.id === playerId);
          const name = p ? (p.id === userId ? humanName : p.name) : playerId;
          return `  [${name}]\n${content.trim()}`;
        })
        .filter(Boolean);
      const boardSummary = boardEntries.length > 0
        ? boardEntries.join("\n\n")
        : "(No private board content yet)";

      const hostSystemPrompt = `You are the in-game host (moderator) for ${currentGame?.name}. The game is already created and configured—you have NO authority to change the rules or ask for setup. Your only job is to run the game: run night/day phases, moderate voting, announce results.

REPLY LENGTH — STRICT LIMIT: Keep every reply under 80 words. Be concise and punchy. Do NOT write long paragraphs or exhaustive explanations. One clear action or question per reply. If you have more to say, spread it across future turns.

When the user says things like "Continue", "What's next?", or "Ready", advance the plot: announce the next phase (e.g. Night falls, Day breaks, time to vote), narrate briefly, and assign the next speaker with NEXT_SPEAKER.

You decide who speaks next based on the current discussion. At the end of EVERY reply, add exactly one line:
NEXT_SPEAKER: <name>[, <name2>, ...]

List as many speakers as needed, comma-separated. The game will have them speak one after another automatically. Examples:
  NEXT_SPEAKER: Juno                        ← one AI speaks
  NEXT_SPEAKER: Juno, Edda                  ← two AIs speak in order
  NEXT_SPEAKER: Juno, Edda, ${humanName}    ← two AIs then human's turn
  NEXT_SPEAKER: Everyone                    ← open discussion (one random AI responds)
  NEXT_SPEAKER: ${humanName}               ← human's turn immediately

All non-host player names (use exactly as written): ${nonHostPlayers.map((p) => (p.id === userId ? humanName : p.name)).join(", ")}.

CRITICAL — Keep the discussion going: list 2–3 AI speakers most of the time so the conversation flows. End with ${humanName} when it's a natural moment for the human to speak. Rotate among different AI players; do NOT repeat the same 1–2 names every turn. When someone suggests a specific person, prefer that choice.

VOTING PHASE RULE (VERY IMPORTANT): When it is time to vote (e.g., "Time to vote", "Cast your vote"), you MUST list ALL remaining AI players who have not yet voted in a single NEXT_SPEAKER line. Do NOT stop at 2–3 names — include every eligible AI player so voting completes automatically without human intervention between votes. Only add ${humanName} at the end after all AI votes are collected (or if the human hasn't voted yet). Example with 5 AI players: NEXT_SPEAKER: Juno, Edda, Maribel, Tomas, Gideon, ${humanName}

--- CURRENT GAME STATE ---
Phase: ${gamePhase || "intro"}

Players:
${playerRoster}

Private Board (what you have already sent to each player — do NOT repeat this publicly):
${boardSummary}

--- GAME RULES (do not modify, only enforce) ---
${currentGame?.config?.rules || "No specific rules defined."}

Role assignment: You assign each player's role (including the human). When you assign or reveal a role, add one line per assignment (no other text on that line):
ASSIGN_ROLE: <player name> -> <role>
Use the exact player name from the list above; for the human player use: ASSIGN_ROLE: ${humanName} -> <role>. Example: ASSIGN_ROLE: ${humanName} -> Civilian. These lines are hidden from the chat and applied by the game. Assign the human's role when appropriate (e.g. at game start or when they need to know).

Private "My Board" (optional): To write something only one player can see (e.g. their role, night result, secret mission), use a block that is stripped from the public message and shown only on that player's panel. Use the exact player name or "You" for the human. Example:
[BOARD:${humanName}]
You are the Werewolf. Tonight you may eliminate one player.
[/BOARD]
You can output multiple [BOARD:Name]...[/BOARD] blocks in one reply. The content inside is private to that player. Do not duplicate the same info in the public message.

Optional — Reply with an image: When a scene, card, map, or moment would be better shown than told, you may reply with an image. Output exactly these tags on their own lines:
<REPLY_TYPE>image</REPLY_TYPE>
<IMAGE_SIZE>square|portrait|landscape</IMAGE_SIZE>
<IMAGE_PROMPT>detailed DALL-E image description in English: describe subject, lighting, mood, style, and composition (e.g. "A dramatic tarot card design, golden edges, mystical fog, candlelit atmosphere, rich colors, fantasy art style, no text")</IMAGE_PROMPT>
<CAPTION>optional short caption for the image</CAPTION>
Choose IMAGE_SIZE by content: square (1:1, general); portrait (tall, e.g. card, character, full-body); landscape (wide, e.g. scene, map, horizon). Write IMAGE_PROMPT with enough detail so the image looks rich; no text inside the image. After the tags you may still add NEXT_SPEAKER and ASSIGN_ROLE lines.`;

      const applyHostRoleAssignments = (content: string): string => {
        const assignLineRegex = /^\s*ASSIGN_ROLE:\s*(.+?)\s*->\s*(.+?)\s*$/im;
        const updates: { playerId: string; role: string }[] = [];
        const lines = content.split(/\r?\n/);
        const keptLines: string[] = [];
        for (const line of lines) {
          const match = line.match(assignLineRegex);
          if (match) {
            const namePart = match[1].trim();
            const rolePart = match[2].trim();
            if (!rolePart) continue;
            const isYou = namePart.toLowerCase() === "you";
            const player = isYou
              ? players.find((p) => p.id === userId)
              : players.find((p) => p.name === namePart || (p.id === userId && (humanGameIdentity?.name ?? "").trim() === namePart));
            const targetId = isYou ? userId : player?.id;
            if (targetId) updates.push({ playerId: targetId, role: rolePart });
          } else {
            keptLines.push(line);
          }
        }
        if (updates.length > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              const u = updates.find((r) => r.playerId === p.id);
              return u ? { ...p, role: u.role } : p;
            })
          );
        }
        return keptLines.join("\n").replace(/\n{2,}/g, "\n\n").trim();
      };

      // A resolved entry in the speaking queue after Host's NEXT_SPEAKER directive
      type SpeakerQueueItem =
        | { type: "human" }
        | { type: "everyone" }
        | { type: "ai"; player: typeof players[0] };

      const parseHostResult = (raw: string): { hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[] } => {
        let hostContent = raw.trim();
        const nextSpeakerMatch = hostContent.match(/\nNEXT_SPEAKER:\s*(.+?)\s*$/im);
        let who: string | null = null;
        const speakerQueue: SpeakerQueueItem[] = [];
        if (nextSpeakerMatch) {
          who = nextSpeakerMatch[1].trim();
          hostContent = hostContent.replace(/\nNEXT_SPEAKER:\s*.+?\s*$/im, "").trim();
          // Parse comma-separated ordered list of speakers (e.g. "Juno, Edda, You")
          const names = who.split(",").map((n) => n.trim()).filter(Boolean);
          for (const name of names) {
            const nameLower = name.toLowerCase();
            if (nameLower === "you" || (humanName && nameLower === humanName.toLowerCase())) {
              speakerQueue.push({ type: "human" });
              break; // human ends the queue
            } else if (nameLower === "everyone") {
              speakerQueue.push({ type: "everyone" });
              break;
            } else {
              const player = players.find((p) => !p.isGameMaster && p.name === name);
              if (player?.isAI) speakerQueue.push({ type: "ai", player });
            }
          }
        }
        return { hostContent, who, speakerQueue };
      };

      /** Parse [BOARD:Name]...[/BOARD] etc., apply actions (e.g. My Board), return content for public display. */
      const applyHostActionsAndClean = (content: string): string => {
        const { cleanContent, actions } = parseHostActions(content);
        for (const a of actions) {
          if (a.type === "my_board") {
            const playerId = resolvePlayerRefToId(a.playerRef, players, userId, humanGameIdentity?.name);
            if (playerId) setMyBoardContent((prev) => ({ ...prev, [playerId]: a.content }));
          }
        }
        return cleanContent;
      };

      /** 主持人流式回复：先打出一条空消息再边收边更新，最后解析 NEXT_SPEAKER */
      const callHostStream = async (userContent: string, chId: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; imageUrl?: string }> => {
        const messageId = addStreamingMessage(
          { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
          chId
        );
        try {
          const res = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            body: JSON.stringify({
              systemPrompt: hostSystemPrompt,
              messages: [{ role: "user", content: userContent }],
              maxCompletionTokens: 220,
            }),
          });
          if (!res.ok || !res.body) {
            updateStreamingMessage(messageId, "…", true);
            return { hostContent: "", who: null, speakerQueue: [] };
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let acc = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split(/\n/);
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const payload = line.slice(6);
                if (payload === "[DONE]") continue;
                try {
                  const data = JSON.parse(payload) as { content?: string };
                  if (typeof data.content === "string") {
                    acc += data.content;
                    updateStreamingMessage(messageId, acc, false);
                  }
                } catch {
                  // ignore parse
                }
              }
            }
          }
          const { hostContent, who, speakerQueue } = parseHostResult(acc);
          const afterActions = applyHostActionsAndClean(hostContent);
          const displayContent = applyHostRoleAssignments(afterActions);
          updateStreamingMessage(messageId, displayContent || " ", true);
          return { hostContent: displayContent, who, speakerQueue };
        } catch (e) {
          console.error("Host stream error:", e);
          updateStreamingMessage(messageId, "…", true);
          return { hostContent: "", who: null, speakerQueue: [] };
        }
      };

      const callHost = async (userContent: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; imageUrl?: string }> => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({
            messages: [
              { role: "system", content: hostSystemPrompt },
              { role: "user", content: userContent },
            ],
          }),
        });
        if (!res.ok) return { hostContent: "", who: null, speakerQueue: [] };
        const data = await res.json();
        let hostContent = (data.message || "").trim();
        const parsed = parseHostResult(hostContent);
        const afterActions = applyHostActionsAndClean(parsed.hostContent);
        hostContent = applyHostRoleAssignments(afterActions);
        return { ...parsed, hostContent, imageUrl: data.imageUrl };
      };

      const runPlayerSpeak = async (speaker: typeof players[0], recent: Array<{ senderName: string; content: string }>): Promise<string | null> => {
        // Skip eliminated players — they should not speak
        const speakerStatus = (speaker.stats?.Status as string | undefined)?.toLowerCase();
        if (speakerStatus === "eliminated" || speakerStatus === "dead") return null;

        try {
          const res = await fetch("/api/chat/player-speak", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
            body: JSON.stringify({
              gameName: currentGame?.name,
              gameTemplate: currentGame?.config?.template,
              rules: currentGame?.config?.rules,
              gamePhase,
              player: {
                name: speaker.name,
                role: speaker.role,
                personality: speaker.personality,
                background: speaker.background,
                // Pass private My Board content so the player knows their secret info
                boardContent: myBoardContent[speaker.id] ?? undefined,
              },
              recentMessages: recent,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return (data.message || "").trim() || null;
        } catch (err) {
          console.error("Error generating AI player reply:", err);
          return null;
        }
      };

      const channelMessagesForRecent = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const firstUserContent = `Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, speakerQueue, imageUrl: firstImageUrl } = await callHostStream(firstUserContent, channelId);
      if (!hostContent && !firstImageUrl) {
        setIsRoundInProgress(false);
        return;
      }

      // Set the first speaker's turn indicator immediately so the UI reflects who's "up"
      const firstInQueue = speakerQueue[0];
      if (firstInQueue?.type === "human") setCurrentSpeakerId(userId);
      else if (firstInQueue?.type === "everyone") setCurrentSpeakerId(null);
      else if (firstInQueue?.type === "ai") setCurrentSpeakerId(firstInQueue.player.id);
      else if (!firstInQueue) {
        // Host said no next speaker: default to human
        const whoLower = who?.toLowerCase() ?? "";
        if (whoLower === "you" || (humanName && whoLower === humanName.toLowerCase())) setCurrentSpeakerId(userId);
      }

      await hostPace();
      let recentForNext = [
        ...channelMessagesForRecent.slice(-10).map((m) => ({ senderName: m.senderName, content: m.content })),
        { senderName: humanName, content },
        { senderName: gmName, content: hostContent },
      ] as Array<{ senderName: string; content: string }>;

      // Execute the ordered speaker queue produced by Host's NEXT_SPEAKER directive.
      // Each entry is either an AI player (speaks in order), "human" (stop and wait), or "everyone" (one AI at random).
      const runSpeakerQueue = async (queue: SpeakerQueueItem[]): Promise<void> => {
        for (const item of queue) {
          if (item.type === "human") {
            setCurrentSpeakerId(userId);
            return;
          }
          if (item.type === "everyone") {
            setCurrentSpeakerId(null);
            // Have one random AI chime in for "open discussion"
            if (aiOnly.length > 0) {
              const pick = aiOnly[Math.floor(Math.random() * aiOnly.length)];
              const txt = await runPlayerSpeak(pick, recentForNext);
              if (txt) {
                addMessage({ senderId: pick.id, senderName: pick.name, senderAvatar: pick.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
                await hostPace();
                recentForNext = [...recentForNext, { senderName: pick.name, content: txt }];
              }
            }
            return;
          }
          // type === "ai" — skip if eliminated
          const itemStatus = (item.player.stats?.Status as string | undefined)?.toLowerCase();
          if (itemStatus === "eliminated" || itemStatus === "dead") continue;
          const txt = await runPlayerSpeak(item.player, recentForNext);
          if (txt) {
            addMessage({ senderId: item.player.id, senderName: item.player.name, senderAvatar: item.player.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
            await hostPace();
            recentForNext = [...recentForNext, { senderName: item.player.name, content: txt }];
            // Update current speaker to whoever is next in the queue (or null when done)
            const nextIdx = queue.indexOf(item) + 1;
            const nextItem = queue[nextIdx];
            if (nextItem?.type === "human") setCurrentSpeakerId(userId);
            else if (nextItem?.type === "ai") setCurrentSpeakerId(nextItem.player.id);
            else if (!nextItem) setCurrentSpeakerId(null);
          }
        }
      };

      await runSpeakerQueue(speakerQueue);

      setCurrentSpeakerId((id) => (id === userId ? id : null));
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
      setLastFailedSendContent(content);
    } finally {
      setIsRoundInProgress(false);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastFailedSendContent) {
      handleSendMessage(lastFailedSendContent);
      setLastFailedSendContent(null);
    }
  };

  // GM-defined game rooms (always compute so hook order is stable; safe when currentGame is null)
  const configChannels = currentGame?.config?.channels;
  const gameRoomEntries = configChannels?.length
    ? configChannels.map((c) => ({ id: c.id, name: c.name, type: "game" as const }))
    : [{ id: "game-room", name: "game-room", type: "game" as const }];
  const defaultGameChannelId = gameRoomEntries[0].id;
  const gameChannels = [
    { id: "rules", name: "Rules", type: "text" as const },
    { id: "progress", name: "Progress", type: "text" as const },
    ...gameRoomEntries,
  ];
  const gameRoomIds = new Set(gameRoomEntries.map((c) => c.id));
  const isGameChannel = selectedChannelId != null && gameRoomIds.has(selectedChannelId);
  const messagesForChannel = isGameChannel
    ? messages.filter((m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId)
    : messages;

  // Quick reply: only update when it's "user's turn" (round just ended, last message from Host/AI).
  // Do not refetch when the user just sent a message — keep current suggestions until Host/AI reply again.
  useEffect(() => {
    if (!currentGame?.config || !isGameChannel) {
      setQuickRepliesLoading(false);
      setQuickReplies([]);
      return;
    }
    if (messagesForChannel.length === 0) {
      setQuickReplies([]);
      setQuickRepliesLoading(false);
      return;
    }
    if (isRoundInProgress) {
      setQuickRepliesLoading(false);
      return;
    }
    const lastMessage = messagesForChannel[messagesForChannel.length - 1];
    if (lastMessage?.senderId === userId) {
      setQuickRepliesLoading(false);
      return;
    }
    const abort = new AbortController();
    setQuickRepliesLoading(true);
    const recent = messagesForChannel.slice(-8).map((m) => ({ senderName: m.senderName, content: m.content }));
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    fetch("/api/suggest-quick-replies", {
      method: "POST",
      headers,
      signal: abort.signal,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
        recentMessages: recent,
        gamePhase,
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((data: { suggestions?: string[] }) => {
        const list = Array.isArray(data.suggestions) ? data.suggestions.filter((s) => s && s.length <= 120).slice(0, 3) : [];
        setQuickReplies(list.length > 0 ? list : []);
      })
      .catch(() => setQuickReplies([]))
      .finally(() => setQuickRepliesLoading(false));
    return () => {
      abort.abort();
      setQuickRepliesLoading(false);
    };
  }, [
    isGameChannel,
    selectedChannelId ?? null,
    currentGame?.id ?? null,
    gamePhase,
    isRoundInProgress,
    userId,
    messagesForChannel.length,
    session?.access_token ?? null,
  ]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const directUrl = `${origin}/game/${gameId}`;
    const showCopied = () => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    };

    if (!session?.access_token) {
      const ok = await copyToClipboard(directUrl);
      toast.success(ok ? "Link copied (sign in to create a share link others can open)" : "Copy link: " + directUrl);
      showCopied();
      return;
    }
    try {
      const res = await fetch(`/api/games/${gameId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const ok = await copyToClipboard(directUrl);
        toast.info(ok ? "Game not found in cloud; direct link copied. Save the game first if you need a share link." : "Game not in cloud. Save first. Link: " + directUrl);
        showCopied();
        return;
      }
      const data = (await res.json()) as { shareUrl: string };
      const ok = await copyToClipboard(data.shareUrl ?? directUrl);
      toast.success(ok ? "Share link copied! Anyone with the link can view this game." : "Share link: " + (data.shareUrl ?? directUrl));
      showCopied();
    } catch (e) {
      console.error("Share failed", e);
      const ok = await copyToClipboard(directUrl);
      toast.error(ok ? "Link copied to clipboard" : "Share failed. Link: " + directUrl);
      showCopied();
    }
  };

  if (!currentGame) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          {gamesLoading || sharedLoadPending ? (
            <>
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-4" aria-hidden />
              <p className="text-zinc-400">Loading game…</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Game not found</h1>
              <p className="text-zinc-400 text-sm mb-4">This game may have been deleted or the link is invalid.</p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const sidebarCommon = {
    games,
    selectedGameId,
    onSelectGame: (id: string) => selectGame(id),
    onCreateGame: () => router.push("/create"),
    onOpenProfile: () => router.push("/profile"),
    onUpdateGame: updateGame,
    onEditCommands: (id: string) => setEditCommandsGameId(id),
  };
  const channelListCommon = {
    gameName: currentGame?.name ?? "Game",
    channels: gameChannels,
    selectedChannelId,
    onShare: handleShare,
    shareJustCopied: shareCopied,
    textSectionLabel: "Sections",
    gameSectionLabel: "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    onDeleteChannel: (id: string | undefined) => {
      if (id === "rules" || id === "progress") {
        toast.info("Sections cannot be removed");
        return;
      }
      if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
    },
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      {/* 移动端顶栏：仅小屏显示 */}
      <header className="md:hidden flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "app" ? null : "app"))} aria-label="打开菜单">
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 truncate max-w-[40%]">{currentGame?.name ?? "Game"}</span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "channels" ? null : "channels"))} aria-label="频道与规则">
            <Hash className="size-5 text-zinc-300" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileRightDrawer((v) => !v)} aria-label="玩家列表">
            <Users className="size-5 text-zinc-300" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
      {/* 应用侧栏由 (pages) layout 统一提供，此处不再重复渲染，避免点击游戏后侧栏/头像闪烁 */}

      {/* 移动端左侧抽屉：应用导航（仅移动端，桌面端使用 layout 侧栏） */}
      <Sheet open={mobileLeftDrawer === "app"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Menu" className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950">
          <GameSidebar {...sidebarCommon} onNavigate={() => setMobileLeftDrawer(null)} />
        </SheetContent>
      </Sheet>

      {/* 移动端左侧抽屉：频道与规则 */}
      <Sheet open={mobileLeftDrawer === "channels"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Channels and rules" className="w-64 max-w-[85vw] p-0 bg-zinc-800 border-r border-zinc-700">
          <ChannelList
            {...channelListCommon}
            selectedChannelId={selectedChannelId}
            onSelectChannel={(id) => { setSelectedChannelId(id); setMobileLeftDrawer(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Game sidebar: 桌面显示，移动端在 Sheet 中 */}
      <div className="hidden md:block flex-shrink-0">
        <ChannelList
          {...channelListCommon}
          onSelectChannel={(id) => setSelectedChannelId(id)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isRoomLoading && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-violet-950/40 border-b border-violet-800/30 text-center text-xs text-violet-300">
            Loading room from cloud…
          </div>
        )}
        {selectedChannelId === "rules" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none space-y-6">
              {(currentGame?.config?.rules ?? "").trim() ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  {currentGame?.config?.rules}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <p className="text-sm font-medium">No rules defined for this game.</p>
                  <p className="text-xs mt-1">The Game Master can add rules when creating the game.</p>
                </div>
              )}

              {/* Slash commands section */}
              {(currentGame?.config?.slashCommands ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Available Commands</h3>
                  <div className="grid gap-1.5">
                    {(currentGame!.config.slashCommands!).map(({ cmd, hint }) => (
                      <div key={cmd} className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2">
                        <span className="font-mono font-semibold text-amber-400 text-sm shrink-0">{cmd}</span>
                        <span className="text-zinc-400 text-sm">{hint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : selectedChannelId === "progress" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              {(gameProgress ?? "").trim() ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  {gameProgress}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">No progress yet.</p>
                  <p className="text-xs mt-1">Game progress will appear here as the host runs the game.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : isGameChannel ? (
          <ChatArea
            channelName={gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? "game-room"}
            messages={messagesForChannel}
            players={players}
            onSendMessage={handleSendMessage}
            isGameActive={gamePhase !== "ended"}
            currentSpeakerId={currentSpeakerId}
            userId={userId}
            gameId={gameId}
            quickReplies={quickReplies}
            quickRepliesLoading={quickRepliesLoading}
            lastFailedSendContent={lastFailedSendContent}
            onRetryLastMessage={handleRetryLastMessage}
            isRoundInProgress={isRoundInProgress}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
            slashCommands={currentGame?.config?.slashCommands}
            onOpenPlayerBoard={() => {
              setMobileRightDrawer(true);
              setRightPanelTab("board");
            }}
            playerBoardLabel={currentGame?.config?.playerBoardLabel}
          />
        ) : null}
      </div>

      {/* 玩家面板 + My Board（仅自己可见，仅 AI Host 可编辑）：桌面显示，移动端在右侧 Sheet */}
      {(() => {
        const humanPlayer = players.find((p) => p.id === userId);
        const playerBoardData: PlayerBoardData = {
          characterName: humanGameIdentity?.name ?? humanPlayer?.name ?? "You",
          avatar: humanPlayer?.avatar ?? "#6366f1",
          attributes: [],
          items: [],
          statusEffects: [],
        };
        return (
          <>
            <div className="hidden md:block flex-shrink-0 w-80">
              <PlayerPanelWithBoard
                players={players}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                playerBoardData={playerBoardData}
                myBoardContentFromHost={myBoardContent[userId] ?? ""}
                currentUserId={userId}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
                playerBoardLabel={currentGame?.config?.playerBoardLabel}
              />
            </div>

            <Sheet open={mobileRightDrawer} onOpenChange={setMobileRightDrawer}>
              <SheetContent side="right" title="Players" className="w-[18rem] max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700">
                <PlayerPanelWithBoard
                  players={players}
                  gameId={gameId}
                  humanGameIdentity={humanGameIdentity}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  playerBoardData={playerBoardData}
                  myBoardContentFromHost={myBoardContent[userId] ?? ""}
                  currentUserId={userId}
                  activeTab={rightPanelTab}
                  onTabChange={setRightPanelTab}
                  playerBoardLabel={currentGame?.config?.playerBoardLabel}
                />
              </SheetContent>
            </Sheet>
          </>
        );
      })()}
      </div>

      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        offset={{ top: "72px", right: "20px" }}
        gap={12}
        toastOptions={{
          style: { zIndex: 9999 },
          duration: 4000,
        }}
      />

      {/* Slash commands editor — opened via sidebar right-click → Edit Commands */}
      {editCommandsGameId && (() => {
        const targetGame = games.find(g => g.id === editCommandsGameId);
        return (
          <SlashCommandsDialog
            open={!!editCommandsGameId}
            onClose={() => setEditCommandsGameId(null)}
            gameName={targetGame?.name}
            commands={targetGame?.config?.slashCommands ?? []}
            onSave={(cmds) => {
              if (!targetGame) return;
              updateGame(targetGame.id, {
                config: { ...targetGame.config, slashCommands: cmds },
              });
            }}
          />
        );
      })()}
    </div>
  );
}
