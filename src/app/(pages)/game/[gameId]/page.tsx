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

const CharacterBrowser = dynamic(() => import("@/app/components/character-browser").then(m => m.CharacterBrowser), { ssr: false });
const PlayerPanelWithBoard = dynamic(() => import("@/app/components/player-panel-with-board").then(m => m.PlayerPanelWithBoard), { ssr: false });
const RpgPanel = dynamic(() => import("@/app/components/rpg-panel").then(m => m.RpgPanel), { ssr: false });
const PlayerProfileDialog = dynamic(() => import("@/app/components/player-profile-dialog").then(m => m.PlayerProfileDialog), { ssr: false });
import { isPlayerEliminated } from "@/lib/player-badges";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { Menu, Hash, Users, BookOpen, Info } from "lucide-react";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { getGameTemplate, getAvatarStyleForTemplate } from "@/lib/game-templates";
import { isSceneMode } from "@/lib/scenes";
import { t, getBrowserLanguage, tAction, tTemplate } from "@/lib/i18n";
import { safeMarked } from "@/lib/safe-marked";
import { trackEvent } from "@/lib/analytics";
import { EvidenceBoard } from "@/app/components/evidence-board";

import { useGameChannels } from "@/hooks/useGameChannels";
import { useGameRoomLifecycle } from "@/hooks/useGameRoomLifecycle";
import { useHostRound } from "@/hooks/useHostRound";
import { OutOfCreditsModal } from "@/app/components/out-of-credits-modal";
import { useGameInit } from "@/hooks/useGameInit";
import { GameEventOverlay, type GameEvent } from "@/app/components/game-event-overlay";
import { useGameActions, getSceneDialogueChips, getPhaseType } from "@/hooks/useGameActions";
import { buildInitialChannelPermissions } from "@/lib/game-host-utils";

