"use client";

import { Home, Gamepad2, Compass, Users, UserCircle, LogOut, Settings, Crown, HelpCircle, Trash2 } from "lucide-react";
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
import { useState } from "react";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { useAuth } from "@/lib/auth-context";
import { useAppRouter } from "@/lib/use-app-router";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SidebarNavigationProps {
  games: Game[];
  onCreateGame: () => void;
  onDeleteGame?: (gameId: string) => void;
}

/**
 * Updated GameSidebar using proper routing
 * This version uses useAppRouter for navigation instead of callback props
 */
export function GameSidebarWithRouting({
  games,
  onCreateGame,
  onDeleteGame,
}: SidebarNavigationProps) {
  const { user, signOut } = useAuth();
  const { navState, goHome, goGame, goDiscover, goMyGames, goProfile } = useAppRouter();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      goHome();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="w-20 flex-shrink-0 bg-zinc-950 border-r border-white/5 flex flex-col items-center py-4 gap-3 overflow-hidden">
      <TooltipProvider delayDuration={100}>
        {/* Top Section: Navigation Buttons */}
        <div className="flex flex-col items-center gap-3">
          {/* Home Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                  navState.page === "home"
                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/50"
                    : "bg-gradient-to-br from-violet-600/80 to-fuchsia-600/80 hover:from-violet-600 hover:to-fuchsia-600 hover:rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                }`}
                onClick={goHome}
              >
                <Home className="h-7 w-7 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden">
              Home
            </TooltipContent>
          </Tooltip>

          {/* My Games Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                  navState.page === "my-games"
                    ? "bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50"
                    : "bg-zinc-800 hover:bg-blue-600 hover:rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105"
                }`}
                onClick={goMyGames}
              >
                <Gamepad2 className="h-7 w-7 text-blue-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden">
              My Games
            </TooltipContent>
          </Tooltip>

          {/* Discover Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                  navState.page === "discover"
                    ? "bg-amber-600 rounded-xl shadow-lg shadow-amber-500/50"
                    : "bg-zinc-800 hover:bg-amber-600 hover:rounded-xl hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105"
                }`}
                onClick={goDiscover}
              >
                <Compass className="h-7 w-7 text-amber-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden">
              Discover
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-10 h-0.5 bg-zinc-700 rounded-full my-2" />

        {/* Game List */}
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-3 px-3">
            {games.map((game) => (
              <ContextMenu key={game.id}>
                <ContextMenuTrigger>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-14 w-14 rounded-2xl transition-all duration-200 relative overflow-hidden ${
                          navState.gameId === game.id ? "rounded-xl" : "hover:rounded-xl"
                        } ${game.icon.startsWith("data:image") ? "p-0" : ""}`}
                        style={{
                          backgroundColor: game.icon.startsWith("data:image") ? "transparent" : game.color,
                        }}
                        onClick={() => goGame(game.id)}
                      >
                        {game.icon.startsWith("data:image") ? (
                          <img src={game.icon} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">{game.icon}</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md shadow-lg border-none font-medium text-sm [&>svg]:hidden">
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

        {/* User Profile - Bottom */}
        <div className="mt-auto">
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full overflow-hidden p-0 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 ring-2 ring-white/10 hover:ring-violet-500/40"
              >
                <GeneratedAvatar
                  name={user?.email || "You"}
                  type="player"
                  enabled={true}
                  className="h-full w-full rounded-full"
                  fallbackColor="#6366f1"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-80 bg-zinc-900 border-zinc-800 text-white p-0 ml-2">
              <div className="p-4 space-y-4">
                {/* User Avatar & Info */}
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                  <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-zinc-700">
                    <GeneratedAvatar
                      name={user?.email || "You"}
                      type="player"
                      enabled={true}
                      className="h-full w-full rounded-full"
                      fallbackColor="#6366f1"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{user?.email?.split("@")[0] || "Player"}</h3>
                    <p className="text-zinc-400 text-xs">{user?.email || "Not signed in"}</p>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                    onClick={() => {
                      setUserMenuOpen(false);
                      goProfile();
                    }}
                  >
                    <UserCircle className="mr-3 h-4 w-4 text-blue-400" />
                    <span className="text-sm">Edit Profile</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                  >
                    <Crown className="mr-3 h-4 w-4 text-amber-500" />
                    <span className="text-sm">Upgrade to Pro</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 hover:bg-zinc-800 text-zinc-100"
                  >
                    <HelpCircle className="mr-3 h-4 w-4 text-green-400" />
                    <span className="text-sm">Help & Support</span>
                  </Button>

                  <div className="pt-1 border-t border-zinc-800 mt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="text-sm">Log Out</span>
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
