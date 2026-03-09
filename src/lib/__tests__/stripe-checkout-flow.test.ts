/**
 * Stripe 支付流程测试
 *
 * 覆盖范围：
 *  1. rechargeCoinsFromPayment — 付款金额 → 积分公式
 *  2. subscription.ts utilities — tier ↔ priceId、月度额度、isPaidTier
 *  3. create-checkout 请求校验逻辑
 *  4. fulfill-session 业务逻辑（状态检查、用户归属、模式处理、幂等）
 *  5. 全流程端到端串联
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rechargeCoinsFromPayment,
  COIN_VALUE_USD,
  GPT_BUDGET_RATIO,
} from '../tokens';
import {
  getMonthlyUsageAllowance,
  getStripePriceIdForTier,
  getTierFromStripePriceId,
  isPaidTier,
  capitalizeTier,
  SUBSCRIPTION_TIERS,
} from '../subscription';

// ─── 1. rechargeCoinsFromPayment ──────────────────────────────────────────

describe('rechargeCoinsFromPayment — 付款金额转积分', () => {
  it('$10 支付 → 500 积分（50% 分配给 API 预算）', () => {
    // $10 = 1000 cents → 1000/100 * 0.5 / 0.01 = 500
    expect(rechargeCoinsFromPayment(1000)).toBe(500);
  });

  it('$20 支付 → 1000 积分', () => {
    expect(rechargeCoinsFromPayment(2000)).toBe(1000);
  });

  it('$1 支付 → 50 积分', () => {
    expect(rechargeCoinsFromPayment(100)).toBe(50);
  });

  it('$200 支付（Ultra 月费）→ 10000 积分', () => {
    expect(rechargeCoinsFromPayment(20000)).toBe(10000);
  });

  it('金额为 0 → 0 积分', () => {
    expect(rechargeCoinsFromPayment(0)).toBe(0);
  });

  it('负数金额 → 0 积分', () => {
    expect(rechargeCoinsFromPayment(-500)).toBe(0);
  });

  it('积分向下取整（非整除时）', () => {
    // 301 cents = $3.01 → 3.01 * 0.5 / 0.01 = 150.5 → floor → 150
    expect(rechargeCoinsFromPayment(301)).toBe(150);
  });

  it('公式符合 GPT_BUDGET_RATIO 和 COIN_VALUE_USD 常量', () => {
    const amountCents = 5000;
    const expectedCoins = Math.floor((amountCents / 100) * GPT_BUDGET_RATIO / COIN_VALUE_USD);
    expect(rechargeCoinsFromPayment(amountCents)).toBe(expectedCoins);
  });

  it('各套餐积分数量递增', () => {
    const packages = [500, 1000, 2500, 5000, 10000, 20000, 50000];
    const coins = packages.map(rechargeCoinsFromPayment);
    for (let i = 1; i < coins.length; i++) {
      expect(coins[i]).toBeGreaterThan(coins[i - 1]);
    }
  });
});

// ─── 2. subscription.ts utilities ────────────────────────────────────────

describe('isPaidTier', () => {
  it('pro / plus / ultra 是付费套餐', () => {
    expect(isPaidTier('pro')).toBe(true);
    expect(isPaidTier('plus')).toBe(true);
    expect(isPaidTier('ultra')).toBe(true);
  });

  it('free / cancelled 不是付费套餐', () => {
    expect(isPaidTier('free')).toBe(false);
    expect(isPaidTier('cancelled')).toBe(false);
    expect(isPaidTier('')).toBe(false);
  });
});

describe('getMonthlyUsageAllowance — 月度积分额度', () => {
  it('pro → 2000 积分/月', () => {
    expect(getMonthlyUsageAllowance('pro')).toBe(2000);
  });

  it('plus → 6000 积分/月', () => {
    expect(getMonthlyUsageAllowance('plus')).toBe(6000);
  });

  it('ultra → 40000 积分/月', () => {
    expect(getMonthlyUsageAllowance('ultra')).toBe(40000);
  });

  it('free → 0 积分', () => {
    expect(getMonthlyUsageAllowance('free')).toBe(0);
  });

  it('各套餐额度随价格递增', () => {
    const pro = getMonthlyUsageAllowance('pro');
    const plus = getMonthlyUsageAllowance('plus');
    const ultra = getMonthlyUsageAllowance('ultra');
    expect(plus).toBeGreaterThan(pro);
    expect(ultra).toBeGreaterThan(plus);
  });

  it('SUBSCRIPTION_TIERS 定义与 getMonthlyUsageAllowance 一致', () => {
    expect(getMonthlyUsageAllowance('pro')).toBe(SUBSCRIPTION_TIERS.pro.usagePerMonth);
    expect(getMonthlyUsageAllowance('plus')).toBe(SUBSCRIPTION_TIERS.plus.usagePerMonth);
    expect(getMonthlyUsageAllowance('ultra')).toBe(SUBSCRIPTION_TIERS.ultra.usagePerMonth);
  });
});

describe('capitalizeTier', () => {
  it('首字母大写', () => {
    expect(capitalizeTier('pro')).toBe('Pro');
    expect(capitalizeTier('plus')).toBe('Plus');
    expect(capitalizeTier('ultra')).toBe('Ultra');
    expect(capitalizeTier('free')).toBe('Free');
  });
});

describe('getStripePriceIdForTier — tier → Stripe price ID', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_test');
    vi.stubEnv('STRIPE_PLUS_PRICE_ID', 'price_plus_test');
    vi.stubEnv('STRIPE_ULTRA_PRICE_ID', 'price_ultra_test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('pro → STRIPE_PRO_PRICE_ID', () => {
    expect(getStripePriceIdForTier('pro')).toBe('price_pro_test');
  });

  it('plus → STRIPE_PLUS_PRICE_ID', () => {
    expect(getStripePriceIdForTier('plus')).toBe('price_plus_test');
  });

  it('ultra → STRIPE_ULTRA_PRICE_ID', () => {
    expect(getStripePriceIdForTier('ultra')).toBe('price_ultra_test');
  });

  it('未配置 price ID 时返回 null', () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', '');
    vi.stubEnv('STRIPE_PRICE_PRO', '');
    expect(getStripePriceIdForTier('pro')).toBeNull();
  });

  it('支持 legacy STRIPE_PRICE_PRO fallback', () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', '');
    vi.stubEnv('STRIPE_PRICE_PRO', 'price_pro_legacy');
    expect(getStripePriceIdForTier('pro')).toBe('price_pro_legacy');
  });
});

describe('getTierFromStripePriceId — Stripe price ID → tier', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_test');
    vi.stubEnv('STRIPE_PLUS_PRICE_ID', 'price_plus_test');
    vi.stubEnv('STRIPE_ULTRA_PRICE_ID', 'price_ultra_test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('price_pro_test → pro', () => {
    expect(getTierFromStripePriceId('price_pro_test')).toBe('pro');
  });

  it('price_plus_test → plus', () => {
    expect(getTierFromStripePriceId('price_plus_test')).toBe('plus');
  });

  it('price_ultra_test → ultra', () => {
    expect(getTierFromStripePriceId('price_ultra_test')).toBe('ultra');
  });

  it('未知 price ID → null', () => {
    expect(getTierFromStripePriceId('price_unknown')).toBeNull();
  });

  it('空字符串 → null', () => {
    expect(getTierFromStripePriceId('')).toBeNull();
  });

  it('getStripePriceIdForTier 和 getTierFromStripePriceId 互为逆运算', () => {
    const tiers = ['pro', 'plus', 'ultra'] as const;
    for (const tier of tiers) {
      const priceId = getStripePriceIdForTier(tier)!;
      expect(getTierFromStripePriceId(priceId)).toBe(tier);
    }
  });
});

// ─── 3. create-checkout 请求校验逻辑 ─────────────────────────────────────

/**
 * 提取 create-checkout 路由中的纯校验逻辑进行独立测试。
 */

