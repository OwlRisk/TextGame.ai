"use client";

import { Play, Users, Clock, Sparkles, Flame, Crown, Gamepad2, Swords, Brain, MessageCircle, Trophy, Zap, Star, TrendingUp, Copy, Search, Filter, Grid3x3, List } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useState } from "react";

interface DiscoverPageProps {
  onCreateGame: () => void;
  onJoinGame?: (gameId: string) => void;
}

const GAME_CATEGORIES = [
  {
    id: "social-deduction",
    name: "Social Deduction",
    description: "Outsmart your opponents with lies and logic",
    icon: Swords,
    color: "from-purple-600 to-indigo-600",
    games: ["Werewolf", "Mafia", "Undercover"]
  },
  {
    id: "brain-games",
    name: "Brain Games",
    description: "Test your knowledge and wit",
    icon: Brain,
    color: "from-pink-600 to-rose-600",
    games: ["Trivia Battle", "Detective Mystery", "Debate Master"]
  },
  {
    id: "party",
    name: "Party & Fun",
    description: "Quick games for everyone",
    icon: MessageCircle,
    color: "from-orange-600 to-amber-600",
    games: ["Storyteller", "Trivia", "Quick Games"]
  }
];

// Community created games (mock data)
const COMMUNITY_GAMES = [
  {
    id: "murder-mystery-mansion",
    name: "Murder Mystery Mansion",
    creator: "Official",
    description: "Solve a thrilling murder in a Victorian mansion. Interview suspects and find clues!",
    tags: ["Mystery", "Roleplay", "Detective"],
    icon: "🔪",
    color: "from-red-600 to-rose-600",
    difficulty: "Medium"
  },
  {
    id: "space-pirates",
    name: "Space Pirates Adventure",
    creator: "Official",
    description: "Navigate the galaxy, trade resources, and outsmart rival pirates in this epic space saga.",
    tags: ["Adventure", "Strategy", "Sci-Fi"],
    icon: "🚀",
    color: "from-blue-600 to-cyan-600",
    difficulty: "Hard"
  },
  {
    id: "haunted-hotel",
    name: "Haunted Hotel",
    creator: "Official",
    description: "Survive the night in a haunted hotel. Each room holds secrets and supernatural challenges.",
    tags: ["Horror", "Survival", "Mystery"],
    icon: "👻",
    color: "from-purple-600 to-violet-600",
    difficulty: "Medium"
  },
  {
    id: "food-truck-wars",
    name: "Food Truck Wars",
    creator: "Official",
    description: "Compete to build the best food truck empire! Manage resources and satisfy customers.",
    tags: ["Business", "Strategy", "Casual"],
    icon: "🌮",
    color: "from-orange-600 to-amber-600",
    difficulty: "Easy"
  }
];

const FEATURED_GAMES = [
  {
    id: "werewolf-classic",
    name: "Werewolf",
    description: "The timeless social deduction game where villagers hunt werewolves in the night.",
    players: "5-12",
    duration: "30-45 min",
    difficulty: "Medium",
    tags: ["Social Deduction", "Strategy", "Popular"],
    icon: "🐺",
    color: "from-purple-600 to-indigo-600",
    activeGames: 234
  },
  {
    id: "undercover-party",
    name: "Undercover",
    description: "Find the spy among you by describing secret words. Who's telling the truth?",
    players: "4-10",
    duration: "15-20 min",
    difficulty: "Easy",
    tags: ["Party Game", "Quick", "Word Game"],
    icon: "🕵️",
    color: "from-blue-600 to-cyan-600",
    activeGames: 189
  },
  {
    id: "mafia-night",
    name: "Mafia",
    description: "An intense game of lies and deception. Can the town survive the Mafia's reign?",
    players: "6-15",
    duration: "45-60 min",
    difficulty: "Hard",
    tags: ["Social Deduction", "Advanced", "Roleplay"],
    icon: "🎭",
    color: "from-red-600 to-pink-600",
    activeGames: 156
  },
  {
    id: "detective-mystery",
    name: "Detective Mystery",
    description: "Solve the case before time runs out. Gather clues and catch the culprit!",
    players: "3-8",
    duration: "20-30 min",
    difficulty: "Medium",
    tags: ["Mystery", "Deduction", "Story"],
    icon: "🔍",
    color: "from-amber-600 to-orange-600",
    activeGames: 98
  },
  {
    id: "escape-room",
    name: "Escape Room",
    description: "Work together to escape. Puzzles, riddles, and teamwork required!",
    players: "2-6",
    duration: "40-60 min",
    difficulty: "Hard",
    tags: ["Puzzle", "Cooperative", "Challenge"],
    icon: "🚪",
    color: "from-green-600 to-emerald-600",
    activeGames: 67
  },
  {
    id: "debate-master",
    name: "Debate Master",
    description: "Argue your case and convince the judges. Best debater wins!",
    players: "2-8",
    duration: "25-35 min",
    difficulty: "Medium",
    tags: ["Debate", "Persuasion", "Educational"],
    icon: "⚖️",
    color: "from-indigo-600 to-purple-600",
    activeGames: 45
  },
  {
    id: "trivia-battle",
    name: "Trivia Battle",
    description: "Test your knowledge across various topics!",
    players: "2-10",
    duration: "15-25 min",
    difficulty: "Easy",
    tags: ["Trivia", "Knowledge", "Quick"],
    icon: "🧠",
    color: "from-pink-600 to-rose-600",
    activeGames: 178
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Collaborative storytelling where each player adds to an evolving narrative.",
    players: "3-8",
    duration: "30-50 min",
    difficulty: "Easy",
    tags: ["Creative", "Story", "Roleplay"],
    icon: "📖",
    color: "from-violet-600 to-purple-600",
    activeGames: 112
  },
  {
    id: "auction-wars",
    name: "Auction Wars",
    description: "Bid strategically to collect the most valuable items. Economics meets strategy!",
    players: "3-10",
    duration: "20-35 min",
    difficulty: "Medium",
    tags: ["Strategy", "Economics", "Bidding"],
    icon: "💎",
    color: "from-yellow-600 to-amber-600",
    activeGames: 89
  }
];

