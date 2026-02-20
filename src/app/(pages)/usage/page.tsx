'use client';

import { useRouter } from 'next/navigation';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { UsageContent } from '@/app/components/usage-content';
import { useGameContext } from '@/app/contexts/GameContext';
import { ProtectedRoute } from '@/app/components/protected-route';

export default function UsagePage() {
  return (
    <ProtectedRoute>
      <UsagePageContent />
    </ProtectedRoute>
  );
}

function UsagePageContent() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Usage"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push('/create')}
      onOpenProfile={() => router.push('/profile')}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <UsageContent />
      </div>
    </AppLayoutWithSidebar>
  );
}
