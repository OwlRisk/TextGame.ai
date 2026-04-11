import { useState, useCallback, memo } from "react";
import { Volume2, VolumeX, User, Info, RefreshCw, Plus, X } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import type { Player } from "@/types/player";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { PlayerProfileDialog } from "@/app/components/player-profile-dialog";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { isPlayerEliminated, resolveYouBadge } from "@/lib/player-badges";
import { t } from "@/lib/i18n";

interface PlayerPanelWithBoardProps {
  players: Player[];
  currentSpeakerId?: string | null;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
  /** If true (e.g. werewolf/mafia), hide other players' roles in the list—only show own role. */
  isHiddenRoleGame?: boolean;
  /** Current user's player id—used to show own role and hide others' in hidden-role games. */
  currentUserId?: string;
  /** When set, human player uses this in-game name for avatar key. */
  humanGameIdentity?: { name: string } | null;
  /** Persisted avatar URLs (key = "name|type") for cross-device. */
  avatarImageUrls?: Record<string, string>;
  /** Call when an avatar URL is loaded so the room can persist it. */
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  /** Force-regenerate a player avatar with DALL-E 3 (costs tokens). */
  onRegenerateAvatar?: (playerName: string, type: 'host' | 'player', opts?: { gender?: string; background?: string; personality?: string; role?: string }) => Promise<string | null>;
  /** Add an AI player to the game (shown in active game, not just lobby). */
  onAddAI?: () => void;
  /** Remove an AI player from the game. */
  onRemovePlayer?: (playerId: string) => void;
  /** Max player seats allowed by template. */
  maxSeats?: number;
}

