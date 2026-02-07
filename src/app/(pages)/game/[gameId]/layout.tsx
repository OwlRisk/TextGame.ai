"use client";

import { use } from "react";
import { GameRoomProvider } from "@/app/contexts/GameRoomContext";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  
  return (
    <ProtectedRoute>
      <GameRoomProvider gameId={gameId}>
        {children}
      </GameRoomProvider>
    </ProtectedRoute>
  );
}
