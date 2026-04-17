"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Sparkles, Play, Clock, Users, Trash2, Archive, Copy, Star, Search, X, RotateCcw, Coins, MapPin } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
  updatedAt?: string;
}

interface MyGamesPageProps {
  games: Game[];
  isLoading?: boolean;
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
  onDeleteGame?: (gameId: string) => void;
  gameSpending?: Record<string, number>;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-white/10" />
        <div className="h-5 w-16 rounded-full bg-white/10" />
      </div>
      <div className="h-5 w-2/3 rounded bg-white/10 mb-3" />
      <div className="flex gap-3 mb-4">
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
      <div className="h-8 rounded-lg bg-white/10" />
    </div>
  );
}

function GameCard({
  game,
  onSelect,
  onDelete,
  onPlayAgain,
  creditsUsed,
}: {
  game: Game;
  onSelect: () => void;
  onDelete?: () => void;
  onPlayAgain?: () => void;
  creditsUsed?: number;
}) {
  const isActive = game.isActive;
  const [saveLocation, setSaveLocation] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`gameRoom_${game.id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.gmState?.location) setSaveLocation(parsed.gmState.location);
    } catch {}
  }, [game.id]);

  return (
    <div
      className={`group relative bg-white/5 backdrop-blur-xl border rounded-2xl p-5 transition-all cursor-pointer ${
        isActive
          ? "border-white/10 hover:border-purple-500/40 hover:bg-white/[0.07]"
          : "border-white/[0.06] hover:border-zinc-500/30 opacity-70 hover:opacity-90"
      }`}
      onClick={onSelect}
    >
      {/* Top row: icon + badge + delete */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg overflow-hidden flex-shrink-0"
          style={{ background: game.color }}
        >
          {game.icon.startsWith("data:image") || game.icon.startsWith("http") || game.icon.startsWith("/") ? (
            <img src={game.icon} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            game.icon
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <Badge
            className={
              isActive
                ? "bg-green-500/20 border-green-500/30 text-green-300 text-[10px] px-2 py-0"
                : "bg-zinc-500/20 border-zinc-500/30 text-zinc-400 text-[10px] px-2 py-0"
            }
          >
            {isActive ? "Active" : "Done"}
          </Badge>

          {onDelete && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Game name */}
      <h3 className="text-base font-bold text-white mb-2 leading-snug line-clamp-1">{game.name}</h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-violet-400" />
          {game.config.playerCount + 1} players
        </span>
        {game.updatedAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(game.updatedAt)}
          </span>
        )}
        {creditsUsed != null && creditsUsed > 0 && (
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            {creditsUsed.toLocaleString()}
          </span>
        )}
      </div>
      {saveLocation && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-400/80 mb-3 truncate">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{saveLocation}</span>
        </div>
      )}

      {/* Action */}
      {isActive ? (
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white h-8 text-xs"
            size="sm"
          >
            Continue Playing
          </Button>
          {onPlayAgain && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPlayAgain();
              }}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white flex-shrink-0"
              title="Duplicate & Modify"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            variant="outline"
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white h-8 text-xs"
            size="sm"
          >
            View Replay
          </Button>
          {onPlayAgain && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPlayAgain();
              }}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-white/5 border-white/10 hover:bg-violet-500/20 hover:border-violet-500/30 text-zinc-400 hover:text-violet-300 flex-shrink-0"
              title="Play Again"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function MyGamesPage({ games, isLoading = false, onSelectGame, onCreateGame, onDeleteGame, gameSpending = {} }: MyGamesPageProps) {
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.name.toLowerCase().includes(q));
  }, [games, search]);

  const activeGames = filteredGames.filter((g) => g.isActive);
  const completedGames = filteredGames.filter((g) => !g.isActive);

  const handlePlayAgain = (game: Game) => {
    toast.success(`Creating new game based on "${game.name}"…`);
    setTimeout(() => onCreateGame(), 400);
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-0 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-white/5 bg-black/50 backdrop-blur-xl flex-shrink-0 relative z-10 shadow-2xl">
        {/* Mobile: two rows. Desktop: single row. */}
        <div className="px-4 sm:px-6 pt-3 pb-3 sm:pt-0 sm:pb-0 sm:h-16 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {/* Row 1: title + mobile "New Game" */}
          <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-white whitespace-nowrap">My Games</h1>
              {!isLoading && (
                <span className="text-xs text-zinc-500 whitespace-nowrap hidden sm:inline">
                  {games.length} {games.length === 1 ? "game" : "games"}
                </span>
              )}
            </div>
            <Button
              onClick={onCreateGame}
              className="sm:hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 h-9 px-3 text-sm whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              New Game
            </Button>
          </div>

          {/* Row 2 (mobile) / inline (desktop): search + desktop New Game */}
          <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search games…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 sm:h-8 pl-8 pr-7 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.08] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <Button
            onClick={onCreateGame}
            className="hidden sm:flex bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 h-8 px-4 text-sm whitespace-nowrap flex-shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            New Game
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-5 w-5 rounded bg-white/10 animate-pulse" />
                  <div className="h-5 w-28 rounded bg-white/10 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-3xl" />
                <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl p-14 text-center max-w-lg shadow-2xl">
                  <div className="relative inline-flex mb-7">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 backdrop-blur-sm rounded-3xl p-7 border border-violet-400/30">
                      <Sparkles className="h-14 w-14 text-violet-300" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">No Games Yet</h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed">
                    Start your first adventure — pick a template or describe your idea to the AI Game Master.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { icon: <Users className="h-5 w-5 text-violet-400 mx-auto mb-1.5" />, label: "Multiplayer" },
                      { icon: <Sparkles className="h-5 w-5 text-fuchsia-400 mx-auto mb-1.5" />, label: "Custom Rules" },
                      { icon: <Star className="h-5 w-5 text-amber-400 mx-auto mb-1.5 fill-amber-400" />, label: "Immersive" },
                    ].map(({ icon, label }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                        {icon}
                        <p className="text-xs text-zinc-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={onCreateGame}
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 h-11 shadow-2xl shadow-violet-500/30 hover:scale-105 transition-all"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Game
                  </Button>
                </div>
              </div>
            </div>
          ) : filteredGames.length === 0 ? (
            // No search results
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 text-lg font-medium mb-1">No games match &ldquo;{search}&rdquo;</p>
              <p className="text-zinc-600 text-sm mb-4">Try a different name</p>
              <button onClick={() => setSearch("")} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {activeGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <Play className="h-4 w-4 text-green-400" />
                    <h2 className="text-base font-bold text-white">Active Games</h2>
                    <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 text-[10px]">
                      {activeGames.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onSelect={() => onSelectGame(game.id)}
                        onDelete={onDeleteGame ? () => onDeleteGame(game.id) : undefined}
                        onPlayAgain={() => handlePlayAgain(game)}
                        creditsUsed={gameSpending[game.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <Archive className="h-4 w-4 text-zinc-500" />
                    <h2 className="text-base font-bold text-white">Completed</h2>
                    <Badge variant="outline" className="bg-zinc-500/20 border-zinc-500/30 text-zinc-400 text-[10px]">
                      {completedGames.length}
                    </Badge>
                    {onDeleteGame && completedGames.length > 1 && (
                      <button
                        className="ml-auto text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1"
                        onClick={() => {
                          if (confirm(`Delete all ${completedGames.length} completed games?`)) {
                            completedGames.forEach((g) => onDeleteGame(g.id));
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {completedGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onSelect={() => onSelectGame(game.id)}
                        onDelete={onDeleteGame ? () => onDeleteGame(game.id) : undefined}
                        onPlayAgain={() => handlePlayAgain(game)}
                        creditsUsed={gameSpending[game.id]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
