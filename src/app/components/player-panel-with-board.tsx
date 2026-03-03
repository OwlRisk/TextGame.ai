import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, User, Package, Info, UserPlus, UserMinus } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Player } from "@/app/components/player-panel";
import { PlayerBoardData } from "@/app/components/player-board";
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
  playerBoardData: PlayerBoardData;
  /** Content written by AI Host for this player's My Board (e.g. role, night result). Only this player sees it. */
  myBoardContentFromHost?: string;
  /** If true (e.g. werewolf/mafia), hide other players' roles in the list—only show own role. */
  isHiddenRoleGame?: boolean;
  /** Current user's player id—used to show own role and hide others' in hidden-role games. */
  currentUserId?: string;
  /** When set, tab is controlled by parent (e.g. open to My Board from chat). */
  activeTab?: "players" | "board";
  onTabChange?: (tab: "players" | "board") => void;
  /** Custom label for the private panel Tab and heading. Defaults to "My Board". Set by GM at game creation. */
  playerBoardLabel?: string;
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
  currentUserId,
  activeTab,
  onTabChange,
  humanGameIdentity,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  playerBoardLabel = "My Board",
  viewerIsGuest = false,
  guestMembers = [],
  onAssignGuest,
}: PlayerPanelWithBoardProps) {
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<"players" | "board">("players");
  const [hasBoardUpdate, setHasBoardUpdate] = useState(false);
  const prevBoardContentRef = useRef<string>("");

  const isControlled = activeTab !== undefined;
  const tabValue = isControlled ? activeTab : internalTab;

  useEffect(() => {
    const trimmed = myBoardContentFromHost.trim();
    if (trimmed && trimmed !== prevBoardContentRef.current) {
      setHasBoardUpdate(true);
    }
    prevBoardContentRef.current = trimmed;
  }, [myBoardContentFromHost]);

  const handleTabChange = (value: string) => {
    const tab = value as "players" | "board";
    if (!isControlled) setInternalTab(tab);
    onTabChange?.(tab);
    if (tab === "board") setHasBoardUpdate(false);
  };

  const openProfile = (p: Player) => {
    setProfilePlayer(p);
    setProfileOpen(true);
  };

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
      <Tabs value={tabValue} onValueChange={handleTabChange} className="flex flex-col h-full overflow-hidden flex-1">
        <div className="h-14 px-5 flex items-center border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/80 backdrop-blur-sm h-10">
            <TabsTrigger value="players" className="data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-400 text-xs">
              <User className="h-3.5 w-3.5 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="board" className="data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-400 text-xs relative">
              <Package className="h-3 w-3 mr-1.5" />
              {playerBoardLabel}
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
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wide">
                Players — {players.length + guestMembers.length}
              </div>
              <div className="space-y-1.5">
                {players.map((player) => (
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
                  />
                ))}
                {/* Guest participants joined via invite link */}
                {guestMembers.map((g) => (
                  <GuestCard key={g.id} guest={g} />
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* My Board Tab — plain text, edited only by AI Host via MY_BOARD_FOR_xxx */}
        <TabsContent value="board" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#1a0f0a]/40 to-zinc-900/50 p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">{playerBoardLabel}</h4>
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
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  viewerIsGuest = false,
  guestMembers = [],
  onAssignGuest,
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
}) {
  const canViewProfile = !!onViewProfile;
  const handleRowClick = () => {
    if (canViewProfile) onViewProfile?.(player);
  };
  const isEliminated = isPlayerEliminated(player);
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
          {player.isAI ? (
            <GeneratedAvatar
              {...getAvatarPropsForPlayer(player)}
              gameId={gameId}
              enabled={true}
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"}`}
              fallbackColor={player.avatar}
              initialUrl={avatarImageUrls[avatarCacheKey(getAvatarPropsForPlayer(player).name ?? player.name, getAvatarPropsForPlayer(player).type)]}
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
                      GM
                    </Badge>
                  )}
                  {/* Viewer is a guest: show Host badge on the human room owner's character */}
                  {!player.isAI && !player.isGameMaster && viewerIsGuest && (
                    <Badge className="inline-flex items-center justify-center leading-none bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] px-2 py-0.5 h-5 font-bold tracking-wide shadow-sm rounded-md">
                      Host
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
        {isUserGameMaster && !player.isGameMaster && (
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {/* Assign / unassign guest to this AI slot */}
            {canAssign && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-zinc-600/50"
                    title={boundGuest ? `Unassign ${boundGuest.nickname}` : "Assign a guest"}
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
                        onClick={() => onAssignGuest!(boundGuest.memberId!, null)}
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
                      onClick={() => onAssignGuest!(g.memberId!, player.id)}
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

function GuestCard({ guest }: { guest: GuestEntry }) {
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
}