"use client";

import { Plus, Hash, Users, MessageSquare, Home, Compass, Settings, LogOut, Crown, HelpCircle, UserCircle, Gamepad2, Trash2, Loader2, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config?: { rules?: string; template?: string };
}

interface GameSidebarProps {
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
  onOpenProfile?: () => void;
  onDeleteGame?: (gameId: string) => void;
  onUpdateGame?: (gameId: string, updates: Partial<Pick<Game, "icon" | "color">>) => void;
  /** 移动端抽屉内使用时，导航后关闭抽屉 */
  onNavigate?: () => void;
}

export function GameSidebar({ games, selectedGameId, onSelectGame, onCreateGame, onOpenProfile, onDeleteGame, onUpdateGame, onNavigate }: GameSidebarProps) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [iconGeneratingId, setIconGeneratingId] = useState<string | null>(null);
  const autoIconRequestedRef = useRef<Set<string>>(new Set());

  const handleGenerateIcon = async (game: Game, silent = false) => {
    if (!onUpdateGame) return;
    setIconGeneratingId(game.id);
    try {
      const res = await fetch("/api/generate-game-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: game.name,
          gameTemplate: game.config?.template,
          rules: game.config?.rules,
          gameId: game.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate");
      }
      const data = await res.json();
      if (data.icon) {
        onUpdateGame(game.id, { icon: data.icon });
        if (!silent) toast.success(`Icon updated for "${game.name}"`);
      }
    } catch (e) {
      console.error("Generate game icon error:", e);
      if (!silent) toast.error(e instanceof Error ? e.message : "Failed to generate icon. Try again later.");
    } finally {
      setIconGeneratingId(null);
    }
  };

  // Auto-generate AI icon in background for games that still use emoji (once per game)
  useEffect(() => {
    if (!onUpdateGame || iconGeneratingId !== null) return;
    const needIcon = games.find(
      (g) => !g.icon.startsWith("data:image") && !autoIconRequestedRef.current.has(g.id)
    );
    if (!needIcon) return;
    autoIconRequestedRef.current.add(needIcon.id);
    handleGenerateIcon(needIcon, true);
  }, [games, onUpdateGame, iconGeneratingId]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  const username = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Guest";
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="w-20 min-w-[5rem] flex-shrink-0 z-10 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950 border-r border-violet-900/20 flex flex-col items-center py-4 gap-3 overflow-hidden backdrop-blur-sm">
      <TooltipProvider delayDuration={100}>
        {/* Top Section: Home + Create */}
        <div className="flex flex-col items-center gap-3">
          {/* Home: 未登录去首页 /，已登录去 /create */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={user ? "/create" : "/"} prefetch onClick={() => { onSelectGame("home"); onNavigate?.(); }} className="block">
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                      selectedGameId === "home"
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/50 hover:!bg-gradient-to-br hover:!from-violet-600 hover:!to-fuchsia-600 hover:brightness-110"
                        : "bg-zinc-800 hover:bg-gradient-to-br hover:from-violet-600 hover:to-fuchsia-600 hover:rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                    }`}
                    asChild
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl">
                      <Home className="size-7 text-white transition-transform duration-300 group-hover:scale-110" />
                      {selectedGameId === "home" && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                      )}
                    </span>
                  </Button>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden animate-in fade-in-0 zoom-in-95 duration-150"
            >
              Home
            </TooltipContent>
          </Tooltip>

          {/* My Games - Link for prefetch */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/my-games" prefetch onClick={() => { onSelectGame("my-games"); onNavigate?.(); }} className="block">
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                      selectedGameId === "my-games"
                        ? "bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50 hover:!bg-blue-600 hover:brightness-110"
                        : "bg-zinc-800 hover:bg-blue-600 hover:rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105"
                    }`}
                    asChild
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl">
                      <Gamepad2 className="size-7 text-white transition-transform duration-300 group-hover:scale-110" />
                      {selectedGameId === "my-games" && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                      )}
                    </span>
                  </Button>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden animate-in fade-in-0 zoom-in-95 duration-150"
            >
              My Games
            </TooltipContent>
          </Tooltip>

          {/* Discover - Link for prefetch */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/discover" prefetch onClick={() => { onSelectGame("discover"); onNavigate?.(); }} className="block">
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                      selectedGameId === "discover"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/50 hover:!bg-gradient-to-br hover:!from-amber-500 hover:!to-orange-500 hover:brightness-110"
                        : "bg-zinc-800 hover:bg-gradient-to-br hover:from-amber-500 hover:to-orange-500 hover:rounded-xl hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105"
                    }`}
                    asChild
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl">
                      <Compass className="size-7 text-white transition-transform duration-300 group-hover:scale-110" />
                      {selectedGameId === "discover" && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                      )}
                    </span>
                  </Button>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden animate-in fade-in-0 zoom-in-95 duration-150"
            >
              Discover
            </TooltipContent>
          </Tooltip>

        </div>

        <div className="w-10 h-0.5 bg-zinc-700 rounded-full my-2" />

        {/* Game List - Only show when user is logged in; min-h-0 让 flex 子项可收缩，避免把底部用户区挤掉 */}
        {user && (
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="flex flex-col items-center gap-3 px-3">
              {games.map((game) => (
                <ContextMenu key={game.id}>
                  <ContextMenuTrigger>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/game/${game.id}`} prefetch onClick={() => { onSelectGame(game.id); onNavigate?.(); }} className="block">
                          <div className="relative group">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-14 w-14 rounded-2xl transition-all duration-200 relative overflow-hidden ${
                                selectedGameId === game.id
                                  ? "rounded-xl"
                                  : "hover:rounded-xl"
                              } ${game.icon.startsWith('data:image') ? 'p-0' : ''}`}
                              style={{ 
                                backgroundColor: game.icon.startsWith('data:image') ? 'transparent' : game.color,
                              }}
                            >
                            {iconGeneratingId === game.id ? (
                              <Loader2 className="size-7 text-white animate-spin" />
                            ) : game.icon.startsWith('data:image') ? (
                              <img 
                                src={game.icon} 
                                alt={game.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl">{game.icon}</span>
                            )}
                            </Button>
                            {selectedGameId === game.id && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                            )}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right"
                        sideOffset={8}
                        className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden animate-in fade-in-0 zoom-in-95 duration-150"
                      >
                        {game.name}
                      </TooltipContent>
                    </Tooltip>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white">
                    <ContextMenuItem 
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                      onClick={() => {
                        setGameToDelete(game);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Game
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* User Profile - Bottom，固定不参与收缩，避免被游戏列表挤掉 */}
        <div className="mt-auto flex-shrink-0">
          {loading ? (
            <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            </div>
          ) : user ? (
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full overflow-hidden p-0 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 ring-2 ring-white/10 hover:ring-violet-500/40"
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userAvatar} alt={username} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xl font-bold">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                side="right" 
                align="end" 
                className="w-80 bg-zinc-900 border-zinc-800 text-white p-0 ml-2"
              >
                <div className="p-4 space-y-4">
                  {/* User Avatar & Info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                    <Avatar className="h-16 w-16 flex-shrink-0 shadow-lg ring-2 ring-zinc-700">
                      <AvatarImage src={userAvatar} alt={username} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-2xl font-bold">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">{username}</h3>
                      <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenProfile?.();
                      }}
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-blue-400" />
                      <span className="text-sm">Edit Profile</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100 opacity-70 cursor-not-allowed"
                      disabled
                      title="Coming soon"
                    >
                      <Crown className="mr-3 h-4 w-4 text-amber-500" />
                      <span className="text-sm">Upgrade to Pro</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100 opacity-70 cursor-not-allowed"
                      disabled
                      title="Coming soon"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100 opacity-70 cursor-not-allowed"
                      disabled
                      title="Coming soon"
                    >
                      <HelpCircle className="mr-3 h-4 w-4 text-green-400" />
                      <span className="text-sm">Help & Support</span>
                    </Button>
                    
                    <div className="pt-1 border-t border-zinc-800 mt-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-10 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                      >
                        {isSigningOut ? (
                          <>
                            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                            <span className="text-sm">Signing out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="text-sm">Log Out</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full bg-zinc-800 hover:bg-violet-600 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30"
                    onClick={() => router.push('/signin')}
                  >
                    <LogIn className="h-7 w-7 text-white" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                sideOffset={8}
                className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden animate-in fade-in-0 zoom-in-95 duration-150"
              >
                Sign In
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{gameToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (gameToDelete && onDeleteGame) {
                  onDeleteGame(gameToDelete.id);
                }
                setGameToDelete(null);
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