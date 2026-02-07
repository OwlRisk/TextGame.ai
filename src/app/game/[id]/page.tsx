"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { GameSidebarWithRouting } from "@/app/components/game-sidebar-with-routing";
import { Button } from "@/app/components/ui/button";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * Game page - shows the actual game interface
 * Contains all the game logic and chat
 */
export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  useEffect(() => {
    // Load games from localStorage
    try {
      const saved = localStorage.getItem("gameRoomState");
      if (saved) {
        const state = JSON.parse(saved);
        if (state.games) {
          setGames(state.games);
          // Find current game
          const game = state.games.find((g: Game) => g.id === gameId);
          setCurrentGame(game || null);
        }
      }
    } catch (e) {
      console.error("Error loading games:", e);
    }
  }, [gameId]);

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
            if (currentGame?.id === gameId) {
              router.push("/my-games");
            }
          }}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">{currentGame?.name || `Game: ${gameId}`}</h1>
            <p className="text-zinc-400 mb-8 text-lg">
              {currentGame ? "Game interface loading..." : "Game not found"}
            </p>
            <div className="space-x-4">
              {currentGame ? (
                <Button
                  onClick={() => router.push("/my-games")}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2"
                >
                  Back to My Games
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/my-games")}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2"
                >
                  Game Not Found - Go Back
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
