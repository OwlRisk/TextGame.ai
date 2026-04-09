"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { useGameRoomContext } from "@/app/contexts/GameRoomContext";
import { toast } from "sonner";
import { fetchAvatarsForRoom, type RoomPlayerInfo } from "@/lib/avatar";
import { assignVoicesForRoom, pickVoiceForSpeaker, INWORLD_VOICE_META } from "@/lib/inworld-voices";
import { buildAiPlayerBriefing } from "@/lib/ai-player-briefing";
import { seedInitialPlayerReplies } from "@/lib/seed-initial-replies";
import { trackEvent } from "@/lib/analytics";
import { getGameTemplate, getTemplateHexColor, getAvatarStyleForTemplate, type GameTemplate } from "@/lib/game-templates";
import { getMysteryCase } from "@/data/mystery-cases";
import { buildSuspectPrompt, buildInitialEvidenceBoard } from "@/lib/suspect-prompt-builder";
import { getScene, isSceneMode } from "@/lib/scenes";
import { extractPreferredName, detectBrowserLanguage } from "@/lib/content-language";
import { t } from "@/lib/i18n";

function buildRoleBoardContent(tmpl: GameTemplate | undefined, role: string): string {
  if (!tmpl) return `**Your Role: ${role}**`;
  const rulesText = tmpl.defaultRules || "";
  const roleRegex = new RegExp(`-\\s*${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^\\n]+)`, "i");
  const match = rulesText.match(roleRegex);
  const desc = match?.[1]?.trim();
  if (desc) return `**Your Role: ${role}**\n\n${desc}`;
  return `**Your Role: ${role}**`;
}

const AI_COLOR_PALETTE = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#a855f7",
  "#dc2626", "#d97706", "#059669", "#2563eb", "#7c3aed",
  "#db2777", "#0d9488", "#ea580c", "#4f46e5", "#9333ea",
] as const;

export interface OpeningKickoffState {
  channelId: string;
  hostName: string;
  hostColor: string;
  gameTemplate?: string;
  gameName: string;
  rules?: string;
  humanPlayerName: string;
  sceneId?: string;
  aiPlayers: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    stats?: Record<string, string | number>;
    personality?: string;
    background?: string;
    speechStyle?: string;
    quirk?: string;
  }>;
  playerNotesById: Record<string, string>;
}

export interface UseGameInitReturn {
  initializeLobby: () => void;
  startGame: () => Promise<void>;
  launchOpeningRound: (kickoff: OpeningKickoffState) => Promise<void>;
  isInitialized: boolean;
  /** True only when the lobby was freshly created (not restored from saved state) */
  isFreshLobby: boolean;
  readyKickoffRef: React.MutableRefObject<OpeningKickoffState | null>;
  seedCancelledRef: React.MutableRefObject<boolean>;
  /** Set this to handleSendMessageRef from useHostRound so the game auto-continues after seed replies */
  afterSeedSendRef: React.MutableRefObject<((content: string, options?: { skipAddMessage?: boolean; channelId?: string }) => Promise<void>) | null>;
  /** User's content language preference (from Profile > navigator.language > "en") */
  contentLanguage: string;
}