export function PlayerPanelWithBoard({ 
  players, 
  currentSpeakerId,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker,
  isHiddenRoleGame = false,
  currentUserId,
  humanGameIdentity,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  onRegenerateAvatar,
  onAddAI,
  onRemovePlayer,
  maxSeats,
}: PlayerPanelWithBoardProps) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = useCallback((p: Player) => {
    setProfilePlayer(p);
    setProfileOpen(true);
  }, []);

  return (
    <div className="w-80 flex-shrink-0 bg-gradient-to-b from-zinc-900/95 via-[#120820]/95 to-zinc-900/95 flex flex-col border-l border-violet-900/20 h-full overflow-hidden backdrop-blur-sm">
      <PlayerProfileDialog
        player={profilePlayer}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        gameId={gameId}
        avatarImageUrls={avatarImageUrls}
        onAvatarUrlLoaded={onAvatarUrlLoaded}
        humanGameIdentity={humanGameIdentity}
      />
      <div className="h-14 px-5 flex items-center justify-between border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="h-4 w-4" />
          <span className="text-sm font-semibold">{t("label.players")}</span>
          <span className="text-xs text-zinc-500">({players.filter(p => !p.isGameMaster).length}{maxSeats ? `/${maxSeats}` : ""})</span>
        </div>
        {onAddAI && (!maxSeats || players.filter(p => !p.isGameMaster).length < maxSeats) && (
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-600/30" title={t("lobby.add_ai")} onClick={onAddAI}>
            <Plus className="h-4 w-4 text-violet-400" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
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
                avatarImageUrls={avatarImageUrls}
                onAvatarUrlLoaded={onAvatarUrlLoaded}
                onRegenerateAvatar={onRegenerateAvatar}
                onRemovePlayer={onRemovePlayer}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

const PlayerCard = memo(function PlayerCard({ 
  player, 
  isSpeaking,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker,
  onViewProfile,
  isHiddenRoleGame,
  currentUserId,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  onRegenerateAvatar,
  onRemovePlayer,
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
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  onRegenerateAvatar?: (playerName: string, type: 'host' | 'player', opts?: { gender?: string; background?: string; personality?: string; role?: string }) => Promise<string | null>;
  onRemovePlayer?: (playerId: string) => void;
}) {
  const [regenerating, setRegenerating] = useState(false);
  const canViewProfile = !!onViewProfile;
  const handleRowClick = () => {
    if (canViewProfile) onViewProfile?.(player);
  };
  const isEliminated = isPlayerEliminated(player);
  const avatarProps = player.isAI ? getAvatarPropsForPlayer(player) : null;

  return (
    <div
      role={canViewProfile ? "button" : undefined}
      tabIndex={canViewProfile ? 0 : undefined}
      onClick={canViewProfile ? handleRowClick : undefined}
      onKeyDown={canViewProfile ? (e) => e.key === "Enter" && handleRowClick() : undefined}
      className={`group p-2 rounded-lg transition-all duration-200 ${
        isEliminated
          ? "opacity-55 pointer-events-none"
          : isSpeaking
          ? "bg-green-600/20 ring-1 ring-green-600/50 shadow-sm"
          : "hover:bg-zinc-800/40 hover:shadow-sm"
      } ${canViewProfile && !isEliminated ? "cursor-pointer" : ""}`}
      title={canViewProfile ? "View profile" : undefined}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar — M-2: AI (including GM) and human share the same GeneratedAvatar
              component; only the props differ (getAvatarPropsForPlayer handles AI/GM,
              human players use type="player"). */}
        <div className="relative flex-shrink-0">
          {player.isAI && avatarProps ? (
            <GeneratedAvatar
              {...avatarProps}
              gameId={gameId}
              enabled={true}
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"}`}
              fallbackColor={player.avatar}
              initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name ?? player.name, avatarProps.type)]}
              onAvatarLoaded={onAvatarUrlLoaded}
            />
          ) : (
            <GeneratedAvatar
              name={player.name && player.name !== "Player" ? player.name : "adventurer"}
              type="player"
              gameId={gameId}
              enabled={!!(gameId && player.name && player.name !== "Player")}
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${isSpeaking ? "ring-2 ring-blue-500/50 scale-105" : "group-hover:scale-105"}`}
              fallbackColor={player.avatar || "#6366f1"}
              initialUrl={avatarImageUrls[avatarCacheKey(player.name ?? "adventurer", "player")]}
              onAvatarLoaded={onAvatarUrlLoaded}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {(() => {
            // Split "Firstname Lastname, Occupation Title" into display name + occupation subtitle
            const commaIdx = player.name.indexOf(",");
            const displayName = commaIdx > 0 ? player.name.slice(0, commaIdx).trim() : player.name;
            const occupation = commaIdx > 0 ? player.name.slice(commaIdx + 1).trim() : null;
            return (
              <>
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span
                    className={`text-sm font-semibold truncate ${
                      isEliminated
                        ? "line-through text-zinc-500"
                        : player.isGameMaster ? "text-amber-300"
                        : !player.isAI ? "text-blue-200"
                        : "text-white"
                    }`}
                  >
                    {displayName}
                  </span>
                  {player.isGameMaster && (
                    <Badge className="inline-flex items-center justify-center leading-none bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 h-5 font-bold tracking-wider shadow-sm rounded-md">
                      HOST
                    </Badge>
                  )}
                  {resolveYouBadge(player, currentUserId) && (
                    <Badge className="inline-flex items-center justify-center leading-none bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-2 py-0.5 h-5 font-bold tracking-wide shadow-sm rounded-md">
                      {t("label.you")}
                    </Badge>
                  )}
                  {!isEliminated && canViewProfile && player.isAI && (
                    <Info className="h-3.5 w-3.5 text-zinc-500 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
                  )}
                </div>
                {/* Occupation subtitle (e.g. "Lantern-Keeper" from "Edda Fenwick, Lantern-Keeper") */}
                {occupation && !player.isGameMaster && (
                  <div className="text-[10px] text-zinc-500 leading-tight mb-0.5">{occupation}</div>
                )}
              </>
            );
          })()}
          {/* Role visibility: always show own role; others only after Host uses REVEAL_ROLE */}
          {player.role && player.role.trim() !== player.name?.trim() && (
            (player.id === currentUserId || player.roleRevealed)
              ? <div className="text-xs text-violet-300 font-medium">{player.role}</div>
              : null
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0 [@media(hover:none)]:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onRegenerateAvatar && player.isAI && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-600/50"
              disabled={regenerating}
              title="Regenerate avatar (DALL-E 3)"
              aria-label={`Regenerate avatar for ${player.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (regenerating || !onRegenerateAvatar) return;
                setRegenerating(true);
                const ap = getAvatarPropsForPlayer(player);
                onRegenerateAvatar(ap.name ?? player.name, ap.type as 'host' | 'player', {
                  gender: ap.gender ?? player.gender,
                  background: ap.background,
                  personality: ap.personality,
                  role: ap.role ?? player.role,
                }).finally(() => setRegenerating(false));
              }}
            >
              <RefreshCw className={`h-3 w-3 text-zinc-400 hover:text-white ${regenerating ? "animate-spin" : ""}`} />
            </Button>
          )}
          {isUserGameMaster && !player.isGameMaster && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-600/50"
              onClick={(e) => { e.stopPropagation(); onToggleMute?.(player.id); }}
              aria-label={player.isMuted ? `Unmute ${player.name}` : `Mute ${player.name}`}
            >
              {player.isMuted ? (
                <VolumeX className="h-3 w-3 text-red-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-zinc-400 hover:text-white" />
              )}
            </Button>
            {player.isAI && onRemovePlayer && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-600/30"
                onClick={(e) => { e.stopPropagation(); onRemovePlayer(player.id); }}
                aria-label={`Remove ${player.name}`}
                title={t("lobby.remove_ai")}
              >
                <X className="h-3 w-3 text-zinc-400 hover:text-red-400" />
              </Button>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
});
