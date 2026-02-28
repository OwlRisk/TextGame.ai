"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { LandingPage } from "@/app/components/landing-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { selectGame, games, updateGame } = useGameContext();
  const { user, loading, signInWithGoogle } = useAuth();

  // Only show the landing page after the client has confirmed the visitor is
  // a guest. Initialising to false (not shown during SSR / hydration) prevents
  // any 1-frame flash of the landing page that logged-in users could see.
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/create");
      return;
    }
    selectGame(null);
    // Show the landing page only once we know for sure the user is not logged in.
    setShowLanding(!loading && !user);
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
      {showLanding ? (
        <LandingPage
          onSignIn={handleSignIn}
          onExploreGames={handleExploreGames}
          onCreateGame={handleCreateGame}
        />
      ) : null}

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
