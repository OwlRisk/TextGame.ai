"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";

export default function DiscoverPageRoute() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
  const { user, loading } = useAuth();

  // 进入 Discover 页时同步侧边栏高亮为 "discover"
  useEffect(() => {
    selectGame("discover");
  }, [selectGame]);

  const handleCreateGame = (preset: DiscoverPreset) => {
    if (!user && !loading) {
      const returnUrl = `/create?preset=${preset.id}`;
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      toast.info("Sign in to create this game");
      return;
    }
    router.push(`/create?preset=${preset.id}`);
  };

  return (
    <AppLayoutWithSidebar
      mobileTitle="Discover"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push("/create")}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      <DiscoverPage onCreateGame={handleCreateGame} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </AppLayoutWithSidebar>
  );
}
