"use client";

import { useRouter } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";

export default function DiscoverPageRoute() {
  const router = useRouter();
  const { games, selectedGameId, selectGame } = useGameContext();
  const { user, loading } = useAuth();

  const handleCreateGame = (preset: DiscoverPreset) => {
    if (!user && !loading) {
      toast.info("Please sign in to create a game");
      router.push("/signin");
      return;
    }
    // Navigate to create page with preset data
    router.push(`/create?preset=${preset.id}`);
  };

  return (
    <div className="h-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebar
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={(gameId) => {
          if (gameId === "home") {
            router.push("/create");
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
        <DiscoverPage
          onCreateGame={handleCreateGame}
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
