"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import dynamic from "next/dynamic";

const LobbyView = dynamic(() => import("@/app/components/lobby-view").then(m => m.LobbyView), { ssr: false });
const CharacterBrowser = dynamic(() => import("@/app/components/character-browser").then(m => m.CharacterBrowser), { ssr: false });
const PlayerPanelWithBoard = dynamic(() => import("@/app/components/player-panel-with-board").then(m => m.PlayerPanelWithBoard), { ssr: false });
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
import { Menu, Hash, Users, BookOpen, Info } from "lucide-react";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getPreferredModel } from "@/lib/model-prefs";
import { fetchAvatarsForRoom, type RoomPlayerInfo } from "@/lib/avatar";
import { assignVoicesForRoom, pickVoiceForSpeaker, INWORLD_VOICE_META } from "@/lib/inworld-voices";
import { safeMarked } from "@/lib/safe-marked";
import {
  MAX_AUTO_ADVANCES,
  HOST_CONTEXT_WINDOW,
  MAX_STREAM_TOKENS,
  BASE_STREAM_TOKENS,
  TOKENS_PER_PLAYER,
} from "@/lib/game-room-constants";
import { useGameRoomPresence } from "@/hooks/useGameRoomPresence";
import { useRoomMembers } from "@/hooks/useRoomMembers";
import { useGameChannels } from "@/hooks/useGameChannels";
import { useGameRoomLifecycle } from "@/hooks/useGameRoomLifecycle";
import { useQuickReplies } from "@/hooks/useQuickReplies";
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

import { seedInitialPlayerReplies } from "@/lib/seed-initial-replies";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

