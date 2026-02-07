# GameMaster Routing Guide

## Overview

This document explains the new routing system for the GameMaster application. The routing system uses Next.js App Router with a custom navigation layer on top.

## File Structure

```
src/
├── lib/
│   ├── auth-context.tsx          # Authentication context
│   ├── use-app-router.ts         # Custom router hook
│   └── router-utils.ts           # Routing utilities and constants
├── components/
│   └── protected-route.tsx       # Protected route wrapper
├── app/
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (public)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── discover/
│   │   └── page.tsx              # Discover games (public)
│   ├── my-games/
│   │   └── page.tsx              # My games (protected)
│   ├── game/
│   │   ├── page.tsx              # Game selection (protected)
│   │   └── [id]/
│   │       └── page.tsx          # Individual game (protected)
│   └── profile/
│       └── page.tsx              # User profile (protected)
└── middleware.ts                 # Route protection middleware
```

## Routes

### Public Routes
- `/` - Home page with welcome screen
- `/discover` - Discover games page
- `/auth/callback` - OAuth callback (handled by Supabase)

### Protected Routes (Require Authentication)
- `/game` - Game selection screen
- `/game/[id]` - Individual game lobby
- `/my-games` - My games list
- `/profile` - User profile

## Usage

### Using the Router Hook

```tsx
"use client";

import { useAppRouter } from "@/lib/use-app-router";

export function MyComponent() {
  const { navState, goHome, goGame, goDiscover, goMyGames, goProfile, back } = useAppRouter();
  
  return (
    <div>
      <button onClick={goHome}>Home</button>
      <button onClick={() => goGame("game-123")}>Play Game</button>
      <button onClick={goDiscover}>Discover Games</button>
      <button onClick={goMyGames}>My Games</button>
      <button onClick={goProfile}>Profile</button>
      <button onClick={back}>Back</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
"use client";

import { ProtectedRoute } from "@/components/protected-route";

export default function MyGamePage() {
  return (
    <ProtectedRoute redirectTo="/">
      {/* This content only shows to authenticated users */}
      <div>Protected Game Content</div>
    </ProtectedRoute>
  );
}
```

### Authentication State

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export function MyComponent() {
  const { user, session, loading, error, signInWithGoogle, signOut } = useAuth();
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {user && <p>Welcome {user.email}</p>}
      {!user && <button onClick={signInWithGoogle}>Sign In</button>}
    </div>
  );
}
```

## Key Components

### useAppRouter Hook
Custom hook that provides:
- `navState` - Current navigation state
- `goHome()` - Navigate to home
- `goGame(gameId?)` - Navigate to game
- `goDiscover()` - Navigate to discover
- `goMyGames()` - Navigate to my games
- `goProfile()` - Navigate to profile
- `navigate(state)` - Generic navigation
- `back()` - Go back in history

### ProtectedRoute Component
Wraps content that should only be visible to authenticated users. When unauthenticated, automatically redirects to the specified route (default: `/`).

### Router Utilities
- `ROUTES` - Constants for all route paths
- `parseLocationToNavState()` - Convert URL to navigation state
- `navStateToPathname()` - Convert navigation state to URL

## Middleware

The `middleware.ts` file in the root directory provides automatic authentication checking:
- Protects routes that require authentication
- Redirects unauthenticated users to home page
- Uses Supabase session cookies for validation

## Next Steps

1. Replace state-based navigation in `page.tsx` with `useAppRouter` hook
2. Create individual route files for: `/discover`, `/my-games`, `/game/[id]`, `/profile`
3. Wrap protected page content with `<ProtectedRoute>` component
4. Update components to use `useAppRouter()` for navigation instead of callback props
5. Test all routes with and without authentication
