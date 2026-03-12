"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { getGames, createGame, updateGame as updateGameDb, touchGame as touchGameDb, deleteGame } from "@/lib/db";
import { toast } from "sonner";

export interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: GameConfig;
  isActive: boolean;
  /** ISO date string; used for sorting the list by last update */
  updatedAt: string;
  /** If this game is a room within a world, the world's UUID. */
  worldId?: string | null;
  /** Room type for world rooms: hub, combat, quest, shop, boss, mystery */
  roomType?: string | null;
  /** Connected room IDs + names for navigation */
  roomConnections?: Array<{ roomId: string; name: string }> | null;
  /** AI-generated one-line room description */
  roomDescription?: string | null;
}

interface GameContextType {
  games: Game[];
  selectedGameId: string | null;
  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  /** Move game to the top of the sidebar (call when player sends a message). */
  touchGame: (id: string) => void;
  removeGame: (id: string) => void;
  selectGame: (id: string | null) => void;
  getGame: (id: string) => Game | undefined;
  isHydrated: boolean;
  gamesLoading: boolean;
}

function rowToGame(row: { id: string; name: string; icon: string; color: string; config: unknown; is_active: boolean; updated_at?: string; world_id?: string | null; room_type?: string | null; room_connections?: unknown; room_description?: string | null }): Game {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    config: (row.config ?? {}) as GameConfig,
    isActive: row.is_active,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    worldId: row.world_id ?? null,
    roomType: row.room_type ?? null,
    roomConnections: (row.room_connections as Array<{ roomId: string; name: string }>) ?? null,
    roomDescription: row.room_description ?? null,
  };
}

function sortGamesByUpdatedAt(games: Game[]): Game[] {
  return [...games].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);

  // Load: from DB when logged in (games + icons), from localStorage when not
  useEffect(() => {
    if (user) {
      setGamesLoading(true);
      getGames(user.id)
        .then(({ data, error }) => {
          if (error) {
            setGames([]);
            const msg = (error as { message?: string })?.message ?? "";
            const isTableMissing = /relation.*does not exist|does not exist|Could not find the table/i.test(msg);
            if (!isTableMissing) {
              toast.error("Failed to load game list");
            }
            return;
          }
          if (data) setGames(sortGamesByUpdatedAt(data.map(rowToGame)));
        })
        .finally(() => {
          setGamesLoading(false);
          setIsHydrated(true);
        });
      const savedSelectedId = localStorage.getItem("selectedGameId");
      if (savedSelectedId) setSelectedGameId(savedSelectedId);
    } else {
      try {
        const saved = localStorage.getItem("gamesList");
        if (saved) {
          const parsedGames = JSON.parse(saved) as Game[];
          const withUpdatedAt = parsedGames.map((g) => ({
            ...g,
            updatedAt: g.updatedAt ?? new Date(0).toISOString(),
          }));
          setGames(sortGamesByUpdatedAt(withUpdatedAt));
        }
        const savedSelectedId = localStorage.getItem("selectedGameId");
        if (savedSelectedId) setSelectedGameId(savedSelectedId);
      } catch (e) {
        console.error("Error loading games from localStorage:", e);
      }
      setIsHydrated(true);
    }
  }, [user?.id]);

  // Save to localStorage when not logged in
  useEffect(() => {
    if (!isHydrated || user) return;
    try {
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
  }, [games, isHydrated, user]);

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
    const withTime = { ...game, updatedAt: game.updatedAt ?? new Date().toISOString() };
    setGames((prev) => {
      if (prev.some((g) => g.id === game.id)) {
        return prev.map((g) => (g.id === game.id ? { ...g, ...withTime } : g));
      }
      return sortGamesByUpdatedAt([withTime, ...prev]);
    });
    if (user && !game.worldId) {
      createGame({
        id: game.id,
        user_id: user.id,
        name: game.name,
        icon: game.icon,
        color: game.color,
        config: game.config as unknown as Record<string, unknown>,
        is_active: game.isActive,
      }).then(({ error }) => {
        if (error) {
          toast.error("Failed to save game");
          setGames((prev) => prev.filter((g) => g.id !== game.id));
        }
      });
    }
  }, [user]);

  const updateGame = useCallback((id: string, updates: Partial<Game>) => {
    // Update fields in-place; does NOT change sort order.
    setGames((prev) =>
      prev.map((game) => (game.id === id ? { ...game, ...updates } : game))
    );
    if (user) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.config !== undefined) dbUpdates.config = updates.config;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (Object.keys(dbUpdates).length > 0) {
        updateGameDb(id, dbUpdates).then(({ error }) => {
          if (error) toast.error("Failed to update game");
        });
      }
    }
  }, [user]);

  /** Bump game to top of sidebar — call only when player actually sends a message. */
  const touchGame = useCallback((id: string) => {
    const now = new Date().toISOString();
    setGames((prev) =>
      sortGamesByUpdatedAt(
        prev.map((game) => (game.id === id ? { ...game, updatedAt: now } : game))
      )
    );
    if (user) {
      touchGameDb(id).catch(() => {/* non-critical */});
    }
  }, [user]);

  const removeGame = useCallback((id: string) => {
    setGames((prev) => prev.filter((game) => game.id !== id));
    if (selectedGameId === id) setSelectedGameId(null);
    if (user) {
      deleteGame(id, user.id).then(({ error }) => {
        if (error) toast.error("Failed to delete game");
      });
    }
  }, [selectedGameId, user]);

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
        touchGame,
        removeGame,
        selectGame,
        getGame,
        isHydrated,
        gamesLoading,
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
