import { useState, useEffect, useRef } from "react";
import { Crown, Volume2, VolumeX, User, Package, Info, Heart } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Player } from "@/app/components/player-panel";
import { PlayerBoardData } from "@/app/components/player-board";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PlayerProfileDialog } from "@/app/components/player-profile-dialog";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";

interface PlayerPanelWithBoardProps {
  players: Player[];
  currentSpeakerId?: string | null;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  playerBoardData: PlayerBoardData;
  /** Content written by AI Host for this player's My Board (e.g. role, night result). Only this player sees it. */
  myBoardContentFromHost?: string;
  /** If true (e.g. werewolf/mafia), hide other players' roles in the list—only show own role. */
  isHiddenRoleGame?: boolean;
  /** Current user's player id—used to show own role and hide others' in hidden-role games. */
  currentUserId?: string;
}

export function PlayerPanelWithBoard({ 
  players, 
  currentSpeakerId,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker,
  playerBoardData,
  myBoardContentFromHost = "",
  isHiddenRoleGame = false,
  currentUserId
}: PlayerPanelWithBoardProps) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tabValue, setTabValue] = useState("players");
  const [hasBoardUpdate, setHasBoardUpdate] = useState(false);
  const prevBoardContentRef = useRef<string>("");

  useEffect(() => {
    const trimmed = myBoardContentFromHost.trim();
    if (trimmed && trimmed !== prevBoardContentRef.current) {
      setHasBoardUpdate(true);
    }
    prevBoardContentRef.current = trimmed;
  }, [myBoardContentFromHost]);

  const handleTabChange = (value: string) => {
    setTabValue(value);
    if (value === "board") setHasBoardUpdate(false);
  };

  const openProfile = (p: Player) => {
    setProfilePlayer(p);
    setProfileOpen(true);
  };

  return (
    <div className="w-80 flex-shrink-0 bg-zinc-850 flex flex-col border-l border-zinc-900/50 h-full overflow-hidden">
      <PlayerProfileDialog
        player={profilePlayer}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        gameId={gameId}
      />
      <Tabs value={tabValue} onValueChange={handleTabChange} className="flex flex-col h-full overflow-hidden">
        <div className="h-14 px-5 flex items-center border-b border-zinc-900/50 bg-zinc-900/30">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 h-10">
            <TabsTrigger value="players" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs">
              <User className="h-3.5 w-3.5 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="board" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 text-xs relative">
              <Package className="h-3 w-3 mr-1.5" />
              My Board
              {hasBoardUpdate && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-zinc-900" aria-hidden />
              )}
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
                    gameId={gameId}
                    onToggleMute={onToggleMute}
                    onSelectSpeaker={onSelectSpeaker}
                    onViewProfile={openProfile}
                    isHiddenRoleGame={isHiddenRoleGame}
                    currentUserId={currentUserId}
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
                      gameId={gameId}
                      onToggleMute={onToggleMute}
                      onSelectSpeaker={onSelectSpeaker}
                      onViewProfile={openProfile}
                      isHiddenRoleGame={isHiddenRoleGame}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* My Board Tab — 纯文本，仅由 AI Host 通过 MY_BOARD_FOR_xxx 编辑 */}
        <TabsContent value="board" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/25 to-zinc-900/40 p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">My Board</h4>
                </div>
                {myBoardContentFromHost.trim() ? (
                  <p className="mt-3 text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                    {myBoardContentFromHost.trim()}
                  </p>
                ) : null}
              </div>
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
  gameId,
  onToggleMute,
  onSelectSpeaker,
  onViewProfile,
  isHiddenRoleGame,
  currentUserId,
}: { 
  player: Player;
  isSpeaking: boolean;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  onViewProfile?: (player: Player) => void;
  isHiddenRoleGame?: boolean;
  currentUserId?: string;
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
              {...getAvatarPropsForPlayer(player)}
              gameId={gameId}
              enabled={true}
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
          {(player.role && (!isHiddenRoleGame || player.id === currentUserId)) && (
            <div className="text-xs text-zinc-300 font-medium">{player.role}</div>
          )}
          {isHiddenRoleGame && player.id !== currentUserId && (
            <div className="text-xs text-zinc-500 font-medium">—</div>
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