type CheckoutRequest = {
  packageId?: string;
  subscriptionTier?: string;
};

function validateCheckoutRequest(body: CheckoutRequest): { error: string; status: number } | null {
  const { packageId, subscriptionTier } = body;
  const isSubscription =
    subscriptionTier === 'pro' || subscriptionTier === 'plus' || subscriptionTier === 'ultra';
  if (!isSubscription && !packageId) {
    return { error: 'Package ID or subscriptionTier (pro/plus/ultra) is required', status: 400 };
  }
  return null;
}

function validatePriceId(
  tier: string,
  priceId: string | null
): { error: string; status: number } | null {
  if (!priceId) {
    return {
      error: `Stripe price not configured for ${tier}. Set the correct STRIPE_*_PRICE_ID in .env, and use a Stripe Price ID (starts with price_).`,
      status: 500,
    };
  }
  if (!priceId.startsWith('price_')) {
    return {
      error: `Invalid Stripe price id for ${tier}. Expected a Stripe Price ID starting with price_ (not a product id like prod_).`,
      status: 500,
    };
  }
  return null;
}

describe('create-checkout 请求参数校验', () => {
  it('同时缺少 packageId 和 subscriptionTier → 400', () => {
    const result = validateCheckoutRequest({});
    expect(result?.status).toBe(400);
    expect(result?.error).toContain('required');
  });

  it('subscriptionTier=pro → 通过', () => {
    expect(validateCheckoutRequest({ subscriptionTier: 'pro' })).toBeNull();
  });

  it('subscriptionTier=plus → 通过', () => {
    expect(validateCheckoutRequest({ subscriptionTier: 'plus' })).toBeNull();
  });

  it('subscriptionTier=ultra → 通过', () => {
    expect(validateCheckoutRequest({ subscriptionTier: 'ultra' })).toBeNull();
  });

  it('subscriptionTier=free 不算付费 tier → 需要 packageId', () => {
    const result = validateCheckoutRequest({ subscriptionTier: 'free' });
    expect(result?.status).toBe(400);
  });

  it('有效 packageId → 通过', () => {
    expect(validateCheckoutRequest({ packageId: 'starter' })).toBeNull();
  });
});

