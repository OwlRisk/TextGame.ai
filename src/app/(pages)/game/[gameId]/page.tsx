"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { GameSidebar } from "@/app/components/game-sidebar";
import { ChannelList } from "@/app/components/channel-list";
import { ChatArea } from "@/app/components/chat-area";
import dynamic from "next/dynamic";

const LobbyView = dynamic(() => import("@/app/components/lobby-view").then(m => m.LobbyView), { ssr: false });
const CharacterBrowser = dynamic(() => import("@/app/components/character-browser").then(m => m.CharacterBrowser), { ssr: false });
const PlayerPanelWithBoard = dynamic(() => import("@/app/components/player-panel-with-board").then(m => m.PlayerPanelWithBoard), { ssr: false });
import { isPlayerEliminated } from "@/lib/player-badges";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { Menu, Hash, Users, BookOpen, Info } from "lucide-react";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getGameTemplate } from "@/lib/game-templates";
import { safeMarked } from "@/lib/safe-marked";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

import { useGameRoomPresence } from "@/hooks/useGameRoomPresence";
import { useRoomMembers } from "@/hooks/useRoomMembers";
import { useGameChannels } from "@/hooks/useGameChannels";
import { useGameRoomLifecycle } from "@/hooks/useGameRoomLifecycle";
import { useQuickReplies } from "@/hooks/useQuickReplies";
import { useHostRound } from "@/hooks/useHostRound";
import { useGameInit } from "@/hooks/useGameInit";
import { useGuestPlayer } from "@/hooks/useGuestPlayer";

const AI_COLOR_PALETTE = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7",
] as const;

