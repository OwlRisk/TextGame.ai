"use client";

import { DiscoverPage } from "@/app/components/discover-page";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Discover() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);

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
    <div className="h-screen w-screen flex bg-zinc-900 text-white overflow-hidden">
      <GameSidebarWithRouting
        games={games}
        onCreateGame={() => {
          // Navigation handled by sidebar
        }}
        onDeleteGame={(gameId) => {
          const updated = games.filter(g => g.id !== gameId);
          setGames(updated);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DiscoverPage
          onCreateGame={(preset) => {
            // Redirect to game setup
            router.push("/discover");
          }}
        />
      </div>
    </div>
  );
}
