'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Coins, Crown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export interface Balance {
  tokens: number;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
}

interface TokenBalanceProps {
  /** compact: icon + count only, clickable to navigate to recharge; used in top bar / user menu */
  compact?: boolean;
  /** External refresh trigger (e.g. after returning from recharge page) */
  refreshKey?: number | string;
}

export function TokenBalance({ compact = false, refreshKey }: TokenBalanceProps) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();

  const fetchBalance = useCallback(async () => {
    if (!session?.access_token) {
      setBalance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/balance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      } else {
        setBalance(null);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshKey]);

  if (!session) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!balance) return null;

  const tierLabel = balance.subscriptionStatus === 'ultra' ? 'Ultra' : balance.subscriptionStatus === 'plus' ? 'Plus' : 'Pro';
  const balanceNode = balance.isPro ? (
    <span className="flex items-center gap-1.5 text-amber-400">
      <Crown className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">{tierLabel}</span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-zinc-100">
      <Coins className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="font-semibold tabular-nums">{balance.tokens.toLocaleString()}</span>
      {!compact && <span className="text-sm text-zinc-500">coins</span>}
    </span>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => router.push('/subscription')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
        aria-label="View balance and subscription"
      >
        {balanceNode}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
        {balanceNode}
      </div>
      <Button
        size="sm"
        onClick={() => router.push('/subscription')}
        variant={balance.isPro ? 'outline' : 'default'}
        className={balance.isPro ? '' : 'bg-amber-500 hover:bg-amber-600 text-zinc-900 border-0'}
      >
        {balance.isPro ? 'Manage' : 'Subscribe'}
      </Button>
    </div>
  );
}
