import { PoolClient } from 'pg';
import { pool } from '@/lib/pg-pool';

// PostgreSQL SET LOCAL does not support prepared parameter $1; only literal values allowed. UUID format enforced to prevent injection.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function safeSetUserId(userId: string): string {
  if (!UUID_RE.test(userId)) throw new Error('Invalid userId for app.user_id');
  return userId.replace(/'/g, "''");
}

/** RLS requires current_setting('app.user_id', true) = user_id; SET before read/write on the same connection */
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

// ========== Recharge / Deduction Formula ==========
// Convention: 1 coin face value = $0.01, but only corresponds to 1/PLATFORM_MARKUP of actual API cost.
// Example: user pays $10 → GPT_BUDGET_RATIO=0.5 → $5 equivalent API budget → 500 coins
// Each API call deducts at PLATFORM_MARKUP multiplier to ensure platform profit.

/** Face value of 1 coin (USD), used for recharge conversion */
export const COIN_VALUE_USD = 0.01;

/** Ratio of payment allocated to API budget (0.5 = 50%), determines number of coins credited */
export const GPT_BUDGET_RATIO = 0.5;

/**
 * Platform markup multiplier: actual API cost is multiplied by this factor when deducting.
 * Set to 2 means each 1 coin ($0.01 face value) covers $0.01/2 = $0.005 of real API cost.
 * Profit margin ≈ 50%.
 */
export const PLATFORM_MARKUP = 2;

/**
 * Calculate coins to credit based on actual payment amount (cents).
 * Formula: coins = (amount_cents / 100) * GPT_BUDGET_RATIO / COIN_VALUE_USD
 * Example: $10 = 1000 cents → 1000/100 * 0.5 / 0.01 = 500 coins
 */
export function rechargeCoinsFromPayment(amountCents: number): number {
  if (amountCents <= 0) return 0;
  const usd = amountCents / 100;
  const gptUsd = usd * GPT_BUDGET_RATIO;
  return Math.floor(gptUsd / COIN_VALUE_USD);
}

/**
 * GPT/TTS API cost (USD) → coins to deduct (including platform markup multiplier)
 */
export function usdToCoins(usd: number): number {
  if (usd <= 0) return 1;
  return Math.max(1, Math.ceil((usd / COIN_VALUE_USD) * PLATFORM_MARKUP));
}

/**
 * OpenAI model pricing: input / output price per 1M tokens (USD).
 * Based on OpenAI official Standard pricing; update when official prices change.
 * As of 2026-03: https://platform.openai.com/docs/pricing
 */
const OPENAI_PRICE_PER_1M: Record<string, { input: number; output: number }> = {
  // GPT-5 series
  'gpt-5.4':              { input: 2.50, output: 15.00 },
  'gpt-5.3-chat-latest':  { input: 1.75, output: 14.00 },
  'gpt-5.4-nano':         { input: 0.20, output: 1.25 },
  'gpt-5.4-mini':         { input: 0.75, output: 4.50 },
  'gpt-5.2':              { input: 1.75, output: 14.00 },
  'gpt-5.2-chat-latest':  { input: 1.75, output: 14.00 },
  'gpt-5.3-codex':        { input: 1.75, output: 14.00 },
  'gpt-5.2-codex':        { input: 1.75, output: 14.00 },
  'gpt-5.2-pro':          { input: 21.00, output: 168.00 },
  'gpt-5.1':              { input: 1.25, output: 10.00 },
  'gpt-5.1-chat-latest':  { input: 1.25, output: 10.00 },
  'gpt-5.1-codex-max':    { input: 1.25, output: 10.00 },
  'gpt-5.1-codex':        { input: 1.25, output: 10.00 },
  'gpt-5':                { input: 1.25, output: 10.00 },
  'gpt-5-chat-latest':    { input: 1.25, output: 10.00 },
  'gpt-5-codex':          { input: 1.25, output: 10.00 },
  'gpt-5-pro':            { input: 15.00, output: 120.00 },
  'gpt-5-mini':           { input: 0.25, output: 2.00 },
  'gpt-5-nano':           { input: 0.05, output: 0.40 },
  // GPT-4.1 series
  'gpt-4.1':              { input: 2.00, output: 8.00 },
  'gpt-4.1-mini':         { input: 0.40, output: 1.60 },
  'gpt-4.1-nano':         { input: 0.10, output: 0.40 },
  // GPT-4o series
  'gpt-4o':               { input: 2.50, output: 10.00 },
  'gpt-4o-2024-11-20':    { input: 2.50, output: 10.00 },
  'gpt-4o-mini':          { input: 0.15, output: 0.60 },
};