export function useGameInit(gameId: string): UseGameInitReturn {
  const { session } = useAuth();
  const { games, updateGame } = useGameContext();
  const {
    players,
    setPlayers,
    setPlayerNotes,
    gamePhase,
    setGamePhase,
    setCurrentSpeakerId,
    setTypingUsers,
    userId,
    humanGameIdentity,
    setHumanGameIdentity,
    avatarImageUrls,
    onAvatarUrlLoaded,
    isRoomLoading,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    setMyBoardContent,
  } = useGameRoomContext();

  const currentGame = games.find((g) => g.id === gameId);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFreshLobby, setIsFreshLobby] = useState(false);
  const [contentLanguage, setContentLanguage] = useState(() => detectBrowserLanguage());
  const seedCancelledRef = useRef(false);
  const readyKickoffRef = useRef<OpeningKickoffState | null>(null);
  const gameStartingRef = useRef(false);
  const afterSeedSendRef = useRef<((content: string, options?: { skipAddMessage?: boolean; channelId?: string }) => Promise<void>) | null>(null);
  const langFetchedRef = useRef(false);
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  useEffect(() => {
    seedCancelledRef.current = false;
    readyKickoffRef.current = null;
    return () => { seedCancelledRef.current = true; };
  }, [gameId]);

  const buildHostPlayer = useCallback((config: any) => {
    const hostColor = "#52525b";
    const hostName = "Narrator";
    return {
      player: {
        id: "gm-1",
        name: hostName,
        avatar: hostColor,
        role: "Narrator",
        status: "Narrator",
        isGameMaster: true,
        isAI: true,
        isMuted: false,
        background: "Invisible storyteller and director",
        personality: undefined,
        gender: "other" as const,
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
      avatar: (configPlayer.avatar_url as string | undefined) ?? AI_COLOR_PALETTE[i % AI_COLOR_PALETTE.length],
      role: undefined as string | undefined,
      stats: {} as Record<string, string | number>,
      isAI: true,
      isMuted: false,
      personality: configPlayer.personality || "Friendly and observant",
      background: configPlayer.background || "A game enthusiast",
      speechStyle: configPlayer.speechStyle || configPlayer.speech_style || undefined,
      quirk: configPlayer.quirk || undefined,
      gender: configPlayer.gender as "male" | "female" | "other" | undefined,
      status: "online" as const,
      voiceId: (configPlayer.voice_id as string | undefined) ?? undefined,
      voiceSampleUrl: (configPlayer.voice_sample_url as string | undefined) ?? undefined,
    }));
  }, []);

  const initializeLobby = () => {
    if (!currentGame || !currentGame.config) return;
    const config = currentGame.config;

    const { player: gameMaster, hostName, hostColor } = buildHostPlayer(config);
    const aiPlayers = buildAiPlayers(config.configuredPlayers || [], config.template);

    const userName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "You";
    const userProfileAvatar = getUserAvatarUrl(session?.user) ?? "#6366f1";
    const userPlayer = {
      id: userId,
      name: userName,
      avatar: userProfileAvatar,
      role: undefined as string | undefined,
      stats: getGameTemplate(config.template || "")?.hasElimination ? { Status: "Alive" } : undefined,
      isAI: false,
      isMuted: false,
      status: "online" as const,
    };

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

    // Deduplicate pool avatar URLs before registering them.
    // If two pool characters ended up with the same avatar_url, only the first
    // keeps it; the rest are cleared so they go through fetchAvatarsForRoom
    // which has proper collision resolution with offset re-fetches.
    const seenAvatarUrls = new Set<string>();
    for (const p of aiPlayers) {
      if (p.avatar?.startsWith('http')) {
        if (seenAvatarUrls.has(p.avatar)) {
          p.avatar = AI_COLOR_PALETTE[parseInt(p.id.split('-')[1] || '0') % AI_COLOR_PALETTE.length];
        } else {
          seenAvatarUrls.add(p.avatar);
        }
      }
    }

    const roomPlayersNeedingAvatar: RoomPlayerInfo[] = [
      { name: gameMaster.name, type: 'host', gender: gameMaster.gender, personality: gameMaster.personality, background: gameMaster.background },
      ...aiPlayers
        .filter((p: { avatar?: string }) => !p.avatar || !p.avatar.startsWith('http'))
        .map((p: { name: string; gender?: string; personality?: string; background?: string }) => ({
          name: p.name, type: 'player' as const, gender: p.gender, personality: p.personality, background: p.background,
        })),
    ];
    for (const p of aiPlayers) {
      if (p.avatar?.startsWith('http')) {
        onAvatarUrlLoaded(p.name, p.avatar);
      }
    }
    if (roomPlayersNeedingAvatar.length > 0) {
      const avatarStyle = getAvatarStyleForTemplate(config.template || "custom");
      fetchAvatarsForRoom(roomPlayersNeedingAvatar, gameId, avatarStyle).then((urlMap) => {
        for (const [key, url] of Object.entries(urlMap)) {
          onAvatarUrlLoaded(key, url);
        }
      }).catch(() => {});
    }

    setCurrentSpeakerId(null);
    setGamePhase("lobby");
  };

  const launchOpeningRound = useCallback(async (kickoff: OpeningKickoffState) => {
    seedCancelledRef.current = true;
    await new Promise((r) => setTimeout(r, 0));
    seedCancelledRef.current = false;

    readyKickoffRef.current = null;
    setGamePhase("active");
    setCurrentSpeakerId(null);
    trackEvent("game_started", {
      template: kickoff.gameTemplate || "custom",
      player_count: playersRef.current.filter((p) => !p.isGameMaster).length,
      game_name: kickoff.gameName,
    });

    const isScene = isSceneMode(kickoff.gameTemplate);
    const sceneData = isScene && kickoff.sceneId ? getScene(kickoff.sceneId) : undefined;

    // Scene games with openingSequence: play pre-written messages, skip AI generation
    if (sceneData?.openingSequence && sceneData.openingSequence.length > 0) {
      const humanName = kickoff.humanPlayerName || "You";
      const playersByName = new Map(
        kickoff.aiPlayers.map((p) => [p.name, p])
      );

      for (let i = 0; i < sceneData.openingSequence.length; i++) {
        if (seedCancelledRef.current) return;
        const msg = sceneData.openingSequence[i];
        const text = msg.text.replace(/\{playerName\}/g, humanName);

        if (msg.speaker === "narrator") {
          addMessage(
            {
              id: `opening-${gameId}-${i}-${Date.now()}`,
              senderId: "gm-1",
              senderName: kickoff.hostName,
              senderAvatar: kickoff.hostColor,
              content: text,
              isAI: true,
            },
            kickoff.channelId
          );
        } else {
          const player = playersByName.get(msg.speaker);
          if (player) {
            addMessage(
              {
                id: `opening-${gameId}-${i}-${Date.now()}`,
                senderId: player.id,
                senderName: player.name,
                senderAvatar: player.avatar ?? "#8b5cf6",
                content: text,
                isAI: true,
              },
              kickoff.channelId
            );
          } else {
            addMessage(
              {
                id: `opening-${gameId}-${i}-${Date.now()}`,
                senderId: "gm-1",
                senderName: msg.speaker,
                senderAvatar: kickoff.hostColor,
                content: text,
                isAI: true,
              },
              kickoff.channelId
            );
          }
        }

        if (i < sceneData.openingSequence.length - 1 && msg.delay) {
          await new Promise((r) => setTimeout(r, msg.delay));
        }
      }

      // After pre-set opening, hand control to the AI host to continue
      setTimeout(() => {
        afterSeedSendRef.current?.("[Continue]", { skipAddMessage: true, channelId: kickoff.channelId });
      }, 800);
      return;
    }

    // Non-scene games (or scenes without openingSequence): original flow
    let hostGreeting: string;
    if (sceneData) {
      hostGreeting = sceneData.openingNarration;
    } else {
      const tmplMeta = getGameTemplate(kickoff.gameTemplate || "custom");
      const isSoloGame = tmplMeta?.maxPlayers === 1;
      const playerCount = playersRef.current.filter((p) => !p.isGameMaster).length;
      if (isSoloGame) {
        hostGreeting = t("greeting.solo", contentLanguage);
      } else if (tmplMeta?.hasHiddenRoles) {
        hostGreeting = t("greeting.hidden_roles", contentLanguage, { count: playerCount });
      } else {
        hostGreeting = t("greeting.default", contentLanguage, { count: playerCount });
      }
    }
    const greetingId = `start-greeting-${gameId}-${Date.now()}`;
    addMessage(
      {
        id: greetingId,
        senderId: "gm-1",
        senderName: kickoff.hostName,
        senderAvatar: kickoff.hostColor,
        content: hostGreeting,
        isAI: true,
      },
      kickoff.channelId
    );

    seedInitialPlayerReplies({
      channelId: kickoff.channelId,
      gameId,
      hostName: kickoff.hostName,
      hostContent: hostGreeting,
      aiPlayers: kickoff.aiPlayers,
      humanPlayerName: kickoff.humanPlayerName,
      gameTemplate: kickoff.gameTemplate,
      gameName: kickoff.gameName,
      rules: kickoff.rules,
      playerNotesById: kickoff.playerNotesById,
      addStreamingMessage,
      updateStreamingMessage,
      setTypingUsers,
      sessionToken: session?.access_token,
      isCancelled: () => seedCancelledRef.current,
      contentLanguage,
    }).then(() => {
      if (seedCancelledRef.current) return;
      setTimeout(() => {
        afterSeedSendRef.current?.("[Continue]", { skipAddMessage: true, channelId: kickoff.channelId });
      }, 800);
    }).catch((e) => {
      console.warn("Initial player replies failed", e);
      toast.error("Some AI players failed to respond. You can still play normally.");
    });
  }, [addMessage, addStreamingMessage, gameId, session?.access_token, setCurrentSpeakerId, setGamePhase, setTypingUsers, updateStreamingMessage]);

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
      const openingHumanName =
        humanGameIdentity?.name ||
        currentPlayers.find((p) => !p.isAI && !p.isGameMaster)?.name ||
        "You";

      const hasHumanPlayers = currentPlayers.some((p) => !p.isAI && !p.isGameMaster);
      if (aiPlayers.length === 0 && !hasHumanPlayers) {
        toast.error("At least one player is required to start the game. Please add AI players or invite friends.");
        return;
      }

      const tmpl = getGameTemplate(config.template || "");
      const configuredPlayers = config.configuredPlayers || [];
      const aiPlayersWithOpeningState = aiPlayers.map((p) => {
        const aiIndex = p.id.startsWith("ai-") ? parseInt(p.id.split("-")[1], 10) - 1 : -1;
        const cp = aiIndex >= 0 && aiIndex < configuredPlayers.length ? configuredPlayers[aiIndex] : null;
        const mergedStats: Record<string, string | number> = { ...(p.stats ?? {}) };
        if ((cp as { word?: string } | null)?.word && tmpl?.hasSecretWord) {
          mergedStats.Word = (cp as { word: string }).word;
        }
        return {
          ...p,
          role: (cp?.role as string | undefined) ?? p.role,
          stats: mergedStats,
        };
      });
      const humanRole = config.humanRole || (tmpl?.hasHiddenRoles ? (tmpl.roles?.[0] ?? undefined) : undefined);

      if (configuredPlayers.length > 0 || humanRole) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.isGameMaster) return p;
            if (!p.isAI && !p.isGameMaster && humanRole) {
              const stats = { ...p.stats };
              if (tmpl?.hasElimination) stats.Status = "Alive";
              return { ...p, role: humanRole, stats };
            }
            const aiIndex = p.id.startsWith("ai-") ? parseInt(p.id.split("-")[1]) - 1 : -1;
            const cp = aiIndex >= 0 && aiIndex < configuredPlayers.length ? configuredPlayers[aiIndex] : null;
            if (!cp) return p;
            const role = cp.role || undefined;
            const stats = { ...p.stats };
            if (role && tmpl?.hasElimination) {
              stats.Status = "Alive";
            }
            if ((cp as any).word && tmpl?.hasSecretWord) {
              stats.Word = (cp as any).word;
            }
            return { ...p, role, stats };
          })
        );
      }

      const isScriptKill = config.template === "script-kill";
      const caseData = isScriptKill && (config as { caseId?: string }).caseId
        ? getMysteryCase((config as { caseId: string }).caseId)
        : undefined;

      if (isScriptKill && caseData) {
        setMyBoardContent((prev) => ({
          ...prev,
          [userId]: buildInitialEvidenceBoard(caseData),
        }));
      } else if (humanRole) {
        const roleDesc = buildRoleBoardContent(tmpl, humanRole);
        setMyBoardContent((prev) => ({ ...prev, [userId]: roleDesc }));
      }

      {
        const briefingByPlayerId: Record<string, string> = {};
        for (const p of aiPlayersWithOpeningState) {
          const aiIndex = p.id.startsWith("ai-") ? parseInt(p.id.split("-")[1], 10) - 1 : -1;

          if (isScriptKill && caseData && aiIndex >= 0 && aiIndex < caseData.suspects.length) {
            briefingByPlayerId[p.id] = buildSuspectPrompt(caseData.suspects[aiIndex], caseData);
          } else {
            const cp = aiIndex >= 0 && aiIndex < configuredPlayers.length ? configuredPlayers[aiIndex] : null;
            const note = buildAiPlayerBriefing({
              gameTemplate: config.template,
              role: cp?.role,
              word: cp?.word,
            });
            if (note) briefingByPlayerId[p.id] = note;
          }
        }
        if (Object.keys(briefingByPlayerId).length > 0) {
          setPlayerNotes((prev) => ({ ...prev, ...briefingByPlayerId }));
        }
      }
      const defaultChannelId = (config as { channels?: { id: string }[] }).channels?.[0]?.id ?? "game-room";

      const kickoffPlayerNotes: Record<string, string> = {};
      for (const p of aiPlayersWithOpeningState) {
        const aiIndex = p.id.startsWith("ai-") ? parseInt(p.id.split("-")[1], 10) - 1 : -1;
        if (isScriptKill && caseData && aiIndex >= 0 && aiIndex < caseData.suspects.length) {
          kickoffPlayerNotes[p.id] = buildSuspectPrompt(caseData.suspects[aiIndex], caseData);
        } else {
          kickoffPlayerNotes[p.id] = buildAiPlayerBriefing({
            gameTemplate: config.template,
            role: p.role,
            word: typeof p.stats?.Word === "string" ? p.stats.Word : undefined,
          });
        }
      }

      const kickoffState: OpeningKickoffState = {
        channelId: defaultChannelId,
        hostName,
        hostColor,
        aiPlayers: aiPlayersWithOpeningState,
        humanPlayerName: openingHumanName,
        gameTemplate: config.template,
        gameName: currentGame.name,
        rules: config.rules,
        playerNotesById: kickoffPlayerNotes,
        ...((config as unknown as Record<string, unknown>).sceneId ? { sceneId: (config as unknown as Record<string, unknown>).sceneId as string } : {}),
      };

      await launchOpeningRound(kickoffState);
    } finally {
      gameStartingRef.current = false;
    }
  }, [currentGame, gamePhase, buildHostPlayer, setPlayers, setPlayerNotes, setGamePhase, gameId, humanGameIdentity?.name, launchOpeningRound, setCurrentSpeakerId, userId, addMessage, setMyBoardContent]);

  // Initialize game room: wait for room state to load, then set up lobby if fresh
  const humanIdentityFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isRoomLoading && players.length === 0) return;

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

    if (!isInitialized && currentGame && players.length === 0 && !hasSavedState) {
      try {
        initializeLobby();
        setIsInitialized(true);
        setIsFreshLobby(true);
      } catch (err) {
        console.error("initializeLobby failed — will retry on next effect run:", err);
      }
    } else if (!isInitialized && players.length > 0) {
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
  }, [currentGame, isInitialized, players.length, gameId, isRoomLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch human in-game identity (skip for scene mode — use real name)
  useEffect(() => {
    if (isRoomLoading) return;
    if (!currentGame?.config || !session?.access_token) return;
    if (humanGameIdentity !== null && humanGameIdentity.name !== "Player") return;
    if (humanIdentityFetchedRef.current === currentGame.id) return;
    humanIdentityFetchedRef.current = currentGame.id;

    if (isSceneMode(currentGame.config.template)) {
      const fullName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0])?.trim() || "Player";
      setHumanGameIdentity({ name: extractPreferredName(fullName) });
      return;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["Authorization"] = `Bearer ${session.access_token}`;
    fetch("/api/generate-human-game-identity", {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameName: currentGame.name,
        rules: currentGame.config.rules,
        contentLanguage,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data: { name?: string }) => {
        const name = (data.name && data.name.trim()) ? data.name.trim().slice(0, 40) : "Player";
        setHumanGameIdentity({ name });
      })
      .catch(() => setHumanGameIdentity({ name: "Player" }));
  }, [isRoomLoading, currentGame?.id, currentGame?.name, currentGame?.config?.rules, session?.access_token, humanGameIdentity, setHumanGameIdentity, session?.user]);

  // Sync human player display name
  useEffect(() => {
    if (players.length === 0) return;
    const name = humanGameIdentity?.name || (session?.user ? (session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0])?.trim() : null) || "You";
    setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, name } : p)));
  }, [humanGameIdentity?.name, session?.user, players.length, userId, setPlayers]);

  // Fetch content language from user preferences; auto-save browser language if not set
  useEffect(() => {
    if (!session?.access_token || langFetchedRef.current) return;
    langFetchedRef.current = true;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
    fetch("/api/user/settings", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((prefs: Record<string, unknown>) => {
        if (typeof prefs.content_language === "string" && prefs.content_language) {
          setContentLanguage(prefs.content_language);
        } else {
          const detected = detectBrowserLanguage();
          setContentLanguage(detected);
          fetch("/api/user/settings", {
            method: "PUT",
            headers,
            body: JSON.stringify({ content_language: detected }),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [session?.access_token]);

  return {
    initializeLobby,
    startGame,
    launchOpeningRound,
    isInitialized,
    isFreshLobby,
    readyKickoffRef,
    seedCancelledRef,
    afterSeedSendRef,
    contentLanguage,
  };
}
