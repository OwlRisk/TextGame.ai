"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { GameConfig } from "@/app/components/game-setup-dialog";

export interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
}

interface GameContextType {
  games: Game[];
  selectedGameId: string | null;
  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  removeGame: (id: string) => void;
  selectGame: (id: string | null) => void;
  getGame: (id: string) => Game | undefined;
  isHydrated: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gamesList");
      if (saved) {
        const parsedGames = JSON.parse(saved);
        setGames(parsedGames);
      }
      
      const savedSelectedId = localStorage.getItem("selectedGameId");
      if (savedSelectedId) {
        setSelectedGameId(savedSelectedId);
      }
    } catch (e) {
      console.error("Error loading games from localStorage:", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever games change
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      // Trim games to prevent localStorage overflow
      const trimmedGames = games.slice(-20).map((g) => ({
        ...g,
        config: g.config?.rules
          ? { ...g.config, rules: g.config.rules.slice(0, 3000) }
          : g.config,
      }));
      localStorage.setItem("gamesList", JSON.stringify(trimmedGames));
    } catch (e) {
      console.error("Error saving games to localStorage:", e);
    }
  }, [games, isHydrated]);

  // Save selected game ID
  useEffect(() => {
    if (!isHydrated) return;
    
    if (selectedGameId) {
      localStorage.setItem("selectedGameId", selectedGameId);
    } else {
      localStorage.removeItem("selectedGameId");
    }
  }, [selectedGameId, isHydrated]);

  const addGame = useCallback((game: Game) => {
    setGames((prev) => [...prev, game]);
  }, []);

  const updateGame = useCallback((id: string, updates: Partial<Game>) => {
    setGames((prev) =>
      prev.map((game) => (game.id === id ? { ...game, ...updates } : game))
    );
  }, []);

  const removeGame = useCallback((id: string) => {
    setGames((prev) => prev.filter((game) => game.id !== id));
    if (selectedGameId === id) {
      setSelectedGameId(null);
    }
  }, [selectedGameId]);

  const selectGame = useCallback((id: string | null) => {
    setSelectedGameId(id);
  }, []);

  const getGame = useCallback(
    (id: string) => {
      return games.find((game) => game.id === id);
    },
    [games]
  );

  return (
    <GameContext.Provider
      value={{
        games,
        selectedGameId,
        addGame,
        updateGame,
        removeGame,
        selectGame,
        getGame,
        isHydrated,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
