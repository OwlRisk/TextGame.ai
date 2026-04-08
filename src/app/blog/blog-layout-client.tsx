"use client";

import { useRouter } from "next/navigation";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { ScrollDepthTracker } from "@/app/components/blog/ScrollDepthTracker";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";

export function BlogLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
  const { user, loading } = useAuth();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Blog"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onOpenProfile={user && !loading ? () => router.push("/profile") : () => router.push("/signin")}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </div>
      <ScrollDepthTracker />
    </AppLayoutWithSidebar>
  );
}