export function DiscoverPage({ onCreateGame }: DiscoverPageProps) {
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const featuredGame = FEATURED_GAMES[0]; // Werewolf as featured
  const popularGames = [...FEATURED_GAMES].sort((a, b) => b.activeGames - a.activeGames).slice(0, 6);

  // Filter games based on search and filters
  const filteredGames = FEATURED_GAMES.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = !selectedDifficulty || game.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40 pointer-events-none" />
      
      <div className="relative">
        {/* Compact Hero Banner */}
        <div className="relative h-[320px] md:h-[280px] overflow-hidden border-b border-white/5">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/30 to-orange-600/20" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          {/* Floating orbs */}
          <div className="absolute top-10 left-[15%] w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          
          <div className="relative h-full max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Text */}
            <div className="flex-1 w-full md:w-auto">
              <div className="inline-flex items-center gap-2.5 px-4 md:px-5 py-2 rounded-full bg-violet-500/20 backdrop-blur-md border border-violet-400/30 mb-4 md:mb-5">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-violet-300" />
                <span className="text-xs md:text-sm font-bold text-white">AI-Powered Game Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">Game Arena</span>
              </h1>
              
              <p className="text-base md:text-lg lg:text-xl text-white/70 mb-6 md:mb-8 max-w-xl leading-relaxed">
                Create & play custom games with AI companions. No waiting for players. No downloads. Start your adventure in 2 minutes.
              </p>
              
              <Button 
                size="lg" 
                onClick={onCreateGame}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm md:text-base px-6 md:px-10 py-5 md:py-7 h-auto shadow-2xl shadow-violet-600/50 hover:shadow-violet-600/70 hover:scale-105 transition-all duration-300 border-0 relative overflow-hidden group w-full md:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5 relative z-10" />
                <span className="relative z-10 font-bold">Create New Game</span>
              </Button>
            </div>

            {/* Right: Feature Cards */}
            <div className="flex gap-3 md:gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 min-w-[140px] md:min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                  <span className="text-xs md:text-sm font-semibold text-zinc-400">Instant Play</span>
                </div>
                <div className="text-lg md:text-xl font-black text-white">Start in 2min</div>
              </div>
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 min-w-[140px] md:min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 md:h-5 md:w-5 text-violet-400" />
                  <span className="text-xs md:text-sm font-semibold text-zinc-400">AI Players</span>
                </div>
                <div className="text-lg md:text-xl font-black text-white">Always Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-8 md:py-12">
          {/* Quick Start Categories */}
          <div className="mb-12 md:mb-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">Quick Start</h2>
                <div className="text-sm text-zinc-500">Choose a game type to begin</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Regular categories */}
              {GAME_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={onCreateGame}
                    className={`group relative bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-violet-500/50 rounded-2xl p-7 transition-all duration-300 hover:scale-105 hover:bg-white/10 text-left overflow-hidden ${
                      selectedCategory === category.id ? 'border-violet-500/50 bg-white/10' : ''
                    }`}
                    onMouseEnter={() => setSelectedCategory(category.id)}
                    onMouseLeave={() => setSelectedCategory(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
                    
                    <div className="relative z-10">
                      <div className={`inline-flex p-3 bg-gradient-to-br ${category.color} rounded-xl mb-4 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-violet-300 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {category.description}
                      </p>
                      <div className="text-xs text-zinc-500">
                        {category.games.join(" • ")}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap className="h-5 w-5 text-violet-400" />
                    </div>
                  </button>
                );
              })}

              {/* Create Custom - Enhanced Large Card */}
              <button
                onClick={onCreateGame}
                className="group relative bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-violet-600/20 backdrop-blur-xl border-2 border-violet-500/50 hover:border-fuchsia-500/70 rounded-2xl p-8 transition-all duration-500 hover:scale-[1.02] text-left overflow-hidden animate-pulse hover:animate-none shadow-2xl shadow-violet-600/30"
                onMouseEnter={() => setSelectedCategory('custom')}
                onMouseLeave={() => setSelectedCategory(null)}
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/30 to-violet-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                {/* Floating sparkles */}
                <div className="absolute top-4 right-4 animate-bounce">
                  <Sparkles className="h-6 w-6 text-fuchsia-400" />
                </div>
                <div className="absolute top-8 right-12 animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div className="absolute top-12 right-6 animate-bounce" style={{ animationDelay: '1s' }}>
                  <Sparkles className="h-3 w-3 text-pink-400" />
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex p-4 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl mb-4 shadow-2xl shadow-violet-600/50 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-fuchsia-300 transition-colors">
                    Create Custom
                  </h3>
                  
                  <p className="text-base text-zinc-300 mb-4 font-medium">
                    Build your own game rules
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-violet-500/30 text-violet-200 border-violet-400/50 text-xs">
                      🎭 Any Genre
                    </Badge>
                    <Badge className="bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/50 text-xs">
                      🎨 Full Control
                    </Badge>
                    <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50 text-xs">
                      ✨ AI Powered
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-bold text-fuchsia-300">
                    Unlimited Possibilities →
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-fuchsia-600/30 to-violet-600/0 blur-xl" />
                </div>
              </button>
            </div>
          </div>

          {/* Featured Games */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">Featured Games</h2>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs font-bold">
                  CURATED
                </Badge>
              </div>
              <div className="text-sm text-zinc-500">Example games to get you started</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {COMMUNITY_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                  onMouseEnter={() => setHoveredGameId(game.id)}
                  onMouseLeave={() => setHoveredGameId(null)}
                  onClick={onCreateGame}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                        {game.icon}
                      </div>
                      <Badge 
                        className={`${
                          game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        } border text-xs font-bold`}
                      >
                        {game.difficulty}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-black text-white mb-2 group-hover:text-violet-300 transition-colors line-clamp-1">
                      {game.name}
                    </h3>
                    
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
                      {game.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {game.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index}
                          className="bg-white/5 text-zinc-400 border-white/10 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Hover Effects */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
                  {hoveredGameId === game.id && (
                    <div className="absolute inset-0 border-2 border-violet-500/50 rounded-2xl pointer-events-none" />
                  )}
                  
                  {/* Play button on hover */}
                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 rounded-lg text-white text-xs font-bold shadow-lg">
                      <Play className="h-3 w-3" />
                      Try This
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Games */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
                  <Gamepad2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">All Games</h2>
                <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700 text-xs">
                  {filteredGames.length} games
                </Badge>
              </div>
              
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-violet-500/50"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <select
                      value={selectedDifficulty || ""}
                      onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                      className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-zinc-900">All Difficulties</option>
                      <option value="Easy" className="bg-zinc-900">Easy</option>
                      <option value="Medium" className="bg-zinc-900">Medium</option>
                      <option value="Hard" className="bg-zinc-900">Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded transition-colors ${
                        viewMode === "grid" 
                          ? "bg-violet-600 text-white" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded transition-colors ${
                        viewMode === "list" 
                          ? "bg-violet-600 text-white" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {filteredGames.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4">
                  <Search className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                <p className="text-zinc-400 mb-6">Try adjusting your search or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDifficulty(null);
                  }}
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  Clear Filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {filteredGames.map((game) => (
                  <button
                    key={game.id}
                    className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-violet-500/50 rounded-xl p-4 md:p-5 transition-all duration-300 hover:scale-105 text-center"
                    onClick={onCreateGame}
                    onMouseEnter={() => setHoveredGameId(game.id)}
                    onMouseLeave={() => setHoveredGameId(null)}
                  >
                    <div className="text-4xl md:text-5xl mb-2 md:mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      {game.icon}
                    </div>
                    <h3 className="text-xs md:text-sm font-black text-white mb-1 group-hover:text-violet-300 transition-colors line-clamp-1">
                      {game.name}
                    </h3>
                    <div className="text-xs text-zinc-500 mb-2">{game.players}</div>
                    <Badge 
                      className={`text-xs ${
                        game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {game.difficulty}
                    </Badge>
                    
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-xl pointer-events-none`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames.map((game) => (
                  <button
                    key={game.id}
                    className="group w-full relative bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-violet-500/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] text-left"
                    onClick={onCreateGame}
                    onMouseEnter={() => setHoveredGameId(game.id)}
                    onMouseLeave={() => setHoveredGameId(null)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {game.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                            {game.name}
                          </h3>
                          <Badge 
                            className={`text-xs ${
                              game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                              'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}
                          >
                            {game.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-1">
                          {game.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{game.players}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{game.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-400" />
                            <span>{game.activeGames} active</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {game.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index}
                              className="bg-white/5 text-zinc-400 border-white/10 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-lg text-white text-sm font-bold">
                          <Play className="h-4 w-4" />
                          <span>Play</span>
                        </div>
                      </div>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}