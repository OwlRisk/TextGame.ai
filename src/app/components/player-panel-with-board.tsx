import { useState } from "react";
import { Crown, Volume2, VolumeX, User, Package, Heart, Zap, Shield, Sword, Sparkles, Info } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { Player } from "@/app/components/player-panel";
import { PlayerBoardData } from "@/app/components/player-board";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PlayerProfileDialog } from "@/app/components/player-profile-dialog";

interface PlayerPanelWithBoardProps {
  players: Player[];
  currentSpeakerId?: string | null;
  isUserGameMaster?: boolean;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  playerBoardData: PlayerBoardData;
}

const rarityColors = {
  common: "bg-zinc-600 text-zinc-100",
  uncommon: "bg-green-600 text-green-100",
  rare: "bg-blue-600 text-blue-100",
  epic: "bg-purple-600 text-purple-100",
  legendary: "bg-amber-600 text-amber-100",
};

const attributeIcons: Record<string, JSX.Element> = {
  health: <Heart className="h-3 w-3" />,
  mana: <Zap className="h-3 w-3" />,
  defense: <Shield className="h-3 w-3" />,
  attack: <Sword className="h-3 w-3" />,
};

export function PlayerPanelWithBoard({ 
  players, 
  currentSpeakerId,
  isUserGameMaster,
  onToggleMute,
  onSelectSpeaker,
  playerBoardData
}: PlayerPanelWithBoardProps) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = (p: Player) => {
    setProfilePlayer(p);
    setProfileOpen(true);
  };

  return (
    <div className="w-80 bg-zinc-850 flex flex-col border-l border-zinc-900/50">
      <PlayerProfileDialog
        player={profilePlayer}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
      <Tabs defaultValue="players" className="flex flex-col h-full">
        <div className="h-14 px-5 flex items-center border-b border-zinc-900/50 bg-zinc-900/30">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 h-10">
            <TabsTrigger value="players" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs">
              <User className="h-3.5 w-3.5 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="board" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs">
              <Package className="h-3 w-3 mr-1.5" />
              My Board
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Players Tab */}
        <TabsContent value="players" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Game Master Section */}
              {players.filter(p => p.isGameMaster).map((player) => (
                <div key={player.id}>
                  <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                    <Crown className="h-3 w-3 text-amber-400" />
                    <span>{player.name}</span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded text-[10px] font-bold tracking-wider border border-amber-500/30 shadow-sm">
                      HOST
                    </span>
                  </div>
                  <PlayerCard
                    player={player}
                    isSpeaking={currentSpeakerId === player.id}
                    isUserGameMaster={isUserGameMaster}
                    onToggleMute={onToggleMute}
                    onSelectSpeaker={onSelectSpeaker}
                    onViewProfile={openProfile}
                  />
                  <Separator className="mt-3 bg-zinc-700/50" />
                </div>
              ))}

              {/* Regular Players */}
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wide">
                  Players — {players.filter(p => !p.isGameMaster).length}
                </div>
                <div className="space-y-1.5">
                  {players.filter(p => !p.isGameMaster).map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isSpeaking={currentSpeakerId === player.id}
                      isUserGameMaster={isUserGameMaster}
                      onToggleMute={onToggleMute}
                      onSelectSpeaker={onSelectSpeaker}
                      onViewProfile={openProfile}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* My Board Tab */}
        <TabsContent value="board" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Character Info */}
              <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-xl p-4 border border-zinc-700/50 overflow-hidden shadow-lg">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 pointer-events-none" />
                
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    {playerBoardData.characterName === "You" ? (
                      <Avatar className="h-14 w-14 rounded-xl shadow-lg ring-2 ring-zinc-700/50 transition-transform hover:scale-105">
                        <AvatarFallback
                          className="text-white"
                          style={{ backgroundColor: playerBoardData.avatar }}
                        >
                          <User className="h-7 w-7 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        name={playerBoardData.characterName}
                        type="player"
                        background={`Game character. Role: ${playerBoardData.characterClass ?? "Player"}.`}
                        className="h-14 w-14 rounded-xl shadow-lg ring-2 ring-zinc-700/50 transition-transform hover:scale-105"
                        fallbackColor={playerBoardData.avatar}
                        fallback={<User className="h-7 w-7 text-white" />}
                      />
                    )}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                      {playerBoardData.level || 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-base mb-0.5">{playerBoardData.characterName}</h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      {playerBoardData.characterClass}
                      {playerBoardData.level && (
                        <span className="ml-2 px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px] font-bold border border-violet-500/30">
                          Level {playerBoardData.level}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <section>
                <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5 tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Attributes
                </h4>
                <div className="space-y-1.5">
                  {playerBoardData.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="group bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg p-2.5 border border-zinc-700/50 hover:border-zinc-600 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`text-${attr.color || 'blue'}-400 transition-transform group-hover:scale-110`}>
                            {attributeIcons[attr.id.toLowerCase()] || <Sparkles className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-xs font-semibold text-white">{attr.name}</span>
                        </div>
                        <span className="text-sm font-bold text-white tabular-nums">
                          {attr.value}
                          {attr.maxValue && <span className="text-zinc-500 font-medium">/{attr.maxValue}</span>}
                        </span>
                      </div>
                      {attr.maxValue && (
                        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all shadow-sm"
                            style={{ width: `${(attr.value / attr.maxValue) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Status Effects */}
              {playerBoardData.statusEffects.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Status Effects
                  </h4>
                  <div className="space-y-1.5">
                    {playerBoardData.statusEffects.map((status) => (
                      <div
                        key={status.id}
                        className={`group relative bg-zinc-900 rounded-lg p-2.5 border transition-all hover:shadow-lg ${
                          status.type === "buff"
                            ? "border-emerald-600/40 bg-gradient-to-r from-emerald-950/30 to-zinc-900 hover:border-emerald-500/60"
                            : status.type === "debuff"
                            ? "border-red-600/40 bg-gradient-to-r from-red-950/30 to-zinc-900 hover:border-red-500/60"
                            : "border-zinc-700/50 hover:border-zinc-600"
                        }`}
                      >
                        {/* Glow effect for buffs/debuffs */}
                        {status.type === "buff" && (
                          <div className="absolute inset-0 bg-emerald-500/5 rounded-lg pointer-events-none" />
                        )}
                        {status.type === "debuff" && (
                          <div className="absolute inset-0 bg-red-500/5 rounded-lg pointer-events-none" />
                        )}
                        
                        <div className="relative flex items-start gap-2.5">
                          <div className="text-xl transition-transform group-hover:scale-110">{status.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="text-xs font-bold text-white">{status.name}</h5>
                              {status.duration && (
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 font-bold ${
                                    status.type === "buff"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : status.type === "debuff"
                                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                                      : "bg-zinc-700 text-zinc-300 border-zinc-600"
                                  }`}
                                >
                                  {status.duration}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{status.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Inventory */}
              <section>
                <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5 tracking-wide">
                  <Package className="h-3.5 w-3.5 text-amber-400" />
                  Inventory
                  <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600 text-[10px] px-1.5 py-0 ml-1 font-bold">
                    {playerBoardData.items.length}
                  </Badge>
                </h4>
                {playerBoardData.items.length > 0 ? (
                  <div className="space-y-1.5">
                    {playerBoardData.items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg p-2.5 border border-zinc-700/50 hover:border-zinc-600 transition-all hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="text-2xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <h5 className="text-xs font-bold text-white">{item.name}</h5>
                              {item.rarity && (
                                <Badge className={`${rarityColors[item.rarity]} text-[10px] px-1.5 py-0 font-bold shadow-sm`}>
                                  {item.rarity.toUpperCase()}
                                </Badge>
                              )}
                              {item.quantity && item.quantity > 1 && (
                                <Badge className="bg-zinc-700 text-zinc-300 border-zinc-600 text-[10px] px-1.5 py-0 font-bold">
                                  ×{item.quantity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-8 border border-zinc-700/50 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-zinc-800 mb-3">
                      <Package className="h-7 w-7 text-zinc-600" />
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">Your inventory is empty</p>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlayerCard({ 
  player, 
  isSpeaking,
  isUserGameMaster,
  onToggleMute,
  onSelectSpeaker,
  onViewProfile,
}: { 
  player: Player;
  isSpeaking: boolean;
  isUserGameMaster?: boolean;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  onViewProfile?: (player: Player) => void;
}) {
  const canViewProfile = !!onViewProfile;
  const handleRowClick = () => {
    if (canViewProfile) onViewProfile?.(player);
  };
  const isEliminated = player.status === "Eliminated" || player.stats?.Status === "Eliminated";

  return (
    <div
      role={canViewProfile ? "button" : undefined}
      tabIndex={canViewProfile ? 0 : undefined}
      onClick={canViewProfile ? handleRowClick : undefined}
      onKeyDown={canViewProfile ? (e) => e.key === "Enter" && handleRowClick() : undefined}
      className={`group p-2 rounded-lg transition-all duration-200 ${
        isEliminated ? "opacity-50 bg-zinc-800/50" :
        isSpeaking 
          ? "bg-green-600/20 ring-1 ring-green-600/50 shadow-sm" 
          : "hover:bg-zinc-700/40 hover:shadow-sm"
      } ${canViewProfile ? "cursor-pointer" : ""}`}
      title={canViewProfile ? "View profile" : undefined}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative flex-shrink-0">
          {!player.isAI ? (
            <Avatar
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"
              }`}
            >
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: player.avatar }}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              name={player.name}
              type={player.isGameMaster ? "host" : "player"}
              background={
                player.isGameMaster
                  ? (player.background ?? undefined)
                  : player.background ?? `Social deduction game player. Role: ${player.role ?? "Player"}.`
              }
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"
              }`}
              fallbackColor={player.avatar}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{player.name}</span>
            {!player.isAI && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0 h-4 font-bold tracking-wide shadow-sm">
                YOU
              </Badge>
            )}
            {canViewProfile && player.isAI && (
              <Info className="h-3.5 w-3.5 text-zinc-500 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
            )}
          </div>
          {player.role && (
            <div className="text-xs text-zinc-300 font-medium">{player.role}</div>
          )}
          {player.status && (
            <div className={`text-xs mt-0.5 font-medium ${isEliminated ? "text-red-400" : "text-emerald-400"}`}>
              Status: {player.status}
            </div>
          )}
        </div>
        {isUserGameMaster && !player.isGameMaster && (
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-zinc-600/50"
              onClick={(e) => { e.stopPropagation(); onToggleMute?.(player.id); }}
            >
              {player.isMuted ? (
                <VolumeX className="h-3 w-3 text-red-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-zinc-400 hover:text-white" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}