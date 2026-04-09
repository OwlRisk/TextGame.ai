import { Hash, Users, Lock, Trash2, Link2, BookOpen, FileText, Package } from "lucide-react";
import { OnlineBadge, resolveOnlineBadge } from "@/lib/player-badges";
import { t } from "@/lib/i18n";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/app/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { useState } from "react";

interface Channel {
  id: string;
  name: string;
  type: "text" | "game";
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
}

interface ChannelListProps {
  gameName: string;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onDeleteChannel?: (channelId: string) => void;
  /** Label for game rooms. Default: "Game Rooms" */
  gameSectionLabel?: string;
  /** Current user display name (e.g. from auth). When provided, shown instead of "Player". */
  userDisplayName?: string | null;
  /** In-game name for the human player (AI-generated). When set with gameId, show this name and use generated avatar. */
  gameUserDisplayName?: string | null;
  gameId?: string;
  /** Persisted avatar URLs so re-login restores the same avatar (e.g. in-game generated avatar). */
  avatarImageUrls?: Record<string, string>;
  /** Call when avatar URL is loaded so the room can persist it. */
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  /** AI-managed channel permissions: channelId → allowed playerIds. undefined = public. */
  channelPermissions?: Record<string, string[]>;
  /** Full player list for showing member avatars in channel rows. */
  allPlayers?: PlayerInfo[];
  /** Unread message counts per channelId — shows a badge on non-selected channels. */
  unreadCounts?: Record<string, number>;
  /** Callback to generate and copy an invite link. Owner only. */
  onInvite?: () => void;
  /** When true, show "Copied!" feedback on the invite button. */
  inviteJustCopied?: boolean;
  /** List of human players who have joined via invite link. */
  roomMembers?: Array<{ id: string; nickname: string; is_owner: boolean; player_id: string | null }>;
  /** The current viewer's member ID — used to show "You" on their own entry. */
  viewerMemberId?: string;
  /** When true, shows a "Rules" entry at the top of the channel list that selects the special "__rules__" channel. */
  hasRules?: boolean;
  /** When true, shows a "My Board" entry below Rules that selects the special "__my_board__" channel. */
  hasMyBoard?: boolean;
  /** When true, shows an amber notification dot on the My Board entry. */
  myBoardHasUpdate?: boolean;
  /** Custom label for the My Board entry. Defaults to "My Board". */
  playerBoardLabel?: string;
}

