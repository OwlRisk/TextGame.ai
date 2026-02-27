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
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Toaster } from '@/app/components/ui/sonner';
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


/** Free：3 种 AI 语音 + 图片生成 */
const FREE_FEATURES = ['3 AI voices · 14 emotion expressions', 'Image generation'] as const;

/** Pro / Plus / Ultra 共用权益（仅 credits 数量不同） */
const PAID_FEATURES = [
  '113 AI voices · 16 languages · 14 emotions',
  'Image generation',
  'GPT-5.2 · GPT-4o · GPT-4 Turbo (selectable in Settings)',
] as const;

/** 14 emotion/sound tags supported by Inworld TTS */
const EMOTION_TAGS = [
  { tag: 'angry',       emoji: '😠', type: 'emotion' },
  { tag: 'happy',       emoji: '😊', type: 'emotion' },
  { tag: 'sad',         emoji: '😢', type: 'emotion' },
  { tag: 'surprised',   emoji: '😲', type: 'emotion' },
  { tag: 'fearful',     emoji: '😨', type: 'emotion' },
  { tag: 'disgusted',   emoji: '🤢', type: 'emotion' },
  { tag: 'laughing',    emoji: '😂', type: 'style'   },
  { tag: 'whispering',  emoji: '🤫', type: 'style'   },
  { tag: 'cough',       emoji: '😮‍💨', type: 'sound'   },
  { tag: 'sigh',        emoji: '😮',  type: 'sound'   },
  { tag: 'laugh',       emoji: '😄', type: 'sound'   },
  { tag: 'breathe',     emoji: '💨', type: 'sound'   },
  { tag: 'clear_throat',emoji: '😤', type: 'sound'   },
  { tag: 'yawn',        emoji: '🥱', type: 'sound'   },
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

function EmotionTagsPreview() {
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
        Voice emotion expressions
      </p>
      <div className="flex flex-wrap gap-1">
        {EMOTION_TAGS.map(({ tag, emoji, type }) => (
          <span
            key={tag}
            title={type === 'emotion' ? 'Emotion' : type === 'style' ? 'Delivery style' : 'Sound effect'}
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono border ${
              type === 'emotion' ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' :
              type === 'style'   ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                   'bg-zinc-700/50 border-zinc-600/40 text-zinc-400'
            }`}
          >
            {emoji}&nbsp;[{tag}]
          </span>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600 mt-2">
        AI characters express these naturally during gameplay.
      </p>
    </div>
  );
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
  const [syncingPlan, setSyncingPlan] = useState(false);
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

  useEffect(() => {
    if (!session?.access_token) {
      setInitialLoading(false);
      return;
    }
    // Reset to true so the skeleton shows while data loads (prevents free-plan flash
    // when session resolves after the first render cycle).
    setInitialLoading(true);
    Promise.all([refreshTier(), refreshDetails()]).finally(() => {
      setInitialLoading(false);
    });
  }, [refreshTier, refreshDetails, session?.access_token]);

  // After Stripe redirect: fulfill subscription (retry when session loads late)
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    if (success !== 'true' || !sessionId || fulfillDoneRef.current) return;

    setSyncing(true); // show "Confirming…" while waiting or fulfilling

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
          const errMsg = data.error || `Sync failed (${res.status}). Try "Sync my plan" below.`;
          const hint = data.hint ? ` ${data.hint}` : '';
          toast.error(errMsg + hint);
          return false;
        }
        await Promise.all([refreshTier(), refreshDetails()]);
        return true;
      } catch (e) {
        toast.error('Could not confirm payment. Try "Sync my plan" below.');
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

    // Session not ready yet (common after redirect): retry every 2s up to 5 times
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
        toast.info('Still seeing Free? Click "Sync my plan" below to refresh from Stripe.');
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

  const handleSyncPlan = useCallback(async () => {
    if (!session?.access_token) return;
    setSyncingPlan(true);
    try {
      const res = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      if (data.tier && data.tier !== 'free') {
        toast.success(`Synced. You're on ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}.`);
        await Promise.all([refreshTier(), refreshDetails()]);
      } else {
        toast.info('No active subscription found in Stripe.');
        await refreshTier();
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not sync plan.');
    } finally {
      setSyncingPlan(false);
    }
  }, [session?.access_token, refreshTier, refreshDetails]);

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
      toast.success(`Plan updated to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}. Proration applied.`);
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
                        <span className="text-sm font-medium text-zinc-200">{PLAN_PRICING[currentTier]?.price ?? ''}</span>
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
                      Update payment, change plan, or cancel in Stripe.
                    </p>
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
                      {/* Emotion tags preview */}
                      <div className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300 mb-2">AI voice emotions &amp; sounds</p>
                            <div className="flex flex-wrap gap-1.5">
                              {EMOTION_TAGS.map(({ tag, emoji, type }) => (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono border ${
                                    type === 'emotion' ? 'bg-violet-500/10 border-violet-500/25 text-violet-300' :
                                    type === 'style'   ? 'bg-blue-500/10 border-blue-500/25 text-blue-300' :
                                                         'bg-zinc-700/60 border-zinc-600/50 text-zinc-400'
                                  }`}
                                >
                                  <span>{emoji}</span>[{tag}]
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change plan: Pro / Plus / Ultra */}
                <div>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Change plan</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
                    {(['pro', 'plus', 'ultra'] as SubscriptionTier[]).map((tier) => {
                      const p = PLAN_PRICING[tier];
                      if (!p) return null;
                      const isCurrent = tier === currentTier;
                      const tierOrder: Record<string, number> = { free: 0, pro: 1, plus: 2, ultra: 3 };
                      const isUpgrade = (tierOrder[tier] ?? 0) > (tierOrder[currentTier] ?? 0);
                      const isDowngrade = (tierOrder[tier] ?? 0) < (tierOrder[currentTier] ?? 0);
                      const isChanging = changingTier === tier;
                      return (
                        <div
                          key={tier}
                          className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${
                            isCurrent ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-bold text-white">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                            <span className="text-sm text-zinc-400">{p.priceNum}/mo</span>
                          </div>
                          <p className="text-xs text-zinc-500">{p.credits}</p>
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
                                  Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </>
                              ) : isDowngrade ? (
                                <>
                                  <TrendingDown className="size-3.5 mr-1" />
                                  Downgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </>
                              ) : null}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* How plan changes work */}
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 max-w-4xl">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">How plan changes work</h3>
                    <ul className="space-y-2 text-sm text-zinc-300">
                      <li className="flex gap-2">
                        <span className="text-emerald-400 shrink-0 font-medium">Credits:</span>
                        <span>Your existing balance is kept. When upgrading, you immediately receive the new plan&apos;s full monthly credit allocation on top of your current balance.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400 shrink-0 font-medium">Billing date:</span>
                        <span>Your existing billing cycle and renewal date stay the same — plan changes take effect immediately but do not reset your billing date.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-400 shrink-0 font-medium">Proration:</span>
                        <span>Unused days on your current plan are credited against the new plan&apos;s charge. You pay only the prorated difference — no separate refund is issued to your card.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-400 shrink-0 font-medium">Downgrade:</span>
                        <span>Downgrades take effect at the end of the current billing period. You keep your current plan&apos;s access until then.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── FREE STATE：三档选一 ───── */}
          {!initialLoading && currentTier === 'free' && (
            <div className="flex flex-col">
              {/* 顶部标题与说明 */}
              <div className="px-6 md:px-10 pt-8 pb-6 border-b border-zinc-800/80">
                <div className="max-w-3xl">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Subscription
                  </h1>
                  <p className="text-zinc-400 text-sm md:text-base">
                    Start free with 6 voice roles and image generation. Upgrade for more voices, GPT-5.2, and monthly credits. Cancel anytime. If you upgrade later, your billing cycle resets from the upgrade day and unused time is credited toward the new plan.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSyncPlan}
                    disabled={syncingPlan || !session?.access_token}
                    className="mt-4 h-9 rounded-lg text-xs font-medium border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    {syncingPlan ? (
                      <>
                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                        Syncing…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="size-3.5 mr-1.5" />
                        Already subscribed? Sync plan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 四档：Free + Pro / Plus / Ultra */}
              <div className="px-6 md:px-10 py-8">
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
                      <p className="text-zinc-400 text-sm font-medium mt-2">No monthly credits · basic features</p>
                    </div>
                    <ul className="p-6 space-y-3 flex-1">
                      {FREE_FEATURES.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                      <li className="pt-1">
                        <EmotionTagsPreview />
                      </li>
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
                    const isPopular = tier === 'plus';
                    return (
                      <div
                        key={tier}
                        className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-colors ${
                          isPopular
                            ? 'border-violet-500/60 bg-zinc-900/90 shadow-lg shadow-violet-500/10'
                            : 'border-zinc-800 bg-zinc-900/80 hover:border-violet-500/50'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 right-0 rounded-bl-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white">
                            Popular
                          </div>
                        )}
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
                            <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                          <li className="pt-1">
                            <EmotionTagsPreview />
                          </li>
                        </ul>
                        <div className="p-6 pt-0">
                          <Button
                            onClick={() => handleUpgrade(tier)}
                            disabled={loading || syncing}
                            className="w-full h-11 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
                          >
                            {syncing ? (
                              'Syncing…'
                            ) : loadingTier === tier ? (
                              <>
                                <RefreshCw className="size-4 mr-1.5 animate-spin" />
                                Processing…
                              </>
                            ) : (
                              <>
                                Get {tier.charAt(0).toUpperCase() + tier.slice(1)} <ArrowRight className="size-4 ml-1" />
                              </>
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
