import { useState, useCallback, memo } from "react";
import { Volume2, VolumeX, User, Info, UserPlus, UserMinus, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import type { Player } from "@/types/player";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { PlayerProfileDialog } from "@/app/components/player-profile-dialog";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { isPlayerEliminated, resolveYouBadge, OnlineBadge } from "@/lib/player-badges";

export interface GuestEntry {
  id: string;
  nickname: string;
  memberId?: string;
  playerId?: string;
  playerName?: string;
  playerRole?: string;
}

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
  /** When true the viewer is a guest — human player slot shows "Host" instead of nothing. */
  viewerIsGuest?: boolean;
  /** Human guests who joined via invite link — rendered at the bottom of the player list. */
  guestMembers?: GuestEntry[];
  /**
   * Owner-only: assign an online guest to a player slot.
   * memberId = game_members.id, playerId = Player.id (null to unassign).
   */
  onAssignGuest?: (memberId: string, playerId: string | null) => void;
  /** Force-regenerate a player avatar with DALL-E 3 (costs tokens). */
  onRegenerateAvatar?: (playerName: string, type: 'host' | 'player', opts?: { gender?: string; background?: string; personality?: string; role?: string }) => Promise<string | null>;
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
  viewerIsGuest = false,
  guestMembers = [],
  onAssignGuest,
  onRegenerateAvatar,
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
      <div className="h-14 px-5 flex items-center border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="h-4 w-4" />
          <span className="text-sm font-semibold">Players</span>
          <span className="text-xs text-zinc-500">({players.filter(p => !p.isGameMaster).length + guestMembers.length})</span>
        </div>
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
                viewerIsGuest={viewerIsGuest}
                guestMembers={guestMembers}
                onAssignGuest={onAssignGuest}
                onRegenerateAvatar={onRegenerateAvatar}
              />
            ))}
            {guestMembers.map((g) => (
              <GuestCard key={g.id} guest={g} />
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
  viewerIsGuest = false,
  guestMembers = [],
  onAssignGuest,
  onRegenerateAvatar,
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
  viewerIsGuest?: boolean;
  guestMembers?: GuestEntry[];
  onAssignGuest?: (memberId: string, playerId: string | null) => void;
  onRegenerateAvatar?: (playerName: string, type: 'host' | 'player', opts?: { gender?: string; background?: string; personality?: string; role?: string }) => Promise<string | null>;
}) {
  const [regenerating, setRegenerating] = useState(false);
  const canViewProfile = !!onViewProfile;
  const handleRowClick = () => {
    if (canViewProfile) onViewProfile?.(player);
  };
  const isEliminated = isPlayerEliminated(player);
  const avatarProps = player.isAI ? getAvatarPropsForPlayer(player) : null;
  // Guest currently bound to this player slot (if any)
  const boundGuest = guestMembers.find((g) => g.playerId === player.id);
  // Guests available to assign (not already bound to another player, and have a memberId)
  const availableGuests = guestMembers.filter((g) => !g.playerId && g.memberId);
  const canAssign = isUserGameMaster && player.isAI && !player.isGameMaster && !!onAssignGuest;

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
                      YOU
                    </Badge>
                  )}
                  {boundGuest && (
                    <Badge className="inline-flex items-center justify-center leading-none bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5 h-5 font-bold tracking-wide shadow-sm rounded-md">
                      {boundGuest.nickname}
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
            {canAssign && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-600/50"
                    title={boundGuest ? `Unassign ${boundGuest.nickname}` : "Assign a guest"}
                    aria-label={boundGuest ? `Unassign ${boundGuest.nickname} from ${player.name}` : `Assign a guest to ${player.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {boundGuest ? (
                      <UserMinus className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <UserPlus className="h-3 w-3 text-zinc-400 hover:text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="left"
                  align="start"
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel className="text-zinc-400 text-xs">
                    {boundGuest ? "Assigned guest" : "Assign online guest"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  {boundGuest && (
                    <>
                      <DropdownMenuItem
                        className="text-xs text-emerald-300 cursor-default opacity-60"
                      >
                        {boundGuest.nickname} (current)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs text-red-400 cursor-pointer hover:bg-zinc-800"
                        disabled={!boundGuest.memberId}
                        onClick={() => boundGuest.memberId && onAssignGuest?.(boundGuest.memberId, null)}
                      >
                        <UserMinus className="h-3 w-3 mr-1.5" />
                        Unassign
                      </DropdownMenuItem>
                    </>
                  )}
                  {!boundGuest && availableGuests.length === 0 && (
                    <DropdownMenuItem disabled className="text-xs text-zinc-500">
                      No unassigned guests online
                    </DropdownMenuItem>
                  )}
                  {availableGuests.map((g) => (
                    <DropdownMenuItem
                      key={g.id}
                      className="text-xs cursor-pointer hover:bg-zinc-800"
                      onClick={() => g.memberId && onAssignGuest?.(g.memberId, player.id)}
                    >
                      <UserPlus className="h-3 w-3 mr-1.5 text-emerald-400" />
                      {g.nickname}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          </>
          )}
        </div>
      </div>
    </div>
  );
});

const GuestCard = memo(function GuestCard({ guest }: { guest: GuestEntry }) {
  const initial = guest.nickname?.charAt(0)?.toUpperCase() || "?";
  const isBound = !!guest.playerId;
  return (
    <div className={`p-2 rounded-lg ${isBound ? "bg-emerald-950/20 ring-1 ring-emerald-700/30" : ""}`}>
      <div className="flex items-center gap-2.5">
        <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isBound
            ? "bg-emerald-700/40 border-emerald-500/50 text-emerald-200"
            : "bg-emerald-800/40 border-emerald-700/40 text-emerald-300"
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-emerald-200 truncate">{guest.nickname}</span>
            <Badge className="inline-flex items-center justify-center leading-none bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 h-5 font-bold tracking-wide shadow-sm rounded-md">
              {OnlineBadge.Guest}
            </Badge>
          </div>
          {isBound ? (
            <div className="text-[10px] text-emerald-400/80 mt-0.5 truncate">
              Playing as {guest.playerName ?? "Unknown"}
              {guest.playerRole ? ` · ${guest.playerRole}` : ""}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 mt-0.5">Spectator</div>
          )}
        </div>
      </div>
    </div>
  );
});