const AI_COLOR_PALETTE = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7",
  "#dc2626", "#d97706", "#059669", "#2563eb", "#7c3aed",
  "#db2777", "#0d9488", "#ea580c", "#4f46e5", "#9333ea",
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
    aiSuggestedPrompts,
    addReaction,
    setGameEvents,
    gmState,
  } = useGameRoomContext();

  const [showCharacterBrowser, setShowCharacterBrowser] = useState(false);
  const [channelPermissions, setChannelPermissions] = useState<Record<string, string[]>>({});
  const [profilePlayer, setProfilePlayer] = useState<import("@/types/player").Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const handlePlayerClick = useCallback((player: import("@/types/player").Player) => {
    setProfilePlayer(player);
    setProfileOpen(true);
  }, []);

  const currentRoom = useMemo(() => {
    if (!gmState?.worldRooms) return null;
    return gmState.worldRooms.rooms[gmState.worldRooms.currentRoomId] ?? null;
  }, [gmState?.worldRooms]);

  // Older message loading from game_messages API
  const [hasMoreDbMessages, setHasMoreDbMessages] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const loadMoreMessages = useCallback(async () => {
    if (!session?.access_token || isLoadingMoreMessages) return;
    setIsLoadingMoreMessages(true);
    try {
      const oldest = messages.length > 0 ? messages[0] : null;
      const before = oldest?.timestamp instanceof Date ? oldest.timestamp.toISOString() : oldest?.timestamp;
      const url = `/api/games/${gameId}/messages?limit=50${before ? `&before=${before}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setHasMoreDbMessages(false); return; }
      const data = await res.json();
      if (!data.messages?.length) { setHasMoreDbMessages(false); return; }
      setHasMoreDbMessages(data.hasMore);
      const existingIds = new Set(messages.map((m: { id: string }) => m.id));
      const newMsgs = data.messages
        .filter((m: { id: string }) => !existingIds.has(m.id))
        .map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          senderAvatar: m.senderAvatar,
          content: m.content,
          timestamp: new Date(m.timestamp),
          channelId: m.channelId,
          isAI: m.isAI,
          isSystemMessage: m.isSystemMessage,
          isPrivate: m.isPrivate,
          isAnnouncement: m.isAnnouncement,
          imageUrl: m.imageUrl,
          reactions: m.reactions || [],
          isStreaming: false,
        }));
      if (newMsgs.length > 0) {
        setMessages((prev: any[]) => [...newMsgs, ...prev]);
      }
    } catch (e) {
      console.error("Failed to load older messages:", e);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [gameId, session?.access_token, messages, isLoadingMoreMessages, setMessages]);
  const pathname = usePathname();

  const currentGame = games.find((g) => g.id === gameId);
  const isOwner = !!games.find((g) => g.id === gameId) && !!session?.user?.id;

  const lobbyMaxSeats = useMemo(() => {
    const templateId = currentGame?.config?.template;
    if (!templateId) return 12;
    return getGameTemplate(templateId)?.maxPlayers ?? 12;
  }, [currentGame?.config?.template]);

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
    phaseLabel,
  });

  // ─── Game initialization ──────────────────────────────────────────────────
  const {
    startGame,
    launchOpeningRound,
    readyKickoffRef,
    seedCancelledRef,
    afterSeedSendRef,
    isInitialized,
    contentLanguage,
  } = useGameInit(gameId);

  // ─── Host round (message handling) ────────────────────────────────────────
  const {
    handleSendMessage,
    handleRetryLastMessage,
    isRoundInProgress,
    lastFailedSendContent,
    handleSendMessageRef,
    msgCountRef,
    channelTaskHint,
    dynamicQuickActions,
    creditsExhausted,
    dismissCreditsExhausted,
  } = useHostRound({
    gameId,
    channelPermissions,
    setChannelPermissions,
    gameRoomEntries,
    defaultGameChannelId,
    readyKickoffRef,
    launchOpeningRound,
    contentLanguage,
  });

  const handleRoomNavigate = useCallback((direction: string) => {
    handleSendMessage(direction);
  }, [handleSendMessage]);

  // Keep the seed-completion callback in sync with the latest host round handler
  useEffect(() => {
    afterSeedSendRef.current = handleSendMessageRef.current;
  });

  // ─── Auto-start: always skip the lobby — start immediately once players exist ─
  const autoStartFiredRef = useRef(false);
  const [autoStarting, setAutoStarting] = useState(false);
  const startGameRef = useRef(startGame);
  useEffect(() => { startGameRef.current = startGame; });
  const isSceneGame = isSceneMode(currentGame?.config?.template);
  useEffect(() => {
    if (autoStartFiredRef.current) return;
    if (!isInitialized || gamePhase !== "lobby") return;
    const nonHostPlayers = players.filter((p) => !p.isGameMaster);
    if (nonHostPlayers.length === 0) return;
    setAutoStarting(true);
    autoStartFiredRef.current = true;
    const safetyTimeout = setTimeout(() => setAutoStarting(false), 30000);
    startGameRef.current().finally(() => { clearTimeout(safetyTimeout); setAutoStarting(false); });
    return () => clearTimeout(safetyTimeout);
  }, [isInitialized, gamePhase, players]);

  // ─── Auto-set channel permissions from template when game starts ──────────
  const channelPermsRoleFingerprintRef = useRef<string>("");
  useEffect(() => {
    if (gamePhase !== "active") return;
    const templateId = currentGame?.config?.template;
    if (!templateId) return;
    const tmpl = getGameTemplate(templateId);
    if (!tmpl?.channels) return;

    const roleFingerprint = players
      .map(p => `${p.id}:${p.role ?? ""}`)
      .sort()
      .join("|");
    if (roleFingerprint === channelPermsRoleFingerprintRef.current) return;
    channelPermsRoleFingerprintRef.current = roleFingerprint;

    const initialPerms = buildInitialChannelPermissions(tmpl.channels, players);
    setChannelPermissions(initialPerms);
  }, [gamePhase, currentGame?.config?.template, players]);

  // ─── My Board update indicator ────────────────────────────────────────────
  const boardContentForViewer = myBoardContent[userId] ?? "";
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

  // ─── Game event overlay ──────────────────────────────────────────────────
  const [currentGameEvent, setCurrentGameEvent] = useState<GameEvent | null>(null);
  const prevPhaseLabelRef = useRef(phaseLabel);
  useEffect(() => {
    if (phaseLabel && phaseLabel !== prevPhaseLabelRef.current && gamePhase === "active") {
      const lower = phaseLabel.toLowerCase();
      const mood = /night/i.test(lower) ? "dark" as const : /day|dawn/i.test(lower) ? "light" as const : "neutral" as const;
      setCurrentGameEvent({ id: `phase-${Date.now()}`, type: "phase", text: phaseLabel, mood });
    }
    prevPhaseLabelRef.current = phaseLabel;
  }, [phaseLabel, gamePhase]);
  useEffect(() => {
    if (gameOverSummary) {
      setCurrentGameEvent({ id: `gameover-${Date.now()}`, type: "game_over", text: "Game Over", subtext: gameOverSummary.slice(0, 120), mood: "victory" });
    }
  }, [gameOverSummary]);
  const prevActiveVoteRef = useRef<typeof activeVote>(null);
  useEffect(() => {
    if (activeVote && !prevActiveVoteRef.current && gamePhase === "active") {
      setCurrentGameEvent({ id: `vote-${Date.now()}`, type: "vote_start", text: activeVote.question || "Vote Now", mood: "neutral" });
    } else if (!activeVote && prevActiveVoteRef.current && gamePhase === "active") {
      setCurrentGameEvent({ id: `vote-end-${Date.now()}`, type: "vote_end", text: "Voting Closed", mood: "neutral" });
    }
    prevActiveVoteRef.current = activeVote;
  }, [activeVote, gamePhase]);
  const dismissGameEvent = useCallback(() => setCurrentGameEvent(null), []);
  const prevEliminatedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentElim = new Set(players.filter(p => isPlayerEliminated(p)).map(p => p.id));
    const newElim = [...currentElim].filter(id => !prevEliminatedRef.current.has(id));
    if (newElim.length > 0 && gamePhase === "active") {
      const names = newElim.map(id => players.find(p => p.id === id)?.name ?? "Someone");
      setCurrentGameEvent({
        id: `elim-${Date.now()}`,
        type: "elimination",
        text: names.length === 1 ? `${names[0]} Eliminated` : `${names.join(", ")} Eliminated`,
        mood: "danger",
      });
    }
    prevEliminatedRef.current = currentElim;
  }, [players, gamePhase]);

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
      const phase = gamePhaseRef.current;
      if (phase === "lobby" || phase === "active") {
        trackEvent("game_abandoned", {
          template: currentGame?.config?.template || "unknown",
          phase,
          duration_seconds: Math.round((Date.now() - gameEnteredAtRef.current) / 1000),
          messages_sent: msgCountRef.current,
        });
      }
    };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearActiveVote = useCallback(() => setActiveVote(null), [setActiveVote]);

  useGameRoomLifecycle({
    gamePhase,
    gameId,
    timerEndsAt,
    addMessage,
    setTimerEndsAt,
    setActiveVote: clearActiveVote,
  });

  useEffect(() => { selectGame(gameId); }, [gameId, selectGame]);

  // Channel migration (legacy "rules"/"progress"/"game-room" → first configured channel)
  useEffect(() => {
    const needsMigrate = selectedChannelId === "rules" || selectedChannelId === "progress" ||
      (selectedChannelId === "game-room" && currentGame?.config?.channels?.length && currentGame.config.channels[0].id !== "game-room");
    if (needsMigrate) {
      const firstChannel = currentGame?.config?.channels?.[0]?.id ?? "game-room";
      setSelectedChannelId(firstChannel);
    }
  }, [currentGame?.config?.channels, selectedChannelId, setSelectedChannelId]);

  // Game icons are now static per template; no DALL-E generation needed.

  // Rules viewed tracking
  const RULES_CHANNEL_ID = "__rules__";
  const BOARD_CHANNEL_ID = "__my_board__";
  useEffect(() => {
    if (selectedChannelId === RULES_CHANNEL_ID) {
      trackEvent("rules_viewed", { template: currentGame?.config?.template || "unknown" });
    }
  }, [selectedChannelId]); // eslint-disable-line react-hooks/exhaustive-deps


  // Track first message sent (state-driven so the hint disappears reactively)
  const [hasUserSentFirstMsg, setHasUserSentFirstMsg] = useState(false);
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const currentCount = msgCountRef.current;
    if (!hasUserSentFirstMsg && currentCount > prevMsgCountRef.current) {
      setHasUserSentFirstMsg(true);
    }
    prevMsgCountRef.current = currentCount;
  });

  const introYourTurnHint = !hasUserSentFirstMsg && gamePhase === "active" && currentSpeakerId === userId
    ? t("hint.first_turn", getBrowserLanguage())
    : undefined;

  // Game actions (context-sensitive action buttons)
  const humanPlayer = players.find((p) => p.id === userId);
  const rpgWorldId = currentGame?.config?.rpgWorldId;
  const isRpgMode = !!rpgWorldId;
  const rpgAvatarStyle = isRpgMode ? getAvatarStyleForTemplate(undefined, rpgWorldId) : undefined;
  const templateActions = useGameActions({
    gameTemplate: currentGame?.config?.template,
    gamePhase,
    phaseLabel,
    players,
    userId,
    humanRole: humanPlayer?.role,
    configQuickActions: currentGame?.config?.quickActions,
  });
  const gameActions = useMemo(() => {
    if (dynamicQuickActions && dynamicQuickActions.length > 0) {
      return dynamicQuickActions.map((label) => ({
        label,
        template: label,
        icon: undefined as string | undefined,
        actionType: "dynamic" as const,
      }));
    }
    return templateActions;
  }, [dynamicQuickActions, templateActions]);

  const dialogueChips = useMemo(() => {
    if (gamePhase !== "active") return [];
    const tmplId = currentGame?.config?.template;
    let chips: Array<{ label: string; starter: string; icon?: string }>;
    if (tmplId && isSceneMode(tmplId)) {
      const phase = getPhaseType(phaseLabel);
      chips = getSceneDialogueChips(phase);
    } else if (!tmplId) {
      chips = [];
    } else {
      chips = getGameTemplate(tmplId)?.dialogueChips ?? [];
    }
    return chips.map(c => ({ ...c, label: tAction(c.label), starter: tTemplate(c.starter) }));
  }, [currentGame?.config?.template, gamePhase, phaseLabel]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!currentGame) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          {gamesLoading ? (
            <>
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-4" aria-hidden />
              <p className="text-zinc-400">{t("status.loading_game")}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">{t("game.not_found")}</h1>
              <p className="text-zinc-400 text-sm mb-6">{t("game.not_found_desc")}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => router.push("/discover")} className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">{t("nav.discover")}</button>
                <button onClick={() => router.push("/my-games")} className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">{t("nav.my_games")}</button>
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">{t("nav.home")}</button>
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
    onOpenProfile: () => router.push("/profile"),
    onUpdateGame: updateGame,
  };
  const isScene = isSceneMode(currentGame?.config?.template);
  const channelListCommon = {
    gameName: currentGame?.name ?? "Game",
    channels: gameChannels,
    selectedChannelId,
    gameSectionLabel: isScene ? t("channel.adventure") : t("channel.game_rooms"),
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    channelPermissions,
    allPlayers: players,
    unreadCounts,
    hasRules: isScene ? false : !!(currentGame?.config?.playerRules ?? "").trim(),
    hasMyBoard: isScene ? false : gamePhase !== "lobby",
    myBoardHasUpdate,
    playerBoardLabel: currentGame?.config?.playerBoardLabel,
    onDeleteChannel: (id: string | undefined) => {
      if (gameRoomIds.has(id ?? "")) toast.info(t("channel.cannot_remove"));
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
          <div className="flex-shrink-0 px-4 py-1.5 bg-violet-950/40 border-b border-violet-800/30 text-center text-xs text-violet-300">{t("status.loading_room")}</div>
        )}
        {selectedChannelId === RULES_CHANNEL_ID ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="max-w-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-700/50">
                <BookOpen className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">{t("label.rules")}</h2>
              </div>
              {(currentGame?.config?.playerRules ?? "").trim() ? (
                <div
                  className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-headings:border-b prose-headings:border-zinc-700 prose-headings:pb-1 prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-li:marker:text-white prose-strong:text-white prose-strong:font-semibold prose-code:text-amber-300 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-hr:border-zinc-700"
                  dangerouslySetInnerHTML={{ __html: safeMarked(currentGame!.config!.playerRules!) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">{t("game.no_rules")}</p>
                  <p className="text-xs mt-1">{t("game.no_rules_hint")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : selectedChannelId === BOARD_CHANNEL_ID ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="max-w-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-700/50">
                <Info className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">{currentGame?.config?.playerBoardLabel || (currentGame?.config?.template === "script-kill" ? t("channel.evidence_board") : t("channel.my_board"))}</h2>
              </div>
              {boardContentForViewer.trim() ? (
                currentGame?.config?.template === "script-kill" ? (
                  <EvidenceBoard boardContent={boardContentForViewer} />
                ) : (
                  <div
                    className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-headings:border-b prose-headings:border-zinc-700 prose-headings:pb-1 prose-p:text-white prose-p:leading-relaxed prose-li:text-white prose-li:marker:text-white prose-strong:text-white prose-strong:font-semibold prose-code:text-amber-300 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-hr:border-zinc-700"
                    dangerouslySetInnerHTML={{ __html: safeMarked(boardContentForViewer) }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">{t("game.nothing_here")}</p>
                  <p className="text-xs mt-1">{t("game.board_hint")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : gamePhase === "lobby" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="h-8 w-8 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">
                {isScene ? t("status.setting_scene", getBrowserLanguage()) : t("status.preparing_game", getBrowserLanguage())}
              </p>
            </div>
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
                    <p className="text-sm font-medium">{t("board.no_content_yet")}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          );
          return null;
        })() ?? (isGameChannel ? (
          <div className="relative flex-1 flex flex-col min-h-0">
          <GameEventOverlay event={currentGameEvent} onDismiss={dismissGameEvent} />
          <ChatArea
            channelName={gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? t("channel.default_room", getBrowserLanguage())}
            channelId={selectedChannelId ?? undefined}
            messages={messagesForChannel}
            players={playersForChannel.filter((p) => !p.isGameMaster)}
            onSendMessage={handleSendMessage}
            isGameActive={gamePhase !== "ended"}
            currentSpeakerId={currentSpeakerId}
            typingUsers={typingUsers}
            userId={userId}
            gameId={gameId}
            gameTemplate={currentGame?.config?.template}
            gameActions={gameActions}
            dialogueChips={dialogueChips}
            gameEvents={gameEvents}
            humanName={humanGameIdentity?.name || undefined}
            isRpgMode={isRpgMode}
            rpgWorldId={currentGame?.config?.rpgWorldId}
            introYourTurnHint={introYourTurnHint}
            aiSuggestedPrompts={aiSuggestedPrompts}
            lastFailedSendContent={lastFailedSendContent}
            onRetryLastMessage={handleRetryLastMessage}
            isRoundInProgress={isRoundInProgress}
            avatarImageUrls={avatarImageUrls}
            onAvatarUrlLoaded={onAvatarUrlLoaded}
            onOpenPlayerBoard={() => {
              setSelectedChannelId(BOARD_CHANNEL_ID);
              setMobileLeftDrawer(null);
            }}
            playerBoardLabel={currentGame?.config?.playerBoardLabel}
            onOpenRules={(currentGame?.config?.playerRules ?? "").trim() ? () => {
              setSelectedChannelId(RULES_CHANNEL_ID);
              setMobileLeftDrawer(null);
            } : undefined}
            myBoardHasUpdate={myBoardHasUpdate}
            isOwner={isOwner ? true : undefined}
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
              router.push("/discover");
            } : undefined}
            onRematch={gameOverSummary && currentGame?.config?.template ? () => {
              const cfg = currentGame.config;
              const tmpl = getGameTemplate(cfg.template);
              const newId = crypto.randomUUID();
              const newGame = {
                id: newId,
                name: currentGame.name,
                icon: currentGame.icon,
                color: currentGame.color,
                config: {
                  ...cfg,
                  configuredPlayers: cfg.configuredPlayers ?? [],
                  humanRole: cfg.humanRole,
                },
                isActive: true,
                updatedAt: new Date().toISOString(),
              };
              addGame(newGame);
              selectGame(newId);
              trackEvent("game_rematch", { template: cfg.template, player_count: tmpl?.recommendedAICount ?? 4 });
              router.push(`/game/${newId}`);
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
              const me = players.find(p => p.id === userId || p.name === humanGameIdentity?.name);
              return me ? isPlayerEliminated(me) : false;
            })()}
            isInAfterlife={selectedChannelId === "afterlife"}
            mood={mood}
            activeVote={activeVote}
            onVote={activeVote ? (choice: string) => {
              handleSendMessage(`I vote for ${choice}`);
            } : undefined}
            timerEndsAt={timerEndsAt}
            alivePlayers={players.filter(p => !isPlayerEliminated(p))}
            onReact={(messageId, emoji) => {
              const displayName = humanGameIdentity?.name || "You";
              addReaction(messageId, emoji, displayName);
            }}
            channelTaskHint={channelTaskHint}
            humanGameIdentity={humanGameIdentity}
            isUserGameMaster={isOwner}
            onLoadMoreMessages={loadMoreMessages}
            hasMoreDbMessages={hasMoreDbMessages}
            isLoadingMoreMessages={isLoadingMoreMessages}
          />
          </div>
        ) : null)}
      </div>
      </ErrorBoundary>

      {/* Player panel */}
            <div className="hidden md:block flex-shrink-0 w-80">
              {isRpgMode ? (
                <RpgPanel
                  players={playersForChannel}
                  currentSpeakerId={currentSpeakerId}
                  currentUserId={userId}
                  gameId={gameId}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  avatarStyle={rpgAvatarStyle}
                  onPlayerClick={handlePlayerClick}
                  currentRoom={currentRoom}
                  onNavigate={handleRoomNavigate}
                />
              ) : (
              <PlayerPanelWithBoard
                players={isScene ? playersForChannel.filter(p => !p.isGameMaster) : playersForChannel}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                currentUserId={userId}
                isHiddenRoleGame={currentGame?.config?.hideRolesInPlayerList ?? false}
                isUserGameMaster={isOwner}
                onAddAI={() => {
                  const nonHostCount = players.filter((p) => !p.isGameMaster).length;
                  if (nonHostCount >= lobbyMaxSeats) {
                    toast.info(t("lobby.max_seats", getBrowserLanguage()).replace("{max}", String(lobbyMaxSeats)));
                    return;
                  }
                  setShowCharacterBrowser(true);
                }}
                onRemovePlayer={(playerId) => setPlayers((prev) => prev.filter((p) => p.id !== playerId))}
                maxSeats={lobbyMaxSeats}
              />
              )}
            </div>

            <Sheet open={mobileRightDrawer} onOpenChange={setMobileRightDrawer}>
              <SheetContent side="right" title="Players" className="w-[18rem] max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700 [&>button:last-child]:hidden">
                {isRpgMode ? (
                  <RpgPanel
                    players={playersForChannel}
                    currentSpeakerId={currentSpeakerId}
                    currentUserId={userId}
                    gameId={gameId}
                    avatarImageUrls={avatarImageUrls}
                    onAvatarUrlLoaded={onAvatarUrlLoaded}
                    avatarStyle={rpgAvatarStyle}
                    onPlayerClick={handlePlayerClick}
                    currentRoom={currentRoom}
                    onNavigate={handleRoomNavigate}
                  />
                ) : (
                <PlayerPanelWithBoard
                  players={isScene ? playersForChannel.filter(p => !p.isGameMaster) : playersForChannel}
                  gameId={gameId}
                  humanGameIdentity={humanGameIdentity}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  currentUserId={userId}
                  isHiddenRoleGame={currentGame?.config?.hideRolesInPlayerList ?? false}
                  isUserGameMaster={isOwner}
                  onAddAI={() => {
                    const nonHostCount = players.filter((p) => !p.isGameMaster).length;
                    if (nonHostCount >= lobbyMaxSeats) {
                      toast.info(t("lobby.max_seats", getBrowserLanguage()).replace("{max}", String(lobbyMaxSeats)));
                      return;
                    }
                    setShowCharacterBrowser(true);
                  }}
                  onRemovePlayer={(playerId) => setPlayers((prev) => prev.filter((p) => p.id !== playerId))}
                  maxSeats={lobbyMaxSeats}
                />
                )}
              </SheetContent>
            </Sheet>
      </div>

      <CharacterBrowser
        open={showCharacterBrowser}
        onClose={() => setShowCharacterBrowser(false)}
        gameId={gameId}
        style={getAvatarStyleForTemplate(currentGame?.config?.template || "custom", currentGame?.config?.rpgWorldId)}
        onSelectCharacter={(char) => {
          const nonHostCount = players.filter((p) => !p.isGameMaster).length;
          if (nonHostCount >= lobbyMaxSeats) {
            toast.info(t("lobby.max_seats", getBrowserLanguage()).replace("{max}", String(lobbyMaxSeats)));
            return;
          }
          if (players.some((p) => p.name === char.name)) {
            toast.info(`${char.name} is already in the game.`);
            return;
          }
          const existingAiIds = players.filter((p) => p.isAI && !p.isGameMaster).map((p) => {
            const n = parseInt(p.id.split("-")[1]);
            return isNaN(n) ? 0 : n;
          });
          const nextIndex = existingAiIds.length > 0 ? Math.max(...existingAiIds) + 1 : 1;
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
            voiceId: char.voice_id ?? undefined,
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

          const tmpl = getGameTemplate(currentGame?.config?.template || "");
          if (tmpl?.hasHiddenRoles) {
            setGameEvents((prev) => [
              ...prev,
              `NEW_PLAYER_JOINED: ${char.name} has joined mid-game and needs a role. Use ASSIGN_ROLE to assign an appropriate role and [BOARD:${char.name}] to brief them privately. Narrate their arrival in-character.`,
            ]);
            setTimeout(() => {
              handleSendMessageRef.current?.(
                `[System: A new player "${char.name}" has joined. Assign them a role with ASSIGN_ROLE and narrate their arrival.]`,
                { channelId: selectedChannelId ?? undefined },
              );
            }, 500);
          }
        }}
      />


      <PlayerProfileDialog
        player={profilePlayer}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        gameId={gameId}
        avatarImageUrls={avatarImageUrls}
        onAvatarUrlLoaded={onAvatarUrlLoaded}
        humanGameIdentity={humanGameIdentity}
        isUserGameMaster={isOwner}
        avatarStyle={rpgAvatarStyle}
      />

      <OutOfCreditsModal open={creditsExhausted} onClose={dismissCreditsExhausted} />

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
