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
import { getGameTemplate, getAvatarStyleForTemplate } from "@/lib/game-templates";
import { isSceneMode } from "@/lib/scenes";
import { safeMarked } from "@/lib/safe-marked";
import { trackEvent } from "@/lib/analytics";
import { EvidenceBoard } from "@/app/components/evidence-board";

import { useGameChannels } from "@/hooks/useGameChannels";
import { useGameRoomLifecycle } from "@/hooks/useGameRoomLifecycle";
import { useHostRound } from "@/hooks/useHostRound";
import { useGameInit } from "@/hooks/useGameInit";
import { useChatTTS } from "@/hooks/use-chat-tts";
import { GameEventOverlay, type GameEvent } from "@/app/components/game-event-overlay";
import { useGameActions } from "@/hooks/useGameActions";
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
  } = useGameRoomContext();

  const [showCharacterBrowser, setShowCharacterBrowser] = useState(false);
  const [channelPermissions, setChannelPermissions] = useState<Record<string, string[]>>({});
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
    isFreshLobby,
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
    roomMembers: players,
    gameRoomEntries,
    defaultGameChannelId,
    readyKickoffRef,
    launchOpeningRound,
  });

  // Keep the seed-completion callback in sync with the latest host round handler
  useEffect(() => {
    afterSeedSendRef.current = handleSendMessageRef.current;
  });

  // ─── Auto-start: begin the game as soon as a freshly-created lobby is ready ─
  const autoStartFiredRef = useRef(false);
  const [autoStarting, setAutoStarting] = useState(false);
  const startGameRef = useRef(startGame);
  useEffect(() => { startGameRef.current = startGame; });
  const isSceneGame = isSceneMode(currentGame?.config?.template);
  useEffect(() => {
    if (autoStartFiredRef.current) return;
    if (!isInitialized || gamePhase !== "lobby") return;
    // Scene games always auto-start; other games require a fresh lobby
    if (!isSceneGame && !isFreshLobby) return;
    const nonHostPlayers = players.filter((p) => !p.isGameMaster);
    if (nonHostPlayers.length === 0) return;
    setAutoStarting(true);
    const safetyTimeout = setTimeout(() => setAutoStarting(false), 30000);
    const delay = isSceneGame ? 50 : 600;
    const timer = setTimeout(async () => {
      autoStartFiredRef.current = true;
      try {
        await startGameRef.current();
      } finally {
        clearTimeout(safetyTimeout);
        setAutoStarting(false);
      }
    }, delay);
    return () => { clearTimeout(timer); clearTimeout(safetyTimeout); };
  }, [isInitialized, isFreshLobby, isSceneGame, gamePhase, players]);

  // ─── Auto-set channel permissions from template when game starts ──────────
  const channelPermsInitRef = useRef(false);
  useEffect(() => {
    if (channelPermsInitRef.current) return;
    if (gamePhase !== "active") return;
    const templateId = currentGame?.config?.template;
    if (!templateId) return;
    const tmpl = getGameTemplate(templateId);
    if (!tmpl?.channels) return;

    const initialPerms = buildInitialChannelPermissions(tmpl.channels, players);
    channelPermsInitRef.current = true;
    setChannelPermissions(prev => {
      if (Object.keys(prev).length > 0) return prev;
      return initialPerms;
    });
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

  useGameRoomLifecycle({
    gamePhase,
    gameId,
    timerEndsAt,
    addMessage,
    setTimerEndsAt,
    setActiveVote: () => setActiveVote(null),
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

  // First-game welcome overlay (shows once per user, auto-dismiss after 8s)
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (gamePhase !== "active") return;
    try {
      if (localStorage.getItem("tg_welcome_shown")) return;
    } catch {}
    setShowWelcome(true);
    const timer = setTimeout(() => {
      setShowWelcome(false);
      try { localStorage.setItem("tg_welcome_shown", "1"); } catch {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [gamePhase]);

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
    ? "It's your turn! Type a response in character, or tap a suggestion below."
    : undefined;

  // Game actions (context-sensitive action buttons)
  const humanPlayer = players.find((p) => p.id === userId);
  const gameActions = useGameActions({
    gameTemplate: currentGame?.config?.template,
    gamePhase,
    phaseLabel,
    players,
    userId,
    humanRole: humanPlayer?.role,
    configQuickActions: currentGame?.config?.quickActions,
  });

  // ─── TTS (voice) — default off, user can toggle in header ─────────────────
  const {
    voiceEnabled, setVoiceEnabled, inworldTTSSupported,
    displayedContentRef, revealTick,
  } = useChatTTS({
    messages: messagesForChannel,
    players,
    gameId,
    channelId: selectedChannelId ?? undefined,
    channelName: gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? "game-room",
    isOwner: isOwner ? true : undefined,
    gameTemplate: currentGame?.config?.template,
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!currentGame) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center">
          {gamesLoading ? (
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
    onOpenProfile: () => router.push("/profile"),
    onUpdateGame: updateGame,
  };
  const isScene = isSceneMode(currentGame?.config?.template);
  const channelListCommon = {
    gameName: currentGame?.name ?? "Game",
    channels: gameChannels,
    selectedChannelId,
    gameSectionLabel: isScene ? "Adventure" : "Game Rooms",
    userDisplayName: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null,
    gameUserDisplayName: humanGameIdentity?.name || null,
    gameId,
    avatarImageUrls,
    onAvatarUrlLoaded,
    channelPermissions,
    allPlayers: players,
    unreadCounts,
    hasRules: isScene ? false : !!(currentGame?.config?.rules ?? "").trim(),
    hasMyBoard: isScene ? false : gamePhase !== "lobby",
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
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-700/50">
                <Info className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">{currentGame?.config?.playerBoardLabel || (currentGame?.config?.template === "script-kill" ? "Evidence Board" : "My Board")}</h2>
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
                  <p className="text-sm font-medium">Nothing here yet.</p>
                  <p className="text-xs mt-1">The Game Master will update your board as the game progresses.</p>
                </div>
              )}
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
            autoStarting={autoStarting}
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
          <div className="relative flex-1 flex flex-col min-h-0">
          <GameEventOverlay event={currentGameEvent} onDismiss={dismissGameEvent} />
          <ChatArea
            channelName={gameRoomEntries.find((c) => c.id === selectedChannelId)?.name ?? selectedChannelId ?? "game-room"}
            channelId={selectedChannelId ?? undefined}
            messages={messagesForChannel}
            players={playersForChannel}
            onSendMessage={handleSendMessage}
            isGameActive={gamePhase !== "ended"}
            currentSpeakerId={currentSpeakerId}
            typingUsers={typingUsers}
            userId={userId}
            gameId={gameId}
            gameTemplate={currentGame?.config?.template}
            gameActions={gameActions}
            gameEvents={gameEvents}
            humanName={humanGameIdentity?.name || undefined}
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
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              localStorage.setItem('voice_enabled', String(next));
            }}
            inworldTTSSupported={inworldTTSSupported}
            displayedContentRef={displayedContentRef}
            revealTick={revealTick}
            alivePlayers={players.filter(p => !isPlayerEliminated(p))}
            onReact={(messageId, emoji) => {
              const displayName = humanGameIdentity?.name || "You";
              addReaction(messageId, emoji, displayName);
            }}
          />
          </div>
        ) : null)}
      </div>
      </ErrorBoundary>

      {/* Player panel */}
            <div className="hidden md:block flex-shrink-0 w-80">
              <PlayerPanelWithBoard
                players={isScene ? playersForChannel.filter(p => !p.isGameMaster) : playersForChannel}
                gameId={gameId}
                humanGameIdentity={humanGameIdentity}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                currentUserId={userId}
                isHiddenRoleGame={currentGame?.config?.hideRolesInPlayerList ?? false}
              />
            </div>

            <Sheet open={mobileRightDrawer} onOpenChange={setMobileRightDrawer}>
              <SheetContent side="right" title="Players" className="w-[18rem] max-w-[85vw] p-0 bg-zinc-850 border-l border-zinc-700 [&>button:last-child]:hidden">
                <PlayerPanelWithBoard
                  players={isScene ? playersForChannel.filter(p => !p.isGameMaster) : playersForChannel}
                  gameId={gameId}
                  humanGameIdentity={humanGameIdentity}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                  currentUserId={userId}
                  isHiddenRoleGame={currentGame?.config?.hideRolesInPlayerList ?? false}
                />
              </SheetContent>
            </Sheet>
      </div>

      <CharacterBrowser
        open={showCharacterBrowser}
        onClose={() => setShowCharacterBrowser(false)}
        gameId={gameId}
        style={getAvatarStyleForTemplate(currentGame?.config?.template || "custom")}
        onSelectCharacter={(char) => {
          const nonHostCount = players.filter((p) => !p.isGameMaster).length;
          if (nonHostCount >= lobbyMaxSeats) {
            toast.info(`Lobby is full (max ${lobbyMaxSeats} players).`);
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
        }}
      />

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-violet-500/30 shadow-2xl shadow-violet-500/10 p-6 animate-in fade-in zoom-in-95 duration-300"
            onClick={() => { setShowWelcome(false); try { localStorage.setItem("tg_welcome_shown", "1"); } catch {} }}
            role="dialog"
            aria-label="Welcome guide"
          >
            <h3 className="text-lg font-bold text-white mb-4">How to play</h3>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">1</span>
                <span>The <strong className="text-white">AI Host</strong> runs the game — assigns roles, manages phases, keeps things moving.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">2</span>
                <span>When you see <strong className="text-emerald-400">&quot;It&apos;s your turn&quot;</strong>, type your response below.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">3</span>
                <span>Not sure what to say? Tap a <strong className="text-violet-400">suggested reply</strong> to jump right in.</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500 text-center">Tap anywhere to dismiss</p>
          </div>
        </div>
      )}

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
