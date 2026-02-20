'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { AppLayoutWithSidebar } from '@/app/components/app-layout-with-sidebar';
import { SubscriptionPlans } from '@/app/components/subscription-plans';
import { useGameContext } from '@/app/contexts/GameContext';
import { Button } from '@/app/components/ui/button';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/subscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { games, selectedGameId, selectGame, updateGame } = useGameContext();
  const { session } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');

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

  const tierInfo = currentTier !== 'free' ? SUBSCRIPTION_TIERS[currentTier] : null;

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
        {/* Header - 与参考一致 */}
        <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Subscription Plans</h1>
              <p className="text-xs text-zinc-500">Choose the plan that fits your needs</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-8 min-h-0 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Current Plan Banner - 与参考一致 */}
            {currentTier !== 'free' && tierInfo && (
              <div className="mb-8 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-semibold text-lg mb-1">
                      Current Plan: {tierInfo.name}
                    </h2>
                    <p className="text-zinc-400 text-sm">Your subscription renews monthly</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{tierInfo.creditsPerMonth} Credits</div>
                    <div className="text-sm text-zinc-400">per month</div>
                  </div>
                </div>
              </div>
            )}

            <SubscriptionPlans currentTier={currentTier} showTitle={false} />

            {/* FAQ - 与参考一致 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8 max-w-3xl">
              <h2 className="text-white font-semibold text-lg mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium text-sm mb-2">How do Credits work?</h3>
                  <p className="text-zinc-400 text-sm">
                    Credits are consumed during gameplay based on AI interactions, TTS usage, and image generation. Your monthly credit allowance resets on your renewal date.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm mb-2">Can I cancel anytime?</h3>
                  <p className="text-zinc-400 text-sm">
                    Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm mb-2">What happens if I run out of credits?</h3>
                  <p className="text-zinc-400 text-sm">
                    You can upgrade to a higher tier at any time. Unused credits from your current plan will be prorated and added to your new plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayoutWithSidebar>
  );
}