export default function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { gameId } = use(params);
  const { session } = useAuth();
  const { games, selectedGameId, selectGame, updateGame, touchGame, addGame, gamesLoading } = useGameContext();
  const {
    messages,
    setMessages,
    players,
    setPlayers,
    addMessage,
    gamePhase,
    setGamePhase,
    selectedChannelId,
    setSelectedChannelId,
    userId,
    currentSpeakerId,
    setCurrentSpeakerId,
    typingUsers,
    humanGameIdentity,
    avatarImageUrls,
    onAvatarUrlLoaded,
    isRoomLoading,
    myBoardContent,
    setMyBoardContent,
    sections,
    gameEvents,
    phaseLabel,
    mood,
    activeVote,
    setActiveVote,
    timerEndsAt,
    setTimerEndsAt,
    gameOverSummary,
    setGameOverSummary,
    addReaction,
  } = useGameRoomContext();

  const [showCharacterBrowser, setShowCharacterBrowser] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const { roomMembers, refreshMembers } = useRoomMembers(gameId);
  const [channelPermissions, setChannelPermissions] = useState<Record<string, string[]>>({});
  const pathname = usePathname();

  const currentGame = games.find((g) => g.id === gameId);
  const isOwner = !!games.find((g) => g.id === gameId) && !!session?.user?.id;

  const lobbyMaxSeats = useMemo(() => {
    const templateId = currentGame?.config?.template;
    if (!templateId) return 12;
    return getGameTemplate(templateId)?.maxPlayers ?? 12;
  }, [currentGame?.config?.template]);

  // ─── Presence ──────────────────────────────────────────────────────────────
  const { onlineGuestPresences, isOwnerOnline } = useGameRoomPresence({
    gameId,
    isOwner,
    gamesLoading,
    sessionUserId: session?.user?.id,
    guestNickname: null,
  });

  // ─── Channel management ───────────────────────────────────────────────────
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

  // ─── Game initialization ──────────────────────────────────────────────────
  const {
    startGame,
    launchOpeningRound,
    readyKickoffRef,
    seedCancelledRef,
  } = useGameInit(gameId);

  // ─── Host round (message handling) ────────────────────────────────────────
  const {
    handleSendMessage,
    handleRetryLastMessage,
    isRoundInProgress,
    lastFailedSendContent,
    handleSendMessageRef,
    msgCountRef,
  } = useHostRound({
    gameId,
    channelPermissions,
    setChannelPermissions,
    roomMembers,
    gameRoomEntries,
    defaultGameChannelId,
    readyKickoffRef,
    launchOpeningRound,
  });

  // ─── Guest player logic ───────────────────────────────────────────────────
  const {
    guestId,
    guestNickname,
    isGuestPlayer,
    enrichedGuestMembers,
    boardContentForViewer,
    handleGuestSendMessage,
    handleAssignGuestToPlayer,
  } = useGuestPlayer({
    gameId,
    isOwner,
    isRoundInProgress,
    handleSendMessageRef,
    roomMembers,
    refreshMembers,
    onlineGuestPresences,
  });

  // ─── My Board update indicator ────────────────────────────────────────────
  const [myBoardHasUpdate, setMyBoardHasUpdate] = useState(false);
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

  // ─── Mobile drawers ───────────────────────────────────────────────────────
  const [mobileLeftDrawer, setMobileLeftDrawer] = useState<"app" | "channels" | null>(null);
  const [mobileRightDrawer, setMobileRightDrawer] = useState(false);
  useEffect(() => {
    setMobileLeftDrawer(null);
    setMobileRightDrawer(false);
  }, [pathname]);

  // ─── Analytics & lifecycle ────────────────────────────────────────────────
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

  useEffect(() => { selectGame(gameId); }, [gameId, selectGame]);

  // ─── Shared / guest game load ─────────────────────────────────────────────
  const [sharedLoadPending, setSharedLoadPending] = useState(false);
  const sharedLoadTriedRef = useRef(false);
  useEffect(() => {
    if (gamesLoading || currentGame || !gameId || sharedLoadTriedRef.current) return;
    const urlGuestId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("guestId")
      : null;
    const guestIdForLoad = urlGuestId ?? guestId ?? (typeof window !== "undefined" ? localStorage.getItem(`guestId_${gameId}`) : null);
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

  // Channel migration (legacy "rules"/"progress"/"game-room" → first configured channel)
  useEffect(() => {
    const needsMigrate = selectedChannelId === "rules" || selectedChannelId === "progress" ||
      (selectedChannelId === "game-room" && currentGame?.config?.channels?.length && currentGame.config.channels[0].id !== "game-room");
    if (needsMigrate) {
      const firstChannel = currentGame?.config?.channels?.[0]?.id ?? "game-room";
      setSelectedChannelId(firstChannel);
    }
  }, [currentGame?.config?.channels, selectedChannelId, setSelectedChannelId]);

  // Generate game icon in background
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

  // Rules viewed tracking
  const RULES_CHANNEL_ID = "__rules__";
  const BOARD_CHANNEL_ID = "__my_board__";
  useEffect(() => {
    if (selectedChannelId === RULES_CHANNEL_ID) {
      trackEvent("rules_viewed", { template: currentGame?.config?.template || "unknown" });
    }
  }, [selectedChannelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick reply suggestions
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

  // ─── Invite ───────────────────────────────────────────────────────────────
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* fallthrough */ }
    }
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
    } catch { return false; }
  };

  const handleInvite = useCallback(async () => {
    if (!gameId) return;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "");
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

  // ─── Render ───────────────────────────────────────────────────────────────

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
                <button onClick={() => router.push("/discover")} className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">Explore Games</button>
                <button onClick={() => router.push("/my-games")} className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">My Games</button>
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">Home</button>
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
      {/* Mobile top bar */}
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
      {/* Mobile left drawer: app nav */}
      <Sheet open={mobileLeftDrawer === "app"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Menu" className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950">
          <GameSidebar {...sidebarCommon} onNavigate={() => setMobileLeftDrawer(null)} />
        </SheetContent>
      </Sheet>

      {/* Mobile left drawer: channels */}
      <Sheet open={mobileLeftDrawer === "channels"} onOpenChange={(open) => !open && setMobileLeftDrawer(null)}>
        <SheetContent side="left" title="Channels and rules" className="w-64 max-w-[85vw] p-0 bg-zinc-800 border-r border-zinc-700">
          <ChannelList {...channelListCommon} selectedChannelId={selectedChannelId} onSelectChannel={(id) => { setSelectedChannelId(id); setMobileLeftDrawer(null); }} />
        </SheetContent>
      </Sheet>

      {/* Desktop channel list */}
      <div className="hidden md:block flex-shrink-0">
        <ChannelList {...channelListCommon} onSelectChannel={(id) => setSelectedChannelId(id)} />
      </div>

      <ErrorBoundary>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isRoomLoading && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-violet-950/40 border-b border-violet-800/30 text-center text-xs text-violet-300">Loading room from cloud…</div>
        )}
        {isGuestPlayer && guestNickname && (
          <div className="flex-shrink-0 px-4 py-2 bg-violet-950/30 border-b border-violet-800/20 flex items-center justify-between">
            <span className="text-xs text-violet-300">Playing as <span className="font-semibold text-white">{guestNickname}</span> · Guest</span>
            <span className="text-xs text-zinc-500">AI responses are managed by the host</span>
          </div>
        )}
        {isGuestPlayer && isOwnerOnline === false && (
          <div className="flex-shrink-0 px-4 py-2 bg-amber-950/40 border-b border-amber-700/30 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
            <span className="text-xs text-amber-300">Host is offline — your messages are saved and will be answered when they return.</span>
          </div>
        )}
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
            onAddCharacter={() => {
              const nonHostCount = players.filter((p) => !p.isGameMaster).length;
              if (nonHostCount >= lobbyMaxSeats) {
                toast.info(`Lobby is full (max ${lobbyMaxSeats} players).`);
                return;
              }
              setShowCharacterBrowser(true);
            }}
            onRemovePlayer={(playerId) => {
              setPlayers((prev) => prev.filter((p) => p.id !== playerId));
            }}
            onInvite={isOwner ? handleInvite : undefined}
            inviteJustCopied={inviteCopied}
            maxSeats={lobbyMaxSeats}
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
            introYourTurnHint={gamePhase === "ready-check" ? "Confirm you're ready to begin. The host will start Round 1 once everyone is set." : undefined}
            introYourTurnReply={gamePhase === "ready-check" ? "Ready" : undefined}
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

      {/* Player panel */}
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
          const nonHostCount = players.filter((p) => !p.isGameMaster).length;
          if (nonHostCount >= lobbyMaxSeats) {
            toast.info(`Lobby is full (max ${lobbyMaxSeats} players).`);
            return;
          }
          const existingAiIds = players.filter((p) => p.isAI && !p.isGameMaster).map((p) => {
            const n = parseInt(p.id.split("-")[1]);
            return isNaN(n) ? 0 : n;
          });
          const nextIndex = existingAiIds.length > 0 ? Math.max(...existingAiIds) + 1 : 1;
          const voiceHint = [char.personality, char.background].filter(Boolean).join('. ') || undefined;
          const newPlayer = {
            id: `ai-${nextIndex}`,
            name: char.name,
            avatar: char.avatar_url || AI_COLOR_PALETTE[(nextIndex - 1) % AI_COLOR_PALETTE.length],
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
