"use client";

import { Plus, Home, Compass, LogOut, HelpCircle, UserCircle, Gamepad2, Trash2, Loader2, LogIn, CreditCard, BarChart3 } from "lucide-react";
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
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config?: { rules?: string; template?: string };
}

import { getGameTemplate } from "@/lib/game-templates";

function getGameIcon(game: Game): string | null {
  if (game.icon && typeof game.icon === "string" && game.icon.startsWith("http")) return game.icon;
  const template = game.config?.template;
  if (template) {
    const tmpl = getGameTemplate(template);
    if (tmpl?.iconUrl) return tmpl.iconUrl;
  }
  return "/games/sidebar-icon-custom.webp";
}

interface GameSidebarProps {
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
  onOpenProfile?: () => void;
  onDeleteGame?: (gameId: string) => void;
  onUpdateGame?: (gameId: string, updates: Partial<Pick<Game, "icon" | "color">>) => void;
  onNavigate?: () => void;
}

export function GameSidebar({ games, selectedGameId, onSelectGame, onCreateGame, onOpenProfile, onDeleteGame, onNavigate }: GameSidebarProps) {
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
  const userAvatar = getUserAvatarUrl(user);

  return (
    <div className="h-full w-[72px] min-w-[72px] flex-shrink-0 z-10 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950 border-r border-violet-900/20 flex flex-col items-center py-3 gap-2 overflow-hidden backdrop-blur-sm">
      <TooltipProvider delayDuration={100}>
        {/* Top Section */}
        <div className="flex flex-col items-center gap-2">
          {/* Home */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`!h-12 !w-12 rounded-2xl transition-all duration-200 relative ${
                  selectedGameId === "home"
                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/50 hover:!from-violet-600 hover:!to-fuchsia-600"
                    : "bg-zinc-800 hover:bg-gradient-to-br hover:from-violet-600 hover:to-fuchsia-600 hover:rounded-xl hover:shadow-lg hover:shadow-violet-500/30"
                }`}
                asChild
              >
                <Link href="/" prefetch aria-label="Home" onClick={() => { onSelectGame("home"); onNavigate?.(); }}>
                  <Home className="h-7 w-7 text-white" aria-hidden="true" />
                  {selectedGameId === "home" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white font-semibold [&>svg]:hidden">
              Home
            </TooltipContent>
          </Tooltip>

          {/* My Games */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`!h-12 !w-12 rounded-2xl transition-all duration-200 relative ${
                  selectedGameId === "my-games"
                    ? "bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50 hover:!bg-blue-600"
                    : "bg-zinc-800 hover:bg-blue-600 hover:rounded-xl"
                }`}
                asChild
              >
                <Link href="/my-games" prefetch aria-label="My Games" onClick={() => { onSelectGame("my-games"); onNavigate?.(); }}>
                  <Gamepad2 className="h-7 w-7 text-white" aria-hidden="true" />
                  {selectedGameId === "my-games" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white font-semibold [&>svg]:hidden">
              My Stories
            </TooltipContent>
          </Tooltip>

          {/* Discover */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`!h-12 !w-12 rounded-2xl transition-all duration-200 relative ${
                  selectedGameId === "discover"
                    ? "bg-orange-600 rounded-xl shadow-lg shadow-orange-500/50 hover:!bg-orange-600"
                    : "bg-zinc-800 hover:bg-orange-600 hover:rounded-xl"
                }`}
                asChild
              >
                <Link href="/discover" prefetch aria-label="Discover" onClick={() => { onSelectGame("discover"); onNavigate?.(); }}>
                  <Compass className="h-7 w-7 text-white" aria-hidden="true" />
                  {selectedGameId === "discover" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white font-semibold [&>svg]:hidden">
              Discover
            </TooltipContent>
          </Tooltip>

          {/* Create Game */}
          {(!user || games.length === 0) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="!h-12 !w-12 bg-green-600 hover:!bg-green-500 rounded-2xl hover:rounded-xl transition-all duration-200"
                  aria-label="Create Game"
                  onClick={() => { trackEvent("cta_click", { label: "create_game", source: "sidebar" }); onCreateGame(); }}
                >
                  <Plus className="h-7 w-7 text-white" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white font-semibold [&>svg]:hidden">
                New Story
              </TooltipContent>
            </Tooltip>
          )}

        </div>

        <div className="w-8 h-0.5 bg-zinc-700 rounded-full my-1" />

        {/* Game List */}
        {user && (
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="flex flex-col items-center gap-2 px-3">
              {games.map((game) => (
                <ContextMenu key={game.id}>
                  <ContextMenuTrigger>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`!h-12 !w-12 rounded-2xl transition-all duration-200 overflow-hidden p-0 ${
                              selectedGameId === game.id ? "rounded-xl" : "hover:rounded-xl"
                            }`}
                            style={{ backgroundColor: game.color }}
                            asChild
                          >
                            <Link href={`/game/${game.id}`} prefetch aria-label={game.name} onClick={() => { onSelectGame(game.id); onNavigate?.(); }}>
                              {getGameIcon(game) ? (
                                <img
                                  src={getGameIcon(game)!}
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-lg font-bold text-white">{game.name.charAt(0)}</span>
                              )}
                            </Link>
                          </Button>
                          {selectedGameId === game.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full pointer-events-none" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white [&>svg]:hidden">
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

        {/* User Profile */}
        <div className="mt-auto flex-shrink-0">
          {loading ? (
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            </div>
          ) : user ? (
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <div className="h-12 w-12 rounded-full overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 ring-2 ring-white/10 hover:ring-violet-500/40">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={userAvatar} alt={username} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-lg font-bold">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                side="right" 
                align="end" 
                className="w-[min(320px,calc(100vw-1rem))] bg-zinc-900 border-zinc-800 text-white p-0 ml-2 rounded-xl overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                    <Avatar className="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-zinc-700/80">
                      <AvatarImage src={userAvatar} alt={username} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xl font-bold">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-zinc-100 truncate">{username}</h3>
                      <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                      onClick={() => { setUserMenuOpen(false); router.push('/profile'); }}
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-blue-400 shrink-0" />
                      <span className="text-sm">Edit Profile</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                      onClick={() => { setUserMenuOpen(false); router.push('/usage'); }}
                    >
                      <BarChart3 className="mr-3 h-4 w-4 text-violet-400 shrink-0" />
                      <span className="text-sm">Usage & Spending</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                      onClick={() => { setUserMenuOpen(false); router.push('/recharge'); }}
                    >
                      <CreditCard className="mr-3 h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-sm">Buy Credits</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                      onClick={() => { setUserMenuOpen(false); router.push('/help'); }}
                    >
                      <HelpCircle className="mr-3 h-4 w-4 text-amber-400 shrink-0" />
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
                          <Loader2 className="mr-3 h-4 w-4 animate-spin shrink-0" />
                        ) : (
                          <LogOut className="mr-3 h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm">{isSigningOut ? 'Signing out...' : 'Log Out'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sign In"
                  className="!h-12 !w-12 !p-0 rounded-full bg-zinc-800 hover:!bg-violet-600 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30"
                  onClick={() => { trackEvent("cta_click", { label: "sign_in", source: "sidebar" }); router.push('/signin'); }}
                >
                  <LogIn className="h-6 w-6 text-white" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={4} className="bg-zinc-900 text-white font-semibold [&>svg]:hidden">
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
              Are you sure you want to delete &ldquo;{gameToDelete?.name}&rdquo;? This action cannot be undone.
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
