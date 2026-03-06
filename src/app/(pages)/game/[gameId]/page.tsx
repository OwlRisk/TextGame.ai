"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import { LobbyView } from "@/app/components/lobby-view";
import { CharacterBrowser } from "@/app/components/character-browser";
import { PlayerPanelWithBoard } from "@/app/components/player-panel-with-board";
import type { PlayerBoardData } from "@/app/components/player-board";
import { parseHostActions, resolvePlayerRefToId } from "@/lib/host-actions";
import { isPlayerEliminated } from "@/lib/player-badges";
import {
  resolveChannelByName as resolveChannelByNameUtil,
  getStreamingDisplay as getStreamingDisplayUtil,
  splitHostOutput as splitHostOutputUtil,
  sectionId as sectionIdUtil,
} from "@/lib/game-host-utils";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { Menu, Hash, Users } from "lucide-react";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getPreferredModel } from "@/lib/model-prefs";
import { fetchAvatarsForRoom, type RoomPlayerInfo } from "@/lib/avatar";
import { supabase } from "@/lib/supabase";
import { safeMarked } from "@/lib/safe-marked";
import {
  getConversationMode,
  hostPace,
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

/** Number of AI players to reply right after the host's initial greeting */
const INITIAL_PLAYER_REPLIES = 3;

/** Members polling interval (ms) and max consecutive errors before giving up */
const MEMBERS_POLL_INTERVAL_MS = 15_000;
const MEMBERS_MAX_ERRORS = 3;

/** Maximum autonomous Host→AI advance loops before waiting for human input */
const MAX_AUTO_ADVANCES = 8;

/** Game inactivity timeout (ms). If no message is added for this long, auto-end the game. */
const GAME_INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Number of recent messages to include in the Host context window */
const HOST_CONTEXT_WINDOW = 35;

/** Server-side max token cap for the streaming response */
const MAX_STREAM_TOKENS = 4096;
/** Base token budget before per-player scaling */
const BASE_STREAM_TOKENS = 500;
/** Additional tokens per player */
const TOKENS_PER_PLAYER = 80;

import { seedInitialPlayerReplies } from "@/lib/seed-initial-replies";

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
    userId,
    currentSpeakerId,
    setCurrentSpeakerId,
    setTypingUsers,
    humanGameIdentity,
    setHumanGameIdentity,
    avatarImageUrls,
    onAvatarUrlLoaded,
    regenerateAvatar,
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
    phaseLabel,
    setPhaseLabel,
    mood,
    setMood,
    activeVote,
    setActiveVote,
    timerEndsAt,
    setTimerEndsAt,
    gameOverSummary,
    setGameOverSummary,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showCharacterBrowser, setShowCharacterBrowser] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickRepliesLoading, setQuickRepliesLoading] = useState(false);
  // Tracks the last message key for which suggest-quick-replies failed.
  // Prevents hammering the API with retries for the same message when other deps change.
  const quickRepliesFailKeyRef = useRef<string | null>(null);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  // shareCopied state removed — share button moved out of game room
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
    return roomMembers.find((m) => m.guest_id === guestId && !m.is_owner)?.player_id ?? null;
  }, [isGuestPlayer, guestId, roomMembers]);

  const playerBoardDataMemo: PlayerBoardData = useMemo(() => {
    const humanPlayer = players.find((p) => p.id === userId);
    return {
      characterName: humanGameIdentity?.name ?? humanPlayer?.name ?? "You",
      avatar: humanPlayer?.avatar ?? "#6366f1",
      attributes: [],
      items: [],
      statusEffects: [],
    };
  }, [players, userId, humanGameIdentity]);

  const boardContentForViewer = useMemo(() => {
    if (isGuestPlayer) return guestPlayerBinding ? myBoardContent[guestPlayerBinding] ?? "" : "";
    return myBoardContent[userId] ?? "";
  }, [isGuestPlayer, guestPlayerBinding, myBoardContent, userId]);

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

  /** Mobile left drawer: 'app' nav | 'channels' channel list */
  const [mobileLeftDrawer, setMobileLeftDrawer] = useState<"app" | "channels" | null>(null);
  const [mobileRightDrawer, setMobileRightDrawer] = useState(false);
  /** Right panel active tab: Players | My Board (private to you, editable by Host only) */
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

    // Read guestId/nickname directly from URL or localStorage instead of React state.
    // This prevents a double-channel race condition: if we depend on `guestId` state,
    // the effect runs first with guestId=null (key="anon"), then re-runs when state
    // updates — creating two channels with the same name simultaneously, causing
    // Supabase to reject the second subscription silently (guest never appears).
    const directGuestId = !session?.user?.id
      ? (new URLSearchParams(window.location.search).get("guestId")
          ?? localStorage.getItem(`guestId_${gameId}`)
          ?? null)
      : null;
    const directNickname = !session?.user?.id
      ? (localStorage.getItem(`nickname_${gameId}`) ?? guestNickname ?? "Guest")
      : null;

    const channel = supabase.channel(`presence:${gameId}`, {
      config: { presence: { key: session?.user?.id ?? directGuestId ?? "anon" } },
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
        // Explicitly sync guests on join — don't rely on sync event firing
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        syncGuestsFromState(state);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const state = channel.presenceState<{ role: string; nickname?: string }>();
        if ((leftPresences as Array<{ role?: string }>).some((p) => p.role === "owner")) {
          const ownerStillPresent = Object.values(state).flat().some((p) => p.role === "owner");
          setIsOwnerOnline(ownerStillPresent);
        }
        // Explicitly sync guests on leave — don't rely on sync event firing
        syncGuestsFromState(state);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (isOwner) {
            await channel.track({ role: "owner", userId: session?.user?.id });
          } else {
            await channel.track({ role: "guest", nickname: directNickname ?? "Guest" });
          }
        }
      });

    // When the browser tab is closed/refreshed, React's useEffect cleanup does NOT run.
    // Calling channel.untrack() in beforeunload makes Supabase fire the leave event
    // on other clients immediately instead of waiting ~30 s for heartbeat timeout.
    const handleBeforeUnload = () => {
      channel.untrack();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // removeChannel sends a phx_leave message synchronously, which fires the
      // presence leave event on other clients immediately (no heartbeat wait).
      supabase.removeChannel(channel);
    };
  // guestId/guestNickname intentionally excluded: we read them directly from
  // URL/localStorage above so the channel is created with the correct key on the
  // first run, preventing the double-channel race condition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, gamesLoading, isOwner, session?.user?.id]);

  // ─── All participants: load + refresh member list ─────────────────────────
  // Polls every 15 s. Stops polling after 3 consecutive failures to avoid
  // spamming the server when auth is broken or network is down.
  useEffect(() => {
    if (!gameId) return;
    let consecutiveErrors = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timer = setTimeout(() => { load(); }, MEMBERS_POLL_INTERVAL_MS);
    };

    const load = () => {
      const url = `/api/games/${gameId}/members`;
      fetch(url)
        .then((r) => r.ok ? r.json() : null)
        .then((data: { members?: Array<{ id: string; nickname: string; is_owner: boolean; player_id: string | null; guest_id: string | null }> } | null) => {
          if (data?.members) {
            setRoomMembers(data.members);
            consecutiveErrors = 0;
          } else {
            consecutiveErrors++;
          }
          if (consecutiveErrors < MEMBERS_MAX_ERRORS) schedule();
        })
        .catch(() => {
          consecutiveErrors++;
          if (consecutiveErrors < MEMBERS_MAX_ERRORS) schedule();
        });
    };

    load();
    return () => { if (timer) clearTimeout(timer); };
  }, [gameId]);

  // ─── Timer expiry: send system event when countdown reaches zero ─────────
  useEffect(() => {
    if (!timerEndsAt) return;
    const remaining = timerEndsAt - Date.now();
    if (remaining <= 0) {
      addMessage({
        senderId: "system",
        senderName: "System",
        senderAvatar: "#6366f1",
        content: "[System: timer expired]",
        isAI: false,
        isSystemMessage: true,
      });
      setTimerEndsAt(null);
      return;
    }
    const timeout = setTimeout(() => {
      addMessage({
        senderId: "system",
        senderName: "System",
        senderAvatar: "#6366f1",
        content: "[System: timer expired]",
        isAI: false,
        isSystemMessage: true,
      });
      setTimerEndsAt(null);
    }, remaining);
    return () => clearTimeout(timeout);
  }, [timerEndsAt, addMessage, setTimerEndsAt]);

  // ─── Inactivity auto-end: if no new message for 2 hours, end the game ────
  const lastActivityRef = useRef(Date.now());
  useEffect(() => { lastActivityRef.current = Date.now(); }, [messages.length]);
  useEffect(() => {
    if (gamePhase !== "active") return;
    const check = () => {
      if (Date.now() - lastActivityRef.current >= GAME_INACTIVITY_TIMEOUT_MS) {
        setGameOverSummary("Game ended due to inactivity (2 hours with no messages).");
        setGamePhase("ended");
        if (currentGame) updateGame(gameId, { isActive: false });
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, gameId]);

  // ─── Owner-leave auto-end: if owner is offline for 5 min during active game, end it ──
  const ownerLeftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (gamePhase !== "active" || isOwner) {
      if (ownerLeftTimerRef.current) { clearTimeout(ownerLeftTimerRef.current); ownerLeftTimerRef.current = null; }
      return;
    }
    if (isOwnerOnline === false) {
      if (!ownerLeftTimerRef.current) {
        ownerLeftTimerRef.current = setTimeout(() => {
          setGameOverSummary("The host has left the game. Game ended.");
          setGamePhase("ended");
        }, 5 * 60 * 1000);
      }
    } else {
      if (ownerLeftTimerRef.current) { clearTimeout(ownerLeftTimerRef.current); ownerLeftTimerRef.current = null; }
    }
    return () => { if (ownerLeftTimerRef.current) { clearTimeout(ownerLeftTimerRef.current); ownerLeftTimerRef.current = null; } };
  }, [gamePhase, isOwner, isOwnerOnline]);

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

    // Prefer guest-view endpoint when a guestId is available.
    const urlGuestId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("guestId")
      : null;
    const guestIdForLoad = urlGuestId ?? guestId ?? (typeof window !== "undefined" ? localStorage.getItem(`guestId_${gameId}`) : null);

    // Authenticated users who own the game don't need the public/guest endpoint.
    // Their game will arrive via the GameProvider's own fetch. Only proceed for
    // actual guests (have a guestId) or truly unauthenticated visitors.
    if (!guestIdForLoad && session?.user?.id) return;

    sharedLoadTriedRef.current = true;
    setSharedLoadPending(true);

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
      .catch((e) => {
        console.error('[game] Failed to load game for guest:', e);
        toast.error("Could not load game data");
      })
      .finally(() => setSharedLoadPending(false));
  }, [gamesLoading, currentGame, gameId, guestId, session?.user?.id, addGame]);

  // When game has GM-defined channels and context still has legacy "game-room", switch to first channel.
  // Also migrate away from removed "rules"/"progress" channels.
  useEffect(() => {
    const needsMigrate = selectedChannelId === "rules" || selectedChannelId === "progress" ||
      (selectedChannelId === "game-room" && currentGame?.config?.channels?.length && currentGame.config.channels[0].id !== "game-room");
    if (needsMigrate) {
      const firstChannel = currentGame?.config?.channels?.[0]?.id ?? "game-room";
      setSelectedChannelId(firstChannel);
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
      try {
        initializeLobby();
        setIsInitialized(true);
      } catch (err) {
        console.error("initializeLobby failed — will retry on next effect run:", err);
      }
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

  const AI_COLORS = [
    "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7"
  ];

  const buildHostPlayer = useCallback((config: any) => {
    const hostColor = config.generatedHost?.color || (config.template === "werewolf"
      ? "#7c3aed"
      : config.template === "undercover"
      ? "#0ea5e9"
      : config.template === "tarot"
      ? "#b45309"
      : "#ec4899");
    const hostName = (config.generatedHost?.name || "Game Master").trim() || "Game Master";
    const hostPersonality = config.generatedHost?.personality || "A mysterious game master";
    return {
      player: {
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
        gender: config.generatedHost?.gender,
      },
      hostName,
      hostColor,
    };
  }, []);

  const buildAiPlayers = useCallback((configuredPlayers: any[], _template?: string) => {
    return (configuredPlayers || []).map((configPlayer: any, i: number) => ({
      id: `ai-${i + 1}`,
      name: configPlayer.name,
      avatar: AI_COLORS[i % AI_COLORS.length],
      role: undefined as string | undefined,
      stats: {} as Record<string, string | number>,
      isAI: true,
      isMuted: false,
      personality: configPlayer.personality || "Friendly and observant",
      background: configPlayer.background || "A game enthusiast",
      gender: configPlayer.gender as "male" | "female" | "other" | undefined,
      status: "online" as const,
    }));
  }, []);

  /** Phase 1: set up the lobby — create players without roles, GM sends a lobby greeting. */
  const initializeLobby = () => {
    if (!currentGame || !currentGame.config) return;
    const config = currentGame.config;

    const { player: gameMaster, hostName, hostColor } = buildHostPlayer(config);
    const aiPlayers = buildAiPlayers(config.configuredPlayers || [], config.template);

    const userName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "You";
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

    // Batch-fetch avatars: 1 random AI player gets a freshly generated avatar
    // (saved to pool + ai_characters DB), the rest (including human) get free pool avatars.
    const roomPlayers: RoomPlayerInfo[] = [
      { name: gameMaster.name, type: 'host', gender: gameMaster.gender, personality: gameMaster.personality, background: gameMaster.background },
      ...aiPlayers.map((p: { name: string; gender?: string; personality?: string; background?: string }) => ({
        name: p.name, type: 'player' as const, gender: p.gender, personality: p.personality, background: p.background,
      })),
      { name: userName, type: 'player' as const, isHuman: true },
    ];
    fetchAvatarsForRoom(roomPlayers, gameId).then((urlMap) => {
      for (const [key, url] of Object.entries(urlMap)) {
        onAvatarUrlLoaded(key, url);
      }
    }).catch(() => {});

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    const lobbyGreeting = config.template === "tarot"
      ? `Welcome. I'm ${hostName}, your reader today. When you're ready, hit **Start Game** and we'll begin your reading.`
      : `Hey everyone, ${hostName} here! Take your time setting up — add or remove players, invite friends. When everyone's here, hit **Start Game** to begin!`;

    addMessage(
      { senderId: "gm-1", senderName: hostName, senderAvatar: hostColor, content: lobbyGreeting, isAI: true },
      defaultChannelId
    );

    setCurrentSpeakerId(null);
    setGamePhase("lobby");
  };

  /** Phase 2: owner starts the game — assign roles via Host API, kick off AI replies. */
  const startGame = useCallback(async () => {
    if (!currentGame || !currentGame.config) return;
    const config = currentGame.config;
    const { hostName, hostColor } = buildHostPlayer(config);

    const currentPlayers = playersRef.current;
    const aiPlayers = currentPlayers.filter((p) => p.isAI && !p.isGameMaster);

    const hasHumanPlayers = currentPlayers.some((p) => !p.isAI && !p.isGameMaster);
    if (aiPlayers.length === 0 && !hasHumanPlayers) {
      toast.error("At least one player is required to start the game. Please add AI players or invite friends.");
      return;
    }

    // Assign roles from config if available (werewolf/mafia/undercover)
    const configuredPlayers = config.configuredPlayers || [];
    if (configuredPlayers.length > 0) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.isGameMaster) return p;
          const aiIndex = p.id.startsWith("ai-") ? parseInt(p.id.split("-")[1]) - 1 : -1;
          const cp = aiIndex >= 0 && aiIndex < configuredPlayers.length ? configuredPlayers[aiIndex] : null;
          if (!cp) return p;
          const role = cp.role || undefined;
          const stats = { ...p.stats };
          if (role && (config.template === "werewolf" || config.template === "mafia")) {
            stats.Status = "Alive";
          }
          if ((cp as any).word && config.template === "undercover") {
            stats.Word = (cp as any).word;
          }
          return { ...p, role, stats };
        })
      );
    }

    setGamePhase("active");

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    const hostGreeting = config.template === "tarot"
      ? `The cards are ready. Share a question or an area of your life you'd like insight on — or say you'd like a general reading.`
      : `Alright, the game is on! Let's get started. Check the Rules section if you need a refresher.`;

    addMessage(
      { senderId: "gm-1", senderName: hostName, senderAvatar: hostColor, content: hostGreeting, isAI: true },
      defaultChannelId
    );

    seedInitialPlayerReplies({
      channelId: defaultChannelId,
      hostName,
      hostContent: hostGreeting,
      aiPlayers,
      gameName: currentGame.name,
      rules: config.rules,
      addStreamingMessage,
      updateStreamingMessage,
      setTypingUsers,
      sessionToken: session?.access_token,
      isCancelled: () => seedCancelledRef.current,
    }).catch((e) => console.warn("Initial player replies failed", e));
  }, [currentGame, session?.access_token, buildHostPlayer, addMessage, setPlayers, setGamePhase]);

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

    // In lobby phase, just add the message — don't trigger Host game logic
    if (gamePhase === "lobby") return;

    // Get AI response (host reply in same channel)
    setLastFailedSendContent(null);
    setIsRoundInProgress(true);
    try {
      // Build recent context so Host can choose next speaker based on current discussion
      const channelMessages = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      const recentSlice = channelMessages.slice(-HOST_CONTEXT_WINDOW);
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

      const hostSystemPrompt = buildHostSystemPrompt({
        gameName: currentGame?.name ?? "",
        humanName,
        nonHostPlayerNames: nonHostPlayers.map((p) => (p.id === userId ? humanName : p.name)),
        hasVotingPhase,
        hasNightPhase,
        hasMultipleRooms,
        channels: (currentGame?.config?.channels ?? gameRoomEntries).map((c) => ({
          name: c.name,
          roomType: (c as { roomType?: string }).roomType,
        })),
        gamePhase: gamePhase || "waiting",
        phaseLabel: phaseLabel ?? "",
        playerRoster,
        eventLogSummary,
        boardSummary,
        rulesText,
      });

      const applyHostRoleAssignments = (content: string): string => {
        // C-5: use playersRef.current (not stale closure `players`) for freshest data after awaits
        const result = parseRoleAssignments(content, playersRef.current, userId, humanName, humanGameIdentity?.name ?? null);
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
        parseHostResultUtil(raw, players, humanName, gameRoomEntries);

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
          } else if (a.type === "phase") {
            setPhaseLabel(a.label);
          } else if (a.type === "announce") {
            addMessage({
              senderId: "system",
              senderName: "Announcement",
              senderAvatar: "#8b5cf6",
              content: a.text,
              isAI: false,
              isAnnouncement: true,
            });
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
          }
        }
        return cleanContent;
      };

      const getStreamingDisplay = getStreamingDisplayUtil;
      const splitHostOutput = splitHostOutputUtil;

      /** Host streaming reply: lazily create message bubble only when there is visible content. */
      const callHostStream = async (userContent: string, chId: string): Promise<{ hostContent: string; who: string | null; speakerQueue: SpeakerQueueItem[]; autoChannelId: string | null; autoChannelGoal: string | null; imageUrl?: string }> => {
        const streamTokenBudget = Math.min(MAX_STREAM_TOKENS, BASE_STREAM_TOKENS + players.length * TOKENS_PER_PLAYER);
        let messageId: string | null = null;
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
            if (res.status === 402) {
              toast.error("Token balance insufficient. Please top up to continue the game.", { duration: 8000 });
              return { hostContent: "", who: null, speakerQueue: [], autoChannelId: null, autoChannelGoal: null };
            }
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
                    const visible = getStreamingDisplay(acc);
                    if (visible && !messageId) {
                      messageId = addStreamingMessage(
                        { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
                        chId,
                        visible,
                      );
                    } else if (visible && messageId) {
                      updateStreamingMessage(messageId, visible, false);
                    }
                  }
                } catch {
                  // ignore parse
                }
              }
            }
          }
          // Split into public message and directive section
          const { message: splitMessage, directives } = splitHostOutput(acc);
          const { hostContent: directivesClean, who, speakerQueue, autoChannelId, autoChannelGoal } = parseHostResult(directives);
          const afterActions = applyHostActionsAndClean(directivesClean);
          const afterRoles = applyHostRoleAssignments(afterActions);
          const displayContent = splitMessage || afterRoles;
          if (displayContent && messageId) {
            updateStreamingMessage(messageId, displayContent, true);
          } else if (displayContent && !messageId) {
            messageId = addStreamingMessage(
              { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
              chId,
              displayContent,
            );
            updateStreamingMessage(messageId, displayContent, true);
          } else if (messageId) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
          return { hostContent: displayContent, who, speakerQueue, autoChannelId, autoChannelGoal };
        } catch (e) {
          console.error("Host stream error:", e);
          toast.error("Game Master stream interrupted — retrying…");
          if (messageId) updateStreamingMessage(messageId, "…", true);
          // Single retry on network/stream failure
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
            if (!retryRes.ok || !retryRes.body) throw new Error("retry failed");
            const retryReader = retryRes.body.getReader();
            const retryDecoder = new TextDecoder();
            let retryAcc = "";
            let retryMsgId: string | null = null;
            while (true) {
              const { done, value } = await retryReader.read();
              if (done) break;
              const chunk = retryDecoder.decode(value, { stream: true });
              for (const line of chunk.split(/\n/)) {
                if (line.startsWith("data: ")) {
                  const payload = line.slice(6);
                  if (payload === "[DONE]") continue;
                  try {
                    const data = JSON.parse(payload) as { content?: string };
                    if (typeof data.content === "string") {
                      retryAcc += data.content;
                      const visible = getStreamingDisplay(retryAcc);
                      if (visible && !retryMsgId) {
                        retryMsgId = addStreamingMessage(
                          { senderId: "gm-1", senderName: gmName, senderAvatar: gmColor, isAI: true },
                          chId,
                          visible,
                        );
                      } else if (visible && retryMsgId) {
                        updateStreamingMessage(retryMsgId, visible, false);
                      }
                    }
                  } catch { /* ignore */ }
                }
              }
            }
            const { message: retryMsg, directives: retryDir } = splitHostOutput(retryAcc);
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
      });

      const channelMessagesForRecent = messages.filter((m) => (m.channelId ?? (cfgChannels?.[0]?.id ?? "game-room")) === channelId);
      // Inject any queued decision summaries from previous private-channel conversations
      // so the HOST is aware of what was decided before this turn began.
      const decisionSummaryPrefix = pendingDecisionSummariesRef.current.length > 0
        ? `[System: cross-channel decisions since last turn]\n${pendingDecisionSummariesRef.current.join("\n")}\n\n`
        : "";
      pendingDecisionSummariesRef.current = [];

      const firstUserContent = `${decisionSummaryPrefix}Recent discussion in this channel (use this to choose next speaker based on context):\n${recentContext}\n\nCurrent message from the human player: ${content}`;
      let { hostContent, who, speakerQueue, autoChannelId: firstAutoChannelId, autoChannelGoal: firstAutoChannelGoal, imageUrl: firstImageUrl } = await callHostStream(firstUserContent, channelId);
      const isSilentTurn = !hostContent && !firstImageUrl;
      if (isSilentTurn && speakerQueue.length === 0) {
        // GM stayed silent and didn't assign a next speaker — return control to human
        setCurrentSpeakerId(userId);
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

      if (!isSilentTurn) await hostPace();
      const recentForNextRef = { current: [
        ...channelMessagesForRecent.slice(-18).map((m) => ({ senderName: m.senderName, content: m.content })),
        { senderName: humanName, content },
        ...(hostContent ? [{ senderName: gmName, content: hostContent }] : []),
      ] as Array<{ senderName: string; content: string }> };

      const sqCtx = buildSpeakerCtx(recentForNextRef);

      if (firstAutoChannelId) {
        await runPrivateChannelConversationFn(sqCtx, firstAutoChannelId, firstAutoChannelGoal);
      }

      let currentQueue = speakerQueue;
      let humanReached = currentQueue.length === 0
        ? (() => { setCurrentSpeakerId(userId); return true; })()
        : await runSpeakerQueueFn(sqCtx, currentQueue);

      for (let i = 0; i < MAX_AUTO_ADVANCES && !humanReached && gamePhase !== "ended"; i++) {
        await hostPace();
        const advanced = await callHostStream(
          "[System: all pending AI actions in this beat are done — advance the game to the next beat automatically.]",
          channelId
        );
        if (!advanced.hostContent && advanced.speakerQueue.length === 0) break;
        if (advanced.hostContent) {
          recentForNextRef.current = [
            ...recentForNextRef.current,
            { senderName: gmName, content: advanced.hostContent },
          ];
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
      // Immediately flush state to DB so other room members see updates via Realtime
      saveNow();
    }
  };

  // C-4: Keep the ref current on every render so the trigger effect always
  // calls the latest version without needing it in the dependency array.
  handleSendMessageRef.current = handleSendMessage;

  const handleRetryLastMessage = useCallback(() => {
    if (lastFailedSendContent) {
      handleSendMessageRef.current?.(lastFailedSendContent);
      setLastFailedSendContent(null);
    }
  }, [lastFailedSendContent]);

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
      ...sections.map((s) => ({ id: s.id, name: s.name, type: "text" as const })),
      ...visibleGameRoomEntries,
    ],
    [sections, visibleGameRoomEntries]
  );

  // Rules sheet overlay state
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);

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
    const humanPlayer = players.find((p) => p.id === userId);
    const humanName = humanGameIdentity?.name || humanPlayer?.name || "You";
    const humanRole = humanPlayer?.role ?? undefined;
    fetch("/api/suggest-quick-replies", {
      method: "POST",
      headers,
      signal: abort.signal,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
        recentMessages: recent,
        gamePhase,
        playerName: humanName,
        playerRole: humanRole,
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
        senderAvatar: "#10b981",  // emerald green — matches server-side senderAvatar for guest messages
        content,
        isAI: false,
        isGuestMessage: true,
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
    if (!session?.access_token || !memberId) return;
    try {
      const res = await fetch(`/api/games/${gameId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        toast.error(playerId ? "Failed to assign guest" : "Failed to unassign guest");
        return;
      }
      // Refresh member list to reflect new binding
      const url = `/api/games/${gameId}/members`;
      const data = await fetch(url).then((r) => r.ok ? r.json() : null);
      if (data?.members) setRoomMembers(data.members);
    } catch {
      toast.error(playerId ? "Failed to assign guest" : "Failed to unassign guest");
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
    onInvite: undefined,
    inviteJustCopied: false,
    gameSectionLabel: "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || guestNickname || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    channelPermissions,
    allPlayers: players,
    unreadCounts,
    onOpenRules: () => setRulesSheetOpen(true),
    onDeleteChannel: (id: string | undefined) => {
      if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
    },
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      {/* Mobile top bar: small screens only */}
      <header className="md:hidden flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "app" ? null : "app"))} aria-label="Open menu">
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 truncate max-w-[40%]">{currentGame?.name ?? "Game"}</span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "channels" ? null : "channels"))} aria-label="Channels & rules">
            <Hash className="size-5 text-zinc-300" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileRightDrawer((v) => !v)} aria-label="Player list">
            <Users className="size-5 text-zinc-300" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
      {/* App sidebar is provided by the (pages) layout */}

      {/* Mobile left drawer: app nav (mobile only; desktop uses layout sidebar) */}
      <Sheet open={mobileLeftDrawer === "app"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Menu" className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950">
          <GameSidebar {...sidebarCommon} onNavigate={() => setMobileLeftDrawer(null)} />
        </SheetContent>
      </Sheet>

      {/* Mobile left drawer: channels & rules */}
      <Sheet open={mobileLeftDrawer === "channels"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Channels and rules" className="w-64 max-w-[85vw] p-0 bg-zinc-800 border-r border-zinc-700">
          <ChannelList
            {...channelListCommon}
            selectedChannelId={selectedChannelId}
            onSelectChannel={(id) => { setSelectedChannelId(id); setMobileLeftDrawer(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Game sidebar: visible on desktop, shown in Sheet on mobile */}
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
              {onlineGuestPresences.length + (isOwnerOnline !== false ? 1 : 0)} players in room:{" "}
              {onlineGuestPresences.map((m) => m.nickname).join(", ")}
            </span>
          </div>
        )}
        {gamePhase === "lobby" ? (
          <LobbyView
            gameName={currentGame?.name ?? "Game"}
            gameTemplate={currentGame?.config?.template}
            players={players}
            isOwner={isOwner}
            gameId={gameId}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
            onStartGame={startGame}
            onAddCharacter={() => setShowCharacterBrowser(true)}
            onRemovePlayer={(playerId) => {
              setPlayers((prev) => prev.filter((p) => p.id !== playerId));
            }}
            onInvite={isOwner ? handleInvite : undefined}
            inviteJustCopied={inviteCopied}
            maxPlayers={currentGame?.config?.playerCount || 12}
          />
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
            gamePhaseLabel={phaseLabel || undefined}
            gameOverSummary={gameOverSummary || undefined}
            onPlayAgain={gameOverSummary ? () => {
              const preset = currentGame?.config?.template;
              router.push(preset ? `/create?preset=${preset}` : "/create");
            } : undefined}
            onNewGame={gameOverSummary ? () => router.push("/create") : undefined}
            onSaveCharacters={gameOverSummary && isOwner && session?.access_token ? async () => {
              const aiPlayers = players.filter((p) => p.isAI && !p.isGameMaster);
              if (aiPlayers.length === 0) { toast.info("No AI characters to save"); return; }
              let saved = 0;
              for (const p of aiPlayers) {
                try {
                  const res = await fetch("/api/characters", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
                    body: JSON.stringify({
                      name: p.name,
                      gender: p.gender || "other",
                      personality: p.personality || null,
                      background: p.background || null,
                      avatar_color: p.avatar || "#8b5cf6",
                      source_game_id: gameId,
                    }),
                  });
                  if (res.ok) saved++;
                } catch {}
              }
              toast.success(`Saved ${saved} character${saved !== 1 ? "s" : ""} to your collection`);
            } : undefined}
            isEliminated={(() => {
              if (isGuestPlayer) return false;
              const me = players.find(p => p.id === userId || p.name === humanGameIdentity?.name);
              return me ? isPlayerEliminated(me) : false;
            })()}
            mood={mood}
            activeVote={activeVote}
            onVote={activeVote ? (choice: string) => {
              const fn = isGuestPlayer ? handleGuestSendMessage : handleSendMessage;
              fn(`I vote for ${choice}`);
              setActiveVote(null);
            } : undefined}
            timerEndsAt={timerEndsAt}
            alivePlayers={players.filter(p => !isPlayerEliminated(p))}
          />
        ) : null)}
      </div>
      </ErrorBoundary>

      {/* Player panel + My Board (private, Host-editable): desktop visible, right Sheet on mobile */}
            <div className="hidden md:block flex-shrink-0 w-80">
              <PlayerPanelWithBoard
                players={playersForChannel}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                onRegenerateAvatar={regenerateAvatar}
                playerBoardData={playerBoardDataMemo}
                myBoardContentFromHost={boardContentForViewer}
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
              <SheetContent side="right" title="Players" className="w-[18rem] max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700 [&>button:last-child]:hidden">
                <PlayerPanelWithBoard
                  players={playersForChannel}
                  gameId={gameId}
                  humanGameIdentity={humanGameIdentity}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  onRegenerateAvatar={regenerateAvatar}
                  playerBoardData={playerBoardDataMemo}
                  myBoardContentFromHost={boardContentForViewer}
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
      </div>

      <CharacterBrowser
        open={showCharacterBrowser}
        onClose={() => setShowCharacterBrowser(false)}
        gameId={gameId}
        onSelectCharacter={(char) => {
          const existingAiIds = players.filter((p) => p.isAI && !p.isGameMaster).map((p) => {
            const n = parseInt(p.id.split("-")[1]);
            return isNaN(n) ? 0 : n;
          });
          const nextIndex = existingAiIds.length > 0 ? Math.max(...existingAiIds) + 1 : 1;
          const newPlayer = {
            id: `ai-${nextIndex}`,
            name: char.name,
            avatar: AI_COLORS[(nextIndex - 1) % AI_COLORS.length],
            role: undefined as string | undefined,
            stats: {} as Record<string, string | number>,
            isAI: true,
            isMuted: false,
            personality: char.personality,
            background: char.background,
            gender: char.gender as "male" | "female" | "other" | undefined,
            status: "online" as const,
          };
          setPlayers((prev) => {
            const humanIdx = prev.findIndex((p) => !p.isAI && !p.isGameMaster);
            if (humanIdx >= 0) {
              const updated = [...prev];
              updated.splice(humanIdx, 0, newPlayer);
              return updated;
            }
            return [...prev, newPlayer];
          });
        }}
      />

      {/* Rules overlay sheet */}
      <Sheet open={rulesSheetOpen} onOpenChange={setRulesSheetOpen}>
        <SheetContent side="left" title="Rules" className="w-[28rem] max-w-[90vw] p-0 bg-zinc-900 border-r border-zinc-700">
          <div className="h-14 px-5 flex items-center border-b border-zinc-800">
            <h2 className="text-base font-semibold text-white">Rules</h2>
          </div>
          <ScrollArea className="h-[calc(100%-3.5rem)] p-5">
            <div className="max-w-2xl">
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
        </SheetContent>
      </Sheet>

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
