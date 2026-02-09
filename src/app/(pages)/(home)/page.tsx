"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { WelcomePage } from "@/app/components/welcome-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { selectGame, games, updateGame } = useGameContext();
  const { user, loading } = useAuth();

  // Logged-in users: "/" redirects to /create (Game Master) so "home" is one place
  useEffect(() => {
    if (!loading && user) {
      router.replace("/create");
      return;
    }
    selectGame(null);
  }, [loading, user, router, selectGame]);

  const handleCreateGame = (presetId?: string) => {
    if (!user && !loading) {
      router.push("/signin");
    } else {
      router.push(presetId ? `/create?preset=${presetId}` : "/create");
    }
  };

  const handleExploreGames = () => {
    router.push("/discover");
  };

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebar
        games={games}
        selectedGameId={null}
        onSelectGame={(gameId) => selectGame(gameId)}
        onCreateGame={handleCreateGame}
        onOpenProfile={() => router.push("/profile")}
        onUpdateGame={updateGame}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <WelcomePage 
          onCreateGame={handleCreateGame}
          onExploreGames={handleExploreGames}
          user={user}
          loading={loading}
          games={games}
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
