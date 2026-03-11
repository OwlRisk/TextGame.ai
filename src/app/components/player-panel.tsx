import { useState } from "react";
import { Crown, Volume2, VolumeX, User, Package } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { PlayerBoardData } from "@/app/components/player-board";
import { Badge } from "@/app/components/ui/badge";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { PlayerProfileDialog } from "@/app/components/player-profile-dialog";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  stats?: Record<string, string | number>;
  isMuted?: boolean;
  isGameMaster?: boolean;
  isAI: boolean;
  isOnline?: boolean;
  /** AI-only: short personality tag (e.g. "Skeptical and analytical") */
  personality?: string;
  /** AI-only: backstory / context (e.g. "Former debate champion") */
  background?: string;
  /** Player gender (male, female, other) - used for avatar generation and TTS voice matching */
  gender?: string;
  /** Whether this player's role has been publicly revealed by the Host (via REVEAL_ROLE directive). */
  roleRevealed?: boolean;
  /** Persistent TTS voice ID (Inworld). Assigned at player creation so each character keeps a stable voice. */
  voiceId?: string;
}

interface PlayerPanelProps {
  players: Player[];
  currentSpeakerId?: string | null;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  /** When set, the human player uses this in-game name and AI-generated avatar. */
  humanGameIdentity?: { name: string } | null;
  /** Persisted avatar URLs (key = "name|type") for cross-device. */
  avatarImageUrls?: Record<string, string>;
  /** Call when an avatar URL is loaded so the room can persist it. */
  onAvatarUrlLoaded?: (key: string, url: string) => void;
}

export function PlayerPanel({ 
  players, 
  currentSpeakerId,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker,
  humanGameIdentity,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
}: PlayerPanelProps) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = (player: Player) => {
    setProfilePlayer(player);
    setProfileOpen(true);
  };

  return (
    <div className="w-52 md:w-56 lg:w-60 bg-zinc-850 flex flex-col border-l border-zinc-900/50 flex-shrink-0">
      <PlayerProfileDialog
        player={profilePlayer}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        gameId={gameId}
        avatarImageUrls={avatarImageUrls}
        onAvatarUrlLoaded={onAvatarUrlLoaded}
        humanGameIdentity={humanGameIdentity}
        isUserGameMaster={isUserGameMaster}
      />
      <div className="h-12 px-4 flex items-center border-b border-zinc-900/50 bg-zinc-900/30">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Players — {players.length}</h3>
      </div>

      <ScrollArea className="flex-1 min-h-0">
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
                onOpenProfile={openProfile}
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
              />
              <Separator className="mt-3 bg-zinc-700/50" />
            </div>
          ))}

          {/* Regular Players */}
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wide">Players</div>
            <div className="space-y-1.5">
              {players.filter(p => !p.isGameMaster).length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">No players yet</p>
              ) : players.filter(p => !p.isGameMaster).map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSpeaking={currentSpeakerId === player.id}
                  isUserGameMaster={isUserGameMaster}
                  gameId={gameId}
                  onToggleMute={onToggleMute}
                  onSelectSpeaker={onSelectSpeaker}
                  humanGameIdentity={humanGameIdentity}
                  onOpenProfile={openProfile}
                  avatarImageUrls={avatarImageUrls}
                  onAvatarUrlLoaded={onAvatarUrlLoaded}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
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
  humanGameIdentity,
  onOpenProfile,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
}: { 
  player: Player;
  isSpeaking: boolean;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  humanGameIdentity?: { name: string } | null;
  onOpenProfile?: (player: Player) => void;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
}) {
  const isClickable = !!onOpenProfile;
  const { user } = useAuth();
  const userAvatarUrl = getUserAvatarUrl(user);
  const humanAvatarName = humanGameIdentity?.name?.trim() && humanGameIdentity.name !== "You" ? humanGameIdentity.name : "Player";
  // Only use pool-generated avatar for human if they have no real profile picture
  const useGameAvatarForHuman = !player.isAI && !!gameId && !userAvatarUrl;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onOpenProfile?.(player) : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && onOpenProfile?.(player) : undefined}
      className={`group p-2 rounded-lg transition-all duration-200 ${
        isSpeaking 
          ? "bg-green-600/20 ring-1 ring-green-600/50 shadow-sm" 
          : "hover:bg-zinc-700/40 hover:shadow-sm"
      } ${isClickable ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-850" : ""}`}
      title={player.isAI && (player.personality || player.background) ? "View personality & background" : isClickable ? "View profile" : undefined}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative flex-shrink-0">
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 z-10 flex h-3 w-3 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
          {!player.isAI && !useGameAvatarForHuman ? (
            <Avatar
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/60 scale-105" : "group-hover:scale-105"
              }`}
            >
              {userAvatarUrl ? (
                <AvatarImage src={userAvatarUrl} alt={player.name} className="object-cover object-top" />
              ) : null}
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: player.avatar }}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : !player.isAI && useGameAvatarForHuman ? (
            <GeneratedAvatar
              name={humanAvatarName}
              type="player"
              gameId={gameId}
              enabled={true}
              initialUrl={avatarImageUrls[avatarCacheKey(humanAvatarName, "player")]}
              onAvatarLoaded={onAvatarUrlLoaded}
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/60 scale-105" : "group-hover:scale-105"
              }`}
              fallbackColor={player.avatar}
            />
          ) : (
            (() => {
              const avatarProps = getAvatarPropsForPlayer(player);
              return (
                <GeneratedAvatar
                  {...avatarProps}
                  gameId={gameId}
                  enabled={true}
                  initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name ?? player.name, avatarProps.type)]}
                  onAvatarLoaded={onAvatarUrlLoaded}
                  className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                    isSpeaking ? "ring-2 ring-green-500/60 scale-105" : "group-hover:scale-105"
                  }`}
                  fallbackColor={player.avatar}
                />
              );
            })()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-white truncate" title={player.name}>{player.name || (player.isGameMaster ? "Host" : "Player")}</span>
            {!player.isAI && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0 h-4 font-bold tracking-wide shadow-sm">
                YOU
              </Badge>
            )}
          </div>
          {(player.isGameMaster || (player.role && player.isAI && (isUserGameMaster || player.roleRevealed))) && (
            <div className="text-xs text-zinc-300 font-medium">
              {player.isGameMaster ? "Game Master" : player.role}
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0 [@media(hover:none)]:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {isUserGameMaster && !player.isGameMaster && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-600/50"
              onClick={() => onToggleMute?.(player.id)}
              aria-label={player.isMuted ? `Unmute ${player.name}` : `Mute ${player.name}`}
            >
              {player.isMuted ? (
                <VolumeX className="h-3 w-3 text-red-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-zinc-400 hover:text-white" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}