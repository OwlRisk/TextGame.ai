"use client";

import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Sparkles, Play, Clock, Users, Trash2, Archive, Copy, TrendingUp, Star } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
}

interface MyGamesPageProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
  onDeleteGame?: (gameId: string) => void;
}

export function MyGamesPage({ games, onSelectGame, onCreateGame, onDeleteGame }: MyGamesPageProps) {
  const activeGames = games.filter(g => g.isActive);
  const completedGames = games.filter(g => !g.isActive);
  
  const handleDuplicateGame = (game: Game, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`"${game.name}" duplicated! Opening...`);
    // In real app, this would pre-fill the create-game chat with this game's config
    setTimeout(() => {
      onCreateGame();
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-0 relative">
      {/* Ambient Background - Enhanced */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <div className="border-b border-white/5 bg-black/50 backdrop-blur-xl flex-shrink-0 relative z-10 shadow-2xl">
        <div className="h-24 px-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-1">My Games</h1>
            <p className="text-sm text-zinc-400 font-medium">
              {games.length} {games.length === 1 ? 'game' : 'games'} total
            </p>
          </div>

          <Button
            onClick={onCreateGame}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105 h-11 px-6"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create New Game
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-7xl mx-auto px-10 py-16">
          {games.length === 0 ? (
            // Empty State - Enhanced
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-3xl" />
                
                <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl p-16 text-center max-w-2xl shadow-2xl">
                  {/* Animated Icon */}
                  <div className="relative inline-flex mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 backdrop-blur-sm rounded-3xl p-8 border border-violet-400/30">
                      <Sparkles className="h-16 w-16 text-violet-300" />
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-100 to-fuchsia-100 bg-clip-text text-transparent mb-4">
                    No Games Yet
                  </h2>
                  <p className="text-lg text-zinc-300 mb-8 leading-relaxed max-w-md mx-auto">
                    Start your adventure by creating your first game. Choose from classic favorites or design something completely unique!
                  </p>
                  
                  {/* Feature Highlights */}
                  <div className="grid grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <Users className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 font-medium">Multiplayer</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <Sparkles className="h-6 w-6 text-fuchsia-400 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 font-medium">Custom Rules</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <Star className="h-6 w-6 text-amber-400 mx-auto mb-2 fill-amber-400" />
                      <p className="text-xs text-zinc-400 font-medium">Immersive</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={onCreateGame}
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-lg px-8 py-6 h-auto shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your First Game
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Active Games */}
              {activeGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Play className="h-5 w-5 text-green-400" />
                    <h2 className="text-2xl font-bold text-white">Active Games</h2>
                    <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                      {activeGames.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeGames.map((game) => (
                        <div
                          key={game.id}
                          className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 hover:border-purple-500/30 transition-all cursor-pointer"
                          onClick={() => onSelectGame(game.id)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg overflow-hidden"
                              style={{ background: game.color }}
                            >
                              {game.icon.startsWith('data:image') ? (
                                <img 
                                  src={game.icon} 
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                game.icon
                              )}
                            </div>
                            <Badge className="bg-green-500/20 border-green-500/30 text-green-300">
                              Active
                            </Badge>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-3">{game.name}</h3>
                          
                          {/* Stats: show — until real data is available */}
                          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-violet-400" />
                              <div>
                                <div className="text-xs text-zinc-500">Played</div>
                                <div className="text-sm font-bold text-white">—</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <div>
                                <div className="text-xs text-zinc-500">Rating</div>
                                <div className="text-sm font-bold text-white">—</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Basic Info */}
                          <div className="space-y-2 text-sm text-zinc-400 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{game.config.playerCount + 1} players</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>In progress</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectGame(game.id);
                              }}
                              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
                              size="sm"
                            >
                              Continue Playing
                            </Button>
                            <Button
                              onClick={(e) => handleDuplicateGame(game, e)}
                              variant="outline"
                              size="icon"
                              className="bg-white/5 border-white/10 hover:bg-white/10 text-white flex-shrink-0"
                              title="Duplicate & Modify"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          {onDeleteGame && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteGame(game.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Games */}
              {completedGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Archive className="h-5 w-5 text-zinc-500" />
                    <h2 className="text-2xl font-bold text-white">Completed Games</h2>
                    <Badge variant="outline" className="bg-zinc-500/20 border-zinc-500/30 text-zinc-400">
                      {completedGames.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {completedGames.map((game) => (
                      <div
                        key={game.id}
                        className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 hover:border-zinc-500/30 transition-all cursor-pointer opacity-75"
                        onClick={() => onSelectGame(game.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden"
                            style={{ background: game.color }}
                          >
                            {game.icon.startsWith('data:image') ? (
                              <img 
                                src={game.icon} 
                                alt={game.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              game.icon
                            )}
                          </div>
                          <Badge className="bg-zinc-500/20 border-zinc-500/30 text-zinc-400">
                            Completed
                          </Badge>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                        
                        <div className="space-y-2 text-sm text-zinc-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{game.config.playerCount + 1} players</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Finished</span>
                          </div>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGame(game.id);
                          }}
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
                          size="sm"
                        >
                          View Game
                        </Button>

                        {onDeleteGame && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteGame(game.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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