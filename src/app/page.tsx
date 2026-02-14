"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { WelcomePage } from "@/app/components/welcome-page";
import { LandingPage } from "@/app/components/landing-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { selectGame, games, updateGame } = useGameContext();
  const { user, loading, signInWithGoogle } = useAuth();

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

  const isGuest = !user && !loading;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle("/create");
    } catch {
      toast.error("登录失败，请重试");
    }
  };

  return (
    <AppLayoutWithSidebar
      mobileTitle="Home"
      games={games}
      selectedGameId={null}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={handleCreateGame}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
          <span className="text-sm">Loading…</span>
        </div>
      ) : isGuest ? (
        <LandingPage
          onSignIn={handleSignIn}
          onExploreGames={handleExploreGames}
        />
      ) : (
        <WelcomePage
          onCreateGame={handleCreateGame}
          onExploreGames={handleExploreGames}
          user={user}
          loading={loading}
          games={games}
        />
      )}

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
    </AppLayoutWithSidebar>
  );
}
