"use client";

import { Plus, Hash, Users, MessageSquare, FileText, Home, Compass, User, Settings, LogOut, Crown, HelpCircle, UserCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { useState } from "react";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface GameSidebarProps {
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: () => void;
  onViewDrafts?: () => void;
  onOpenProfile?: () => void;
}

export function GameSidebar({ games, selectedGameId, onSelectGame, onCreateGame, onViewDrafts, onOpenProfile }: GameSidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="w-20 bg-zinc-950 border-r border-white/5 flex flex-col items-center py-4 gap-3">
      <TooltipProvider delayDuration={100}>
        {/* Top Section: Home + Create */}
        <div className="flex flex-col items-center gap-3">
          {/* Home */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                    selectedGameId === "home"
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/50"
                      : "bg-gradient-to-br from-violet-600/80 to-fuchsia-600/80 hover:from-violet-600 hover:to-fuchsia-600 hover:rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                  }`}
                  onClick={() => onSelectGame("home")}
                >
                  <Home className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" />
                  {selectedGameId === "home" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 border border-violet-500/50 shadow-lg shadow-violet-500/30 text-white px-4 py-2.5 rounded-lg backdrop-blur-sm [&>svg]:fill-violet-600 [&>svg]:border-violet-500/50"
            >
              <p className="flex items-center gap-2">
                <span>🏠</span>
                <span>Home</span>
              </p>
            </TooltipContent>
          </Tooltip>

          {/* My Games */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                    selectedGameId === "my-games"
                      ? "bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50"
                      : "bg-zinc-800 hover:bg-blue-600 hover:rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105"
                  }`}
                  onClick={() => onSelectGame("my-games")}
                >
                  <Gamepad2 className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" />
                  {selectedGameId === "my-games" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                  {/* Hover glow effect */}
                  {selectedGameId !== "my-games" && (
                    <div className="absolute inset-0 rounded-xl bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-500/50 shadow-lg shadow-blue-500/30 text-white px-4 py-2.5 rounded-lg backdrop-blur-sm [&>svg]:fill-blue-600 [&>svg]:border-blue-500/50"
            >
              <p className="flex items-center gap-2">
                <span>🎮</span>
                <span>My Games</span>
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Discover */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 relative ${
                    selectedGameId === "discover"
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/50"
                      : "bg-zinc-800 hover:bg-gradient-to-br hover:from-amber-500 hover:to-orange-500 hover:rounded-xl hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105"
                  }`}
                  onClick={() => onSelectGame("discover")}
                >
                  <Compass className="h-7 w-7 text-white transition-transform duration-300 group-hover:rotate-12" />
                  {selectedGameId === "discover" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                  )}
                  {/* Hover glow effect */}
                  {selectedGameId !== "discover" && (
                    <div className="absolute inset-0 rounded-xl bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={8}
              className="font-semibold bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-500/50 shadow-lg shadow-amber-500/30 text-white px-4 py-2.5 rounded-lg backdrop-blur-sm [&>svg]:fill-amber-500 [&>svg]:border-amber-500/50"
            >
              <p className="flex items-center gap-2">
                <span>🧭</span>
                <span>Discover</span>
              </p>
            </TooltipContent>
          </Tooltip>

        </div>

        <div className="w-10 h-0.5 bg-zinc-700 rounded-full my-2" />

        {/* Game List */}
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-3 px-3">
            {games.map((game) => (
              <Tooltip key={game.id}>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-14 w-14 rounded-2xl transition-all duration-200 relative ${
                        selectedGameId === game.id
                          ? "rounded-xl"
                          : "hover:rounded-xl"
                      }`}
                      style={{ 
                        backgroundColor: game.color,
                      }}
                      onClick={() => onSelectGame(game.id)}
                    >
                      <span className="text-xl">{game.icon}</span>
                      {selectedGameId === game.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-10 bg-white rounded-r-full" />
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{game.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        {/* Drafts */}
        {onViewDrafts && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-200 ${
                    selectedGameId === "drafts"
                      ? "bg-amber-600 rounded-xl"
                      : "bg-zinc-800 hover:bg-amber-600 hover:rounded-xl"
                  }`}
                  onClick={onViewDrafts}
                >
                  <FileText className="h-7 w-7 text-amber-400" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>My Drafts</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* User Profile - Bottom */}
        <div className="mt-auto">
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 overflow-hidden"
                >
                  <User className="h-7 w-7 text-white" />
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
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Player</h3>
                    <p className="text-zinc-400 text-xs">Member since 2024</p>
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
    </div>
  );
}