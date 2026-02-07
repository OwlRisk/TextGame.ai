// Centralized routing utilities for the GameMaster app

export const ROUTES = {
  HOME: '/',
  AUTH_CALLBACK: '/auth/callback',
  GAME: '/game',
  GAME_DETAIL: (gameId: string) => `/game/${gameId}`,
  DISCOVER: '/discover',
  MY_GAMES: '/my-games',
  PROFILE: '/profile',
} as const;

export type RouteType = typeof ROUTES[keyof typeof ROUTES];

/**
 * Navigation state that represents which page/view should be displayed
 */
export interface NavigationState {
  page: 'home' | 'game' | 'discover' | 'my-games' | 'profile' | 'game-detail';
  gameId?: string;
  showGameMasterChat?: boolean;
  showGameCreatorForm?: boolean;
  showUserProfile?: boolean;
}

/**
 * Parse URL hash or pathname to determine navigation state
 * Handles both hash-based and pathname-based routing
 */
export function parseLocationToNavState(pathname?: string): NavigationState {
  const path = pathname || '';
  
  if (path === '/' || path === '') {
    return { page: 'home' };
  }
  
  if (path === '/discover') {
    return { page: 'discover' };
  }
  
  if (path === '/my-games') {
    return { page: 'my-games' };
  }
  
  if (path === '/profile') {
    return { page: 'profile', showUserProfile: true };
  }
  
  if (path.startsWith('/game/')) {
    const gameId = path.replace('/game/', '');
    return { page: 'game-detail', gameId };
  }
  
  if (path === '/game') {
    return { page: 'game' };
  }
  
  // Default to home
  return { page: 'home' };
}

/**
 * Convert navigation state to URL pathname
 */
export function navStateToPathname(state: NavigationState): string {
  switch (state.page) {
    case 'home':
      return ROUTES.HOME;
    case 'discover':
      return ROUTES.DISCOVER;
    case 'my-games':
      return ROUTES.MY_GAMES;
    case 'profile':
      return ROUTES.PROFILE;
    case 'game-detail':
      return state.gameId ? ROUTES.GAME_DETAIL(state.gameId) : ROUTES.GAME;
    case 'game':
    default:
      return ROUTES.GAME;
  }
}
