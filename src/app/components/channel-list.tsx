import { Hash, Settings, Share2, Users, Home, Trash2 } from "lucide-react";
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

interface ChannelListProps {
  gameName: string;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onShare: () => void;
  onSettings: () => void;
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
}

export function ChannelList({ 
  gameName, 
  channels, 
  selectedChannelId, 
  onSelectChannel,
  onShare,
  onSettings,
  shareJustCopied = false,
  onDeleteChannel,
  textSectionLabel = "Sections",
  gameSectionLabel = "Game Rooms",
  userDisplayName,
  gameUserDisplayName,
  gameId,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
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
    <div className="w-52 md:w-56 lg:w-64 flex-shrink-0 bg-zinc-800 flex flex-col min-h-0 overflow-hidden">
      {/* Game Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-900/50 shadow-sm">
        <h2 className="font-semibold text-base text-white truncate">{gameName}</h2>
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
            {channels.filter(c => c.type === "game").map((channel) => (
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
                    <Users className="h-4 w-4 mr-2" />
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
                    Delete Room
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="h-16 bg-zinc-900/50 px-3 flex items-center justify-between border-t border-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
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
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate" title={displayName}>{displayName}</div>
            <div className="text-xs text-zinc-400">{shortLabel}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onSettings} title="Coming soon">
          <Settings className="h-4 w-4 text-zinc-400" />
        </Button>
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