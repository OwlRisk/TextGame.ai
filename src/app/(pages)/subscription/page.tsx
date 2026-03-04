'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Star,
  Zap,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Toaster } from '@/app/components/ui/sonner';
import {
  SUBSCRIPTION_TIERS,
  TIER_ORDER,
  capitalizeTier,
  type SubscriptionTier,
} from '@/lib/subscription';

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
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
}

const FREE_FEATURES = ['Full feature access', 'No monthly credit refill', 'Buy credits as needed'] as const;

const PAID_FEATURES = [
  '100+ AI voices · 16 languages',
  'Latest GPT models, selectable',
  'Image generation',
  'Voice emotion expressions',
] as const;

const ULTRA_EXCLUSIVE_FEATURES = [
  { text: 'Early access to new features', highlight: true },
  { text: 'Priority AI processing', highlight: true },
  { text: 'Priority support', highlight: true },
] as const;

type PaidTier = 'pro' | 'plus' | 'ultra';

interface PlanStyle {
  badge?: string;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  badgeGradient?: string;
}

const PLAN_STYLES: Record<PaidTier, PlanStyle> = {
  pro:   { badge: 'Best value', accentFrom: 'from-violet-500', accentTo: 'to-violet-600', borderColor: 'border-violet-500/50', badgeGradient: 'from-violet-500 to-violet-600' },
  plus:  { badge: 'Popular',    accentFrom: 'from-fuchsia-500', accentTo: 'to-purple-600', borderColor: 'border-fuchsia-500/60', badgeGradient: 'from-fuchsia-500 to-purple-600' },
  ultra: {                       accentFrom: 'from-amber-500', accentTo: 'to-orange-500', borderColor: 'border-amber-500/40' },
};

function getPlanPrice(tier: PaidTier): string {
  return `$${SUBSCRIPTION_TIERS[tier].priceMonthly}`;
}

function getPlanCreditsLabel(tier: PaidTier): string {
  return `${SUBSCRIPTION_TIERS[tier].creditsPerMonth.toLocaleString()} credits / month`;
}

