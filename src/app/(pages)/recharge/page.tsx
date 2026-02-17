'use client';

import { useRouter } from 'next/navigation';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { RechargeContent } from '@/app/components/recharge-content';
import { useGameContext } from '@/app/contexts/GameContext';

export default function RechargePage() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();

  return (
    <AppLayoutWithSidebar
      mobileTitle="Get Coins"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push('/create')}
      onOpenProfile={() => router.push('/profile')}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <RechargeContent />
      </div>
    </AppLayoutWithSidebar>
  );
}
