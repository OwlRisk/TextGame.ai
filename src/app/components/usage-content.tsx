'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  MessageSquare,
  ImageIcon,
  Mic,
  Gamepad2,
  TrendingDown,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
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

// ─── Category mapping: actual DB transaction_type → display group ────────────
type CategoryKey = 'gameplay' | 'setup' | 'voice' | 'image';

const CATEGORY_GROUP: Record<string, CategoryKey> = {
  ai_chat:           'gameplay',
  ai_player_speak:   'gameplay',
  suggest_gm_replies:'gameplay',
  game_creation:     'setup',
  generate_players:  'setup',
  image_generation:  'image',
  tts:               'voice',
  transcription:     'voice',
};

const CATEGORY_META: Record<CategoryKey, {
  label: string;
  color: string;
  fill: string;
  Icon: typeof MessageSquare;
}> = {
  gameplay: { label: 'AI Gameplay',   color: 'text-violet-400',  fill: '#a855f7', Icon: MessageSquare },
  setup:    { label: 'Game Setup',    color: 'text-amber-400',   fill: '#f59e0b', Icon: Gamepad2 },
  voice:    { label: 'Voice',         color: 'text-sky-400',     fill: '#38bdf8', Icon: Mic },
  image:    { label: 'Avatars',       color: 'text-rose-400',    fill: '#fb7185', Icon: ImageIcon },
};

const ALL_CATEGORIES: CategoryKey[] = ['gameplay', 'setup', 'voice', 'image'];

function resolveCategory(type: string): CategoryKey {
  return CATEGORY_GROUP[type] ?? 'gameplay';
}

// ─── Transaction list config ─────────────────────────────────────────────────
const TX_DISPLAY: Record<string, { label: string; icon: typeof ArrowUpRight; color: string; bg: string; prefix: string }> = {
  spending:           { label: 'Spending',     icon: ArrowUpRight, color: 'text-red-400',     bg: 'bg-red-500/10',     prefix: '-' },
  topup:              { label: 'Top-up',       icon: Plus,         color: 'text-emerald-400', bg: 'bg-emerald-500/10', prefix: '+' },
  subscription_grant: { label: 'Subscription', icon: RefreshCw,    color: 'text-blue-400',    bg: 'bg-blue-500/10',    prefix: '+' },
  purchase:           { label: 'Purchase',     icon: Plus,         color: 'text-emerald-400', bg: 'bg-emerald-500/10', prefix: '+' },
  refund:             { label: 'Refund',       icon: RefreshCw,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', prefix: '+' },
};

function getTxDisplay(tx: Transaction) {
  if (tx.amount > 0) {
    return TX_DISPLAY[tx.transactionType] ?? TX_DISPLAY.topup;
  }
  return TX_DISPLAY.spending;
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const days = Math.floor(sec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  if (total === 0) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-zinc-400 mb-1.5">{label}</div>
      {payload.filter(p => p.value > 0).map((p) => {
        const meta = CATEGORY_META[p.dataKey as CategoryKey];
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta?.fill }} />
              <span className="text-zinc-300">{meta?.label ?? p.dataKey}</span>
            </span>
            <span className="text-white font-medium tabular-nums">{p.value.toLocaleString()}</span>
          </div>
        );
      })}
      {payload.length > 1 && (
        <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-zinc-700">
          <span className="text-zinc-400">Total</span>
          <span className="text-white font-semibold tabular-nums">{total.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
    const spending = transactions.filter((r) => r.amount < 0);

    const weekSpent = spending
      .filter((r) => new Date(r.createdAt) >= sevenDaysAgo)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const monthSpent = spending
      .filter((r) => new Date(r.createdAt) >= thirtyDaysAgo)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    const chartData: Record<string, number | string>[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const dayRecords = spending.filter((r) => {
        const t = new Date(r.createdAt);
        return t >= dayStart && t < dayEnd;
      });
      const byGroup: Record<CategoryKey, number> = { gameplay: 0, setup: 0, voice: 0, image: 0 };
      dayRecords.forEach((r) => {
        byGroup[resolveCategory(r.transactionType)] += Math.abs(r.amount);
      });
      chartData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...byGroup,
      });
    }

    const groupTotals: Record<CategoryKey, number> = { gameplay: 0, setup: 0, voice: 0, image: 0 };
    spending.forEach((r) => {
      groupTotals[resolveCategory(r.transactionType)] += Math.abs(r.amount);
    });
    const totalGrouped = Object.values(groupTotals).reduce((s, v) => s + v, 0);

    return { weekSpent, monthSpent, chartData, totalSpent: totalGrouped, groupTotals, totalGrouped };
  }, [transactions]);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-zinc-400">Sign in to view your usage.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-zinc-800/60 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-white">Usage & Spending</h1>
            <p className="text-xs text-zinc-500">Track your credit usage</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Balance + period stats ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Available</span>
            </div>
            {loadingBalance ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            ) : balance ? (
              <div className="text-3xl font-black text-white tabular-nums">{balance.tokens.toLocaleString()}</div>
            ) : (
              <div className="text-zinc-500">—</div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">7 Days</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums">{stats.weekSpent.toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">30 Days</span>
            </div>
            <div className="text-3xl font-black text-white tabular-nums">{stats.monthSpent.toLocaleString()}</div>
          </div>
        </div>

        {/* ── Spending chart ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Spending Trend</h3>
          <p className="text-xs text-zinc-500 mb-4">Last 7 days by category</p>
          {stats.totalSpent > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.chartData} barSize={20} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                {ALL_CATEGORIES.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={CATEGORY_META[key].fill}
                    radius={i === ALL_CATEGORIES.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
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
          {/* Legend */}
          {stats.totalSpent > 0 && (
            <div className="flex items-center justify-center gap-5 mt-3">
              {ALL_CATEGORIES.map((key) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_META[key].fill }} />
                  {CATEGORY_META[key].label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Category breakdown ────────────────────────────────────────── */}
        {stats.totalSpent > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_CATEGORIES
                .filter((key) => stats.groupTotals[key] > 0)
                .map((key) => {
                  const meta = CATEGORY_META[key];
                  const amount = stats.groupTotals[key];
                  const pct = stats.totalGrouped > 0 ? Math.round((amount / stats.totalGrouped) * 100) : 0;
                  const Icon = meta.Icon;
                  return (
                    <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${meta.fill}18` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: meta.fill }} />
                        </div>
                        <span className="text-xs text-zinc-400 font-medium">{meta.label}</span>
                      </div>
                      <div className="text-xl font-bold text-white tabular-nums mb-2">{amount.toLocaleString()}</div>
                      <div className="w-full bg-zinc-800 rounded-full h-1">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.fill }} />
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">{pct}%</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Transaction history ───────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
          {loadingTx ? (
            <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                <DollarSign className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-zinc-400 mb-1">No transactions yet</p>
              <p className="text-zinc-600 text-sm">Your history will appear here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx, index) => {
                const display = getTxDisplay(tx);
                const Icon = display.icon;
                const isCredit = tx.amount > 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-zinc-900/80 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Icon className={`h-4 w-4 ${isCredit ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description || tx.transactionType}</p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded ${display.bg} ${display.color} font-medium`}>{display.label}</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatTime(tx.createdAt)}</span>
                      </div>
                    </div>
                    <div className={`text-base font-bold tabular-nums ${display.color}`}>
                      {display.prefix}{Math.abs(tx.amount).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
