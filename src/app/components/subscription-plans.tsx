'use client';

import { useState } from 'react';
import { Check, X, Star, Zap, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SubscriptionBadge } from '@/app/components/subscription-badge';
import type { SubscriptionTier } from '@/lib/subscription';

interface SubscriptionPlansProps {
  currentTier?: SubscriptionTier;
  onSelectPlan?: (tier: 'pro') => void;
  /** 在订阅页使用时为 false，由页面提供 header */
  showTitle?: boolean;
}

export function SubscriptionPlans({ currentTier = 'free', onSelectPlan, showTitle = true }: SubscriptionPlansProps) {
  const [loadingTier, setLoadingTier] = useState<'pro' | null>(null);

  const plans: Array<{
    tier: SubscriptionTier;
    name: string;
    tagline: string;
    price: number;
    credits: number;
    icon: typeof Zap;
    features: { text: string; included: boolean }[];
    gradient: string;
    popular?: boolean;
  }> = [
    {
      tier: 'free',
      name: 'Free',
      tagline: 'Get started',
      price: 0,
      credits: 0,
      icon: Zap,
      gradient: 'from-zinc-500 to-zinc-600',
      features: [
        { text: 'GPT-4o-mini only', included: true },
        { text: 'Limited context window', included: true },
        { text: 'Basic gameplay', included: true },
        { text: 'GPT-5.2', included: false },
        { text: 'Extended context & memory', included: false },
      ],
    },
    {
      tier: 'pro',
      name: 'Pro',
      tagline: '$20/month',
      price: 20,
      credits: 20,
      icon: Star,
      gradient: 'from-blue-500 to-cyan-500',
      popular: true,
      features: [
        { text: 'GPT-5.2', included: true },
        { text: 'Larger context & memory cache', included: true },
        { text: '20 Credits per month', included: true },
        { text: 'Priority support', included: true },
      ],
    },
  ];

  const handleSelect = async (tier: 'pro') => {
    if (onSelectPlan) {
      onSelectPlan(tier);
      return;
    }
    setLoadingTier(tier);
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
      setLoadingTier(null);
    }
  };

  return (
    <div className={showTitle ? 'py-8' : ''}>
      {showTitle && (
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">plan</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Subscribe for monthly usage. Upgrade or cancel anytime.
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto ${showTitle ? 'mb-10' : ''}`}>
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentTier === plan.tier;

          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl p-5 md:p-6 transition-all duration-300 border-2 ${
                plan.popular
                  ? 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/20 scale-[1.02]'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Flame className="size-3" />
                    POPULAR
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-2 right-3">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                </div>
              )}

              <div className="flex justify-center mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${plan.gradient} opacity-90`}>
                  <Icon className="size-7 text-white" />
                </div>
              </div>
              <div className="text-center mb-2">
                <SubscriptionBadge tier={plan.tier} size="lg" className="mb-1" />
                <p className="text-xs text-zinc-500">{plan.tagline}</p>
              </div>
              <div className="text-center mb-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-zinc-400 text-sm">/mo</span>}
                </div>
                {plan.credits > 0 && (
                  <div className="mt-1 inline-block px-2 py-0.5 bg-zinc-800 rounded-full">
                    <span className="text-xs font-medium text-zinc-300">{plan.credits} Credits/mo</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {f.included ? (
                      <div className="mt-0.5 size-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="size-2.5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="mt-0.5 size-4 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                        <X className="size-2.5 text-zinc-500" />
                      </div>
                    )}
                    <span className={`text-sm ${f.included ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.tier === 'free' ? (
                <Button disabled className="w-full rounded-xl bg-zinc-800 text-zinc-500 cursor-not-allowed">
                  Free Forever
                </Button>
              ) : isCurrent ? (
                <Button disabled className="w-full rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelect(plan.tier as 'pro')}
                  disabled={loadingTier !== null}
                  className={`w-full rounded-xl font-semibold bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white border-0`}
                >
                  {loadingTier === plan.tier ? (
                    <>Processing…</>
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <h4 className="font-semibold text-white mb-2">Credits & usage</h4>
          <p className="text-zinc-400 text-sm">
            Credits are consumed by AI chat, voice, and images. Unused credits roll over each month. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
