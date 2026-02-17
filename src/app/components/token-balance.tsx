'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Coins, Crown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Balance {
  tokens: number;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
}

export function TokenBalance() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/user/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="flex items-center gap-3">
      {balance.isPro ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-white font-medium shadow-md">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-semibold">Pro - Unlimited</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {balance.tokens.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">coins</span>
        </div>
      )}
      
      <Button 
        size="sm" 
        onClick={() => router.push('/recharge')}
        variant={balance.isPro ? "outline" : "default"}
        className={balance.isPro ? "" : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"}
      >
        {balance.isPro ? 'Manage' : 'Get coins'}
      </Button>
    </div>
  );
}
