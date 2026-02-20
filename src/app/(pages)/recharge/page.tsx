'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { RechargeContent } from '@/app/components/recharge-content';
import { useGameContext } from '@/app/contexts/GameContext';

function RechargeFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] text-zinc-500 text-sm">
      Loading…
    </div>
  );
}

export default function RechargePage() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Top up"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push('/create')}
      onOpenProfile={() => router.push('/profile')}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <Suspense fallback={<RechargeFallback />}>
          <RechargeContent />
        </Suspense>
      </div>
    </AppLayoutWithSidebar>
  );
}
