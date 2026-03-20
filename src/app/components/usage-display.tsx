'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export interface UsageBalance {
  tokens: number;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
}

interface UsageDisplayProps {
  compact?: boolean;
  refreshKey?: number | string;
}

/** Display usage balance; click to navigate to /usage */
export function UsageDisplay({ compact = false, refreshKey }: UsageDisplayProps) {
  const [balance, setBalance] = useState<UsageBalance | null>(null);
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
      console.error('Failed to fetch usage balance:', error);
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

  const node = (
    <span className="flex items-center gap-1.5 text-zinc-100">
      <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
      <span className="font-semibold tabular-nums">{balance.tokens.toLocaleString()}</span>
      {!compact && <span className="text-sm text-zinc-500">credits</span>}
    </span>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => router.push('/usage')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
        aria-label="View usage"
      >
        {node}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
      {node}
    </div>
  );
}