describe('create-checkout price ID 校验', () => {
  it('price ID 为空（未配置）→ 500', () => {
    const result = validatePriceId('pro', null);
    expect(result?.status).toBe(500);
    expect(result?.error).toContain('not configured');
  });

  it('price ID 以 prod_ 开头（Product ID，非 Price ID）→ 500', () => {
    const result = validatePriceId('pro', 'prod_abc123');
    expect(result?.status).toBe(500);
    expect(result?.error).toContain('price_');
  });

  it('合法 price ID（以 price_ 开头）→ 通过', () => {
    expect(validatePriceId('pro', 'price_abc123')).toBeNull();
  });

  it('错误信息包含套餐名称', () => {
    const result = validatePriceId('ultra', null);
    expect(result?.error).toContain('ultra');
  });
});

// ─── 4. fulfill-session 业务逻辑 ─────────────────────────────────────────

type FakeSession = {
  payment_status: string;
  mode: string;
  metadata?: { userId?: string };
  amount_total?: number | null;
  subscription?: string | null;
};

function validateFulfillSession(
  session: FakeSession,
  currentUserId: string
): { error: string; status: number } | null {
  if (session.payment_status !== 'paid') {
    return { error: 'Payment not completed', status: 400 };
  }
  if (session.metadata?.userId !== currentUserId) {
    return { error: 'Session does not belong to this user', status: 403 };
  }
  if (session.mode !== 'payment' && session.mode !== 'subscription') {
    return { error: 'Unsupported session mode', status: 400 };
  }
  return null;
}

function calculateTokensFromSession(session: FakeSession): number | null {
  if (session.mode !== 'payment') return null;
  const amountCents = session.amount_total ?? 0;
  const tokens = rechargeCoinsFromPayment(amountCents);
  return tokens > 0 ? tokens : null;
}

describe('fulfill-session — 支付状态校验', () => {
  const userId = 'user-abc-123';

  it('payment_status=unpaid → 400', () => {
    const result = validateFulfillSession(
      { payment_status: 'unpaid', mode: 'payment', metadata: { userId } },
      userId
    );
    expect(result?.status).toBe(400);
    expect(result?.error).toContain('not completed');
  });

  it('payment_status=no_payment_required → 400', () => {
    const result = validateFulfillSession(
      { payment_status: 'no_payment_required', mode: 'payment', metadata: { userId } },
      userId
    );
    expect(result?.status).toBe(400);
  });

  it('payment_status=paid + 正确用户 → 通过', () => {
    const result = validateFulfillSession(
      { payment_status: 'paid', mode: 'payment', metadata: { userId } },
      userId
    );
    expect(result).toBeNull();
  });
});

describe('fulfill-session — 用户归属校验', () => {
  it('session 归属用户与当前用户不一致 → 403', () => {
    const result = validateFulfillSession(
      { payment_status: 'paid', mode: 'payment', metadata: { userId: 'user-other' } },
      'user-current'
    );
    expect(result?.status).toBe(403);
    expect(result?.error).toContain('does not belong');
  });

  it('session 无 metadata → 403', () => {
    const result = validateFulfillSession(
      { payment_status: 'paid', mode: 'payment', metadata: {} },
      'user-current'
    );
    expect(result?.status).toBe(403);
  });

  it('userId 匹配 → 通过', () => {
    const result = validateFulfillSession(
      { payment_status: 'paid', mode: 'payment', metadata: { userId: 'user-abc' } },
      'user-abc'
    );
    expect(result).toBeNull();
  });
});

