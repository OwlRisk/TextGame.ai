'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Star,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import type { SubscriptionTier } from '@/lib/subscription';

interface SubscriptionDetails {
  tier: 'free' | 'pro' | 'plus' | 'ultra';
  status: string;
  subscriptionId: string | null;
  subscribedAt: string | null;
  renewalAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  canManageBilling: boolean;
}

function formatDate(dateText: string | null): string {
  if (!dateText) return '—';
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}


/** Free：6 种角色语音 + 图片生成 */
const FREE_FEATURES = ['6 voice roles', 'Image generation'] as const;

/** Pro / Plus / Ultra 共用权益（仅 credits 数量不同） */
const PAID_FEATURES = [
  'More voice roles',
  'Image generation',
  'GPT-5.2 and other models',
  'Unlimited GPT-4o mini',
] as const;

const PLAN_PRICING: Record<string, { price: string; priceNum: string; credits: string; creditsNum: number }> = {
  pro: { price: '$20 / month', priceNum: '$20', credits: '2,000 credits / month', creditsNum: 2000 },
  plus: { price: '$60 / month', priceNum: '$60', credits: '6,000 credits / month', creditsNum: 6000 },
  ultra: { price: '$200 / month', priceNum: '$200', credits: '40,000 credits / month', creditsNum: 40000 },
};

