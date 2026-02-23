"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, History, Palette, Bell, Languages, Camera, X, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { toast } from "sonner";

interface UserProfileProps {
  onClose: () => void;
}

type ActiveTab = "account" | "history" | "appearance" | "language" | "notifications";

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("account");
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Use actual user data from auth - Update when user changes
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  
  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Player");
      setEmail(user.email || "");
      setBio(user.user_metadata?.bio || "Passionate gamer who loves strategy and social games!");
    }
  }, [user]);
  
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);

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

          <div className="mb-2 px-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">App Settings</h2>
          </div>

          <button 
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left text-sm font-medium transition-colors ${
              activeTab === "appearance" 
                ? "bg-[#404249] text-white" 
                : "text-zinc-300 hover:bg-[#404249] hover:text-white"
            }`}
          >
            <Palette className="h-4 w-4" />
            Appearance
          </button>

          <button 
            onClick={() => setActiveTab("language")}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left text-sm font-medium transition-colors ${
              activeTab === "language" 
                ? "bg-[#404249] text-white" 
                : "text-zinc-300 hover:bg-[#404249] hover:text-white"
            }`}
          >
            <Languages className="h-4 w-4" />
            Language
          </button>

          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left text-sm font-medium transition-colors ${
              activeTab === "notifications" 
                ? "bg-[#404249] text-white" 
                : "text-zinc-300 hover:bg-[#404249] hover:text-white"
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
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
              {activeTab === "appearance" && "Appearance"}
              {activeTab === "language" && "Language"}
              {activeTab === "notifications" && "Notifications"}
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
          <ScrollArea className="flex-1 px-10 pb-20">
            <div className="space-y-6 max-w-2xl">
              {/* My Account Tab */}
              {activeTab === "account" && (
                <>
                  {/* Avatar Section */}
                  <div className="bg-[#2b2d31] rounded-lg p-6">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <Avatar className="h-20 w-20">
                          <AvatarImage 
                            src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                            alt={username} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-2xl">
                            {username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="h-6 w-6 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] text-white border-0">
                            <Camera className="h-3 w-3 mr-2" />
                            Upload Image
                          </Button>
                          <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-700 text-zinc-300">
                            Generate Avatar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-[#2b2d31] rounded-lg p-6 space-y-5">
                    <div>
                      <Label htmlFor="username" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-[#1e1f22] border-zinc-900 text-white placeholder:text-zinc-500 focus:border-[#5865f2]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#1e1f22] border-zinc-900 text-white placeholder:text-zinc-500 focus:border-[#5865f2]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="bg-[#1e1f22] border-zinc-900 text-white placeholder:text-zinc-500 min-h-[100px] focus:border-[#5865f2] resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" className="border-zinc-700 hover:bg-zinc-700 text-zinc-300" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                      Save Changes
                    </Button>
                  </div>
                </>
              )}

              {/* Game History Tab */}
              {activeTab === "history" && (
                <>
                  <div className="bg-[#2b2d31] rounded-lg overflow-hidden">
                    <div className="divide-y divide-zinc-800">
                      {gameHistory.map((game) => (
                        <div key={game.id} className="p-6 hover:bg-[#313338] transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{game.name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                                <span>{game.date}</span>
                                <span>•</span>
                                <span>{game.players} players</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded text-xs font-medium bg-[#5865f2]/20 text-[#5865f2]">
                              Completed
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#2b2d31] rounded-lg p-6">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Journey</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-zinc-400 mb-1">Games Created</div>
                        <div className="text-2xl font-bold text-purple-400">{stats.totalGames}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 mb-1">Characters Met</div>
                        <div className="text-2xl font-bold text-cyan-400">32</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 mb-1">Hours Played</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.totalPlaytime}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 mb-1">Favorite Game</div>
                        <div className="text-2xl font-bold text-white">{stats.favoriteGame}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="bg-[#2b2d31] rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme" className="bg-[#1e1f22] border-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1f22] border-zinc-900">
                        <SelectItem value="dark">Dark Mode</SelectItem>
                        <SelectItem value="light">Light Mode</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === "language" && (
                <div className="bg-[#2b2d31] rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language" className="bg-[#1e1f22] border-zinc-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1f22] border-zinc-900">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="bg-[#2b2d31] rounded-lg p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Game Invitations</div>
                        <div className="text-xs text-zinc-400">Receive notifications when invited to games</div>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Achievement Unlocks</div>
                        <div className="text-xs text-zinc-400">Get notified when you unlock achievements</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Game Updates</div>
                        <div className="text-xs text-zinc-400">Updates about ongoing games</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}