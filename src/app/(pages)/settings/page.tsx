'use client';

import { useRouter } from 'next/navigation';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { SettingsContent } from '@/app/components/settings-content';
import { useGameContext } from '@/app/contexts/GameContext';
import { ProtectedRoute } from '@/app/components/protected-route';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Settings"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push('/create')}
      onOpenProfile={() => router.push('/profile')}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <SettingsContent />
      </div>
    </AppLayoutWithSidebar>
  );
}