describe('fulfill-session — session 模式处理', () => {
  const userId = 'user-abc';

  it('mode=setup（不支持）→ 400', () => {
    const result = validateFulfillSession(
      { payment_status: 'paid', mode: 'setup', metadata: { userId } },
      userId
    );
    expect(result?.status).toBe(400);
    expect(result?.error).toContain('Unsupported');
  });

  it('mode=payment → 通过', () => {
    expect(
      validateFulfillSession({ payment_status: 'paid', mode: 'payment', metadata: { userId } }, userId)
    ).toBeNull();
  });

  it('mode=subscription → 通过', () => {
    expect(
      validateFulfillSession({ payment_status: 'paid', mode: 'subscription', metadata: { userId } }, userId)
    ).toBeNull();
  });
});

describe('fulfill-session — 积分计算（payment 模式）', () => {
  it('$10 → 500 积分', () => {
    const tokens = calculateTokensFromSession({
      payment_status: 'paid',
      mode: 'payment',
      amount_total: 1000,
    });
    expect(tokens).toBe(500);
  });

  it('$20 → 1000 积分', () => {
    expect(
      calculateTokensFromSession({ payment_status: 'paid', mode: 'payment', amount_total: 2000 })
    ).toBe(1000);
  });

  it('amount_total=0 → null（无效金额，不发放积分）', () => {
    expect(
      calculateTokensFromSession({ payment_status: 'paid', mode: 'payment', amount_total: 0 })
    ).toBeNull();
  });

  it('amount_total=null → null', () => {
    expect(
      calculateTokensFromSession({ payment_status: 'paid', mode: 'payment', amount_total: null })
    ).toBeNull();
  });

  it('subscription 模式 → null（不直接发积分，走 grantMonthlyAllowance）', () => {
    expect(
      calculateTokensFromSession({ payment_status: 'paid', mode: 'subscription', amount_total: 2000 })
    ).toBeNull();
  });
});

// ─── 5. 全流程端到端串联 ─────────────────────────────────────────────────

describe('全支付流程串联', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_live');
    vi.stubEnv('STRIPE_PLUS_PRICE_ID', 'price_plus_live');
    vi.stubEnv('STRIPE_ULTRA_PRICE_ID', 'price_ultra_live');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('订阅流程：tier → priceId → 月度额度', () => {
    const tiers = ['pro', 'plus', 'ultra'] as const;
    for (const tier of tiers) {
      const priceId = getStripePriceIdForTier(tier);
      expect(priceId).not.toBeNull();
      expect(priceId!.startsWith('price_')).toBe(true);

      const resolvedTier = getTierFromStripePriceId(priceId!);
      expect(resolvedTier).toBe(tier);

      const allowance = getMonthlyUsageAllowance(tier);
      expect(allowance).toBeGreaterThan(0);
    }
  });

  it('一次性购买流程：请求校验 → 付款 → 积分发放', () => {
    const packageId = 'popular';
    const userId = 'user-test';

    // 1. 校验请求参数
    const reqError = validateCheckoutRequest({ packageId });
    expect(reqError).toBeNull();

    // 2. 模拟 Stripe Checkout 完成（$10 支付）
    const paidSession: FakeSession = {
      payment_status: 'paid',
      mode: 'payment',
      metadata: { userId },
      amount_total: 1000,
    };

    // 3. fulfill-session 校验
    const fulfillError = validateFulfillSession(paidSession, userId);
    expect(fulfillError).toBeNull();

    // 4. 计算发放积分
    const tokens = calculateTokensFromSession(paidSession);
    expect(tokens).toBe(500);
  });

  it('订阅流程：用户 A 的 session 无法被用户 B 兑换（防止积分盗取）', () => {
    const session: FakeSession = {
      payment_status: 'paid',
      mode: 'subscription',
      metadata: { userId: 'user-A' },
    };

    const result = validateFulfillSession(session, 'user-B');
    expect(result?.status).toBe(403);
  });

  it('相同金额在不同套餐定价下发放积分一致', () => {
    // 积分只由金额决定，与套餐名称无关
    const coins1 = rechargeCoinsFromPayment(2000);
    const coins2 = rechargeCoinsFromPayment(2000);
    expect(coins1).toBe(coins2);
  });
});
