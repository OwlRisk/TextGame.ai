"use client";

import { useRouter } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { MyGamesPage } from "@/app/components/my-games-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Lock, LogIn } from "lucide-react";

export default function MyGamesPageRoute() {
  const router = useRouter();
  const { games, selectedGameId, selectGame } = useGameContext();
  const { user, loading } = useAuth();

  // Show sign-in prompt if not authenticated
  if (!user && !loading) {
    return (
      <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
        <GameSidebar
          games={games}
          selectedGameId={selectedGameId}
          onSelectGame={(gameId) => {
            if (gameId === "home") {
              router.push("/");
            } else if (gameId === "discover") {
              router.push("/discover");
            } else if (gameId === "my-games") {
              router.push("/my-games");
            } else {
              router.push("/signin");
            }
          }}
          onCreateGame={() => router.push("/signin")}
          onOpenProfile={() => router.push("/signin")}
        />

        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Sign in to view your games</h1>
            <p className="text-zinc-400 mb-8">
              Create an account or sign in to access your game library and continue your adventures.
            </p>
            <Button
              onClick={() => router.push("/signin")}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>

        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          offset={{ top: "72px", right: "20px" }}
          gap={12}
          toastOptions={{
            style: { zIndex: 9999 },
            duration: 4000,
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId) => {
          if (gameId === "home") {
            router.push("/");
          } else if (gameId === "discover") {
            router.push("/discover");
          } else if (gameId === "my-games") {
            router.push("/my-games");
          } else {
            selectGame(gameId);
            router.push(`/game/${gameId}`);
          }
        }}
        onCreateGame={() => router.push("/create")}
        onOpenProfile={() => router.push("/profile")}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MyGamesPage
          games={games}
          onSelectGame={(gameId) => {
            selectGame(gameId);
            router.push(`/game/${gameId}`);
          }}
          onCreateGame={() => router.push("/create")}
        />
      </div>

      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        offset={{ top: "72px", right: "20px" }}
        gap={12}
        toastOptions={{
          style: { zIndex: 9999 },
          duration: 4000,
        }}
      />
    </div>
  );
}
