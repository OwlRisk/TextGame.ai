"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NavigationState, parseLocationToNavState, navStateToPathname } from "./router-utils";

export interface UseAppRouterReturn {
  navState: NavigationState;
  goHome: () => void;
  goGame: (gameId?: string) => void;
  goDiscover: () => void;
  goMyGames: () => void;
  goProfile: () => void;
  navigate: (state: NavigationState) => void;
  back: () => void;
}

/**
 * Custom hook for application routing
 * Synchronizes Next.js router with app navigation state
 */
export function useAppRouter(): UseAppRouterReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [navState, setNavState] = useState<NavigationState>({ page: 'home' });

  // Parse pathname on mount and updates
  useEffect(() => {
    const state = parseLocationToNavState(pathname);
    setNavState(state);
  }, [pathname]);

  const navigate = useCallback((state: NavigationState) => {
    const pathname = navStateToPathname(state);
    router.push(pathname);
    setNavState(state);
  }, [router]);

  const goHome = useCallback(() => {
    navigate({ page: 'home' });
  }, [navigate]);

  const goGame = useCallback((gameId?: string) => {
    if (gameId) {
      navigate({ page: 'game-detail', gameId });
    } else {
      navigate({ page: 'game' });
    }
  }, [navigate]);

  const goDiscover = useCallback(() => {
    navigate({ page: 'discover' });
  }, [navigate]);

  const goMyGames = useCallback(() => {
    navigate({ page: 'my-games' });
  }, [navigate]);

  const goProfile = useCallback(() => {
    navigate({ page: 'profile', showUserProfile: true });
  }, [navigate]);

  const back = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navState,
    goHome,
    goGame,
    goDiscover,
    goMyGames,
    goProfile,
    navigate,
    back,
  };
}