function getPlanFeatures(tier: string): string[] {
  const credits = PLAN_PRICING[tier]?.credits ?? '';
  return [credits, ...PAID_FEATURES];
}

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const fulfillDoneRef = useRef(false);

  const refreshTier = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/user/balance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = res.ok ? await res.json() : null;
      const status = data?.subscriptionStatus ?? 'free';
      setCurrentTier(status === 'cancelled' ? 'free' : (status as SubscriptionTier));
    } catch {
      setCurrentTier('free');
    }
  }, [session?.access_token]);

  const refreshDetails = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/stripe/subscription-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
        credentials: 'include',
      });
      const data = res.ok ? await res.json() : null;
      setDetails(data);
    } catch {
      setDetails(null);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    Promise.all([refreshTier(), refreshDetails()]).finally(() => {
      setInitialLoading(false);
    });
  }, [refreshTier, refreshDetails, session?.access_token]);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    if (success !== 'true' || !sessionId || !session?.access_token || fulfillDoneRef.current) return;

    fulfillDoneRef.current = true;
    setSyncing(true);
    fetch('/api/stripe/fulfill-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, accessToken: session.access_token }),
      credentials: 'include',
    })
      .then(async () => { await Promise.all([refreshTier(), refreshDetails()]); })
      .catch(() => { void Promise.all([refreshTier(), refreshDetails()]); })
      .finally(() => {
        setSyncing(false);
        window.history.replaceState({}, '', '/subscription');
      });
  }, [searchParams, session?.access_token, refreshTier, refreshDetails]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: tier, accessToken: session?.access_token }),
        credentials: 'include',
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

  const handleManageBilling = async () => {
    if (!session?.access_token) return;
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Failed to open billing portal');
    } catch (e) {
      console.error(e);
    } finally {
      setOpeningPortal(false);
    }
  };

  const isCancelled = !!details?.cancelAtPeriodEnd;
  const renewalLabel = isCancelled ? 'Access until' : 'Next renewal';

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a] flex flex-col">
        {/* top bar */}
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

        <div className="flex-1 min-h-0 overflow-auto">

          {/* ───── LOADING STATE ───── */}
          {initialLoading && (
            <div className="h-full flex flex-col animate-pulse">
              <div className="flex-shrink-0 px-6 md:px-10 py-8 border-b border-zinc-800/80 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-zinc-800" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-24 rounded bg-zinc-800" />
                  <div className="h-3.5 w-36 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 px-6 md:px-10 py-8">
                <div className="flex flex-col gap-3">
                  <div className="h-3 w-16 rounded bg-zinc-800" />
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="h-3.5 w-28 rounded bg-zinc-800" />
                        <div className="h-3.5 w-20 rounded bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="h-3 w-28 rounded bg-zinc-800" />
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-4">
                        <div className="size-4 rounded-full bg-zinc-800" />
                        <div className="h-3.5 w-40 rounded bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── PAID STATE ───── */}
          {!initialLoading && ['pro', 'plus', 'ultra'].includes(currentTier) && (
            <div className="h-full flex flex-col">
              {/* top hero strip */}
              <div className="relative overflow-hidden flex-shrink-0 px-6 md:px-10 py-8 border-b border-zinc-800/80">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/5 to-transparent" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center shrink-0">
                      <Star className="size-6 text-violet-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-white">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan</h1>
                        {syncing ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <RefreshCw className="size-3 animate-spin" /> Syncing…
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isCancelled ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            <span className={`size-1.5 rounded-full ${isCancelled ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            {isCancelled ? 'Cancels at period end' : 'Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-sm mt-0.5">{PLAN_PRICING[currentTier]?.price ?? ''} · {PLAN_PRICING[currentTier]?.credits ?? ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* cancel warning */}
              {isCancelled && details?.cancelAt && (
                <div className="flex-shrink-0 mx-6 md:mx-10 mt-5 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-sm text-amber-300">
                  Your subscription ends on <strong>{formatDate(details.cancelAt)}</strong>. You keep full access until then.
                </div>
              )}

              {/* main grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 px-6 md:px-10 py-6 md:py-8 min-h-0">
                {/* billing details */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Billing</h2>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <CalendarDays className="size-4 shrink-0" />
                        Subscribed on
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{formatDate(details?.subscribedAt ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <RefreshCw className="size-4 shrink-0" />
                        {renewalLabel}
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{formatDate(details?.renewalAt ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <Zap className="size-4 shrink-0" />
                        Amount
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{PLAN_PRICING[currentTier]?.price ?? ''}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleManageBilling}
                    disabled={openingPortal || syncing || !details?.canManageBilling}
                    className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm"
                  >
                    {openingPortal ? 'Opening…' : 'Cancel plan'}
                  </Button>
                </div>

                {/* features */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Included in {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</h2>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                    {getPlanFeatures(currentTier).map((f) => (
                      <div key={f} className="flex items-center gap-3 px-5 py-4">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        <span className="text-sm text-zinc-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── FREE STATE：三档选一 ───── */}
          {!initialLoading && currentTier === 'free' && (
            <div className="h-full flex flex-col">
              {/* 顶部标题与说明 */}
              <div className="flex-shrink-0 px-6 md:px-10 pt-8 pb-6 border-b border-zinc-800/80">
                <div className="max-w-3xl">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Subscription
                  </h1>
                  <p className="text-zinc-400 text-sm md:text-base">
                    Free: 6 voice roles and image generation. Pro and above: more voices, GPT-5.2 and other models. Cancel anytime.
                  </p>
                </div>
              </div>

              {/* 四档：Free + Pro / Plus / Ultra */}
              <div className="flex-1 overflow-auto px-6 md:px-10 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {/* Free 档 */}
                  <div className="flex flex-col rounded-2xl border-2 border-zinc-700 bg-zinc-900/80 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        Free
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold text-white">$0</span>
                        <span className="text-zinc-500 text-sm">/ month</span>
                      </div>
                      <p className="text-zinc-400 text-sm font-medium mt-2">No credits · use as you go</p>
                    </div>
                    <ul className="p-6 space-y-3 flex-1">
                      {FREE_FEATURES.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="p-6 pt-0">
                      <div className="w-full h-11 rounded-xl flex items-center justify-center text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Current plan
                      </div>
                    </div>
                  </div>
                  {/* Pro / Plus / Ultra */}
                  {(['pro', 'plus', 'ultra'] as SubscriptionTier[]).map((tier) => {
                    const p = PLAN_PRICING[tier];
                    if (!p) return null;
                    return (
                      <div
                        key={tier}
                        className="flex flex-col rounded-2xl border-2 border-zinc-800 bg-zinc-900/80 overflow-hidden hover:border-violet-500/50 transition-colors"
                      >
                        <div className="p-6 border-b border-zinc-800">
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            {tier}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-bold text-white">{p.priceNum}</span>
                            <span className="text-zinc-500 text-sm">/ month</span>
                          </div>
                          <p className="text-violet-300/90 text-sm font-medium mt-2">{p.credits}</p>
                        </div>
                        <ul className="p-6 space-y-3 flex-1">
                          {PAID_FEATURES.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="p-6 pt-0">
                          <Button
                            onClick={() => handleUpgrade(tier)}
                            disabled={loading || syncing}
                            className="w-full h-11 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
                          >
                            {syncing ? 'Syncing…' : loading ? 'Processing…' : (
                              <>Get {tier.charAt(0).toUpperCase() + tier.slice(1)} <ArrowRight className="size-4 ml-1" /></>
                            )}
                          </Button>
                          <p className="text-center text-xs text-zinc-600 mt-3">Secured by Stripe</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
  );
}

function SubscriptionFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] text-zinc-500 text-sm">
      Loading…
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionFallback />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