const AI_COLOR_PALETTE = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7",
] as const;

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
    typingUsers,
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
    addReaction,
  } = useGameRoomContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showCharacterBrowser, setShowCharacterBrowser] = useState(false);
  const [lastFailedSendContent, setLastFailedSendContent] = useState<string | null>(null);
  // shareCopied state removed — share button moved out of game room
  const [inviteCopied, setInviteCopied] = useState(false);
  const { roomMembers, refreshMembers } = useRoomMembers(gameId);

  // Guest player: arrived via /join/[inviteCode] with guestId URL param
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestMemberId, setGuestMemberId] = useState<string | null>(null);
  const [guestNickname, setGuestNickname] = useState<string | null>(null);
  // Presence: owner/guest online status via Supabase Presence
  const { onlineGuestPresences, isOwnerOnline } = useGameRoomPresence({
    gameId,
    isOwner: !!games.find((g) => g.id === gameId) && !!session?.user?.id,
    gamesLoading,
    sessionUserId: session?.user?.id,
    guestNickname,
  });

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

  const boardContentForViewer = useMemo(() => {
    if (isGuestPlayer) return guestPlayerBinding ? myBoardContent[guestPlayerBinding] ?? "" : "";
    return myBoardContent[userId] ?? "";
  }, [isGuestPlayer, guestPlayerBinding, myBoardContent, userId]);

  const prevBoardContentRef = useRef<string>("");
  useEffect(() => {
    const trimmed = boardContentForViewer.trim();
    if (trimmed && trimmed !== prevBoardContentRef.current) {
      setMyBoardHasUpdate(true);
    }
    prevBoardContentRef.current = trimmed;
  }, [boardContentForViewer]);

  useEffect(() => {
    if (selectedChannelId === "__my_board__") setMyBoardHasUpdate(false);
  }, [selectedChannelId]);

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

  const seedCancelledRef = useRef(false);
  const msgCountRef = useRef(0);
  useEffect(() => {
    seedCancelledRef.current = false;
    return () => { seedCancelledRef.current = true; };
  }, [gameId]);

  const gameEnteredAtRef = useRef(Date.now());
  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => {
    gameEnteredAtRef.current = Date.now();
    trackEvent("game_room_entered", { template: currentGame?.config?.template || "unknown" });
    const handleVisChange = () => {
      if (document.visibilityState === "hidden") {
        const durationSec = Math.round((Date.now() - gameEnteredAtRef.current) / 1000);
        trackEvent("game_session_end", { duration_seconds: durationSec, messages_sent: msgCountRef.current });
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      if (gamePhaseRef.current === "lobby") {
        trackEvent("game_abandoned", {
          template: currentGame?.config?.template || "unknown",
          duration_seconds: Math.round((Date.now() - gameEnteredAtRef.current) / 1000),
        });
      }
    };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always reflects the latest players so async closures (handleSendMessage, runSpeakerQueue)
  // don't operate on stale role/stat data after setPlayers() takes effect between awaits.
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Always reflects the latest messages so applyHostActionsAndClean can find
  // the correct target message for REACT directives without stale closure data.
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

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
  const [myBoardHasUpdate, setMyBoardHasUpdate] = useState(false);

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

  // Presence + member polling handled by extracted hooks above

  // Find current game
  const currentGame = games.find((g) => g.id === gameId);

  // Timer expiry, inactivity auto-end, owner-leave auto-end
  useGameRoomLifecycle({
    gamePhase,
    isOwner,
    isOwnerOnline,
    gameId,
    currentGameExists: !!currentGame,
    messagesLength: messages.length,
    timerEndsAt,
    addMessage,
    setTimerEndsAt,
    setGameOverSummary,
    setGamePhase,
    updateGame,
  });

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

  // Generate the AI icon in the background after entering the room so it
  // doesn't block navigation. Only fires once per game (when icon is still an emoji).
  const iconGeneratedRef = useRef(false);
  useEffect(() => {
    if (!currentGame || iconGeneratedRef.current) return;
    const icon = currentGame.icon ?? "";
    if (icon.startsWith("http") || icon.startsWith("data:image")) return;
    iconGeneratedRef.current = true;
    const { name, config } = currentGame;
    fetch("/api/generate-game-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: name, gameTemplate: config?.template, rules: config?.rules }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.icon) updateGame(gameId, { icon: data.icon }); })
      .catch(() => {});
  }, [currentGame?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Players came from saved state (DB or localStorage) — mark initialized, don't re-init.
      // Validate voiceIds: if a player has a gendered voiceId that doesn't match their gender,
      // reassign voices for the whole room so the fix applies to existing sessions too.
      const needsVoiceFix = players.some((p) => {
        if (!p.isAI || !p.voiceId || !p.gender) return false;
        const g = p.gender.toLowerCase();
        if (g !== 'male' && g !== 'female') return false;
        const meta = INWORLD_VOICE_META.find(v => v.voiceId === p.voiceId);
        return meta ? meta.gender !== g : false;
      });
      if (needsVoiceFix) {
        const voiceMap = assignVoicesForRoom(players.filter(p => p.isAI).map(p => ({
          name: p.name, gender: p.gender, personality: p.personality, background: p.background,
        })));
        setPlayers(prev => prev.map(p => p.isAI && voiceMap[p.name] ? { ...p, voiceId: voiceMap[p.name] } : p));
      }
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

  const AI_COLORS = AI_COLOR_PALETTE;

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
        voiceId: undefined as string | undefined,
      },
      hostName,
      hostColor,
    };
  }, []);

  const buildAiPlayers = useCallback((configuredPlayers: any[], _template?: string) => {
    return (configuredPlayers || []).map((configPlayer: any, i: number) => ({
      id: `ai-${i + 1}`,
      name: configPlayer.name,
      // Use pool-provided avatar_url as initial avatar; fetchAvatarsForRoom will overwrite
      // only if no pool avatar exists.
      avatar: (configPlayer.avatar_url as string | undefined) ?? AI_COLORS[i % AI_COLORS.length],
      role: undefined as string | undefined,
      stats: {} as Record<string, string | number>,
      isAI: true,
      isMuted: false,
      personality: configPlayer.personality || "Friendly and observant",
      background: configPlayer.background || "A game enthusiast",
      gender: configPlayer.gender as "male" | "female" | "other" | undefined,
      status: "online" as const,
      // Use pre-assigned voice from pool; assignVoicesForRoom will only be called for those without one.
      voiceId: (configPlayer.voice_id as string | undefined) ?? undefined,
      voiceSampleUrl: (configPlayer.voice_sample_url as string | undefined) ?? undefined,
    }));
  }, []);

  /** Phase 1: set up the lobby — create players without roles, GM sends a lobby greeting. */
  const initializeLobby = () => {
    if (!currentGame || !currentGame.config) return;
    const config = currentGame.config;

    const { player: gameMaster, hostName, hostColor } = buildHostPlayer(config);
    const aiPlayers = buildAiPlayers(config.configuredPlayers || [], config.template);

    const userName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "You";
    // Use real Google/Facebook profile picture if available, fallback to color
    const userProfileAvatar = getUserAvatarUrl(session?.user) ?? "#6366f1";
    const userPlayer = {
      id: userId,
      name: userName,
      avatar: userProfileAvatar,
      role: undefined as string | undefined,
      stats: config.template === "werewolf" || config.template === "mafia" ? { Status: "Alive" } : undefined,
      isAI: false,
      isMuted: false,
      status: "online" as const,
    };

    // Assign voices: players that came from the pool already have a voiceId set in buildAiPlayers.
    // Only run assignVoicesForRoom for the GM and any players without a pre-assigned voice.
    const speakersNeedingVoice = [
      !gameMaster.voiceId ? { name: gameMaster.name, gender: gameMaster.gender, personality: gameMaster.personality, background: gameMaster.background } : null,
      ...aiPlayers
        .filter((p: { voiceId?: string }) => !p.voiceId)
        .map((p: { name: string; gender?: string; personality?: string; background?: string }) => ({
          name: p.name, gender: p.gender, personality: p.personality, background: p.background,
        })),
    ].filter(Boolean) as { name: string; gender?: string; personality?: string; background?: string }[];

    if (speakersNeedingVoice.length > 0) {
      const voiceMap = assignVoicesForRoom(speakersNeedingVoice);
      if (!gameMaster.voiceId) gameMaster.voiceId = voiceMap[gameMaster.name];
      for (const p of aiPlayers) {
        if (!p.voiceId) p.voiceId = voiceMap[p.name];
      }
    }

    setPlayers([gameMaster, ...aiPlayers, userPlayer]);

    // Batch-fetch avatars only for players without a pool avatar (i.e., avatar is a color string).
    // Pool characters already have avatar_url loaded as their avatar.
    // Human player uses their real Google/Facebook profile picture.
    const roomPlayersNeedingAvatar: RoomPlayerInfo[] = [
      // GM always needs an avatar (generated from personality)
      { name: gameMaster.name, type: 'host', gender: gameMaster.gender, personality: gameMaster.personality, background: gameMaster.background },
      // AI players only if they don't already have a URL avatar from the pool
      ...aiPlayers
        .filter((p: { avatar?: string }) => !p.avatar || !p.avatar.startsWith('http'))
        .map((p: { name: string; gender?: string; personality?: string; background?: string }) => ({
          name: p.name, type: 'player' as const, gender: p.gender, personality: p.personality, background: p.background,
        })),
    ];
    // For pool players that have a URL, register their avatar_url directly so
    // the avatar lookup map is populated without a separate fetch.
    for (const p of aiPlayers) {
      if (p.avatar?.startsWith('http')) {
        onAvatarUrlLoaded(p.name, p.avatar);
      }
    }
    if (roomPlayersNeedingAvatar.length > 0) {
      const avatarStyle = typeof window !== 'undefined'
        ? (localStorage.getItem('avatar_style_pack') ?? 'semi-realistic')
        : 'semi-realistic';
      fetchAvatarsForRoom(roomPlayersNeedingAvatar, gameId, avatarStyle).then((urlMap) => {
        for (const [key, url] of Object.entries(urlMap)) {
          onAvatarUrlLoaded(key, url);
        }
      }).catch(() => {});
    }

    setCurrentSpeakerId(null);
    setGamePhase("lobby");
  };

  /** Phase 2: owner starts the game — assign roles via Host API, kick off AI replies. */
  const gameStartingRef = useRef(false);
  const startGame = useCallback(async () => {
    if (!currentGame || !currentGame.config) return;
    if (gamePhase !== "lobby") return;
    if (gameStartingRef.current) return;
    gameStartingRef.current = true;

    try {
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

      // Cancel any in-flight seed from a prior (interrupted) start attempt
      seedCancelledRef.current = true;
      await new Promise((r) => setTimeout(r, 0));
      seedCancelledRef.current = false;

    setGamePhase("active");
      trackEvent("game_started", {
        template: config.template || "custom",
        player_count: currentPlayers.filter((p) => !p.isGameMaster).length,
        game_name: currentGame.name,
      });

    const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";
    const hostGreeting = config.template === "tarot"
      ? `The cards are ready. Share a question or an area of your life you'd like insight on — or say you'd like a general reading.`
      : `Alright, the game is on! Let's get started. Check the Rules section if you need a refresher.`;

      const greetingId = `start-greeting-${gameId}`;
    addMessage(
        { id: greetingId, senderId: "gm-1", senderName: hostName, senderAvatar: hostColor, content: hostGreeting, isAI: true },
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
      }).catch((e) => {
        console.warn("Initial player replies failed", e);
        toast.error("Some AI players failed to respond. You can still play normally.");
      });
    } finally {
      gameStartingRef.current = false;
    }
  }, [currentGame, gamePhase, session?.access_token, buildHostPlayer, addMessage, setPlayers, setGamePhase, gameId]);

  const handleSendMessage = async (content: string, options?: { skipAddMessage?: boolean; channelId?: string }) => {
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
              .map((m) => {
                let line = `- ${m.senderName}: ${m.content}`;
                if (m.reactions?.length) {
                  line += ` [reactions: ${m.reactions.map((r) => `${r.emoji} ${r.from}`).join(", ")}]`;
                }
                return line;
              })
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
      const freshPlayers = playersRef.current;
      const aiOnly = freshPlayers.filter(
        (p) =>
          p.isAI &&
          !p.isGameMaster &&
          (!channelPermsForAiOnly ||
            channelPermsForAiOnly.includes("*") ||
            channelPermsForAiOnly.includes(p.id))
      );

      // Build player roster for host context — always read from ref to avoid stale closure
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
        parseHostResultUtil(raw, playersRef.current, humanName, gameRoomEntries);

      let latestEngagementScore = 3;
      const seenAnnouncements = new Set<string>();

      /** Parse [BOARD:Name]...[/BOARD], [ACCESS:Room]...[/ACCESS], [SECTION:Title]...[/SECTION], etc. Apply actions; return public display content. */
      const applyHostActionsAndClean = (content: string): string => {
        const { cleanContent, actions } = parseHostActions(content);
        const currentPlayers = playersRef.current;
        for (const a of actions) {
          if (a.type === "my_board") {
            const playerId = resolvePlayerRefToId(a.playerRef, currentPlayers, userId, humanGameIdentity?.name);
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
                .map((ref) => resolvePlayerRefToId(ref, currentPlayers, userId, humanGameIdentity?.name))
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
          if (!res.ok || !res.body) {
            setTypingUsers([]);
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
                      setTypingUsers([]);
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
        ...channelMessagesForRecent.slice(-18).map((m) => ({
          senderName: m.senderName,
          content: m.reactions?.length
            ? `${m.content} [reactions: ${m.reactions.map((r) => `${r.emoji} ${r.from}`).join(", ")}]`
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
        ? (() => { setCurrentSpeakerId(userId); return true; })()
        : await runSpeakerQueueFn(sqCtx, currentQueue);

      let lastBeatContentLen = hostContent?.length ?? 0;
      for (let i = 0; i < MAX_AUTO_ADVANCES && !humanReached && gamePhase !== "ended"; i++) {
        await dynamicPace(lastBeatContentLen);
        const recentSummary = recentForNextRef.current.slice(-10)
          .map((m) => `${m.senderName}: ${m.content}`).join("\n");
        const advanced = await callHostStream(
          `[System: all pending AI actions in this beat are done — advance the game to the next beat automatically. Do NOT repeat any announcement or phase transition you already made.]\n\nRecent messages for context:\n${recentSummary}`,
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
  // Queue of unprocessed guest messages that arrived while isRoundInProgress was true.
  const pendingGuestMsgsRef = useRef<Array<{ content: string; channelId?: string }>>([]);
  // Snapshot the message IDs present at hydration time so we can distinguish
  // "loaded from DB" from "arrived via Realtime after mount".
  const hydratedMsgIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!isOwner) return;
    // Capture the initial set of message IDs once on the first run where isOwner is true.
    // Any message whose ID is in this set is "historical" and should not trigger AI.
    if (hydratedMsgIdsRef.current === null) {
      hydratedMsgIdsRef.current = new Set(messages.map((m) => m.id));
      const guestMsgs = messages.filter(
        (m) => (m as unknown as { isGuestMessage?: boolean }).isGuestMessage && !m.isAI
      );
      if (guestMsgs.length > 0) {
        lastProcessedGuestMsgRef.current = guestMsgs[guestMsgs.length - 1].id;
      }
      return;
    }

    const guestMessages = messages.filter(
      (m) => (m as unknown as { isGuestMessage?: boolean }).isGuestMessage && !m.isAI
    );
    if (guestMessages.length === 0) return;
    const latest = guestMessages[guestMessages.length - 1];

    // Already processed
    if (latest.id === lastProcessedGuestMsgRef.current) return;
    // Historical message loaded from DB — skip
    if (hydratedMsgIdsRef.current.has(latest.id)) {
      lastProcessedGuestMsgRef.current = latest.id;
      return;
    }

    lastProcessedGuestMsgRef.current = latest.id;

    const payload = {
      content: latest.content,
      channelId: (latest as unknown as { channelId?: string }).channelId ?? undefined,
    };

    if (isRoundInProgress) {
      // AI is busy — queue this message so it's processed when the round finishes.
      pendingGuestMsgsRef.current.push(payload);
      return;
    }

    handleSendMessageRef.current?.(payload.content, {
      skipAddMessage: true,
      channelId: payload.channelId,
    });
  }, [messages, isOwner, isRoundInProgress]); // handleSendMessage intentionally omitted — use ref

  // Process queued guest messages once the current round finishes
  useEffect(() => {
    if (isRoundInProgress || !isOwner) return;
    if (pendingGuestMsgsRef.current.length === 0) return;
    const next = pendingGuestMsgsRef.current.shift();
    if (next) {
      handleSendMessageRef.current?.(next.content, {
        skipAddMessage: true,
        channelId: next.channelId,
      });
    }
  }, [isRoundInProgress, isOwner]);

  // Channel management: game room entries, visibility, message filtering, unread counts
  const {
    gameRoomEntries,
    defaultGameChannelId,
    gameChannels,
    gameRoomIds,
    isGameChannel,
    messagesForChannel,
    unreadCounts,
    playersForChannel,
  } = useGameChannels({
    channelConfigs: currentGame?.config?.channels,
    sections,
    channelPermissions,
    userId,
    messages,
    selectedChannelId,
    players,
  });

  const RULES_CHANNEL_ID = "__rules__";
  const BOARD_CHANNEL_ID = "__my_board__";

  useEffect(() => {
    if (selectedChannelId === RULES_CHANNEL_ID) {
      trackEvent("rules_viewed", { template: currentGame?.config?.template || "unknown" });
    }
  }, [selectedChannelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick reply suggestions (fetched when it's the human player's turn)
  const { quickReplies, quickRepliesLoading, setQuickReplies } = useQuickReplies({
    currentGameConfig: currentGame?.config ? { name: currentGame.name, rules: currentGame.config.rules, template: currentGame.config.template } : null,
    isGameChannel,
    selectedChannelId,
    messagesForChannel,
    userId,
    gamePhase,
    isRoundInProgress,
    currentSpeakerId,
    humanGameIdentity,
    players,
    sessionAccessToken: session?.access_token ?? null,
  });

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern Clipboard API first
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to execCommand fallback
      }
    }
    // execCommand fallback (works in most mobile/older browsers)
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  /** Generate invite link and copy to clipboard. Owner only. */
  const handleInvite = useCallback(async () => {
    if (!gameId) return;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "");

      // Fast path: if we already have an invite code, copy immediately without an API round-trip.
      const existingCode = (currentGame as { invite_code?: string } | null)?.invite_code;
      if (existingCode) {
        const inviteUrl = `${base}/join/${existingCode}`;
        const ok = await copyToClipboard(inviteUrl);
        trackEvent("invite_shared", { template: currentGame?.config?.template || "custom" });
        if (ok) {
          toast.success("Invite link copied! Share it with players.");
          setInviteCopied(true);
          setTimeout(() => setInviteCopied(false), 2500);
        } else {
          toast.info(inviteUrl, { description: "Tap and hold to copy this link", duration: 10000 });
        }
        return;
      }

      // Slow path: generate a new invite code via API (first time only).
      // Token refresh and API fetch consume the browser user-gesture context, so
      // clipboard.writeText will fail silently afterwards. We fetch the URL first,
      // then attempt clipboard — and only show "Copied" when it actually succeeds.
      let token = session?.access_token;
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) token = refreshed.access_token;
      } catch { /* use existing token */ }
      if (!token) return;

      const res = await fetch(`/api/games/${gameId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Failed to generate invite link"); return; }
      const data = (await res.json()) as { inviteUrl: string };
      trackEvent("invite_shared", { template: currentGame?.config?.template || "custom" });
      const ok = await copyToClipboard(data.inviteUrl);
      if (ok) {
        toast.success("Invite link copied! Share it with players.");
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2500);
      } else {
        toast.info(data.inviteUrl, { description: "Tap and hold to copy this link", duration: 10000 });
      }
    } catch (e) {
      console.error("[invite]", e);
      toast.error("Failed to generate invite link");
    }
  }, [gameId, session?.access_token, currentGame]);

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
      await refreshMembers();
    } catch {
      toast.error(playerId ? "Failed to assign guest" : "Failed to unassign guest");
    }
  }, [gameId, session?.access_token, refreshMembers]);

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
              <p className="text-zinc-400 text-sm mb-6">This game may have been deleted or the link is invalid.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => router.push("/discover")}
                  className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Explore Games
                </button>
                <button
                  onClick={() => router.push("/my-games")}
                  className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  My Games
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Home
                </button>
              </div>
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
    onInvite: isOwner ? handleInvite : undefined,
    inviteJustCopied: inviteCopied,
    gameSectionLabel: "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || guestNickname || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    channelPermissions,
    allPlayers: players,
    unreadCounts,
    hasRules: !!(currentGame?.config?.rules ?? "").trim(),
    hasMyBoard: gamePhase !== "lobby",
    myBoardHasUpdate,
    playerBoardLabel: currentGame?.config?.playerBoardLabel,
    onDeleteChannel: (id: string | undefined) => {
      if (gameRoomIds.has(id ?? "")) toast.info("Game rooms are defined by the Game Master and cannot be removed");
    },
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      {/* Mobile top bar: small screens only */}
      <header className="md:hidden flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "app" ? null : "app"))} aria-label="Open menu">
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 truncate max-w-[40%]">{currentGame?.name ?? "Game"}</span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setMobileLeftDrawer((v) => (v === "channels" ? null : "channels"))} aria-label="Channels & rules">
            <Hash className="size-5 text-zinc-300" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg" onClick={() => setMobileRightDrawer((v) => !v)} aria-label="Player list">
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
        {selectedChannelId === RULES_CHANNEL_ID ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="max-w-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-700/50">
                <BookOpen className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Rules</h2>
              </div>
              {(currentGame?.config?.rules ?? "").trim() ? (
                <div
                  className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-headings:border-b prose-headings:border-zinc-700 prose-headings:pb-1 prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-li:marker:text-white prose-strong:text-white prose-strong:font-semibold prose-code:text-amber-300 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-hr:border-zinc-700"
                  dangerouslySetInnerHTML={{ __html: safeMarked(currentGame!.config!.rules!) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">No rules defined for this game.</p>
                  <p className="text-xs mt-1">The Game Master can add rules when creating the game.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : selectedChannelId === BOARD_CHANNEL_ID ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="max-w-2xl p-6">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#1a0f0a]/40 to-zinc-900/50 p-5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-amber-500/20">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Info className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-amber-200">{currentGame?.config?.playerBoardLabel || "My Board"}</h2>
                </div>
                {boardContentForViewer.trim() ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-strong:text-white prose-code:text-amber-300 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs"
                    dangerouslySetInnerHTML={{ __html: safeMarked(boardContentForViewer) }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                    <p className="text-sm font-medium">Nothing here yet.</p>
                    <p className="text-xs mt-1">The Game Master will update your board as the game progresses.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : gamePhase === "lobby" ? (
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
            <ScrollArea className="flex-1 min-h-0">
              <div className="max-w-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-200 mb-4">{activeSection.name}</h2>
                {activeSection.content.trim() ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white prose-li:text-white prose-strong:text-white prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded"
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
            typingUsers={typingUsers}
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
              setSelectedChannelId(BOARD_CHANNEL_ID);
              setMobileLeftDrawer(null);
            }}
            playerBoardLabel={currentGame?.config?.playerBoardLabel}
            isOwner={isGuestPlayer ? false : (isOwner ? true : undefined)}
            gamePhaseLabel={phaseLabel || undefined}
            gameOverSummary={gameOverSummary || undefined}
            onResumeGame={gameOverSummary && isOwner ? () => {
              setGamePhase("active");
              setGameOverSummary("");
              updateGame(gameId, { isActive: true });
              addMessage({
                senderId: "system",
                senderName: "System",
                senderAvatar: "#6366f1",
                content: "Game resumed by the host.",
                isAI: false,
                isSystemMessage: true,
              });
            } : undefined}
            onNewGame={gameOverSummary ? () => {
              const preset = currentGame?.config?.template;
              router.push(preset ? `/create?preset=${preset}` : "/create");
            } : undefined}
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
            onReact={(messageId, emoji) => {
              const displayName = humanGameIdentity?.name || "You";
              addReaction(messageId, emoji, displayName);
            }}
          />
        ) : null)}
      </div>
      </ErrorBoundary>

      {/* Player panel: desktop visible, right Sheet on mobile */}
            <div className="hidden md:block flex-shrink-0 w-80">
              <PlayerPanelWithBoard
                players={playersForChannel}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                currentUserId={userId}
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
                  currentUserId={userId}
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
          const voiceHint = [char.personality, char.background].filter(Boolean).join('. ') || undefined;
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
            voiceId: pickVoiceForSpeaker(char.gender, voiceHint, undefined, char.name),
            voiceSampleUrl: char.voice_sample_url ?? undefined,
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
