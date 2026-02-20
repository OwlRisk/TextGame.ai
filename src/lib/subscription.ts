/**
 * 订阅档位：仅 Free / Pro（Pro $20/月）
 */
export type SubscriptionTier = 'free' | 'pro';

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  { name: string; priceMonthly: number; creditsPerMonth: number; usagePerMonth: number }
> = {
  free: { name: 'Free', priceMonthly: 0, creditsPerMonth: 0, usagePerMonth: 0 },
  pro: { name: 'Pro', priceMonthly: 20, creditsPerMonth: 20, usagePerMonth: 2000 },
};

export const USAGE_PER_CREDIT = 100;

export function getMonthlyUsageAllowance(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier]?.usagePerMonth ?? 0;
}

export function isPaidTier(tier: string): tier is 'pro' {
  return tier === 'pro';
}

/**
 * Stripe 月付订阅 Price ID，配置 STRIPE_PRICE_PRO
 */
export function getStripePriceIdForTier(tier: 'pro'): string | null {
  return process.env.STRIPE_PRICE_PRO ?? null;
}

export function getTierFromStripePriceId(priceId: string): SubscriptionTier | null {
  if (process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  return null;
}