export function ChannelList({ 
  gameName, 
  channels, 
  selectedChannelId, 
  onSelectChannel,
  onDeleteChannel,
  gameSectionLabel = "Game Rooms",
  userDisplayName,
  gameUserDisplayName,
  gameId,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  channelPermissions = {},
  allPlayers = [],
  unreadCounts = {},
  onInvite,
  inviteJustCopied = false,
  roomMembers,
  viewerMemberId,
  hasRules,
  hasMyBoard,
  myBoardHasUpdate,
  playerBoardLabel = "My Board",
}: ChannelListProps) {
  const { user } = useAuth();
  const userAvatarUrl = getUserAvatarUrl(user);
  const displayName = (gameUserDisplayName && gameUserDisplayName.trim()) || (userDisplayName && userDisplayName.trim()) ? (gameUserDisplayName || userDisplayName || "Player").trim() : "Player";
  const shortLabel = (displayName !== "Player") ? "You" : "#0001";
  // Unified style: human players also use AI-style generated avatars in-game
  const useGameAvatar = !!gameId;
  const avatarName = (gameUserDisplayName && gameUserDisplayName.trim() && gameUserDisplayName !== "You") ? gameUserDisplayName : "Player";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  return (
    <div className="w-52 md:w-56 lg:w-64 h-full flex-shrink-0 bg-zinc-800 flex flex-col min-h-0 overflow-hidden">
      {/* Game Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-zinc-900/50 shadow-sm gap-1">
        <h2 className="font-semibold text-base text-white truncate flex-1 pl-2">{gameName}</h2>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          {/* Rules entry + My Board + dynamic sections from AI Host */}
          {(hasRules || hasMyBoard || channels.some(c => c.type === "text")) && (
            <div className="mb-5">
              {hasRules && (
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-3 h-9 mb-1 rounded-lg ${
                    selectedChannelId === "__rules__"
                      ? "bg-zinc-700/50 text-white"
                      : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                  }`}
                  onClick={() => onSelectChannel("__rules__")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="text-sm">{t("label.rules")}</span>
                </Button>
              )}
              {hasMyBoard && (
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-3 h-9 mb-1 rounded-lg ${
                    selectedChannelId === "__my_board__"
                      ? "bg-zinc-700/50 text-white"
                      : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                  }`}
                  onClick={() => onSelectChannel("__my_board__")}
                >
                  <Package className="h-4 w-4 mr-2 text-amber-400/60" />
                  <span className="text-sm">{playerBoardLabel}</span>
                  {myBoardHasUpdate && selectedChannelId !== "__my_board__" && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" aria-hidden />
                  )}
                </Button>
              )}
              {(() => {
                const textChannels = channels.filter(c => c.type === "text");
                return textChannels.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t("label.sections")}</span>
                  </div>
                  {textChannels.map((channel) => (
                    <ContextMenu key={channel.id}>
                      <ContextMenuTrigger>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start px-3 h-9 mb-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                            selectedChannelId === channel.id
                              ? "bg-zinc-700/50 text-white"
                              : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                          }`}
                          onClick={() => onSelectChannel(channel.id)}
                        >
                          <FileText className="h-4 w-4 mr-2 text-amber-400/60" />
                          <span className="text-sm">{channel.name}</span>
                        </Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white">
                        <ContextMenuItem 
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                          onClick={() => {
                            setChannelToDelete(channel);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("channel.delete_section")}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
                );
              })()}
            </div>
          )}

          {(hasRules || hasMyBoard || channels.some(c => c.type === "text")) && <Separator className="my-3 bg-zinc-700/50" />}

          {/* Game Rooms */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{gameSectionLabel}</span>
            </div>
            {channels.filter(c => c.type === "game").map((channel) => {
              const perms = channelPermissions[channel.id];
              const isRestricted = Array.isArray(perms) && !perms.includes("*");
              const memberPlayers = isRestricted
                ? allPlayers.filter((p) => perms.includes(p.id))
                : [];
              return (
                <ContextMenu key={channel.id}>
                  <ContextMenuTrigger>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start px-3 h-auto min-h-[2.25rem] py-1.5 mb-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                        selectedChannelId === channel.id
                          ? "bg-zinc-700/50 text-white"
                          : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                      }`}
                      onClick={() => onSelectChannel(channel.id)}
                    >
                      <div className="flex items-center w-full gap-2 min-w-0">
                        {isRestricted ? (
                          <Lock className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                        ) : (
                          <Users className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate flex-1 text-left">{channel.name}</span>
                        {/* Unread badge */}
                        {(unreadCounts[channel.id] ?? 0) > 0 && selectedChannelId !== channel.id && (
                          <span className="flex-shrink-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                            {unreadCounts[channel.id]! > 99 ? "99+" : unreadCounts[channel.id]}
                          </span>
                        )}
                        {/* Member avatar stack */}
                        {memberPlayers.length > 0 && (
                          <div className="flex -space-x-1.5 flex-shrink-0">
                            {memberPlayers.slice(0, 4).map((p) => (
                              <div
                                key={p.id}
                                className="h-4 w-4 rounded-full border border-zinc-800 flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: p.avatar.startsWith("#") ? p.avatar : "#6366f1" }}
                                title={p.name}
                              >
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {memberPlayers.length > 4 && (
                              <div className="h-4 w-4 rounded-full border border-zinc-800 bg-zinc-600 flex items-center justify-center text-[8px] text-zinc-300">
                                +{memberPlayers.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white">
                    <ContextMenuItem
                      className="text-zinc-400 focus:text-zinc-300 focus:bg-zinc-800 cursor-default pointer-events-none text-xs"
                    >
                      {isRestricted
                        ? t(memberPlayers.length !== 1 ? "channel.members" : "channel.member", undefined, { count: memberPlayers.length })
                        : t("channel.public_room")}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>

        {/* Room members section — shown to all participants when anyone else is online */}
        {roomMembers && roomMembers.length > 0 && (
          <>
            <Separator className="my-3 bg-zinc-700/50" />
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t("label.players")}</span>
                <span className="text-xs text-zinc-500">{roomMembers.length}</span>
              </div>
              {roomMembers.map((m) => {
                const badge = resolveOnlineBadge(m, viewerMemberId);
                return (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-300 truncate flex-1">{m.nickname}</span>
                    {badge === OnlineBadge.You && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-600/60 text-zinc-300 font-bold tracking-wide">{t("label.you")}</span>
                    )}
                    {badge === OnlineBadge.Guest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold tracking-wide border border-emerald-500/25">{t("label.guest")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User section: pinned to bottom */}
      <div className="mt-auto flex-shrink-0 h-16 bg-zinc-900/50 px-3 flex items-center gap-3 border-t border-zinc-900/50">
        {useGameAvatar ? (
          <GeneratedAvatar
            name={avatarName}
            type="player"
            gameId={gameId}
            enabled={true}
            initialUrl={avatarImageUrls[avatarCacheKey(avatarName, "player")]}
            onAvatarLoaded={onAvatarUrlLoaded}
            className="h-10 w-10 flex-shrink-0"
            fallbackColor="#6366f1"
          />
        ) : (
          <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white/10">
            {userAvatarUrl ? (
              <AvatarImage src={userAvatarUrl} alt={displayName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-indigo-600 text-xs font-semibold text-white">
              {displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate" title={displayName}>{displayName}</div>
          <div className="text-xs text-zinc-400">{shortLabel}</div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {channelToDelete?.type === "game"
                ? t("channel.delete_room")
                : t("channel.delete_section")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("channel.confirm_delete", undefined, { name: channelToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700">
              {t("btn.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (channelToDelete && onDeleteChannel) {
                  onDeleteChannel(channelToDelete.id);
                }
                setChannelToDelete(null);
              }}
            >
              {t("btn.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}