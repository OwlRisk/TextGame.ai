"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MyGamesPage } from "@/app/components/my-games-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Lock, LogIn } from "lucide-react";

export default function MyGamesPageRoute() {
  const router = useRouter();
  const { games, selectGame, gamesLoading, isHydrated } = useGameContext();
  const { user, loading, signInWithGoogle } = useAuth();

  // Sync sidebar highlight to "my-games" when entering My Games page
  useEffect(() => {
    selectGame("my-games");
  }, [selectGame]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle("/my-games");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  if (!user && !loading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Sign in to view your games</h1>
            <p className="text-zinc-400 mb-8 text-sm sm:text-base">
              Create an account or sign in to access your game library and continue your adventures.
            </p>
            <Button
              onClick={handleSignIn}
              size="lg"
              className="min-h-[44px] bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
        <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
      </>
    );
  }

  return (
    <>
      <MyGamesPage
        games={games}
        isLoading={loading || gamesLoading || !isHydrated}
        onSelectGame={(gameId) => {
          selectGame(gameId);
          router.push(`/game/${gameId}`);
        }}
        onCreateGame={() => router.push("/create")}
      />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </>
  );
}
