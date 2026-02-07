"use client";

import { useState, useEffect } from "react";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load games from localStorage on mount
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="h-screen flex bg-zinc-900 text-white">
      <GameSidebarWithRouting
        games={games}
        onCreateGame={() => {
          // Navigation handled by GameSidebarWithRouting
        }}
        onDeleteGame={(gameId) => {
          setGames(games.filter(g => g.id !== gameId));
          // Update localStorage
          try {
            const saved = localStorage.getItem("gameRoomState");
            if (saved) {
              const state = JSON.parse(saved);
              state.games = games.filter(g => g.id !== gameId);
              localStorage.setItem("gameRoomState", JSON.stringify(state));
            }
          } catch (e) {
            console.error("Error updating games:", e);
          }
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