function getModelPrice(model: string): { input: number; output: number } {
  const key = model?.toLowerCase?.() ?? '';
  return OPENAI_PRICE_PER_1M[key] ?? OPENAI_PRICE_PER_1M['gpt-5.3-chat-latest'];
}

/**
 * Calculate API cost (USD) for this call based on model and usage, then convert to coins
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
 * Conservative estimate when only total token count is known (e.g. streaming with no usage data); estimates using a higher-priced model
 */
export function estimatedTokensToCoins(totalTokens: number, model?: string): number {
  if (totalTokens <= 0) return 1;
  const { input, output } = getModelPrice(model ?? 'gpt-5.3-chat-latest');
  const half = totalTokens / 2;
  const usd = (half / 1_000_000) * input + (half / 1_000_000) * output;
  return usdToCoins(usd);
}

/**
 * Inworld TTS pricing: price per 1M characters (USD).
 * As of 2026-03: https://platform.openai.com/docs/pricing (Inworld via OpenAI)
 */
export const INWORLD_TTS_PRICE_PER_1M_CHARS: Record<string, number> = {
  'inworld-tts-1.5-max':  10.00,
  'inworld-tts-1-max':    10.00,
  'inworld-tts-1.5-mini': 5.00,
  'inworld-tts-1':        5.00,
};

/**
 * Calculate coins to deduct based on TTS character count and model (including PLATFORM_MARKUP).
 * Formula: usdToCoins((chars / 1_000_000) × pricePerMillion), minimum 1 coin.
 */
export function ttsCostToCoins(chars: number, model: string): number {
  if (chars <= 0) return 0;
  const pricePerMillion =
    INWORLD_TTS_PRICE_PER_1M_CHARS[model] ??
    INWORLD_TTS_PRICE_PER_1M_CHARS['inworld-tts-1.5-max'];
  const usd = (chars / 1_000_000) * pricePerMillion;
  return usdToCoins(usd);
}

/**
 * Image generation model pricing (per image, USD).
 * As of 2026-03: https://platform.openai.com/docs/pricing
 */
export const IMAGE_GEN_PRICE_USD: Record<string, number> = {
  'dall-e-2':    0.016,  // 256×256 standard
  'dall-e-3':    0.040,  // 1024×1024 standard
  'dall-e-3-hd': 0.080,  // 1024×1024 HD
  'flux':        0.050,  // Replicate flux-dev estimate
  'stable-diffusion': 0.030, // Replicate SDXL estimate
};

/**
 * Calculate coins to deduct based on image generation model (including PLATFORM_MARKUP).
 * Unknown models fall back to dall-e-3.
 */
export function imageGenCostToCoins(model: string): number {
  const price = IMAGE_GEN_PRICE_USD[model] ?? IMAGE_GEN_PRICE_USD['dall-e-3'];
  return usdToCoins(price);
}

// Token costs for fixed-cost operations (not based on API pricing)
export const TOKEN_COSTS = {
  QUICK_REPLY_SUGGESTION: 2,
  PROMPT_SUGGESTION: 2,
  VOICE_TRANSCRIPTION_PER_MIN: 6,
} as const;

/**
 * Rough estimate of token count for text (used for pre-deduction balance check).
 * English ≈ 4 chars/token, CJK ≈ 1.5 chars/token; use 3 chars/token as conservative estimate.
 */
export function estimateTokensFromText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 3);
}

/**
 * Estimate upper-bound token count for one chat round (system + messages content + maxCompletionTokens)
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
    if (result.rows.length === 0) {
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
  await withUserContext(userId, async (client) => {
    if (paymentIntentId && (await hasTransactionForPaymentIntent(paymentIntentId, client))) {
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

/** Subscription status (DB may still contain legacy plus/ultra values; new writes are free | pro | cancelled only) */
export type SubscriptionStatus = 'free' | 'pro' | 'plus' | 'ultra' | 'cancelled';

/**
 * Update user's subscription status (Pro only; writes free | pro | cancelled)
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
