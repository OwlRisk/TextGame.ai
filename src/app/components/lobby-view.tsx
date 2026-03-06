"use client";

import { useCallback, useRef, useState } from "react";
import { Play, UserPlus, Plus, X, Sparkles, Users, Crown, Bot, User, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import type { Player } from "@/app/components/player-panel";
import { cn } from "@/app/components/ui/utils";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";

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
  onInvite?: () => void;
  inviteJustCopied?: boolean;
  maxPlayers?: number;
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
  onInvite,
  inviteJustCopied,
  maxPlayers = 12,
}: LobbyViewProps) {
  const [startingGame, setStartingGame] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const host = players.find((p) => p.isGameMaster);
  const nonHost = players.filter((p) => !p.isGameMaster);
  const aiCount = nonHost.filter((p) => p.isAI).length;
  const humanCount = nonHost.filter((p) => !p.isAI).length;

  const handleStart = useCallback(async () => {
    setStartingGame(true);
    try {
      await onStartGame();
    } finally {
      setStartingGame(false);
    }
  }, [onStartGame]);

  const handleVoiceTest = useCallback(async (player: Player) => {
    if (testingVoice) {
      testAudioRef.current?.pause();
      testAudioRef.current = null;
      setTestingVoice(null);
      return;
    }

    setTestingVoice(player.id);
    try {
      // Ask AI to generate a greeting in-character
      const greetRes = await fetch('/api/characters/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: player.name,
          personality: player.personality,
          background: player.background,
          isHost: !!player.isGameMaster,
        }),
      });
      let sampleText = `Hello, I'm ${player.name}.`;
      if (greetRes.ok) {
        const greetData = await greetRes.json();
        if (greetData.greeting) sampleText = greetData.greeting;
      }

      const voiceHint = [player.personality, player.background].filter(Boolean).join('. ') || undefined;
      const voiceId = pickVoiceForSpeaker(player.gender, voiceHint, undefined, player.name);
      const modelId = (typeof window !== 'undefined' ? localStorage.getItem('tts_model') : null) ?? 'inworld-tts-1.5-max';
      const res = await fetch('/api/inworld-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voiceId, modelId }),
      });
      if (!res.ok) { setTestingVoice(null); return; }
      const data = await res.json();
      if (!data.audioBase64) { setTestingVoice(null); return; }
      const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      testAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setTestingVoice(null); testAudioRef.current = null; };
      audio.onerror = () => { URL.revokeObjectURL(url); setTestingVoice(null); testAudioRef.current = null; };
      await audio.play();
    } catch {
      setTestingVoice(null);
    }
  }, [testingVoice]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{gameName}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {nonHost.length} player{nonHost.length !== 1 ? "s" : ""} in lobby
              {maxPlayers ? ` · max ${maxPlayers}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Bot className="h-3.5 w-3.5" />{aiCount} AI</span>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{humanCount} Human</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Host card */}
          {host && (
            <div className="rounded-xl border border-violet-800/30 bg-violet-950/20 p-4 flex items-center gap-4">
              <GeneratedAvatar
                name={host.name}
                type="host"
                gameId={gameId}
                role={host.role}
                background={host.background}
                personality={host.personality}
                gender={host.gender}
                initialUrl={avatarImageUrls?.[`${host.name}|host`]}
                onAvatarLoaded={onAvatarUrlLoaded}
                className="h-12 w-12 rounded-full ring-2 ring-violet-500/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{host.name}</span>
                  <Crown className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{host.background || "Game Host"}</p>
              </div>
              <button
                onClick={() => handleVoiceTest(host)}
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg transition-colors",
                  testingVoice === host.id
                    ? "bg-violet-600/30 text-violet-300"
                    : "text-zinc-500 hover:text-violet-300 hover:bg-violet-900/30"
                )}
                title="Test voice"
                aria-label={`Test voice for ${host.name}`}
              >
                {testingVoice === host.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Player grid */}
          <div>
            <h2 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              Players
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-medium flex-shrink-0">YOU</span>
                      )}
                      {player.isAI && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium flex-shrink-0">AI</span>
                      )}
                    </div>
                    {player.personality && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{player.personality}</p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {player.isAI && (
                      <button
                        onClick={() => handleVoiceTest(player)}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          testingVoice === player.id
                            ? "bg-violet-600/30 text-violet-300"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50"
                        )}
                        title="Test voice"
                        aria-label={`Test voice for ${player.name}`}
                      >
                        {testingVoice === player.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    {isOwner && player.isAI && (
                      <button
                        onClick={() => onRemovePlayer(player.id)}
                        className="p-1 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300"
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
              {isOwner && nonHost.length < maxPlayers && (
                <button
                  onClick={onAddCharacter}
                  className="rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 p-4 flex items-center justify-center gap-2 transition-colors text-zinc-500 hover:text-zinc-300 min-h-[4.5rem]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Character</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800/60 bg-zinc-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          {onInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInvite}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              {inviteJustCopied ? "Copied!" : "Invite"}
            </Button>
          )}
          <div className="flex-1" />
          {isOwner && (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={startingGame || nonHost.length === 0}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-8 shadow-lg shadow-violet-900/30 disabled:opacity-50"
            >
              {startingGame ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Starting…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </>
              )}
            </Button>
          )}
          {!isOwner && (
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Waiting for host to start the game…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
