import { Hash, Share2, Users, Lock, Trash2, Link2, Check } from "lucide-react";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/contexts/AuthContext";
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
  onShare: () => void;
  /** When true, show "Copied!" feedback on the share button for a short time */
  shareJustCopied?: boolean;
  onDeleteChannel?: (channelId: string) => void;
  /** Label for the text sections (intro, rules, progress). Default: "Sections" */
  textSectionLabel?: string;
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
  /** List of human players who have joined via invite link (owner only). */
  roomMembers?: Array<{ id: string; nickname: string; is_owner: boolean; player_id: string | null }>;
}

export function ChannelList({ 
  gameName, 
  channels, 
  selectedChannelId, 
  onSelectChannel,
  onShare,
  shareJustCopied = false,
  onDeleteChannel,
  textSectionLabel = "Sections",
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
}: ChannelListProps) {
  const { user } = useAuth();
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = (gameUserDisplayName && gameUserDisplayName.trim()) || (userDisplayName && userDisplayName.trim()) ? (gameUserDisplayName || userDisplayName || "Player").trim() : "Player";
  const shortLabel = (displayName !== "Player") ? "You" : "#0001";
  // 统一风格：在游戏内用户也使用与 AI 相同的生成头像
  const useGameAvatar = !!gameId;
  const avatarName = (gameUserDisplayName && gameUserDisplayName.trim() && gameUserDisplayName !== "You") ? gameUserDisplayName : "Player";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  return (
    <div className="w-52 md:w-56 lg:w-64 h-full flex-shrink-0 bg-zinc-800 flex flex-col min-h-0 overflow-hidden">
      {/* Game Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-zinc-900/50 shadow-sm gap-1">
        <h2 className="font-semibold text-base text-white truncate flex-1 pl-2">{gameName}</h2>
        {/* Invite button (owner only) */}
        {onInvite && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 focus-visible:ring-2 focus-visible:ring-violet-500/50 ${inviteJustCopied ? "min-w-[5rem]" : "w-8 px-0"}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInvite(); }}
            title={inviteJustCopied ? "Invite link copied!" : "Invite players"}
          >
            {inviteJustCopied ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />Copied
              </span>
            ) : (
              <Link2 className="h-4 w-4 text-violet-400 hover:text-violet-300" />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 focus-visible:ring-2 focus-visible:ring-amber-500/50 ${shareJustCopied ? "min-w-[5rem]" : "w-8 px-0"}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(); }}
          title={shareJustCopied ? "Copied!" : "Copy share link"}
        >
          {shareJustCopied ? (
            <span className="text-xs font-medium text-emerald-400">Copied!</span>
          ) : (
            <Share2 className="h-4 w-4 text-zinc-400 hover:text-white" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          {/* Text sections (intro, rules, progress) */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{textSectionLabel}</span>
            </div>
            {channels.filter(c => c.type === "text").map((channel) => (
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
                    <Hash className="h-4 w-4 mr-2" />
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
                    Delete Section
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>

          <Separator className="my-3 bg-zinc-700/50" />

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
                        ? `${memberPlayers.length} member${memberPlayers.length !== 1 ? "s" : ""}`
                        : "Public room"}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>

        {/* Room members section (owner only, shown when someone has joined via invite) */}
        {roomMembers && roomMembers.length > 1 && (
          <>
            <Separator className="my-3 bg-zinc-700/50" />
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Players Online</span>
                <span className="text-xs text-zinc-500">{roomMembers.length}</span>
              </div>
              {roomMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">{m.nickname}</span>
                  {m.is_owner && (
                    <span className="text-[10px] text-violet-400 font-medium">Host</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User Section：固定在底部 */}
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
                ? "Delete Room"
                : "Delete Section"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{channelToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700">
              Cancel
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}