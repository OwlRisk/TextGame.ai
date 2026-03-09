"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { LandingPage } from "@/app/components/landing-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export default function HomeClient({ heroHeadline }: { heroHeadline?: React.ReactNode }) {
  const router = useRouter();
  const { selectGame, games, updateGame } = useGameContext();
  const { user, loading, signInWithGoogle, signInWithFacebook } = useAuth();

  // Render the landing page immediately so the hero h2 is in the SSR HTML
  // (critical for LCP). Logged-in users are redirected after hydration.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setHidden(true);
      router.replace("/create");
      return;
    }
    selectGame("home");
  }, [loading, user, router, selectGame]);

  const handleCreateGame = (presetId?: string) => {
    trackEvent("cta_click", { label: presetId ? `play_${presetId}` : "create_game", source: "landing" });
    const target = presetId ? `/create?preset=${presetId}` : "/create";
    if (!user && !loading) {
      router.push(`/signin?returnUrl=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  const handleExploreGames = () => {
    trackEvent("cta_click", { label: "explore_games", source: "landing" });
    router.push("/discover");
  };

  const handleSignIn = async () => {
    trackEvent("cta_click", { label: "sign_in", source: "landing" });
    try {
      await signInWithGoogle("/create");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  const handleSignInFacebook = async () => {
    trackEvent("cta_click", { label: "sign_in_facebook", source: "landing" });
    try {
      await signInWithFacebook("/create");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  return (
    <AppLayoutWithSidebar
      mobileTitle="Home"
      games={games}
      selectedGameId="home"
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={handleCreateGame}
      onOpenProfile={() => router.push("/profile")}
      onUpdateGame={updateGame}
    >
      {!hidden && (
        <LandingPage
          onSignIn={handleSignIn}
          onCreateGame={handleCreateGame}
          onExploreGames={handleExploreGames}
          heroHeadline={heroHeadline}
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
