"use client";

import { useState, useEffect } from "react";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * Root app layout - includes sidebar and main content area
 */
export default function RootAppLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="h-screen flex bg-zinc-900 text-white">
      <GameSidebarWithRouting
        games={games}
        onCreateGame={() => {
          // Navigation handled by component
        }}
        onDeleteGame={(gameId) => {
          const updated = games.filter(g => g.id !== gameId);
          setGames(updated);
          
          // Update localStorage
          try {
            const saved = localStorage.getItem("gameRoomState");
            if (saved) {
              const state = JSON.parse(saved);
              state.games = updated;
              localStorage.setItem("gameRoomState", JSON.stringify(state));
            }
          } catch (e) {
            console.error("Error updating games:", e);
          }
        }}
      />
      {children}
    </div>
  );
}
