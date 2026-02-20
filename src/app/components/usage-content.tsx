'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';

interface Transaction {
  id: string;
  amount: number;
  transactionType: string;
  description: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof ArrowUpRight; color: string; bgColor: string; prefix: string }
> = {
  spending: { label: 'Spending', icon: ArrowUpRight, color: 'text-red-400', bgColor: 'bg-red-500/10', prefix: '-' },
  topup: { label: 'Top-up', icon: Plus, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', prefix: '+' },
  subscription_grant: { label: 'Subscription', icon: RefreshCw, color: 'text-blue-400', bgColor: 'bg-blue-500/10', prefix: '+' },
  purchase: { label: 'Purchase', icon: Plus, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', prefix: '+' },
  default: { label: 'Transaction', icon: Activity, color: 'text-zinc-400', bgColor: 'bg-zinc-500/10', prefix: '' },
};

function getTypeConfig(tx: Transaction) {
  if (tx.amount > 0) {
    if (tx.transactionType === 'subscription_grant') return TYPE_CONFIG.subscription_grant;
    if (tx.transactionType === 'purchase') return TYPE_CONFIG.purchase;
    return TYPE_CONFIG.topup;
  }
  return TYPE_CONFIG.spending;
}

function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function UsageContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [balance, setBalance] = useState<{ tokens: number; isPro: boolean } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!session?.access_token) {
      setLoadingBalance(false);
      setLoadingTx(false);
      return;
    }
    const headers = { Authorization: `Bearer ${session.access_token}` };
    fetch('/api/user/balance', { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBalance(data))
      .catch(() => setBalance(null))
      .finally(() => setLoadingBalance(false));
    fetch('/api/user/transactions?limit=50', { headers })
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoadingTx(false));
  }, [session?.access_token]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const spendingRecords = transactions.filter((r) => r.amount < 0);
    const weekSpent = spendingRecords
      .filter((r) => new Date(r.createdAt) >= startOfWeek)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const monthSpent = spendingRecords
      .filter((r) => new Date(r.createdAt) >= startOfMonth)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const chartData: { date: string; spent: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const daySpent = spendingRecords
        .filter((r) => {
          const t = new Date(r.createdAt);
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, r) => sum + Math.abs(r.amount), 0);
      chartData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spent: daySpent,
      });
    }
    return { weekSpent, monthSpent, chartData, totalSpent: spendingRecords.reduce((s, r) => s + Math.abs(r.amount), 0) };
  }, [transactions]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0a0a] min-h-0 overflow-y-auto">
        <div className="p-6 text-zinc-400 text-center">Sign in to view your usage.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-h-0 overflow-y-auto">
      {/* Header - 与参考一致 */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
            <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Usage & Spending</h1>
            <p className="text-xs text-zinc-500">Track your credit usage</p>
          </div>
        </div>
      </div>

      {/* Stats Overview - 与参考一致 */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-6 flex-shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-sm">Spending Trend</h3>
                <p className="text-xs text-zinc-500">Last 7 days</p>
              </div>
            </div>
            {stats.totalSpent > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value: number) => [value, 'Spent']}
                  />
                  <Bar dataKey="spent" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingDown className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No spending data yet</p>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Available</span>
              </div>
              {loadingBalance ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : balance?.isPro ? (
                <div className="text-2xl font-bold text-amber-400">Pro</div>
              ) : balance ? (
                <>
                  <div className="text-3xl font-black text-white mb-1 tabular-nums">
                    {balance.tokens.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500">usage</div>
                </>
              ) : (
                <div className="text-zinc-400 text-sm">—</div>
              )}
              <div className="mt-3">
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                  <Link href="/recharge">
                    <Plus className="h-3 w-3 mr-1" />
                    Top up
                  </Link>
                </Button>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs font-semibold text-zinc-400">Last 7 Days</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{stats.weekSpent.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 mt-1">Spent</div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-semibold text-zinc-400">Last 30 Days</span>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.monthSpent.toLocaleString()}</div>
        </div>
      </div>

      {/* Transaction List - 与参考一致样式 */}
      <div className="flex-1 px-6 py-4 min-h-0">
        {loadingTx ? (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading…</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
              <DollarSign className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-1">No transactions found</p>
            <p className="text-zinc-600 text-sm mb-4">Your transaction history will appear here</p>
            <Button asChild variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
              <Link href="/recharge">Top up</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((record, index) => {
              const typeConfig = getTypeConfig(record);
              const Icon = typeConfig.icon;
              const isCredit = record.amount > 0;
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-sm mb-1">
                            {record.description || record.transactionType}
                          </h3>
                        </div>
                        <div className={`text-xl font-bold tabular-nums ${typeConfig.color}`}>
                          {typeConfig.prefix}
                          {Math.abs(record.amount).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${typeConfig.bgColor}`}>
                          <span className={`font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                        </div>
                        <span className="text-zinc-600">•</span>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(record.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
