import { PoolClient } from 'pg';
import { pool } from '@/lib/pg-pool';

// PostgreSQL SET LOCAL 不支持预编译参数 $1，只能用字面量；仅允许 UUID 格式防注入
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function safeSetUserId(userId: string): string {
  if (!UUID_RE.test(userId)) throw new Error('Invalid userId for app.user_id');
  return userId.replace(/'/g, "''");
}

/** RLS 要求 current_setting('app.user_id', true) = user_id，在同一连接上先 SET 再查/写 */
async function withUserContext<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    const safe = safeSetUserId(userId);
    await client.query(`SET LOCAL app.user_id = '${safe}'`);
    return await fn(client);
  } catch (err) {
    console.error('[tokens] withUserContext error userId=', userId, 'err=', err);
    if (err instanceof Error) console.error('[tokens] withUserContext stack:', err.stack);
    throw err;
  } finally {
    client.release();
  }
}

// ========== 充值 / 扣费公式 ==========
// 约定：1 coin = 一定量的 GPT 消费（美元）
// 例如：用户充值 $10 → 平台给其中 $5 等价于 GPT 额度 → 即 500 coins（1 coin = $0.01 GPT）

/** 1 coin 代表的 GPT 消费（美元），用于充值与扣费统一换算 */
export const COIN_VALUE_USD = 0.01;

/** 充值金额中用于 GPT 的比例，例如 0.5 表示 $10 充值 → $5 的 GPT 额度 */
export const GPT_BUDGET_RATIO = 0.5;

/**
 * 根据实际支付金额（美分）计算应到账的 coins
 * 公式：coins = (amount_cents / 100) * GPT_BUDGET_RATIO / COIN_VALUE_USD
 * 例：$10 = 1000 美分 → 1000/100 * 0.5 / 0.01 = 500 coins
 */
export function rechargeCoinsFromPayment(amountCents: number): number {
  if (amountCents <= 0) return 0;
  const usd = amountCents / 100;
  const gptUsd = usd * GPT_BUDGET_RATIO;
  return Math.floor(gptUsd / COIN_VALUE_USD);
}

/**
 * GPT API 成本（美元）→ 扣减的 coins
 */
export function usdToCoins(usd: number): number {
  if (usd <= 0) return 1;
  return Math.max(1, Math.ceil(usd / COIN_VALUE_USD));
}

/** OpenAI 模型定价：每 100 万 token 的 input / output 价格（美元），可随官方调价更新 */
const OPENAI_PRICE_PER_1M: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o-2024-11-20': { input: 2.5, output: 10 },
  'gpt-5.2': { input: 2.5, output: 10 }, // 与 gpt-4o 同档，后续可单独配置
};

function getModelPrice(model: string): { input: number; output: number } {
  const key = model?.toLowerCase?.() ?? '';
  return OPENAI_PRICE_PER_1M[key] ?? OPENAI_PRICE_PER_1M['gpt-4o'];
}

/**
 * 根据模型与 usage 计算本次调用的 API 成本（美元），再换算为 coins
 */
export function gptUsageToCoins(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const { input, output } = getModelPrice(model);
  const inputUsd = (promptTokens / 1_000_000) * input;
  const outputUsd = (completionTokens / 1_000_000) * output;
  return usdToCoins(inputUsd + outputUsd);
}

/**
 * 仅知道总 token 数时的保守估算（用于 stream 等无 usage 场景），按偏贵模型估算
 */
export function estimatedTokensToCoins(totalTokens: number, model?: string): number {
  if (totalTokens <= 0) return 1;
  const { input, output } = getModelPrice(model ?? 'gpt-4o');
  const half = totalTokens / 2;
  const usd = (half / 1_000_000) * input + (half / 1_000_000) * output;
  return usdToCoins(usd);
}

// Token costs for various operations (fixed costs for non-token operations)
export const TOKEN_COSTS = {
  GENERATE_AVATAR: 16,
  GENERATE_ICON: 16,
  QUICK_REPLY_SUGGESTION: 2,
  PROMPT_SUGGESTION: 2,
  VOICE_TRANSCRIPTION_PER_MIN: 6,
  TTS_PER_1K_CHARS: 15,
} as const;

