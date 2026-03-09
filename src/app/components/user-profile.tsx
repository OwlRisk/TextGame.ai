"use client";

import { useState, useEffect } from "react";
import { User, History, Camera, X, LogOut, Loader2, Gamepad2, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { getGames } from "@/lib/db";
import Link from "next/link";
import { toast } from "sonner";

interface UserProfileProps {
  onClose: () => void;
}

type ActiveTab = "account" | "history";

interface GameRecord {
  id: string;
  name: string;
  updated_at: string;
  config: { template?: string; playerCount?: number };
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("account");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  const username = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Player";
  const email = user?.email || "";

  useEffect(() => {
    if (activeTab !== "history" || !user?.id) return;
    setGamesLoading(true);
    getGames(user.id)
      .then(({ data }) => setGames((data as GameRecord[] | null) ?? []))
      .catch(() => setGames([]))
      .finally(() => setGamesLoading(false));
  }, [activeTab, user?.id]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Don't show toast here as page will reload
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  // Mock data
  const gameHistory = [
    { id: 1, name: "Werewolf Night", date: "2024-01-20", result: "Won", players: 7 },
    { id: 2, name: "Undercover Mystery", date: "2024-01-19", result: "Lost", players: 6 },
    { id: 3, name: "Mafia Showdown", date: "2024-01-18", result: "Won", players: 8 },
    { id: 4, name: "Detective Game", date: "2024-01-17", result: "Won", players: 5 },
  ];

  const stats = {
    totalGames: 24,
    totalPlaytime: "18h 32m",
    favoriteGame: "Werewolf",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close profile"
      />
      
      {/* Discord-style Modal */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#313338] rounded-lg shadow-2xl flex overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Left Sidebar Navigation */}
        <div className="w-56 bg-[#2b2d31] p-4 space-y-1 flex-shrink-0 overflow-y-auto">
          <div className="mb-4 px-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">User Settings</h2>
          </div>
          
          <button 
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left text-sm font-medium transition-colors ${
              activeTab === "account" 
                ? "bg-[#404249] text-white" 
                : "text-zinc-300 hover:bg-[#404249] hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            My Account
          </button>
          
          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left text-sm font-medium transition-colors ${
              activeTab === "history" 
                ? "bg-[#404249] text-white" 
                : "text-zinc-300 hover:bg-[#404249] hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            Game History
          </button>

          <div className="h-px bg-zinc-700 my-2" />

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center gap-3 px-2 py-2 rounded text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Log Out
              </>
            )}
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#313338]">
          {/* Header with Close Button */}
          <div className="flex-shrink-0 px-10 pt-16 pb-6 relative">
            <h1 className="text-xl font-bold text-white">
              {activeTab === "account" && "My Account"}
              {activeTab === "history" && "Game History"}
            </h1>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 min-h-0 px-10">
            <div className="space-y-6 max-w-2xl pb-20">
              {/* My Account Tab */}
              {activeTab === "account" && (
                <>
                  {/* Avatar Section */}
                  <div className="bg-[#2b2d31] rounded-lg p-6">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                          alt={username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-2xl">
                          {username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">{username}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Avatar managed via your sign-in provider</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info (read-only) */}
                  <div className="bg-[#2b2d31] rounded-lg p-6 space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Username</Label>
                      <p className="text-sm text-white bg-[#1e1f22] rounded px-3 py-2">{username}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Email</Label>
                      <p className="text-sm text-white bg-[#1e1f22] rounded px-3 py-2">{email}</p>
                    </div>
                    <p className="text-xs text-zinc-500">To update your name or email, edit them in your sign-in provider (Google, GitHub, etc.).</p>
                  </div>
                </>
              )}

              {/* Game History Tab */}
              {activeTab === "history" && (
                <>
                  <div className="bg-[#2b2d31] rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-400">Games Created</p>
                        <p className="text-2xl font-bold text-purple-400">{gamesLoading ? "—" : games.length}</p>
                      </div>
                      <Link href="/my-games" onClick={onClose}>
                        <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-700 text-zinc-300 gap-1.5">
                          <ExternalLink className="h-3 w-3" />
                          View All
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="bg-[#2b2d31] rounded-lg overflow-hidden">
                    {gamesLoading ? (
                      <div className="flex items-center justify-center py-12 text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading games…
                      </div>
                    ) : games.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
                        <Gamepad2 className="h-10 w-10 opacity-30" />
                        <p className="text-sm">No games yet. Create your first game!</p>
                        <Link href="/" onClick={onClose}>
                          <Button size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] text-white">Start a Game</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {games.map((game) => (
                          <div key={game.id} className="p-4 hover:bg-[#313338] transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white truncate">{game.name || "Untitled Game"}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {game.config?.template && <span className="mr-2">{game.config.template}</span>}
                                  {new Date(game.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Link href={`/game/${game.id}`} onClick={onClose}>
                                <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white flex-shrink-0 gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  Play
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}