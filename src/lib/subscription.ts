/**
 * Subscription tiers: Free / Pro / Plus / Ultra
 * Pro $20/mo 2000 credits, Plus $60/mo 6000 credits, Ultra $200/mo 40000 credits
 */
export type SubscriptionTier = 'free' | 'pro' | 'plus' | 'ultra';

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  { name: string; priceMonthly: number; creditsPerMonth: number; usagePerMonth: number }
> = {
  free: { name: 'Free', priceMonthly: 0, creditsPerMonth: 0, usagePerMonth: 0 },
  pro: { name: 'Pro', priceMonthly: 20, creditsPerMonth: 2000, usagePerMonth: 2000 },
  plus: { name: 'Plus', priceMonthly: 60, creditsPerMonth: 6000, usagePerMonth: 6000 },
  ultra: { name: 'Ultra', priceMonthly: 200, creditsPerMonth: 40000, usagePerMonth: 40000 },
};

export const USAGE_PER_CREDIT = 100;

export function getMonthlyUsageAllowance(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier]?.usagePerMonth ?? 0;
}

export function isPaidTier(tier: string): tier is 'pro' | 'plus' | 'ultra' {
  return tier === 'pro' || tier === 'plus' || tier === 'ultra';
}

export const TIER_ORDER: Record<SubscriptionTier, number> = { free: 0, pro: 1, plus: 2, ultra: 3 };

export function capitalizeTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Stripe monthly subscription Price ID.
 * Prefers STRIPE_PRO_PRICE_ID (consistent with .env.example),
 * with fallback to the legacy variable name STRIPE_PRICE_PRO.
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
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PLUS_PRICE_ID) return 'plus';
  if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return 'ultra';
  return null;
}