/**
 * 粗略估算文本对应的 token 数（用于扣费前预检查）
 * 英文约 4 字符/token，中文约 1.5 字符/token，取 3 字符/token 作为保守估计
 */
export function estimateTokensFromText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 3);
}

/**
 * 估算一轮 chat 的 token 上限（system + messages 内容 + maxCompletionTokens）
 */
export function estimateChatTokens(
  systemLength: number,
  messagesTotalLength: number,
  maxCompletionTokens: number
): number {
  return systemLength + messagesTotalLength + maxCompletionTokens;
}

export interface UserBalance {
  tokens: number;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionEndDate?: Date;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: string;
  description: string;
  gameSessionId?: string;
  createdAt: Date;
}

/**
 * Get user's current token balance and subscription status.
 * Uses app.user_id for RLS so server-side API can read user_profiles.
 */
export async function getUserBalance(userId: string): Promise<UserBalance> {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `SELECT tokens, subscription_status, subscription_current_period_end 
       FROM user_profiles 
       WHERE user_id = $1`,
      [userId]
    );
    console.log('[tokens] getUserBalance userId=', userId, 'rows=', result.rows.length);

    if (result.rows.length === 0) {
      console.log('[tokens] getUserBalance no row, inserting default 100');
      await client.query(
        'INSERT INTO user_profiles (user_id, tokens) VALUES ($1, 100) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
      return {
        tokens: 100,
        isPro: false,
        subscriptionStatus: 'free',
      };
    }

    const row = result.rows[0];
    const status = row.subscription_status || 'free';
    const isPaidTier = status === 'pro' || status === 'plus' || status === 'ultra';
    const subscriptionStatus = status === 'cancelled' ? 'free' : (isPaidTier ? status : 'free');
    return {
      tokens: row.tokens || 0,
      isPro: isPaidTier,
      subscriptionStatus,
      subscriptionEndDate: row.subscription_current_period_end,
    };
  });
}

/**
 * Check if user has sufficient tokens (subscription users get monthly allowance, same check)
 */
export async function hasTokens(userId: string, amount: number): Promise<boolean> {
  const balance = await getUserBalance(userId);
  return balance.tokens >= amount;
}

/**
 * Deduct tokens from user account.
 * Uses app.user_id for RLS.
 */
export async function deductTokens(
  userId: string,
  amount: number,
  transactionType: string,
  description: string,
  gameSessionId?: string
): Promise<boolean> {
  return withUserContext(userId, async (client) => {
    await client.query('BEGIN');
    try {
      const balanceResult = await client.query(
        'SELECT tokens, subscription_status FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      if (balanceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      const { tokens } = balanceResult.rows[0];
      if (tokens < amount) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        'UPDATE user_profiles SET tokens = tokens - $1 WHERE user_id = $2',
        [amount, userId]
      );
      await client.query(
        `INSERT INTO token_transactions 
         (user_id, amount, transaction_type, description, game_session_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, -amount, transactionType, description, gameSessionId]
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deducting tokens:', error);
      throw error;
    }
  });
}

/**
 * Check if we already credited tokens for this payment (idempotency).
 * Must run inside RLS context (same connection with app.user_id set) when userId is provided.
 */
export async function hasTransactionForPaymentIntent(
  paymentIntentId: string,
  client?: PoolClient
): Promise<boolean> {
  if (!paymentIntentId) return false;
  const runner = client ?? pool;
  const result = await runner.query(
    'SELECT 1 FROM token_transactions WHERE stripe_payment_intent_id = $1 LIMIT 1',
    [paymentIntentId]
  );
  return result.rows.length > 0;
}

/**
 * Add tokens to user account (for purchases).
 * If paymentIntentId is provided and already credited, skips (idempotent).
 * Uses app.user_id for RLS so server can write user_profiles and token_transactions.
 */
export async function addTokens(
  userId: string,
  amount: number,
  transactionType: string,
  description: string,
  paymentIntentId?: string
): Promise<void> {
  console.log('[tokens] addTokens userId=', userId, 'amount=', amount, 'paymentIntentId=', paymentIntentId);
  await withUserContext(userId, async (client) => {
    if (paymentIntentId && (await hasTransactionForPaymentIntent(paymentIntentId, client))) {
      console.log('[tokens] addTokens idempotent skip, already credited for', paymentIntentId);
      return;
    }
    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO user_profiles (user_id, tokens) 
         VALUES ($1, $2)
         ON CONFLICT (user_id) 
         DO UPDATE SET tokens = user_profiles.tokens + $2`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO token_transactions 
         (user_id, amount, transaction_type, description, stripe_payment_intent_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, amount, transactionType, description, paymentIntentId]
      );
      await client.query('COMMIT');
      console.log('[tokens] addTokens committed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[tokens] addTokens error:', error);
      if (error instanceof Error) console.error('[tokens] addTokens stack:', error.stack);
      throw error;
    }
  });
}

