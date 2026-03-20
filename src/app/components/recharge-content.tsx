'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Shield, Infinity, MessageSquare } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { setAuthCookie } from '@/lib/auth-cookie';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus: number;
  perCredit: string;
  badge?: string;
}

const PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Try it out',
    price: 5,
    credits: 500,
    bonus: 0,
    perCredit: '$0.010',
  },
  {
    id: 'popular',
    name: 'Most popular',
    price: 10,
    credits: 1000,
    bonus: 200,
    perCredit: '$0.008',
    badge: 'Best value',
  },
  {
    id: 'power',
    name: 'Power user',
    price: 25,
    credits: 2500,
    bonus: 750,
    perCredit: '$0.008',
  },
  {
    id: 'ultimate',
    name: 'Go all in',
    price: 50,
    credits: 5000,
    bonus: 2000,
    perCredit: '$0.007',
  },
];

const FEATURES = [
  { icon: MessageSquare, text: 'Every AI message, voice, and image' },
  { icon: Infinity, text: 'Credits never expire' },
  { icon: Shield, text: 'No subscription, no recurring charges' },
] as const;

export function RechargeContent() {
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState('popular');
  const [isProcessing, setIsProcessing] = useState(false);
  const fulfillDoneRef = useRef(false);
  const balanceFetchingRef = useRef(false);

  const selected = PACKAGES.find((p) => p.id === selectedId) ?? PACKAGES[1];
  const totalCredits = selected.credits + selected.bonus;

  const fetchBalance = useCallback(() => {
    if (!session?.access_token) return;
    if (balanceFetchingRef.current) return;
    balanceFetchingRef.current = true;
    fetch('/api/user/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session.access_token }),
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data != null) setBalance(data.tokens ?? 0);
      })
      .catch(() => {})
      .finally(() => {
        balanceFetchingRef.current = false;
      });
  }, [session?.access_token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchBalance();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchBalance]);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    if (success !== 'true' || !sessionId || !session?.access_token || fulfillDoneRef.current) return;
    fulfillDoneRef.current = true;
    fetch('/api/stripe/fulfill-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, accessToken: session.access_token }),
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.credited || data.tokens) {
          trackEvent('purchase', { checkout_type: 'recharge' });
          return fetch('/api/user/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: session.access_token }),
            credentials: 'include',
          }).then((r) => (r.ok ? r.json() : { tokens: 0 }));
        }
      })
      .then((b) => {
        if (b != null) setBalance(b.tokens ?? 0);
        window.history.replaceState({}, '', '/recharge');
        setTimeout(() => fetchBalance(), 2000);
      })
      .catch(() => {
        window.history.replaceState({}, '', '/recharge');
        fetchBalance();
      });
  }, [searchParams, session?.access_token, fetchBalance]);

  const redirectToSignIn = () => {
    window.location.href = '/signin?returnUrl=' + encodeURIComponent('/recharge');
  };

  const handlePurchase = async () => {
    if (!user) {
      redirectToSignIn();
      return;
    }
    let freshSession: { access_token?: string } | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      freshSession = data.session;
    } catch {}
    const accessToken = freshSession?.access_token ?? session?.access_token;
    if (!accessToken) {
      alert('Your session has expired. Please sign in again.');
      redirectToSignIn();
      return;
    }
    setAuthCookie(accessToken);
    setIsProcessing(true);
    trackEvent('begin_checkout', {
      item_name: selected.name,
      checkout_type: 'recharge',
      value: selected.price,
    });
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selected.id, accessToken }),
        credentials: 'include',
      });
      const text = await response.text();
      if (response.headers.get('X-Auth-Result') === 'no-user' || /Unauthorized/i.test(text)) {
        redirectToSignIn();
        return;
      }
      let data: { url?: string; error?: string; details?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        alert('Payment failed');
        return;
      }
      if (response.ok && typeof data?.url === 'string' && data.url) {
        window.location.href = data.url;
        return;
      }
      const msg = [data?.error, data?.details].filter(Boolean).join(' — ') || 'Payment failed';
      alert(msg);
    } catch {
      alert('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-5 py-10 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Buy credits
          </h1>
          <p className="text-zinc-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Pay as you go. No subscription needed.
            {balance !== null && (
              <span className="block mt-2 text-sm text-zinc-400">
                You have <span className="text-white font-semibold tabular-nums">{balance.toLocaleString()}</span> credits
              </span>
            )}
          </p>
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {PACKAGES.map((pkg) => {
            const isActive = selectedId === pkg.id;
            const total = pkg.credits + pkg.bonus;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedId(pkg.id)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 sm:p-6 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {pkg.name}
                </span>

                <span className="text-3xl sm:text-4xl font-black text-white mb-1">
                  ${pkg.price}
                </span>

                <span className="text-lg sm:text-xl font-bold text-zinc-200 tabular-nums mb-1">
                  {total.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500">
                  credits{pkg.bonus > 0 && (
                    <span className="text-emerald-400 ml-1">+{pkg.bonus.toLocaleString()} bonus</span>
                  )}
                </span>

                <div className="mt-auto pt-4">
                  {isActive ? (
                    <div className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-semibold">
                      <Check className="h-3.5 w-3.5" /> Selected
                    </div>
                  ) : (
                    <div className="h-8 rounded-lg border border-zinc-700/60 flex items-center justify-center text-zinc-500 text-xs font-medium">
                      Select
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Purchase button */}
        <div className="mb-12">
          <button
            type="button"
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Buy {totalCredits.toLocaleString()} credits for ${selected.price}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-zinc-600 mt-3">
            Secured by Stripe · Instant delivery · No recurring charges
          </p>
        </div>

        {/* What credits cover */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">
            What credits cover
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <span className="text-sm text-zinc-300 leading-snug pt-1">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">
            Common questions
          </h2>
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="font-medium text-zinc-200 mb-1">How are credits used?</dt>
              <dd className="text-zinc-500 leading-relaxed">
                Every AI interaction costs a small number of credits — messages, character voices, and image generation. You can see exact costs in <Link href="/usage" className="text-violet-400 hover:underline">Usage</Link>.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-200 mb-1">Do credits expire?</dt>
              <dd className="text-zinc-500 leading-relaxed">
                No. Credits stay in your account until you use them.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-200 mb-1">Can I buy more later?</dt>
              <dd className="text-zinc-500 leading-relaxed">
                Yes. Come back anytime and add more credits to your balance.
              </dd>
            </div>
          </dl>
        </div>

        {/* Spacer at the bottom for mobile scroll */}
        <div className="h-8" />
      </div>
    </div>
  );
}
