"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Menu, Hash, Users, Link2, Check } from "lucide-react";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getPreferredModel } from "@/lib/model-prefs";
import { supabase } from "@/lib/supabase";
import { safeMarked } from "@/lib/safe-marked";
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
          preferredModel: getPreferredModel(),
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
  // Extract gameId at the top so it's available for all state/effect hooks below
  const { gameId } = use(params);
  const { session } = useAuth();
  const { games, selectedGameId, selectGame, updateGame, touchGame, addGame, gamesLoading } = useGameContext();
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
    playerNotes,
    setPlayerNotes,
    sections,
    setSections,
    gameEvents,
    setGameEvents,
    saveNow,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
  // Tracks the last message key for which suggest-quick-replies failed.
  // Prevents hammering the API with retries for the same message when other deps change.
  const quickRepliesFailKeyRef = useRef<string | null>(null);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [roomMembers, setRoomMembers] = useState<Array<{ id: string; nickname: string; is_owner: boolean; player_id: string | null; guest_id: string | null }>>([]);
  // Guests currently online according to Supabase Presence (real-time, auto-cleared on disconnect)
  const [onlineGuestPresences, setOnlineGuestPresences] = useState<Array<{ id: string; nickname: string }>>([]);

  // Guest player: arrived via /join/[inviteCode] with guestId URL param
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestMemberId, setGuestMemberId] = useState<string | null>(null);
  const [guestNickname, setGuestNickname] = useState<string | null>(null);
  // Presence: is the room owner currently online?
  const [isOwnerOnline, setIsOwnerOnline] = useState<boolean | null>(null); // null = unknown (loading)

  // ─── Multiplayer: owner / guest detection ───────────────────────────────────
  // GameContext only loads games belonging to the logged-in user; if this game
  // is in the list, the current user created it (= owner).
  // NOTE: gameId is extracted via use(params) at line ~149; isOwner depends on games list.
  // We use a lazy computed value that will be correct after games load.
  const isOwner = !!games.find((g) => g.id === gameId) && !!session?.user?.id;
  /** True if this client is a non-owner participant (guest or auth player who joined via invite) */
  const isGuestPlayer = !isOwner && !!guestId;

  /**
   * For each online guest (from Presence), enrich with their bound player info from roomMembers.
   * guest_id (presence key = guestId UUID) is matched against roomMembers[].guest_id.
   */
  const enrichedGuestMembers = useMemo(() => {
    return onlineGuestPresences.map((g) => {
      const member = roomMembers.find((m) => m.guest_id === g.id && !m.is_owner);
      const boundPlayer = member?.player_id ? players.find((p) => p.id === member.player_id) : null;
      return {
        id: g.id,
        nickname: g.nickname,
        memberId: member?.id,
        playerId: boundPlayer?.id,
        playerName: boundPlayer?.name,
        playerRole: boundPlayer?.role,
      };
    });
  }, [onlineGuestPresences, roomMembers, players]);

  /**
   * For guest clients: the player_id this guest is bound to (set by owner via PATCH endpoint).
   * Used to look up their MY_BOARD content.
   */
  const guestPlayerBinding = useMemo(() => {
    if (!isGuestPlayer || !guestId) return null;
    return roomMembers.find((m) => m.guest_id === guestId)?.player_id ?? null;
  }, [isGuestPlayer, guestId, roomMembers]);

  /** True while Host + AI replies are being generated (prevents double-send and shows loading) */
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  /**
   * Channel access control set by the AI Host via [ACCESS:ChannelName]...[/ACCESS].
   * channelId → playerIds allowed to see/enter the channel.
   * undefined entry = public (no restrictions).
   * empty array = locked (nobody).
   * ["*"] = explicitly public.
   */
  const [channelPermissions, setChannelPermissions] = useState<Record<string, string[]>>({});
  const pathname = usePathname();

  // Cancels seedInitialPlayerReplies when gameId changes or component unmounts
  const seedCancelledRef = useRef(false);
  useEffect(() => {
    seedCancelledRef.current = false;
    return () => { seedCancelledRef.current = true; };
  }, [gameId]);

  // Always reflects the latest players so async closures (handleSendMessage, runSpeakerQueue)
  // don't operate on stale role/stat data after setPlayers() takes effect between awaits.
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  // C-4: Stable ref to handleSendMessage so the guest-message-trigger effect
  // (which would otherwise re-run on every render because handleSendMessage is a new
  // function reference each time) can call the latest version without being listed
  // as an effect dependency.
  const handleSendMessageRef = useRef<((content: string, options?: { skipAddMessage?: boolean; channelId?: string }) => Promise<void>) | null>(null);

  // Summaries from "decision" private channels that need to be injected into the HOST's
  // context on the player's next message turn. Reset after each HOST call that consumes them.
  const pendingDecisionSummariesRef = useRef<string[]>([]);

  /** 移动端左侧抽屉：'app' 应用导航 | 'channels' 频道列表 */
  const [mobileLeftDrawer, setMobileLeftDrawer] = useState<"app" | "channels" | null>(null);
  const [mobileRightDrawer, setMobileRightDrawer] = useState(false);
  /** 右侧玩家面板当前 Tab：Players | My Board（仅自己可见、仅 Host 可编辑） */
  const [rightPanelTab, setRightPanelTab] = useState<"players" | "board">("players");

  useEffect(() => {
    setMobileLeftDrawer(null);
    setMobileRightDrawer(false);
  }, [pathname]);

  // ─── Multiplayer: read guestId / memberId from URL search params ────────────
  // C-6: Use game-scoped localStorage key (`guestId_${gameId}`) so that
  //      different game rooms do not share the same guest identity, preventing
  //      cross-room tracking and stale identity bleed-through.
  // Migration: if the scoped key is absent, check the legacy global "guestId"
  //      key and migrate it, preventing duplicate member records.
  useEffect(() => {
    if (typeof window === "undefined" || !gameId) return;
    const guestIdKey = `guestId_${gameId}`;
    const searchParams = new URLSearchParams(window.location.search);
    const urlGuestId = searchParams.get("guestId");
    const urlMemberId = searchParams.get("memberId");
    if (urlGuestId) {
      setGuestId(urlGuestId);
      localStorage.setItem(guestIdKey, urlGuestId);
    } else if (!session?.user?.id) {
      // Check game-scoped key first; fall back to legacy global key (one-time migration)
      const stored = localStorage.getItem(guestIdKey);
      if (stored) {
        setGuestId(stored);
      } else {
        const legacy = localStorage.getItem("guestId");
        if (legacy) {
          setGuestId(legacy);
          localStorage.setItem(guestIdKey, legacy);
          localStorage.removeItem("guestId");
        }
      }
    }
    if (urlMemberId) {
      setGuestMemberId(urlMemberId);
      localStorage.setItem(`member_${gameId}`, urlMemberId);
    } else {
      const stored = localStorage.getItem(`member_${gameId}`);
      if (stored) setGuestMemberId(stored);
    }
    const storedNickname = localStorage.getItem(`nickname_${gameId}`);
    if (storedNickname) setGuestNickname(storedNickname);
  }, [gameId, session?.user?.id]);

  // ─── Presence: owner broadcasts online status; guests/others subscribe ────
  useEffect(() => {
    if (!gameId) return;
    // All clients are ready to detect owner presence after games list is loaded
    // (isOwner is reliable once gamesLoading is false)
    if (gamesLoading) return;

    const channel = supabase.channel(`presence:${gameId}`, {
      config: { presence: { key: session?.user?.id ?? guestId ?? "anon" } },
    });

    const syncGuestsFromState = (state: Record<string, Array<{ role?: string; nickname?: string }>>) => {
      const guests = Object.entries(state).flatMap(([key, entries]) =>
        entries
          .filter((p) => p.role === "guest")
          .map((p) => ({ id: key, nickname: p.nickname ?? "Guest" }))
      );
      setOnlineGuestPresences(guests);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        const ownerPresent = Object.values(state)
          .flat()
          .some((p) => p.role === "owner");
        setIsOwnerOnline(ownerPresent);
        syncGuestsFromState(state);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if ((newPresences as Array<{ role?: string }>).some((p) => p.role === "owner")) {
          setIsOwnerOnline(true);
        }
        // sync event fires after join and rebuilds the full list
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if ((leftPresences as Array<{ role?: string }>).some((p) => p.role === "owner")) {
          // Re-check full state: another owner tab may still be open
          const state = channel.presenceState<{ role: string; nickname?: string }>();
          const ownerStillPresent = Object.values(state)
            .flat()
            .some((p) => p.role === "owner");
          setIsOwnerOnline(ownerStillPresent);
        }
        // sync event fires after leave and rebuilds the full list
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (isOwner) {
            await channel.track({ role: "owner", userId: session?.user?.id });
          } else {
            await channel.track({ role: "guest", nickname: guestNickname ?? "Guest" });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, gamesLoading, isOwner, session?.user?.id, guestId, guestNickname]);

  // ─── All participants: load + refresh member list ─────────────────────────
  // Owner refreshes every 15 s; guests also load on mount so Players Online
  // appears immediately without waiting for the first poll tick.
  useEffect(() => {
    if (!gameId) return;

    const load = () => {
      // C-1: Members API now requires auth. Pass Bearer token for authenticated
      // users; pass guestId query param for guests.
      const currentGuestId = guestId ?? (typeof window !== "undefined" ? localStorage.getItem(`guestId_${gameId}`) : null);
      const url = currentGuestId
        ? `/api/games/${gameId}/members?guestId=${encodeURIComponent(currentGuestId)}`
        : `/api/games/${gameId}/members`;
      const headers: Record<string, string> = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      fetch(url, { headers })
        .then((r) => r.ok ? r.json() : null)
        .then((data: { members?: Array<{ id: string; nickname: string; is_owner: boolean; player_id: string | null; guest_id: string | null }> } | null) => {
          if (data?.members) setRoomMembers(data.members);
        })
        .catch(() => {/* non-critical */});
    };

    load(); // immediate first fetch for everyone
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [gameId, guestId, session?.access_token]);

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  useEffect(() => {
    selectGame(gameId);
  }, [gameId, selectGame]);

  // If game is not in my list, try two fallbacks:
  // 1. Guest view: verify guestId membership and load game data (for invite-joined players)
  // 2. Public/shared view: load game via share token (for /play/[token] links)
  // Wait until gamesLoading is done before deciding the game is truly absent (avoids spurious 404 for owners).
  const [sharedLoadPending, setSharedLoadPending] = useState(false);
  const sharedLoadTriedRef = useRef(false);
  useEffect(() => {
    if (gamesLoading || currentGame || !gameId || sharedLoadTriedRef.current) return;
    sharedLoadTriedRef.current = true;
    setSharedLoadPending(true);

    // Prefer guest-view endpoint when a guestId is available.
    // Read directly from URL params to avoid race with the guestId state setter.
    const urlGuestId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("guestId")
      : null;
    // C-6: Use game-scoped key for localStorage lookup
    const guestIdForLoad = urlGuestId ?? guestId ?? (typeof window !== "undefined" ? localStorage.getItem(`guestId_${gameId}`) : null);
    const url = guestIdForLoad
      ? `/api/games/${gameId}/guest-view?guestId=${encodeURIComponent(guestIdForLoad)}`
      : `/api/games/${gameId}/public`;

    fetch(url)
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
      .catch((e) => console.error('[game] Failed to load game for guest:', e))
      .finally(() => setSharedLoadPending(false));
  }, [gamesLoading, currentGame, gameId, guestId, addGame]);

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
  // Use a ref to prevent retrying on API failure (avoids infinite-retry loop).
  const humanIdentityFetchedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isRoomLoading) return; // wait for saved identity to arrive from DB/cache
    if (!currentGame?.config || !session?.access_token) return;
    if (humanGameIdentity !== null && humanGameIdentity.name !== "Player") return;
    // Only attempt once per game to avoid hammering the API on repeated failures
    if (humanIdentityFetchedRef.current === currentGame.id) return;
    humanIdentityFetchedRef.current = currentGame.id;
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

  const handleSendMessage = async (content: string, options?: { skipAddMessage?: boolean; channelId?: string }) => {
    if (!content.trim()) return;
    // Prevent concurrent rounds: second message while AI is still replying would cause parallel Host calls
    if (isRoundInProgress) return;

    // Move this game to the top of the sidebar (only triggered when player speaks)
    if (gameId) touchGame(gameId);

    const cfgChannels = currentGame?.config?.channels;
    const roomIds = cfgChannels?.length ? new Set(cfgChannels.map((c) => c.id)) : new Set(["game-room"]);
    const channelId = options?.channelId
      ?? (selectedChannelId && roomIds.has(selectedChannelId) ? selectedChannelId : (cfgChannels?.[0]?.id ?? "game-room"));

    // When triggered by a guest message the guest's message is already in the chat.
    // Skip adding a duplicate owner message in that case.
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

    // Get AI response (host reply in same channel)
    setLastFailedSendContent(null);
    setIsRoundInProgress(true);
    try {
      // Build recent context so Host can choose next speaker based on current discussion
      const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentSlice = channelMessages.slice(-35);
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
      // Only include AI players who can access the current channel so "everyone"
      // replies don't accidentally pick an AI from a different faction's private room.
      const channelPermsForAiOnly = channelPermissions[channelId];
      const aiOnly = players.filter(
        (p) =>
          p.isAI &&
          !p.isGameMaster &&
          (!channelPermsForAiOnly ||
            channelPermsForAiOnly.includes("*") ||
            channelPermsForAiOnly.includes(p.id))
      );

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
        // If an online guest is bound to this AI slot, label them as GUEST so the AI knows
        // a real person is playing this character
        const boundGuest = roomMembers.find((m) => m.player_id === p.id && !m.is_owner);
        const personality = p.personality ? `Personality: ${p.personality}` : "";
        const background = p.background ? `Background: ${p.background}` : "";
        const extras = [personality, background].filter(Boolean).join(" | ");
        const typeLabel = boundGuest ? `GUEST: ${boundGuest.nickname}` : "AI";
        return `  • ${name} [${typeLabel}] | ${role} | ${statusStr}${extras ? ` | ${extras}` : ""}`;
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

      const eventLogSummary = gameEvents.length > 0
        ? gameEvents.map((e, i) => `  ${i + 1}. ${e}`).join("\n")
        : "(No events recorded yet)";

      // Detect game characteristics so we only inject phase-specific rules when relevant.
      const rulesText = currentGame?.config?.rules ?? "";
      const tmpl = currentGame?.config?.template ?? "";
      const hasVotingPhase =
        ["werewolf", "mafia"].includes(tmpl) ||
        /\bvot(e|ing)\b/i.test(rulesText);
      const hasNightPhase =
        ["werewolf", "mafia"].includes(tmpl) ||
        /\bnight\s*(phase|action|round)?\b/i.test(rulesText);
      const hasMultipleRooms = gameRoomEntries.length > 1;

      const hostSystemPrompt = `You are the game host (moderator) for "${currentGame?.name}". The game is already configured — your only job is to run it: advance phases, moderate interactions, and drive the story forward. You have NO authority to change rules or ask for setup.

## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. PUBLIC MESSAGE (before ---): What all players see in chat and hear via TTS. 1–2 sentences maximum. Never include directives, role info, or private content here.
2. DIRECTIVES (after ---): Hidden machine commands. Never shown to players.

Example A — with role assignment:
The roles are set. The game begins.
---
ASSIGN_ROLE: Mira Thorne -> Seer
[BOARD:Mira Thorne]
You are the Seer. Each night, secretly investigate one player.
[/BOARD]
NEXT_SPEAKER: Mira Thorne

Example B — no roles:
The ancient door swings open. What do you do?
---
NEXT_SPEAKER: ${humanName}

Always output "---" even when there are no directives.

## PACING & NARRATION
When the user says "Continue", "Ready", or "What's next?", advance the plot: announce the next phase briefly and assign the next speaker. Keep the game moving — never dwell on the same beat twice.

## SPEAKER CONTROL
Every DIRECTIVES section must end with exactly one NEXT_SPEAKER line:
NEXT_SPEAKER: <name>[, <name2>, ...]

Player names (use exactly as written): ${nonHostPlayers.map((p) => (p.id === userId ? humanName : p.name)).join(", ")}.

Examples:
  NEXT_SPEAKER: Juno                     ← one AI speaks
  NEXT_SPEAKER: Juno, Edda               ← two AIs in order
  NEXT_SPEAKER: Juno, Edda, ${humanName} ← two AIs then human's turn
  NEXT_SPEAKER: Everyone                 ← open discussion (one random AI responds)
  NEXT_SPEAKER: ${humanName}            ← human's turn immediately

List 2–3 AI speakers most turns so conversation flows naturally. End with ${humanName} at natural pauses. Rotate players; avoid repeating the same 1–2 names. Follow specific name requests when made.
When your public message asks a specific player to elaborate, explain further, continue, or respond (e.g. "Alex, tell us more" / "Alex，你详细说说"), you MUST put that player's name first in NEXT_SPEAKER so they speak immediately.
${hasVotingPhase ? `
VOTING: When it is time to vote, list ALL eligible AI players in one NEXT_SPEAKER line so voting completes without human intervention between votes. Append ${humanName} last. Example: NEXT_SPEAKER: Juno, Edda, Maribel, Tomas, ${humanName}
` : ""}${hasNightPhase ? `
NIGHT: Night-action players (role-based actors who act in private) go first — list ALL of them in a single NEXT_SPEAKER. Omit ${humanName} if their role has no night action. When the system sends "[System: all pending AI actions in this beat are done — advance the game to the next beat automatically.]", transition to the next phase and include ${humanName}. Never re-prompt players who have already acted.
` : ""}
## DIRECTIVES REFERENCE
All directives go after "---". They are stripped from public display and never read aloud.

**Role assignment** (when the game uses roles):
ASSIGN_ROLE: <exact name> -> <role>
Use only the name as shown before [AI] or [YOU/HUMAN] in the Players list. No epithets or extra text. For the human: ASSIGN_ROLE: ${humanName} -> <role>.

**Role reveal** (when game logic calls for public disclosure):
REVEAL_ROLE: <player name>   ← makes that player's role visible to all
REVEAL_ROLE: All             ← reveals everyone at once (e.g. game over)

**Player elimination** (when a player is removed from the game):
ELIMINATE: <exact name>
Marks the player as eliminated; they will not speak again. If roles are assigned in this game, also output REVEAL_ROLE: <player name>.

**Game over** (when a win/loss condition is met):
GAME_OVER: <outcome description>
Also output REVEAL_ROLE: All. Do NOT output NEXT_SPEAKER after GAME_OVER.

**Event memory** (record key moments so you never forget):
RECORD_EVENT: <one-line summary>
Use after phase transitions, eliminations, or significant discoveries. These are injected back as your memory in future turns.

**Private board** (content only one player sees):
[BOARD:<exact name or "You">]
Private content here. Markdown supported.
[/BOARD]
Multiple BOARD blocks per reply are fine. Never duplicate private info in the public message.
${hasMultipleRooms ? `
**Room access** (control which players see each game room):
[ACCESS:<RoomName>]Player1, Player2[/ACCESS]   ← restrict to named players
[ACCESS:<RoomName>]*[/ACCESS]                  ← make public (everyone)
[ACCESS:<RoomName>][/ACCESS]                   ← lock (no one)

Available rooms and their types:
${(currentGame?.config?.channels ?? gameRoomEntries).map((c) => {
  const roomType = (c as { roomType?: string }).roomType ?? "public";
  const hint =
    roomType === "decision"
      ? "AI-only private room — use AUTO_CHANNEL here at the start of each private phase with a clear goal; the system will summarise the outcome and prepend it to your next context"
      : roomType === "private_ai"
      ? "AI-only private room — use AUTO_CHANNEL for free side-discussion (no structured outcome)"
      : roomType === "broadcast"
      ? "read-only for players; host-only announcements"
      : "public — everyone can see and speak";
  return `  "${c.name}" (${roomType}) — ${hint}`;
}).join("\n")}

**Private channel auto-conversation**:
AUTO_CHANNEL: <RoomName> [| <goal>]
- "decision" rooms: members confer until consensus; result is summarised and injected into YOUR next context automatically — you will know the decision without being told here.
- "private_ai" rooms: free discussion, no structured outcome.
Place AUTO_CHANNEL BEFORE NEXT_SPEAKER. Only valid for rooms with explicit [ACCESS:...] restrictions.
Examples:
  AUTO_CHANNEL: Werewolves only | Pick a villager to eliminate tonight
  AUTO_CHANNEL: Mafia only | Decide who to threaten next round
  NEXT_SPEAKER: ${humanName}
` : ""}
**Sidebar sections** (persistent notes visible to all players):
[SECTION:<Title>]
Markdown content here.
[/SECTION]
Reusing the same title updates it in place. Good for: vote logs, phase results, clue boards, player status.

**Image reply** (when a visual would enhance the moment):
<REPLY_TYPE>image</REPLY_TYPE>
<IMAGE_SIZE>square|portrait|landscape</IMAGE_SIZE>
<IMAGE_PROMPT>English description: subject, lighting, mood, style, composition. No text in image.</IMAGE_PROMPT>
<CAPTION>optional caption</CAPTION>
Size guide: square (general), portrait (character/card), landscape (scene/map). After these tags you may still add NEXT_SPEAKER.

## CURRENT GAME STATE
Phase: ${gamePhase || "intro"}

Players:
${playerRoster}

Event Log:
${eventLogSummary}

Private Board (already sent — do not repeat publicly):
${boardSummary}

## GAME RULES (enforce only, do not modify)
${rulesText || "No specific rules defined."}`.trim();

      const applyHostRoleAssignments = (content: string): string => {
        const assignLineRegex = /^\s*ASSIGN_ROLE:\s*(.+?)\s*->\s*(.+?)\s*$/im;
        const revealLineRegex = /^\s*REVEAL_ROLE:\s*(.+?)\s*$/im;
        const gameOverLineRegex = /^\s*GAME_OVER:\s*(.+?)\s*$/im;
        const recordEventRegex = /^\s*RECORD_EVENT:\s*(.+?)\s*$/im;
        const eliminateRegex = /^\s*ELIMINATE:\s*(.+?)\s*$/im;
        const roleUpdates: { playerId: string; role: string }[] = [];
        const revealIds: string[] = [];
        const newEvents: string[] = [];
        const eliminateIds: string[] = [];
        const lines = content.split(/\r?\n/);
        const keptLines: string[] = [];
        for (const line of lines) {
          const assignMatch = line.match(assignLineRegex);
          const revealMatch = line.match(revealLineRegex);
          const gameOverMatch = line.match(gameOverLineRegex);
          const recordEventMatch = line.match(recordEventRegex);
          const eliminateMatch = line.match(eliminateRegex);
          if (gameOverMatch) {
            // GAME_OVER: <winner description> — ends the game
            setGamePhase("ended");
            newEvents.push(`GAME OVER — ${gameOverMatch[1].trim()}`);
          } else if (recordEventMatch) {
            newEvents.push(recordEventMatch[1].trim());
          } else if (eliminateMatch) {
            const namePart = eliminateMatch[1].trim();
            const nameBase = namePart.split(",")[0].trim();
            // C-5: use playersRef.current (not stale closure `players`) because
            // this function runs after multiple awaits; React state may have changed.
            const target = playersRef.current.find((p) =>
              !p.isGameMaster && (p.name === namePart || p.name === nameBase)
            );
            if (target) {
              eliminateIds.push(target.id);
              newEvents.push(`${target.name} was eliminated (role: ${target.role ?? "unknown"})`);
            }
          } else if (assignMatch) {
            const namePart = assignMatch[1].trim();
            const rolePart = assignMatch[2].trim();
            if (!rolePart) continue;
            const isYou = namePart.toLowerCase() === "you";
            // Fuzzy match: AI sometimes appends epithets (e.g. "Oren Pike, Millwright").
            // Try exact first, then fall back to matching the portion before the first comma.
            // C-5: use playersRef.current for freshest player data after awaits.
            const nameBase = namePart.split(",")[0].trim();
            const player = isYou
              ? playersRef.current.find((p) => p.id === userId)
              : playersRef.current.find((p) =>
                  p.name === namePart ||
                  p.name === nameBase ||
                  (p.id === userId && (humanGameIdentity?.name ?? "").trim() === namePart) ||
                  (p.id === userId && (humanGameIdentity?.name ?? "").trim() === nameBase)
                );
            const targetId = isYou ? userId : player?.id;
            if (targetId) roleUpdates.push({ playerId: targetId, role: rolePart });
          } else if (revealMatch) {
            // REVEAL_ROLE: Name  — makes that player's role visible in the Players panel
            const namePart = revealMatch[1].trim();
            const isAll = namePart.toLowerCase() === "all" || namePart.toLowerCase() === "everyone";
            if (isAll) {
              players.forEach((p) => { if (!p.isGameMaster) revealIds.push(p.id); });
            } else {
              const isYou = namePart.toLowerCase() === "you" || namePart.toLowerCase() === (humanName ?? "").toLowerCase();
              const nameBase = namePart.split(",")[0].trim();
              const target = isYou
                ? players.find((p) => p.id === userId)
                : players.find((p) => p.name === namePart || p.name === nameBase);
              if (target) revealIds.push(target.id);
            }
          } else {
            keptLines.push(line);
          }
        }
        if (roleUpdates.length > 0 || revealIds.length > 0 || eliminateIds.length > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              const roleUp = roleUpdates.find((r) => r.playerId === p.id);
              const reveal = revealIds.includes(p.id);
              const eliminate = eliminateIds.includes(p.id);
              const updates: Partial<typeof p> = {};
              if (roleUp) updates.role = roleUp.role;
              if (reveal) updates.roleRevealed = true;
              if (eliminate) updates.stats = { ...(p.stats ?? {}), Status: "eliminated" };
              return Object.keys(updates).length ? { ...p, ...updates } : p;
            })
          );
        }
        if (newEvents.length > 0) {
          setGameEvents((prev) => [...prev, ...newEvents]);
        }
        return keptLines.join("\n").replace(/\n{2,}/g, "\n\n").trim();
      };

      // A resolved entry in the speaking queue after Host's NEXT_SPEAKER directive
      type SpeakerQueueItem =
        | { type: "human" }
        | { type: "everyone" }
        | { type: "ai"; player: typeof players[0] };

      // Fuzzy channel name resolver: exact match first, then partial containment.
      // Prevents AUTO_CHANNEL / ACCESS directives from silently failing when the
      // HOST slightly misspells a room name (e.g. "Werewolf only" vs "Werewolves only").
      const resolveChannelByName = (name: string): string | null => {
        const n = name.toLowerCase().trim();
        const exact = gameRoomEntries.find((c) => c.name.toLowerCase() === n);
        if (exact) return exact.id;
        // Partial: query contains entry name, or entry name contains query
        const partial = gameRoomEntries.find(
          (c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())
        );
        return partial?.id ?? null;
      };

      const parseHostResult = (raw: string): { hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: string | null; autoChannelGoal: string | null } => {
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
              // Fuzzy: AI sometimes appends epithets (e.g. "Garrick Wold, Wolf-Trapper").
              // Try exact first, then fall back to the portion before the first comma.
              const nameBase = name.split(",")[0].trim();
              const player = players.find((p) => !p.isGameMaster && (p.name === name || p.name === nameBase));
              if (player?.isAI) speakerQueue.push({ type: "ai", player });
            }
          }
        }
        // AUTO_CHANNEL: triggers an autonomous AI conversation in a private channel.
        // Supports optional goal via pipe: AUTO_CHANNEL: Room Name | Pick tonight's target
        const autoChannelMatch = hostContent.match(/\nAUTO_CHANNEL:\s*(.+?)\s*$/im);
        let autoChannelId: string | null = null;
        let autoChannelGoal: string | null = null;
        if (autoChannelMatch) {
          const raw = autoChannelMatch[1].trim();
          const pipeIdx = raw.indexOf("|");
          const channelName = pipeIdx >= 0 ? raw.slice(0, pipeIdx).trim() : raw;
          autoChannelGoal = pipeIdx >= 0 ? raw.slice(pipeIdx + 1).trim() : null;
          autoChannelId = resolveChannelByName(channelName);
          hostContent = hostContent.replace(/\nAUTO_CHANNEL:\s*.+?\s*$/im, "").trim();
        }
        return { hostContent, who, speakerQueue, autoChannelId, autoChannelGoal };
      };

      /** Parse [BOARD:Name]...[/BOARD], [ACCESS:Room]...[/ACCESS], [SECTION:Title]...[/SECTION], etc. Apply actions; return public display content. */
      const applyHostActionsAndClean = (content: string): string => {
        const { cleanContent, actions } = parseHostActions(content);
        for (const a of actions) {
          if (a.type === "my_board") {
            const playerId = resolvePlayerRefToId(a.playerRef, players, userId, humanGameIdentity?.name);
            if (playerId) setMyBoardContent((prev) => ({ ...prev, [playerId]: a.content }));
          } else if (a.type === "access") {
            // Resolve channel ref with fuzzy matching so minor HOST misspellings still work.
            const chId = resolveChannelByName(a.channelRef);
            if (!chId) continue;

            if (a.playerRefs.includes("*")) {
              // Explicitly public: remove any restriction
              setChannelPermissions((prev) => {
                const next = { ...prev };
                delete next[chId];
                return next;
              });
            } else {
              // Resolve each player ref to an id
              const resolvedIds = a.playerRefs
                .map((ref) => resolvePlayerRefToId(ref, players, userId, humanGameIdentity?.name))
                .filter((id): id is string => id !== null);
              setChannelPermissions((prev) => ({ ...prev, [chId]: resolvedIds }));

              // If human no longer has access and is currently viewing this channel → switch away
              if (!resolvedIds.includes(userId)) {
                setSelectedChannelId((cur) => (cur === chId ? defaultGameChannelId : cur));
              }
            }
          } else if (a.type === "section") {
            const id = "section-" + a.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
            toast.success(a.summary || "Game over!", {
              duration: 8000,
              description: "This game has been marked as completed.",
            });
          }
        }
        return cleanContent;
      };

      /**
       * Extract the public message portion from the accumulated stream.
       * With the new --- separator format: everything before --- is the public message.
       * Fallback (no --- yet): strip any partial/complete [BOARD:...] blocks to avoid
       * leaking private role info while the stream is still in progress.
       */
      const getStreamingDisplay = (raw: string): string => {
        const sepIdx = raw.search(/\n---\s*(\n|$)/);
        if (sepIdx >= 0) return raw.slice(0, sepIdx).trim();
        // No separator yet — redact BOARD blocks as a safety fallback
        let cleaned = raw.replace(/\[BOARD:[^\]]*\][\s\S]*?\[\/BOARD\]/gi, "");
        cleaned = cleaned.replace(/\[BOARD:[^\]]*\][\s\S]*$/gi, "");
        return cleaned.replace(/\n{2,}/g, "\n\n").trim();
      };

      /**
       * Split host output at --- into (message, directives).
       * If no separator is found, treat the entire content as directives (fallback).
       */
      const splitHostOutput = (raw: string): { message: string; directives: string } => {
        const sepIdx = raw.search(/\n---\s*(\n|$)/);
        if (sepIdx >= 0) {
          const message = raw.slice(0, sepIdx).trim();
          const directives = raw.slice(raw.indexOf("\n", sepIdx + 1) + 1).trim();
          return { message, directives };
        }
        // Fallback: old format — entire content goes through directive parsers and clean
        return { message: "", directives: raw };
      };

      /** 主持人流式回复：先打出一条空消息再边收边更新，最后解析 NEXT_SPEAKER */
      const callHostStream = async (userContent: string, chId: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: string | null; autoChannelGoal: string | null; imageUrl?: string }> => {
        const messageId = addStreamingMessage(
          { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
          chId
        );
        // Give the host enough room for all structural output (BOARD blocks, ASSIGN_ROLE lines,
        // SECTION blocks, etc.). The AI is already instructed to be concise in its narrative,
        // so a generous budget doesn't make replies verbose — it just prevents truncation.
        // Server-side cap is 4096; we leave headroom for complex games and large player counts.
        const streamTokenBudget = Math.min(4096, 500 + players.length * 80);
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
          if (!res.ok || !res.body) {
            updateStreamingMessage(messageId, "…", true);
            return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
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
                    // Only show the public message portion (before ---).
                    // If --- hasn't arrived yet, fall back to redacting BOARD blocks.
                    updateStreamingMessage(messageId, getStreamingDisplay(acc), false);
                  }
                } catch {
                  // ignore parse
                }
              }
            }
          }
          // Split into public message and directive section
          const { message: splitMessage, directives } = splitHostOutput(acc);
          // Process all directives (NEXT_SPEAKER, ASSIGN_ROLE, BOARD, SECTION, AUTO_CHANNEL, etc.)
          const { hostContent: directivesClean, who, speakerQueue, autoChannelId, autoChannelGoal } = parseHostResult(directives);
          applyHostActionsAndClean(directivesClean);
          applyHostRoleAssignments(directivesClean);
          // Determine the final public display
          const displayContent = splitMessage || (() => {
            // Fallback: derive display from directives clean content (old behavior)
            const afterActions = applyHostActionsAndClean(directivesClean);
            return applyHostRoleAssignments(afterActions);
          })();
          updateStreamingMessage(messageId, displayContent || " ", true);
          return { hostContent: displayContent, who, speakerQueue, autoChannelId, autoChannelGoal };
        } catch (e) {
          console.error("Host stream error:", e);
          updateStreamingMessage(messageId, "…", true);
          return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
        }
      };

      const callHost = async (userContent: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: string | null; autoChannelGoal: string | null; imageUrl?: string }> => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({
            messages: [
              { role: "system", content: hostSystemPrompt },
              { role: "user", content: userContent },
            ],
            preferredModel: getPreferredModel(),
          }),
        });
        if (!res.ok) return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
        const data = await res.json();
        let hostContent = (data.message || "").trim();
        const parsed = parseHostResult(hostContent);
        const afterActions = applyHostActionsAndClean(parsed.hostContent);
        hostContent = applyHostRoleAssignments(afterActions);
        return { ...parsed, hostContent, imageUrl: data.imageUrl };
      };

      const runPlayerSpeak = async (speaker: typeof players[0], recent: Array<{ senderName: string; content: string }>, channelGoal?: string | null): Promise<string | null> => {
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
              // Pass the player's own notes from previous turns
              ...(playerNotes[speaker.id] ? { playerNotes: playerNotes[speaker.id] } : {}),
              recentMessages: recent,
              preferredModel: getPreferredModel(),
              ...(channelGoal ? { channelGoal } : {}),
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const rawMessage = (data.message || "").trim();
          if (!rawMessage) return null;

          // Extract [MY_NOTES] from the player's message and save them privately
          const { cleanContent, actions } = parseHostActions(rawMessage);
          const notesAction = actions.find((a) => a.type === "player_notes");
          if (notesAction && notesAction.type === "player_notes") {
            setPlayerNotes((prev) => ({ ...prev, [speaker.id]: notesAction.content }));
          }
          return cleanContent || null;
        } catch (err) {
          console.error("Error generating AI player reply:", err);
          return null;
        }
      };

      // Run an autonomous AI-only conversation in a private channel.
      // Called when HOST emits AUTO_CHANNEL: <RoomName> [| goal text] in its DIRECTIVES section.
      // Behaviour depends on the channel's roomType:
      //   "decision"   – runs until consensus detected (or maxRounds), then generates a 1-sentence
      //                  summary that is queued for injection into the HOST's next context call.
      //   "private_ai" – free discussion for maxRounds; no structured outcome.
      const runPrivateChannelConversation = async (targetChannelId: string, goal: string | null, maxRounds = 3): Promise<void> => {
        const perms = channelPermissions[targetChannelId];
        if (!perms || perms.includes("*")) return;
        const channelAiPlayers = playersRef.current.filter(
          (p) => p.isAI && !p.isGameMaster && perms.includes(p.id)
        );
        if (channelAiPlayers.length === 0) return;

        const roomType = currentGame?.config?.channels?.find((c) => c.id === targetChannelId)?.roomType ?? "private_ai";

        const channelRecent = messages
          .filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === targetChannelId)
          .slice(-15)
          .map((m) => ({ senderName: m.senderName, content: m.content }));
        let recentContext = channelRecent;

        // For decision rooms: check consensus after each complete round using LLM.
        // Returns either null (no consensus yet) or a one-sentence decision summary.
        // Language-agnostic — works regardless of the conversation language.
        const checkConsensusAndSummarise = async (
          context: Array<{ senderName: string; content: string }>,
          channelName: string
        ): Promise<string | null> => {
          if (context.length === 0) return null;
          try {
            const transcript = context.map((m) => `${m.senderName}: ${m.content}`).join("\n");
            const goalLine = goal ? `Task: ${goal}\n` : "";
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
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
            // Non-critical — fall through and continue rounds.
          }
          return null;
        };

        let earlyDecisionSummary: string | null = null;

        for (let round = 0; round < maxRounds && !earlyDecisionSummary; round++) {
          for (const player of channelAiPlayers) {
            if (earlyDecisionSummary) break;
            const freshPlayer = playersRef.current.find((p) => p.id === player.id) ?? player;
            const status = (freshPlayer.stats?.Status as string | undefined)?.toLowerCase();
            if (status === "eliminated" || status === "dead") continue;
            setCurrentSpeakerId(freshPlayer.id);
            const txt = await runPlayerSpeak(freshPlayer, recentContext, goal);
            if (txt) {
              addMessage(
                { senderId: freshPlayer.id, senderName: freshPlayer.name, senderAvatar: freshPlayer.avatar ?? "#8b5cf6", content: txt, isAI: true },
                targetChannelId
              );
              await hostPace();
              recentContext = [...recentContext, { senderName: freshPlayer.name, content: txt }];
            }
          }
          // After each full round (all players spoke), check for consensus in decision rooms.
          // Skip round 0 — too early; need at least one exchange before judging.
          if (roomType === "decision" && round > 0) {
            const channelName = gameRoomEntries.find((c) => c.id === targetChannelId)?.name ?? targetChannelId;
            earlyDecisionSummary = await checkConsensusAndSummarise(recentContext, channelName);
          }
        }
        setCurrentSpeakerId(null);

        // Queue the decision summary for injection into HOST context on the next human turn.
        if (roomType === "decision") {
          const channelName = gameRoomEntries.find((c) => c.id === targetChannelId)?.name ?? targetChannelId;
          const summary =
            earlyDecisionSummary ??
            // Fallback: if early consensus check wasn't triggered (only ran 1 round), summarise now.
            await (async () => {
              if (recentContext.length === 0) return null;
              try {
                const transcript = recentContext.map((m) => `${m.senderName}: ${m.content}`).join("\n");
                const goalLine = goal ? ` (task: ${goal})` : "";
                const res = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
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
            pendingDecisionSummariesRef.current.push(`[${channelName}] ${summary}`);
          }
        }
      };

      const channelMessagesForRecent = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      // Inject any queued decision summaries from previous private-channel conversations
      // so the HOST is aware of what was decided before this turn began.
      const decisionSummaryPrefix = pendingDecisionSummariesRef.current.length > 0
        ? `[System: cross-channel decisions since last turn]\n${pendingDecisionSummariesRef.current.join("\n")}\n\n`
        : "";
      pendingDecisionSummariesRef.current = [];

      const firstUserContent = `${decisionSummaryPrefix}Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, speakerQueue, autoChannelId: firstAutoChannelId, autoChannelGoal: firstAutoChannelGoal, imageUrl: firstImageUrl } = await callHostStream(firstUserContent, channelId);
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
        ...channelMessagesForRecent.slice(-18).map((m) => ({ senderName: m.senderName, content: m.content })),
        { senderName: humanName, content },
        { senderName: gmName, content: hostContent },
      ] as Array<{ senderName: string; content: string }>;

      // Execute the ordered speaker queue produced by Host's NEXT_SPEAKER directive.
      // Returns true if the queue ended at a human turn (game waits for user input),
      // false if the queue exhausted without a human (auto-advance may be triggered).
      const runSpeakerQueue = async (queue: SpeakerQueueItem[]): Promise<boolean> => {
        for (const item of queue) {
          if (item.type === "human") {
            setCurrentSpeakerId(userId);
            return true;
          }
          if (item.type === "everyone") {
            setCurrentSpeakerId(null);
            // Have one random AI chime in for "open discussion"
            if (aiOnly.length > 0) {
              const pick = aiOnly[Math.floor(Math.random() * aiOnly.length)];
              // Refresh player data so any role/stat changes from setPlayers are visible.
              const freshPick = playersRef.current.find((p) => p.id === pick.id) ?? pick;
              const txt = await runPlayerSpeak(freshPick, recentForNext);
              if (txt) {
                addMessage({ senderId: freshPick.id, senderName: freshPick.name, senderAvatar: freshPick.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
                await hostPace();
                recentForNext = [...recentForNext, { senderName: freshPick.name, content: txt }];
              }
            }
            return true; // treat "everyone" as human-stopping point
          }
          // type === "ai" — refresh player data to pick up any role/stat updates, then skip if eliminated
          const freshPlayer = playersRef.current.find((p) => p.id === item.player.id) ?? item.player;
          const itemStatus = (freshPlayer.stats?.Status as string | undefined)?.toLowerCase();
          if (itemStatus === "eliminated" || itemStatus === "dead") continue;
          const txt = await runPlayerSpeak(freshPlayer, recentForNext);
          if (txt) {
            addMessage({ senderId: freshPlayer.id, senderName: freshPlayer.name, senderAvatar: freshPlayer.avatar ?? "#8b5cf6", content: txt, isAI: true }, channelId);
            await hostPace();
            recentForNext = [...recentForNext, { senderName: freshPlayer.name, content: txt }];
            // Update current speaker to whoever is next in the queue (or null when done)
            const nextIdx = queue.indexOf(item) + 1;
            const nextItem = queue[nextIdx];
            if (nextItem?.type === "human") setCurrentSpeakerId(userId);
            else if (nextItem?.type === "ai") setCurrentSpeakerId(nextItem.player.id);
            else if (!nextItem) setCurrentSpeakerId(null);
          }
        }
        return false; // queue exhausted without a human turn
      };

      // If Host requested a private channel side-conversation (AUTO_CHANNEL), run it now
      // before returning control to the player. Only triggered on the first host response,
      // not inside the auto-advance loop, to avoid cascading side effects.
      if (firstAutoChannelId) {
        await runPrivateChannelConversation(firstAutoChannelId, firstAutoChannelGoal);
      }

      // Run the first queue from the host's response.
      // If it ends WITHOUT the human (e.g. pure AI night-phase sequence), auto-advance
      // the game by calling the host again — up to MAX_AUTO_ADVANCES times — so the
      // game never gets stuck waiting for a villager who has no night action.
      const MAX_AUTO_ADVANCES = 6;
      let currentQueue = speakerQueue;
      let humanReached = await runSpeakerQueue(currentQueue);

      for (let i = 0; i < MAX_AUTO_ADVANCES && !humanReached && gamePhase !== "ended"; i++) {
        await hostPace();
        const advanced = await callHostStream(
          "[System: all pending AI actions in this beat are done — advance the game to the next beat automatically.]",
          channelId
        );
        if (!advanced.hostContent) break;
        recentForNext = [
          ...recentForNext,
          { senderName: gmName, content: advanced.hostContent },
        ];
        currentQueue = advanced.speakerQueue;
        humanReached = await runSpeakerQueue(currentQueue);
      }

      if (!humanReached) setCurrentSpeakerId((id) => (id === userId ? id : null));
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get response from Game Master");
      setLastFailedSendContent(content);
    } finally {
      setIsRoundInProgress(false);
      // Immediately flush state to DB so other room members see updates via Realtime
      saveNow();
    }
  };

  // C-4: Keep the ref current on every render so the trigger effect always
  // calls the latest version without needing it in the dependency array.
  handleSendMessageRef.current = handleSendMessage;

  const handleRetryLastMessage = useCallback(() => {
    if (lastFailedSendContent) {
      handleSendMessage(lastFailedSendContent);
      setLastFailedSendContent(null);
    }
  }, [lastFailedSendContent, handleSendMessage]);

  // ─── Owner: auto-trigger AI when a guest message arrives via Realtime ────────
  // Track the last processed message ID so we only respond to NEW guest messages.
  // C-4: Use handleSendMessageRef instead of handleSendMessage directly so this
  // effect is NOT re-run on every render (the function reference changes each render).
  const lastProcessedGuestMsgRef = useRef<string | null>(null);
  // Tracks whether we have seen the initial DB-loaded messages yet.
  // On the first run that contains guest messages we record the latest ID without
  // triggering the AI — this prevents re-firing for historical messages after a
  // page refresh.  Only messages that arrive AFTER initialization will trigger AI.
  const autoTriggerInitializedRef = useRef(false);
  useEffect(() => {
    if (!isOwner || isRoundInProgress) return;
    const guestMessages = messages.filter(
      (m) => (m as unknown as { isGuestMessage?: boolean }).isGuestMessage && !m.isAI
    );
    if (guestMessages.length === 0) return;
    const latest = guestMessages[guestMessages.length - 1];

    if (!autoTriggerInitializedRef.current) {
      // First time we see guest messages: these are historical (loaded from DB on mount).
      // Mark the latest as processed so we don't re-trigger AI for them after refresh.
      autoTriggerInitializedRef.current = true;
      lastProcessedGuestMsgRef.current = latest.id;
      return;
    }

    if (latest.id === lastProcessedGuestMsgRef.current) return;
    lastProcessedGuestMsgRef.current = latest.id;
    // Trigger host AI response. Pass skipAddMessage so the guest's existing message
    // is not duplicated under the owner's name. Pass channelId so the AI replies
    // in the same channel the guest used, not necessarily the owner's current view.
    handleSendMessageRef.current?.(latest.content, {
      skipAddMessage: true,
      channelId: (latest as unknown as { channelId?: string }).channelId ?? undefined,
    });
  }, [messages, isOwner, isRoundInProgress]); // handleSendMessage intentionally omitted — use ref

  // GM-defined game rooms (always compute so hook order is stable; safe when currentGame is null)
  // Derive a stable cache key from channel IDs so useMemo doesn't recompute on every context update.
  const channelsCacheKey = currentGame?.config?.channels?.map((c) => c.id).join(",") ?? "";
  const gameRoomEntries = useMemo(() => {
    const cfg = currentGame?.config?.channels;
    return cfg?.length
      ? cfg.map((c) => ({ id: c.id, name: c.name, type: "game" as const }))
      : [{ id: "game-room", name: "game-room", type: "game" as const }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelsCacheKey]);

  const defaultGameChannelId = gameRoomEntries[0].id;

  // Filter game rooms based on AI-managed access control.
  // Rules / Progress (text sections) are always visible.
  const visibleGameRoomEntries = useMemo(
    () =>
      gameRoomEntries.filter((ch) => {
        const perms = channelPermissions[ch.id];
        if (!perms) return true;
        if (perms.includes("*")) return true;
        return perms.includes(userId);
      }),
    [gameRoomEntries, channelPermissions, userId]
  );

  const gameChannels = useMemo(
    () => [
      { id: "rules", name: "Rules", type: "text" as const },
      { id: "progress", name: "Progress", type: "text" as const },
      ...sections.map((s) => ({ id: s.id, name: s.name, type: "text" as const })),
      ...visibleGameRoomEntries,
    ],
    [sections, visibleGameRoomEntries]
  );

  const gameRoomIds = useMemo(
    () => new Set(gameRoomEntries.map((c) => c.id)),
    [gameRoomEntries]
  );

  const isGameChannel = useMemo(
    () => selectedChannelId != null && gameRoomIds.has(selectedChannelId),
    [selectedChannelId, gameRoomIds]
  );

  const messagesForChannel = useMemo(
    () =>
      isGameChannel
        ? messages.filter((m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId)
        : messages,
    [isGameChannel, messages, selectedChannelId, defaultGameChannelId]
  );

  // Unread message counts per game channel — tracked by recording the message count at the
  // moment the user switches to a channel, then computing the delta as new messages arrive.
  const [seenMessageCounts, setSeenMessageCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!selectedChannelId) return;
    const currentCount = messages.filter(
      (m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId
    ).length;
    setSeenMessageCounts((prev) => ({ ...prev, [selectedChannelId]: currentCount }));
    // Intentionally only re-runs on selectedChannelId change, not on every new message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const channelId of gameRoomIds) {
      if (channelId === selectedChannelId) continue;
      const total = messages.filter(
        (m) => (m.channelId ?? defaultGameChannelId) === channelId
      ).length;
      const seen = seenMessageCounts[channelId] ?? 0;
      const delta = total - seen;
      if (delta > 0) counts[channelId] = delta;
    }
    return counts;
  }, [messages, seenMessageCounts, gameRoomIds, defaultGameChannelId, selectedChannelId]);

  // Show only players who can access the currently selected channel.
  // Uses channelPermissions directly — no hardcoding of channel types.
  // If no permissions are defined (or the list contains "*"), all players are shown.
  // The host (isGameMaster) is always shown regardless of restrictions.
  const playersForChannel = useMemo(() => {
    const perms = selectedChannelId ? channelPermissions[selectedChannelId] : undefined;
    if (!perms || perms.includes("*")) return players;
    return players.filter((p) => p.isGameMaster || perms.includes(p.id));
  }, [players, selectedChannelId, channelPermissions]);

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
    // Don't show quick replies until the user has spoken at least once in this channel.
    // This prevents "default" suggestions from appearing at the start of the game
    // before the user has engaged.
    const userHasSpoken = messagesForChannel.some((m) => m.senderId === userId);
    if (!userHasSpoken) {
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
    // Skip if we already tried (and failed) for this exact message — avoids hammering
    // the API when other deps (gamePhase, isRoundInProgress) change for the same message.
    const attemptKey = `${selectedChannelId ?? ''}:${lastMessage?.id ?? messagesForChannel.length}`;
    if (quickRepliesFailKeyRef.current === attemptKey) {
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
        preferredModel: getPreferredModel(),
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((data: { suggestions?: string[] }) => {
        quickRepliesFailKeyRef.current = null;
        const list = Array.isArray(data.suggestions) ? data.suggestions.filter((s) => s && s.length <= 120).slice(0, 3) : [];
        setQuickReplies(list.length > 0 ? list : []);
      })
      .catch(() => { quickRepliesFailKeyRef.current = attemptKey; setQuickReplies([]); })
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

  const handleShare = useCallback(async () => {
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
  }, [gameId, session?.access_token]);

  /** Generate invite link and copy to clipboard. Owner only. */
  const handleInvite = useCallback(async () => {
    if (!session?.access_token || !gameId) return;
    try {
      const res = await fetch(`/api/games/${gameId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { toast.error("Failed to generate invite link"); return; }
      const data = (await res.json()) as { inviteUrl: string };
      const ok = await copyToClipboard(data.inviteUrl);
      toast.success(ok ? "Invite link copied! Share it with players." : `Invite: ${data.inviteUrl}`);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch (e) {
      console.error("[invite]", e);
      toast.error("Failed to generate invite link");
    }
  }, [gameId, session?.access_token]);

  /**
   * Guest sends a message via the server-side API route (bypasses auth requirement).
   * The server appends the message to game_room_state and Realtime notifies the owner.
   *
   * I-5: If the server call fails, we roll back the optimistic message so the
   *      guest is not misled into thinking their message was delivered.
   */
  const handleGuestSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !gameId) return;
    const cfgChannels = currentGame?.config?.channels;
    const channelId = selectedChannelId ?? cfgChannels?.[0]?.id ?? "game-room";

    // Generate the message ID here so the local optimistic message and the
    // Realtime echo share the same ID — preventing the duplicate that occurs
    // when mergeRemoteState adds the server copy (which had a different ID).
    const messageId = `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Optimistically add message to local UI
    addMessage(
      {
        id: messageId,
        senderId: guestId ?? "guest",
        senderName: guestNickname ?? "Guest",
        senderAvatar: "#8b5cf6",
        content,
        isAI: false,
      },
      channelId
    );

    try {
      const res = await fetch(`/api/games/${gameId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,  // server will use this ID so Realtime echo matches
          guestId,
          content,
          nickname: guestNickname ?? "Guest",
          channelId,
        }),
      });
      if (!res.ok) {
        // I-5: Roll back the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 429) {
          toast.error("Sending too fast — please wait a moment.");
        } else {
          toast.error(data.error ?? "Failed to send message");
        }
      }
    } catch (e) {
      console.error("[guest message]", e);
      // I-5: Roll back the optimistic message on network error
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.error("Failed to send message");
    }
  }, [gameId, guestId, guestNickname, selectedChannelId, currentGame?.config?.channels, addMessage, setMessages]);

  /**
   * Owner assigns (or unassigns) an online guest to an AI player slot.
   * Calls PATCH /api/games/[gameId]/members/[memberId] then refreshes the member list.
   */
  const handleAssignGuestToPlayer = useCallback(async (memberId: string, playerId: string | null) => {
    if (!session?.access_token) return;
    try {
      await fetch(`/api/games/${gameId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ playerId }),
      });
      // Refresh member list to reflect new binding
      const url = `/api/games/${gameId}/members`;
      const data = await fetch(url, {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      }).then((r) => r.ok ? r.json() : null);
      if (data?.members) setRoomMembers(data.members);
    } catch {
      /* non-critical */
    }
  }, [gameId, session?.access_token]);

  if (!currentGame) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-zinc-900 text-white">
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
  };
  const channelListCommon = {
    gameName: currentGame?.name ?? "Game",
    channels: gameChannels,
    selectedChannelId,
    onShare: handleShare,
    shareJustCopied: shareCopied,
    onInvite: isOwner && session?.access_token ? handleInvite : undefined,
    inviteJustCopied: inviteCopied,
    // Show Players Online to everyone (owner + guests) when there are members
    roomMembers: roomMembers.length > 0 ? roomMembers : undefined,
    // viewerMemberId: owner has is_owner=true so we detect them via is_owner;
    // guests pass their memberId so their own row shows "You" not "Guest"
    viewerMemberId: isGuestPlayer ? (guestMemberId ?? undefined) : undefined,
    textSectionLabel: "Sections",
    gameSectionLabel: "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || guestNickname || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    channelPermissions,
    allPlayers: players,
    unreadCounts,
    onDeleteChannel: (id: string | undefined) => {
      if (id === "rules" || id === "progress") {
        toast.info("Sections cannot be removed");
        return;
      }
      if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
    },
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
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

      <ErrorBoundary>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isRoomLoading && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-violet-950/40 border-b border-violet-800/30 text-center text-xs text-violet-300">
            Loading room from cloud…
          </div>
        )}
        {/* Guest player identity banner */}
        {isGuestPlayer && guestNickname && (
          <div className="flex-shrink-0 px-4 py-2 bg-violet-950/30 border-b border-violet-800/20 flex items-center justify-between">
            <span className="text-xs text-violet-300">
              Playing as <span className="font-semibold text-white">{guestNickname}</span> · Guest
            </span>
            <span className="text-xs text-zinc-500">AI responses are managed by the host</span>
          </div>
        )}
        {/* Host offline warning (shown to guests only) */}
        {isGuestPlayer && isOwnerOnline === false && (
          <div className="flex-shrink-0 px-4 py-2 bg-amber-950/40 border-b border-amber-700/30 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
            <span className="text-xs text-amber-300">
              Host is offline — your messages are saved and will be answered when they return.
            </span>
          </div>
        )}
        {/* Show other participants to everyone when someone else is online */}
        {onlineGuestPresences.length > 0 && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-emerald-950/30 border-b border-emerald-800/20 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300">
              {onlineGuestPresences.length + 1} players in room:{" "}
              {onlineGuestPresences.map((m) => m.nickname).join(", ")}
            </span>
          </div>
        )}
        {selectedChannelId === "rules" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-2xl">
              {(currentGame?.config?.rules ?? "").trim() ? (
                <div
                  className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-200 prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: safeMarked(currentGame!.config!.rules!) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <p className="text-sm font-medium">No rules defined for this game.</p>
                  <p className="text-xs mt-1">The Game Master can add rules when creating the game.</p>
                </div>
              )}

            </div>
          </ScrollArea>
        ) : selectedChannelId === "progress" ? (
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-2xl">
              {(gameProgress ?? "").trim() ? (
                <div
                  className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-200 prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: safeMarked(gameProgress) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">No progress yet.</p>
                  <p className="text-xs mt-1">Game progress will appear here as the host runs the game.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (() => {
          const activeSection = sections.find((s) => s.id === selectedChannelId);
          if (activeSection) return (
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-2xl">
                <h2 className="text-base font-semibold text-zinc-200 mb-4">{activeSection.name}</h2>
                {activeSection.content.trim() ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-200 prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded"
                    dangerouslySetInnerHTML={{ __html: safeMarked(activeSection.content) }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                    <p className="text-sm font-medium">No content yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          );
          return null;
        })() ?? (isGameChannel ? (
          <ChatArea
            channelName={gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? "game-room"}
            channelId={selectedChannelId ?? undefined}
            messages={messagesForChannel}
            players={playersForChannel}
            onSendMessage={isGuestPlayer ? handleGuestSendMessage : handleSendMessage}
            isGameActive={gamePhase !== "ended"}
            currentSpeakerId={currentSpeakerId}
            userId={isGuestPlayer ? (guestId ?? userId) : userId}
            gameId={gameId}
            quickReplies={isGuestPlayer ? [] : quickReplies}
            quickRepliesLoading={isGuestPlayer ? false : quickRepliesLoading}
            lastFailedSendContent={isGuestPlayer ? null : lastFailedSendContent}
            onRetryLastMessage={handleRetryLastMessage}
            isRoundInProgress={isGuestPlayer ? false : isRoundInProgress}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
            onOpenPlayerBoard={() => {
              setMobileRightDrawer(true);
              setRightPanelTab("board");
            }}
            playerBoardLabel={currentGame?.config?.playerBoardLabel}
            isOwner={isGuestPlayer ? false : (isOwner ? true : undefined)}
          />
        ) : null)}
      </div>
      </ErrorBoundary>

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
                players={playersForChannel}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                playerBoardData={playerBoardData}
                myBoardContentFromHost={
                  isGuestPlayer
                    ? (guestPlayerBinding ? myBoardContent[guestPlayerBinding] ?? "" : "")
                    : (myBoardContent[userId] ?? "")
                }
                currentUserId={userId}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
                playerBoardLabel={currentGame?.config?.playerBoardLabel}
                viewerIsGuest={isGuestPlayer}
                guestMembers={enrichedGuestMembers}
                onAssignGuest={isOwner ? handleAssignGuestToPlayer : undefined}
              />
            </div>

            <Sheet open={mobileRightDrawer} onOpenChange={setMobileRightDrawer}>
              <SheetContent side="right" title="Players" className="w-[18rem] max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700">
                <PlayerPanelWithBoard
                  players={playersForChannel}
                  gameId={gameId}
                  humanGameIdentity={humanGameIdentity}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  playerBoardData={playerBoardData}
                  myBoardContentFromHost={
                    isGuestPlayer
                      ? (guestPlayerBinding ? myBoardContent[guestPlayerBinding] ?? "" : "")
                      : (myBoardContent[userId] ?? "")
                  }
                  currentUserId={userId}
                  activeTab={rightPanelTab}
                  onTabChange={setRightPanelTab}
                  playerBoardLabel={currentGame?.config?.playerBoardLabel}
                  viewerIsGuest={isGuestPlayer}
                  guestMembers={enrichedGuestMembers}
                  onAssignGuest={isOwner ? handleAssignGuestToPlayer : undefined}
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
    </div>
  );
}
