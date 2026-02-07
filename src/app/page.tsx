"use client";

import { useRouter } from "next/navigation";
import { WelcomePage } from "@/app/components/welcome-page";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";
import { useState, useEffect } from "react";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * Home page - Shows welcome screen
 */
export default function HomePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);

  // Load games from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gameRoomState");
      if (saved) {
        const state = JSON.parse(saved);
        if (state.games) {
          setGames(state.games);
        }
      }
    } catch (e) {
      console.error("Error loading games:", e);
    }
  }, []);

  const handleCreateGame = () => {
    router.push("/discover");
  };

  const handleExploreGames = () => {
    router.push("/discover");
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebarWithRouting
        games={games}
        onCreateGame={handleCreateGame}
        onDeleteGame={(gameId) => {
          const updated = games.filter(g => g.id !== gameId);
          setGames(updated);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <WelcomePage
          onCreateGame={handleCreateGame}
          onExploreGames={handleExploreGames}
        />
      </div>
    </div>
  );
}
