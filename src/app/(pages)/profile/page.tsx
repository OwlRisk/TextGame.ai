"use client";

import { useRouter } from "next/navigation";
import { GameSidebar } from "@/app/components/game-sidebar";
import { UserProfile } from "@/app/components/user-profile";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const { games, selectedGameId, selectGame } = useGameContext();

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
        <UserProfile onClose={() => router.push("/")} />
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
