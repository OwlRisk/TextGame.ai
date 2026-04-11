"use client";

import { useCallback, useRef, useState } from "react";
import { Play, Plus, X, Sparkles, Users, Bot, User, Volume2, Square, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import type { Player } from "@/types/player";
import { cn } from "@/app/components/ui/utils";
import { t, getBrowserLanguage } from "@/lib/i18n";
import { getGameTemplate } from "@/lib/game-templates";

interface LobbyViewProps {
  gameName: string;
  gameTemplate?: string;
  players: Player[];
  isOwner: boolean;
  gameId: string;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  onStartGame: () => void;
  onAddCharacter: () => void;
  onRemovePlayer: (playerId: string) => void;
  maxSeats?: number;
  autoStarting?: boolean;
}

export function LobbyView({
  gameName,
  gameTemplate,
  players,
  isOwner,
  gameId,
  avatarImageUrls,
  onAvatarUrlLoaded,
  onStartGame,
  onAddCharacter,
  onRemovePlayer,
  maxSeats = 12,
  autoStarting = false,
}: LobbyViewProps) {
  const [startingGame, setStartingGame] = useState(false);
  const isStarting = startingGame || autoStarting;

  const nonHost = players.filter((p) => !p.isGameMaster);
  const aiCount = nonHost.filter((p) => p.isAI).length;
  const humanCount = nonHost.filter((p) => !p.isAI).length;
  const lang = getBrowserLanguage();
  const tmpl = getGameTemplate(gameTemplate);

  const handleStart = useCallback(async () => {
    setStartingGame(true);
    try {
      await onStartGame();
    } finally {
      setStartingGame(false);
    }
  }, [onStartGame]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{gameName}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {t("lobby.players_in_lobby", lang).replace("{count}", String(nonHost.length))}
              {maxSeats ? ` · ${t("lobby.max_seats", lang).replace("{max}", String(maxSeats))}` : ""}
            </p>
            {tmpl && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {t("lobby.recommended", lang).replace("{min}", String(tmpl.minPlayers)).replace("{max}", String(tmpl.maxPlayers))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Bot className="h-3.5 w-3.5" />{aiCount} {t("label.ai")}</span>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{humanCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Player grid */}
          <div>
            <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              {t("lobby.players", lang)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nonHost.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    "group relative rounded-xl border p-4 flex items-center gap-3 transition-colors",
                    player.isAI
                      ? "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                      : "border-emerald-800/30 bg-emerald-950/10 hover:border-emerald-700/40"
                  )}
                >
                  <GeneratedAvatar
                    name={player.name}
                    type="player"
                    gameId={gameId}
                    role={player.role}
                    background={player.background}
                    personality={player.personality}
                    gender={player.gender}
                    initialUrl={avatarImageUrls?.[`${player.name}|player`]}
                    onAvatarLoaded={onAvatarUrlLoaded}
                    className="h-10 w-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{player.name}</span>
                      {!player.isAI && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-medium flex-shrink-0">{t("label.you")}</span>
                      )}
                      {player.isAI && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium flex-shrink-0">{t("label.ai")}</span>
                      )}
                    </div>
                    {player.personality && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{player.personality}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {player.isAI && (player.voiceSampleUrl || player.voiceId) && (
                      <VoicePreviewBtn url={player.voiceSampleUrl} voiceId={player.voiceId} name={player.name} />
                    )}
                    {isOwner && player.isAI && (
                      <button
                        onClick={() => onRemovePlayer(player.id)}
                        className="p-1 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity"
                        title="Remove player"
                        aria-label={`Remove ${player.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add player card */}
              {isOwner && nonHost.length < maxSeats && (
                <button
                  onClick={onAddCharacter}
                  className="rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 p-4 flex items-center justify-center gap-2 transition-colors text-zinc-500 hover:text-zinc-300 min-h-[4.5rem]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("btn.add_character")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800/60 bg-zinc-900/80 backdrop-blur">
        <div className="flex items-center justify-center gap-3">
          {isStarting ? (
            <div className="text-sm text-zinc-300 flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              <Sparkles className="h-4 w-4 text-violet-400" />
              {t("status.preparing_game", getBrowserLanguage())}
            </div>
          ) : (
            <>
              <div className="flex-1" />
              {isOwner && (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={nonHost.length === 0}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-8 shadow-lg shadow-violet-900/30 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t("btn.start_game", lang)}
                </Button>
              )}
              {!isOwner && (
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  {t("lobby.waiting_for_host", lang)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const SAMPLE_PHRASES: Record<string, string> = {
  male: "Hey there! I'm ready to play. Let's have some fun!",
  female: "Hi everyone! Excited to join the game. Let's go!",
  default: "Hello! Looking forward to playing with you all!",
};

function VoicePreviewBtn({ url, voiceId, name }: { url?: string; voiceId?: string; name: string }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const toggle = useCallback(async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      let audioSrc = url || blobUrlRef.current;

      if (!audioSrc && voiceId) {
        const phrase = SAMPLE_PHRASES.default;
        const res = await fetch("/api/inworld-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: phrase, voiceId, source: "lobby_preview" }),
        });
        if (!res.ok) throw new Error("TTS failed");
        const data = await res.json();
        if (!data.audioBase64) throw new Error("No audio");
        const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: data.contentType || "audio/mpeg" });
        audioSrc = URL.createObjectURL(blob);
        blobUrlRef.current = audioSrc;
      }

      if (!audioSrc) { setLoading(false); return; }

      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      setPlaying(true);
      audio.onended = () => { audioRef.current = null; setPlaying(false); };
      audio.onerror = () => { audioRef.current = null; setPlaying(false); };
      await audio.play();
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [url, voiceId, playing]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        playing
          ? "bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      )}
      title={playing ? `Stop ${name}'s voice` : `Preview ${name}'s voice`}
      aria-label={playing ? `Stop ${name}'s voice` : `Preview ${name}'s voice`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : playing ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
