"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { AppLayoutWithSidebar } from "@/app/components/app-layout-with-sidebar";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";

const SIDEBAR_EXCLUDED_PATHS = ["/signin"];

const PATHNAME_TO_TITLE: Record<string, string> = {
  "/discover": "Discover",
  "/my-games": "My Games",
  "/profile": "Profile",
  "/usage": "Usage & Spending",
  "/subscription": "Subscription",
  "/help": "Help & Support",
  "/recharge": "Subscription",
};

function getMobileTitle(pathname: string): string {
  if (pathname.startsWith("/game/")) return "Game";
  if (pathname.startsWith("/games/")) return "Game Info";
  if (pathname === "/games") return "All Games";
  return PATHNAME_TO_TITLE[pathname] ?? "Menu";
}

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
  const { user, loading } = useAuth();

  const hideSidebar = SIDEBAR_EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (hideSidebar) {
    return <>{children}</>;
  }

  const mobileTitle = getMobileTitle(pathname ?? "");
  const isGamePage = (pathname ?? "").startsWith("/game/");

  return (
    <AppLayoutWithSidebar
      mobileTitle={mobileTitle}
      hideMobileHeader={isGamePage}
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={user && !loading ? () => router.push("/discover") : () => router.push("/signin")}
      onOpenProfile={user && !loading ? () => router.push("/profile") : () => router.push("/signin")}
      onUpdateGame={updateGame}
    >
      {children}
    </AppLayoutWithSidebar>
  );
}
