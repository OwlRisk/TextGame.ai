'use client';

import { useState } from 'react';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SubscriptionBadge } from '@/app/components/subscription-badge';
import {
  SUBSCRIPTION_TIERS,
  capitalizeTier,
  type SubscriptionTier,
} from '@/lib/subscription';

const PLAN_FEATURES: Record<'pro' | 'plus' | 'ultra', string[]> = {
  pro: [
    `${SUBSCRIPTION_TIERS.pro.creditsPerMonth.toLocaleString()} credits / month`,
    '100+ AI voices · 16 languages',
    'Latest GPT models, selectable',
    'Image generation',
    'Voice emotion expressions',
  ],
  plus: [
    `${SUBSCRIPTION_TIERS.plus.creditsPerMonth.toLocaleString()} credits / month`,
    '100+ AI voices · 16 languages',
    'Latest GPT models, selectable',
    'Image generation',
    'Voice emotion expressions',
  ],
  ultra: [
    `${SUBSCRIPTION_TIERS.ultra.creditsPerMonth.toLocaleString()} credits / month`,
    '100+ AI voices · 16 languages',
    'Latest GPT models, selectable',
    'Image generation',
    'Voice emotion expressions',
    'Early access to new features',
    'Priority AI processing',
    'Priority support',
  ],
};

interface PlanBlockProps {
  tier: 'pro' | 'plus' | 'ultra';
  isCurrent: boolean;
  onSelectPlan?: (tier: SubscriptionTier) => void;
}

export function PlanBlock({ tier, isCurrent, onSelectPlan }: PlanBlockProps) {
  const [loading, setLoading] = useState(false);
  const info = SUBSCRIPTION_TIERS[tier];
  const features = PLAN_FEATURES[tier];

  const handleSubscribe = async () => {
    if (onSelectPlan) {
      onSelectPlan(tier);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: tier }),
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
          <SubscriptionBadge tier={tier} size="lg" className="mb-0.5" />
          <p className="text-zinc-500 text-sm">
            ${info.priceMonthly}/month · {info.creditsPerMonth.toLocaleString()} credits
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-bold text-white">${info.priceMonthly}</span>
        <span className="text-zinc-500 text-sm">/ month</span>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((text, idx) => (
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
              Subscribe to {capitalizeTier(tier)}
              <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/** @deprecated Use PlanBlock instead */
export const ProPlanBlock = ({ isCurrent, onSelectPlan }: { isCurrent: boolean; onSelectPlan?: (tier: 'pro') => void }) => (
  <PlanBlock tier="pro" isCurrent={isCurrent} onSelectPlan={onSelectPlan ? () => onSelectPlan('pro') : undefined} />
);
