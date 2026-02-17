import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Accept self-signed certificates for all environments
});

/** RLS 要求 current_setting('app.user_id', true) = user_id，在同一连接上先 SET 再查/写 */
async function withUserContext<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SET LOCAL app.user_id = $1', [userId]);
    return await fn(client);
  } finally {
    client.release();
  }
}

// Token costs for various operations (based on actual API costs)
export const TOKEN_COSTS = {
  // Game creation flow
  GAME_CREATION_FULL: 250,        // Complete game setup with host + players
  GENERATE_HOST: 50,              // Generate AI host character
  GENERATE_PLAYERS: 100,          // Generate AI player characters
  GENERATE_AVATAR: 16,            // Generate single avatar image (DALL-E 2)
  GENERATE_ICON: 16,              // Generate game icon
  
  // Chat and interaction
  GM_CHAT_MESSAGE: 10,            // Single GM chat message
  HOST_RESPONSE: 10,              // In-game host response
  QUICK_REPLY_SUGGESTION: 2,     // Suggest quick replies (mini model)
  PROMPT_SUGGESTION: 2,           // Suggest prompts (mini model)
  
  // Voice features
  VOICE_TRANSCRIPTION_PER_MIN: 6, // Whisper transcription per minute
  TTS_PER_1K_CHARS: 15,           // Text-to-speech per 1000 characters
} as const;

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
    return {
      tokens: row.tokens || 0,
      isPro: row.subscription_status === 'pro',
      subscriptionStatus: row.subscription_status || 'free',
      subscriptionEndDate: row.subscription_current_period_end,
    };
  });
}

/**
 * Check if user has sufficient tokens (Pro users always return true)
 */
export async function hasTokens(userId: string, amount: number): Promise<boolean> {
  const balance = await getUserBalance(userId);
  
  // Pro users have unlimited tokens
  if (balance.isPro) {
    return true;
  }
  
  // Check if user has enough tokens
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
      const { tokens, subscription_status } = balanceResult.rows[0];
      const isPro = subscription_status === 'pro';
      if (isPro) {
        await client.query(
          `INSERT INTO token_transactions 
           (user_id, amount, transaction_type, description, game_session_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, 0, transactionType, `${description} (Pro - Unlimited)`, gameSessionId]
        );
        await client.query('COMMIT');
        return true;
      }
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
      console.error('Error adding tokens:', error);
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
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    transactionType: row.transaction_type,
    description: row.description,
    gameSessionId: row.game_session_id,
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

/**
 * Update user's subscription status
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: 'free' | 'pro' | 'cancelled',
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
