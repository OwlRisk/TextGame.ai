'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { useGameContext } from '@/app/contexts/GameContext';
import { Button } from '@/app/components/ui/button';
import type { SubscriptionTier } from '@/lib/subscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
  const { session } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/user/balance', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const status = data?.subscriptionStatus ?? 'free';
        setCurrentTier(status === 'cancelled' ? 'free' : (status as SubscriptionTier));
      })
      .catch(() => setCurrentTier('free'));
  }, [session?.access_token]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: 'pro' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Failed to create checkout');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayoutWithSidebar
      mobileTitle="Subscription"
      games={games}
      selectedGameId={selectedGameId}
      onSelectGame={(gameId) => selectGame(gameId)}
      onCreateGame={() => router.push('/create')}
      onOpenProfile={() => router.push('/profile')}
      onUpdateGame={updateGame}
    >
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a] flex flex-col">
        <div className="flex-shrink-0 px-4 md:px-6 py-3 flex items-center gap-3 border-b border-zinc-800/80 bg-zinc-950/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 -ml-1 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-zinc-500">Back</span>
        </div>

        <div className="flex-1 px-4 md:px-6 py-8 pb-10 min-h-0 overflow-auto">
          <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-white mb-3">Upgrade Membership</h1>
            <p className="text-zinc-500 text-sm text-center mb-8">
              Unlock Pro: unlimited GPT-4o-mini and Credits for GPT-5.2.
            </p>
            <Button
              onClick={handleUpgrade}
              disabled={loading || currentTier === 'pro'}
              className="w-full max-w-sm h-11 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white disabled:opacity-70"
            >
              {currentTier === 'pro' ? 'Current Plan: Pro' : loading ? 'Processing…' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayoutWithSidebar>
  );
}
