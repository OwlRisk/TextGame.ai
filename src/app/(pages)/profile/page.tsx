"use client";

import { useRouter } from "next/navigation";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
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
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Profile"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push("/create")}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      <UserProfile onClose={() => router.push("/")} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </AppLayoutWithSidebar>
  );
}
