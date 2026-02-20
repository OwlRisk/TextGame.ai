'use client';

import { useState } from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SubscriptionBadge } from '@/app/components/subscription-badge';

const PRO_CONTEXT_CACHE = '128K context & memory cache';

const PRO_FEATURES = [
  'Unlimited GPT-4o-mini',
  'GPT-5.2 powered by Credits (20/month)',
  PRO_CONTEXT_CACHE,
  'Priority support',
];

interface ProPlanBlockProps {
  isCurrent: boolean;
  onSelectPlan?: (tier: 'pro') => void;
}

export function ProPlanBlock({ isCurrent, onSelectPlan }: ProPlanBlockProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (onSelectPlan) {
      onSelectPlan('pro');
      return;
    }
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
    <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-fuchsia-500/5 p-6 shadow-lg shadow-violet-500/10">
      {isCurrent && (
        <div className="mb-4 inline-flex">
          <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 border border-emerald-500/30">
            Current plan
          </span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className="size-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
          <Star className="size-6 text-violet-300" />
        </div>
        <div>
          <SubscriptionBadge tier="pro" size="lg" className="mb-0.5" />
          <p className="text-zinc-500 text-sm">$20/month · 20 Credits</p>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-bold text-white">$20</span>
        <span className="text-zinc-500 text-sm">/ month</span>
      </div>
      <ul className="space-y-3 mb-6">
        {PRO_FEATURES.map((text, idx) => (
          <li key={idx} className="flex items-center gap-2.5">
            <span className="size-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="size-2.5 text-emerald-400" />
            </span>
            <span className="text-sm text-zinc-300">{text}</span>
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <Button
          disabled
          className="w-full rounded-xl h-11 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium"
        >
          Current plan
        </Button>
      ) : (
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-xl h-11 font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
        >
          {loading ? 'Processing…' : (
            <>
              Subscribe to Pro
              <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
