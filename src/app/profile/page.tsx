"use client";

import { UserProfile } from "@/app/components/user-profile";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Profile() {
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
    <ProtectedRoute>
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
          <UserProfile onClose={() => router.back()} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
