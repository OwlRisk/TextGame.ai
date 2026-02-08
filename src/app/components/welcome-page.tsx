"use client";

import { Button } from "@/app/components/ui/button";
import { Sparkles, Lightbulb, MessageSquare, Shield, Users, Zap, Wand2, Target, ChevronRight, Gamepad2, Crown, Eye, LogIn, Loader2 } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export interface WelcomeGame {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface WelcomePageProps {
  onCreateGame: (presetId?: string) => void;
  onExploreGames: () => void;
  user: User | null;
  loading: boolean;
  games?: WelcomeGame[];
}

export function WelcomePage({ onCreateGame, onExploreGames, user, loading, games = [] }: WelcomePageProps) {
  const router = useRouter();
  const recentGames = games.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />
      
      <ScrollArea className="flex-1 h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
          {/* Continue playing (logged-in with games) */}
          {user && !loading && recentGames.length > 0 && (
            <div className="mb-10 rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Continue</h2>
              <div className="flex flex-wrap gap-3">
                {recentGames.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => router.push(`/game/${g.id}`)}
                    className="flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 px-4 py-3 text-left transition-all min-w-0"
                  >
                    <span className="text-2xl shrink-0">{g.icon || "🎮"}</span>
                    <span className="font-medium text-white truncate">{g.name}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="text-sm text-purple-300 font-semibold">Welcome to the Future of Gaming</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight px-1">
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Create & Play
              </span>
              <br />
              <span className="text-white">ANY Game You Imagine</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 sm:mb-12 font-medium max-w-3xl mx-auto px-2">
              Design custom games, set your own rules, and dive into immersive experiences. 
              You're the game designer.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : !user ? (
                <Button
                  onClick={() => router.push("/signin")}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 h-auto shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all hover:scale-[1.02] sm:hover:scale-105"
                >
                  <LogIn className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 shrink-0" />
                  Sign in with Google
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => onCreateGame()}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 h-auto shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all hover:scale-[1.02] sm:hover:scale-105"
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 shrink-0" />
                    Create Your Game
                  </Button>
                  
                  <Button
                    onClick={onExploreGames}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-white/5 border-white/20 hover:bg-white/10 text-white text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 h-auto"
                  >
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 shrink-0" />
                    Browse Examples
                  </Button>
                </>
              )}
            </div>

            {!loading && (
              !user ? (
                <p className="text-sm text-zinc-500">
                  <span className="text-purple-400 font-semibold">New here?</span> Sign in to start creating amazing games.
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  <span className="text-purple-400 font-semibold">New here?</span> Click &quot;Create Your Game&quot; and our Game Master will guide you through.
                </p>
              )
            )}
          </div>

          {/* Section divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16 sm:mb-24" aria-hidden />

          {/* How It Works - 3 Steps */}
          <div className="mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
              From idea to gameplay in 3 simple steps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/50">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-sm font-black text-purple-300">1</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Talk to Game Master</h3>
                  </div>
                  
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    Simply describe the game you want to create. Our Game Master will ask you questions and help you design every detail.
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">Takes ~2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative hover:border-blue-500/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/50">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <span className="text-sm font-black text-blue-300">2</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Set the Rules</h3>
                  </div>
                  
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    Define roles, winning conditions, and gameplay phases. Use our templates or create something completely unique.
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Wand2 className="h-4 w-4" />
                    <span className="font-semibold">Fully customizable</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative hover:border-orange-500/30 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-orange-500/50">
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                      <span className="text-sm font-black text-orange-300">3</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Start Playing</h3>
                  </div>
                  
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    Jump into the game room and start playing. All characters are managed by our system - just focus on having fun!
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-orange-400">
                    <Target className="h-4 w-4" />
                    <span className="font-semibold">Instant gameplay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3 sm:mb-4">
              Why You'll Love It
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
              Powerful features that make game creation effortless and gameplay immersive.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wand2 className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Create Any Game</h3>
                <p className="text-sm text-zinc-400">
                  Mystery, strategy, party games - if you can imagine it, you can build it.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pre-built Templates</h3>
                <p className="text-sm text-zinc-400">
                  Start with classics like Werewolf or Who's the Spy and customize them your way.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Crown className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Smart Game Master</h3>
                <p className="text-sm text-zinc-400">
                  Our host controls game flow, enforces rules, and keeps everyone engaged.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Immersive Experience</h3>
                <p className="text-sm text-zinc-400">
                  Natural conversations and rich interactions make you forget you're playing alone.
                </p>
              </div>
            </div>
          </div>

          {/* Popular Game Examples */}
          <div className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3 sm:mb-4">
              Popular Game Templates
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
              Start from a template or create your own unique experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Werewolf */}
              <button
                onClick={() => onCreateGame("werewolf-classic")}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-left hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="text-4xl">🐺</div>
                  <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <span className="text-xs font-bold text-purple-300">CLASSIC</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Werewolf</h3>
                <p className="text-zinc-400 mb-4 relative z-10">
                  A thrilling game of deception where villagers hunt hidden werewolves through strategic discussion and voting.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 relative z-10">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>5-12 players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>Strategy</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-purple-400 font-semibold relative z-10">
                  <span>Create this game</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Who's the Spy */}
              <button
                onClick={() => onCreateGame("undercover-party")}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-left hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="text-4xl">🕵️</div>
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                    <span className="text-xs font-bold text-blue-300">PARTY</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Who's the Spy</h3>
                <p className="text-zinc-400 mb-4 relative z-10">
                  Find the undercover agent who has a different word. Quick rounds, endless laughs!
                </p>
                
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 relative z-10">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>4-10 players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>Word Game</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-blue-400 font-semibold relative z-10">
                  <span>Create this game</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Custom Game */}
              <button
                onClick={() => onCreateGame()}
                className="group bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 text-left hover:border-purple-500/50 hover:from-purple-500/20 hover:via-fuchsia-500/20 hover:to-pink-500/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="text-4xl">✨</div>
                  <div className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-fuchsia-500/30 border border-purple-500/40 rounded-full">
                    <span className="text-xs font-bold text-purple-200">NEW</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Custom Game</h3>
                <p className="text-zinc-400 mb-4 relative z-10">
                  Have a unique idea? Design your own game from scratch with complete creative freedom.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 relative z-10">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>2-20 players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wand2 className="h-4 w-4" />
                    <span>Your Rules</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-purple-400 font-semibold relative z-10">
                  <span>Start creating</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-1 sm:mb-2">Describe</div>
              <div className="text-sm text-zinc-400">Tell the Game Master your idea</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-1 sm:mb-2">∞</div>
              <div className="text-sm text-zinc-400">Possibilities</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-1 sm:mb-2">~2 min</div>
              <div className="text-sm text-zinc-400">To start playing</div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}