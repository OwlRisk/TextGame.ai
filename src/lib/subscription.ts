/**
 * 订阅档位：仅 Free / Pro / Plus / Ultra（Pro $20/月，Plus $60/月，Ultra $200/月）
 */
export type SubscriptionTier = 'free' | 'pro' | 'plus' | 'ultra';

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  { name: string; priceMonthly: number; creditsPerMonth: number; usagePerMonth: number }
> = {
  free: { name: 'Free', priceMonthly: 0, creditsPerMonth: 0, usagePerMonth: 0 },
  pro: { name: 'Pro', priceMonthly: 20, creditsPerMonth: 20, usagePerMonth: 2000 },
  plus: { name: 'Plus', priceMonthly: 60, creditsPerMonth: 40, usagePerMonth: 10000 },
  ultra: { name: 'Ultra', priceMonthly: 200, creditsPerMonth: 80, usagePerMonth: 20000 },
};

export const USAGE_PER_CREDIT = 100;

export function getMonthlyUsageAllowance(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier]?.usagePerMonth ?? 0;
}

export function isPaidTier(tier: string): tier is 'pro' | 'plus' | 'ultra' {
  return tier === 'pro' || tier === 'plus' || tier === 'ultra';
}

/**
 * Stripe 月付订阅 Price ID。
 * 优先使用 STRIPE_PRO_PRICE_ID（与 .env.example 一致），
 * 同时兼容历史变量名 STRIPE_PRICE_PRO。
 */
export function getStripePriceIdForTier(tier: 'pro' | 'plus' | 'ultra'): string | null {
  if (tier === 'pro') {
    return process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_PRO || null;
  } else if (tier === 'plus') {
    return process.env.STRIPE_PLUS_PRICE_ID || null;
  } else if (tier === 'ultra') {
    return process.env.STRIPE_ULTRA_PRICE_ID || null;
  }
  return null;
}

export function getTierFromStripePriceId(priceId: string): SubscriptionTier | null {
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
    if (priceId === process.env.STRIPE_PLUS_PRICE_ID) return 'plus';
    if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return 'ultra';
    return null;
}