/**
 * Get user's recent token transactions
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<TokenTransaction[]> {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `SELECT id, user_id, amount, transaction_type, description, game_session_id, created_at
       FROM token_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      amount: Number(row.amount),
      transactionType: row.transaction_type as string,
      description: row.description as string,
      gameSessionId: row.game_session_id as string | undefined,
      createdAt: new Date(row.created_at as string),
    }));
  });
}

/** Default 1:100 coin packages when DB has none (e.g. migration not run) */
export const DEFAULT_COIN_PACKAGES = [
  { id: 'default-100', name: '100 Coins', tokens: 100, price_cents: 100, bonus_percentage: 0 },
  { id: 'default-500', name: '500 Coins', tokens: 500, price_cents: 500, bonus_percentage: 0 },
  { id: 'default-1000', name: '1,000 Coins', tokens: 1000, price_cents: 1000, bonus_percentage: 0 },
  { id: 'default-2000', name: '2,000 Coins', tokens: 2000, price_cents: 2000, bonus_percentage: 0 },
  { id: 'default-5000', name: '5,000 Coins', tokens: 5000, price_cents: 5000, bonus_percentage: 0 },
  { id: 'default-10000', name: '10,000 Coins', tokens: 10000, price_cents: 10000, bonus_percentage: 0 },
] as const;

/**
 * Get all available token packages (from DB, or defaults if empty)
 */
export async function getTokenPackages() {
  try {
    const result = await pool.query(
      `SELECT id, name, tokens, price_cents, bonus_percentage
       FROM token_packages
       WHERE is_active = true
       ORDER BY tokens ASC`
    );
    if (result.rows.length > 0) return result.rows;
  } catch (e) {
    console.warn('[tokens] getTokenPackages DB error, using defaults:', (e as Error)?.message);
  }
  return [...DEFAULT_COIN_PACKAGES];
}

/** 订阅状态（DB 可能仍有 plus/ultra 历史值，新写入仅 free | pro | cancelled） */
export type SubscriptionStatus = 'free' | 'pro' | 'plus' | 'ultra' | 'cancelled';

/**
 * Update user's subscription status（仅支持 Pro，写入 free | pro | cancelled）
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  subscriptionId?: string,
  periodEnd?: Date
): Promise<void> {
  await withUserContext(userId, async (client) => {
    await client.query(
      `INSERT INTO user_profiles (user_id, subscription_status, subscription_id, subscription_current_period_end)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET 
         subscription_status = $2,
         subscription_id = COALESCE($3, user_profiles.subscription_id),
         subscription_current_period_end = $4`,
      [userId, status, subscriptionId, periodEnd]
    );
  });
}

/**
 * Grant monthly usage allowance for subscription (call on subscribe + renewal)
 */
export async function grantMonthlyAllowance(userId: string, tier: 'pro' | 'plus' | 'ultra'): Promise<void> {
  const { getMonthlyUsageAllowance } = await import('@/lib/subscription');
  const amount = getMonthlyUsageAllowance(tier);
  if (amount <= 0) return;
  await addTokens(userId, amount, 'subscription_grant', `Monthly allowance: ${tier}`);
}

/**
 * Set or update user's Stripe customer ID
 */
export async function setCustomerId(userId: string, customerId: string): Promise<void> {
  await withUserContext(userId, async (client) => {
    await client.query(
      `INSERT INTO user_profiles (user_id, customer_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET customer_id = $2`,
      [userId, customerId]
    );
  });
}

/**
 * Get user's Stripe customer ID
 */
export async function getCustomerId(userId: string): Promise<string | null> {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      'SELECT customer_id FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.customer_id || null;
  });
}