function getPlanFeatures(tier: PaidTier): string[] {
  return [getPlanCreditsLabel(tier), ...PAID_FEATURES];
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
  const [credits, setCredits] = useState<number | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [changingTier, setChangingTier] = useState<SubscriptionTier | null>(null);
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
      if (typeof data?.tokens === 'number') setCredits(data.tokens);
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

  const handleSyncPlan = useCallback(async () => {
    if (!session?.access_token) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Sync failed');
      }
      await Promise.all([refreshTier(), refreshDetails()]);
      toast.success('Subscription synced successfully.');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [session?.access_token, refreshTier, refreshDetails]);

  useEffect(() => {
    if (!session?.access_token) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    Promise.all([refreshTier(), refreshDetails()]).finally(() => {
      setInitialLoading(false);
    });
  }, [refreshTier, refreshDetails, session?.access_token]);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    if (success !== 'true' || !sessionId || fulfillDoneRef.current) return;

    setSyncing(true);

    const doFulfill = async () => {
      if (!session?.access_token) return false;
      try {
        const res = await fetch('/api/stripe/fulfill-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, accessToken: session.access_token }),
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = data.error || `Sync failed (${res.status}). Click "Sync my plan" to retry.`;
          const hint = data.hint ? ` ${data.hint}` : '';
          toast.error(errMsg + hint);
          return false;
        }
        await Promise.all([refreshTier(), refreshDetails()]);
        return true;
      } catch {
        toast.error('Could not confirm payment. Click "Sync my plan" to retry.');
        return false;
      } finally {
        setSyncing(false);
      }
    };

    if (session?.access_token) {
      fulfillDoneRef.current = true;
      doFulfill().then((ok) => {
        if (ok) window.history.replaceState({}, '', '/subscription');
      });
      return;
    }

    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      if (session?.access_token) {
        clearInterval(id);
        fulfillDoneRef.current = true;
        doFulfill().then((ok) => {
          if (ok) window.history.replaceState({}, '', '/subscription');
        });
        return;
      }
      if (attempts >= 5) {
        clearInterval(id);
        setSyncing(false);
        toast.info('Still seeing Free? Click "Sync my plan" to refresh from Stripe.');
      }
    }, 2000);
    return () => clearInterval(id);
  }, [searchParams, session?.access_token, refreshTier, refreshDetails]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!session?.access_token) {
      toast.error('Please sign in to subscribe');
      router.push('/signin');
      return;
    }
    setLoadingTier(tier);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: tier, accessToken: session.access_token }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      const msg = data.error || 'Failed to create checkout';
      const detail = data.details ? ` ${data.details}` : '';
      toast.error(msg + detail);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingTier(null);
    }
  };

  const handleChangePlan = async (targetTier: SubscriptionTier) => {
    if (!session?.access_token || targetTier === currentTier) return;
    setChangingTier(targetTier);
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier, accessToken: session.access_token }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change plan');
      toast.success(`Plan updated to ${capitalizeTier(targetTier)}. Proration applied.`);
      await Promise.all([refreshTier(), refreshDetails()]);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not change plan. Try Manage subscription.');
    } finally {
      setChangingTier(null);
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
      toast.error(e instanceof Error ? e.message : 'Could not open billing. Please try again.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const isCancelled = !!details?.cancelAtPeriodEnd;
  const renewalLabel = isCancelled ? 'Access until' : 'Next renewal';
  const paidTier = currentTier as PaidTier;

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a] flex flex-col">
        <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 4000 }} />
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
            <div className="flex flex-col">
              {/* top hero strip */}
              <div className="relative overflow-hidden px-6 md:px-10 py-8 border-b border-zinc-800/80">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/5 to-transparent" />
                <div className="relative flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center shrink-0">
                    <Star className="size-6 text-violet-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-white">{capitalizeTier(currentTier)} plan</h1>
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
                    <p className="text-zinc-500 text-sm mt-0.5">{getPlanPrice(paidTier)} / month · {getPlanCreditsLabel(paidTier)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-10 py-8 flex flex-col gap-8">
                {/* cancel warning */}
                {isCancelled && details?.cancelAt && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-sm text-amber-300">
                    Your subscription ends on <strong>{formatDate(details.cancelAt)}</strong>. You keep full access until then.
                  </div>
                )}

                {/* billing + features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          <CreditCard className="size-4 shrink-0" />
                          Amount
                        </div>
                        <span className="text-sm font-medium text-zinc-200">{getPlanPrice(paidTier)} / month</span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                          <Zap className="size-4 shrink-0" />
                          Credits remaining
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${credits !== null && credits < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {credits !== null ? credits.toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleManageBilling}
                      disabled={openingPortal || syncing || !details?.canManageBilling}
                      className="w-full h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-sm font-medium"
                    >
                      {openingPortal ? (
                        <>Opening…</>
                      ) : (
                        <>
                          <CreditCard className="size-4 mr-2" />
                          Manage subscription
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-zinc-500 text-center -mt-2">
                      Update payment, change plan, or cancel via Manage subscription.
                    </p>
                  </div>

                  {/* features */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Included in {capitalizeTier(currentTier)}</h2>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                      {getPlanFeatures(paidTier).map((f) => (
                        <div key={f} className="flex items-center gap-3 px-5 py-4">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-zinc-300">{f}</span>
                        </div>
                      ))}
                      {currentTier === 'ultra' && ULTRA_EXCLUSIVE_FEATURES.map((f) => (
                        <div key={f.text} className="flex items-center gap-3 px-5 py-4">
                          <Star className="size-4 text-amber-400 shrink-0 fill-amber-400/30" />
                          <span className="text-sm text-amber-300/90">{f.text}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Change plan: Pro / Plus / Ultra */}
                <div>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Change plan</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
                    {(['pro', 'plus', 'ultra'] as PaidTier[]).map((tier) => {
                      const info = SUBSCRIPTION_TIERS[tier];
                      const isCurrent = tier === currentTier;
                      const isUpgrade = (TIER_ORDER[tier] ?? 0) > (TIER_ORDER[currentTier] ?? 0);
                      const isDowngrade = (TIER_ORDER[tier] ?? 0) < (TIER_ORDER[currentTier] ?? 0);
                      const isChanging = changingTier === tier;
                      return (
                        <div
                          key={tier}
                          className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${
                            isCurrent ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-bold text-white">{capitalizeTier(tier)}</span>
                            <span className="text-sm text-zinc-400">${info.priceMonthly}/mo</span>
                          </div>
                          <p className="text-xs text-zinc-500">{info.creditsPerMonth.toLocaleString()} credits / month</p>
                          {isCurrent ? (
                            <div className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Current plan
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleChangePlan(tier)}
                              disabled={!!changingTier || syncing}
                              variant="outline"
                              className={`w-full h-9 rounded-lg text-xs font-medium ${
                                isDowngrade
                                  ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                                  : 'border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                              }`}
                            >
                              {isChanging ? (
                                <>
                                  <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                                  Updating…
                                </>
                              ) : isUpgrade ? (
                                <>
                                  <ArrowRight className="size-3.5 mr-1" />
                                  Upgrade to {capitalizeTier(tier)}
                                </>
                              ) : isDowngrade ? (
                                <>
                                  <TrendingDown className="size-3.5 mr-1" />
                                  Downgrade to {capitalizeTier(tier)}
                                </>
                              ) : null}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancel subscription shortcut */}
                  <div className="mt-4 max-w-4xl">
                    <button
                      onClick={handleManageBilling}
                      disabled={openingPortal || !details?.canManageBilling}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" />
                      Cancel subscription
                    </button>
                  </div>

                  {/* How plan changes work */}
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 max-w-4xl">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">How plan changes work</h3>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex gap-2">
                        <span className="text-emerald-400 shrink-0 font-medium">Upgrade:</span>
                        <span>Takes effect immediately. Your billing cycle resets, and you receive the new plan&apos;s full monthly credits on top of your existing balance. Unused days on the old plan are prorated as a credit.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400 shrink-0 font-medium">Downgrade:</span>
                        <span>Takes effect immediately. Your billing cycle stays the same, and unused time on the higher plan is prorated as a credit toward the new plan. No new credits are granted — your existing balance is kept.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400 shrink-0 font-medium">Proration:</span>
                        <span>Stripe calculates the prorated difference automatically — you only pay (or receive credit for) the remaining days in your billing period.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── FREE STATE ───── */}
          {!initialLoading && currentTier === 'free' && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-800/80">
                <div className="max-w-5xl">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Choose your plan</h1>
                  <p className="text-zinc-500 text-sm">Unlock the full experience — AI voices, powerful models, and monthly credits. Cancel anytime.</p>
                </div>
              </div>

              {/* Pricing cards */}
              <div className="px-6 md:px-10 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">

                  {/* Free */}
                  <div className="flex flex-col rounded-2xl border-2 border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
                    <div className="p-6">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Free</div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-black text-zinc-300">$0</span>
                        <span className="text-zinc-600 text-sm">/ mo</span>
                      </div>
                      <p className="text-zinc-600 text-xs mt-2">Start free · buy credits as you go</p>
                    </div>
                    <div className="px-6 pb-5 flex-1 flex flex-col">
                      <div className="h-px bg-zinc-800 mb-4" />
                      <ul className="space-y-2.5 flex-1 mb-5">
                        {FREE_FEATURES.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-zinc-500">
                            <CheckCircle2 className="size-3.5 text-zinc-600 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      <div className="w-full h-11 rounded-xl flex items-center justify-center text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        Current plan
                      </div>
                    </div>
                  </div>

                  {/* Pro / Plus / Ultra */}
                  {(['pro', 'plus', 'ultra'] as PaidTier[]).map((tier) => {
                    const info = SUBSCRIPTION_TIERS[tier];
                    const style = PLAN_STYLES[tier];
                    const hasBadge = !!style.badge;
                    return (
                      <div
                        key={tier}
                        className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-200 ${style.borderColor} bg-zinc-900 ${hasBadge ? 'shadow-xl shadow-fuchsia-500/10 scale-[1.02]' : 'hover:scale-[1.01]'}`}
                      >
                        {/* Badge */}
                        {style.badge && (
                          <div className="absolute top-0 inset-x-0 flex justify-center">
                            <div className={`bg-gradient-to-r ${style.badgeGradient} text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-b-lg`}>
                              {style.badge}
                            </div>
                          </div>
                        )}

                        <div className={`p-6 ${hasBadge ? 'pt-8' : ''}`}>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                            {tier}
                          </div>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-4xl font-black text-white">${info.priceMonthly}</span>
                            <span className="text-zinc-500 text-sm">/ mo</span>
                          </div>
                          {/* Credits highlight */}
                          <div className={`rounded-xl bg-gradient-to-r ${style.accentFrom} ${style.accentTo} p-px`}>
                            <div className="rounded-[11px] bg-zinc-900 px-3 py-2">
                              <div className="text-sm font-bold text-white tabular-nums">{info.creditsPerMonth.toLocaleString()} credits</div>
                              <div className="text-[11px] text-zinc-400 mt-0.5">renews monthly</div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-5 flex-1 flex flex-col">
                          <div className="h-px bg-zinc-800 mb-4" />
                          <ul className="space-y-2.5 flex-1 mb-5">
                            {PAID_FEATURES.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />{f}
                              </li>
                            ))}
                            {tier === 'ultra' && (
                              <>
                                <li className="flex items-center gap-2 pt-1">
                                  <div className="h-px flex-1 bg-amber-500/20" />
                                  <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-widest shrink-0">Ultra exclusive</span>
                                  <div className="h-px flex-1 bg-amber-500/20" />
                                </li>
                                {ULTRA_EXCLUSIVE_FEATURES.map((f) => (
                                  <li key={f.text} className="flex items-center gap-2 text-xs text-amber-300/90">
                                    <Star className="size-3.5 text-amber-400 shrink-0 fill-amber-400/30" />{f.text}
                                  </li>
                                ))}
                              </>
                            )}
                          </ul>
                          <Button
                            onClick={() => handleUpgrade(tier)}
                            disabled={loading || syncing}
                            className={`w-full h-11 rounded-xl text-sm font-bold bg-gradient-to-r ${style.accentFrom} ${style.accentTo} hover:opacity-90 text-white shadow-lg border-0`}
                          >
                            {syncing ? 'Syncing…' : loadingTier === tier ? (
                              <><RefreshCw className="size-4 mr-1.5 animate-spin" />Processing…</>
                            ) : (
                              <>Get {capitalizeTier(tier)}<ArrowRight className="size-4 ml-1.5" /></>
                            )}
                          </Button>
                          <p className="text-center text-[10px] text-zinc-600 mt-2.5">Secured by Stripe</p>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* Footer note */}
                <p className="text-center text-xs text-zinc-600 mt-4 max-w-xl mx-auto">
                  Cancel anytime · Unused credits carry over · Prorated billing when upgrading
                </p>
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
