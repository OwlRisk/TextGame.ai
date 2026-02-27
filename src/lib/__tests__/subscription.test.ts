import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getMonthlyUsageAllowance,
  isPaidTier,
  getStripePriceIdForTier,
  getTierFromStripePriceId,
  SUBSCRIPTION_TIERS,
} from '../subscription';

// ─── SUBSCRIPTION_TIERS ───────────────────────────────────────────────────

describe('SUBSCRIPTION_TIERS', () => {
  it('free tier has 0 monthly usage', () => {
    expect(SUBSCRIPTION_TIERS.free.usagePerMonth).toBe(0);
    expect(SUBSCRIPTION_TIERS.free.priceMonthly).toBe(0);
  });

  it('paid tiers have increasing usage allowances', () => {
    expect(SUBSCRIPTION_TIERS.pro.usagePerMonth).toBeGreaterThan(0);
    expect(SUBSCRIPTION_TIERS.plus.usagePerMonth).toBeGreaterThan(SUBSCRIPTION_TIERS.pro.usagePerMonth);
    expect(SUBSCRIPTION_TIERS.ultra.usagePerMonth).toBeGreaterThan(SUBSCRIPTION_TIERS.plus.usagePerMonth);
  });

  it('paid tiers have increasing monthly prices', () => {
    expect(SUBSCRIPTION_TIERS.pro.priceMonthly).toBeGreaterThan(0);
    expect(SUBSCRIPTION_TIERS.plus.priceMonthly).toBeGreaterThan(SUBSCRIPTION_TIERS.pro.priceMonthly);
    expect(SUBSCRIPTION_TIERS.ultra.priceMonthly).toBeGreaterThan(SUBSCRIPTION_TIERS.plus.priceMonthly);
  });
});

// ─── getMonthlyUsageAllowance ─────────────────────────────────────────────

describe('getMonthlyUsageAllowance', () => {
  it('free → 0', () => {
    expect(getMonthlyUsageAllowance('free')).toBe(0);
  });

  it('pro → 2000', () => {
    expect(getMonthlyUsageAllowance('pro')).toBe(2000);
  });

  it('plus → 6000', () => {
    expect(getMonthlyUsageAllowance('plus')).toBe(6000);
  });

  it('ultra → 40000', () => {
    expect(getMonthlyUsageAllowance('ultra')).toBe(40000);
  });

  it('pro < plus < ultra', () => {
    expect(getMonthlyUsageAllowance('pro')).toBeLessThan(getMonthlyUsageAllowance('plus'));
    expect(getMonthlyUsageAllowance('plus')).toBeLessThan(getMonthlyUsageAllowance('ultra'));
  });
});

// ─── isPaidTier ───────────────────────────────────────────────────────────

describe('isPaidTier', () => {
  it('returns true for pro', () => {
    expect(isPaidTier('pro')).toBe(true);
  });

  it('returns true for plus', () => {
    expect(isPaidTier('plus')).toBe(true);
  });

  it('returns true for ultra', () => {
    expect(isPaidTier('ultra')).toBe(true);
  });

  it('returns false for free', () => {
    expect(isPaidTier('free')).toBe(false);
  });

  it('returns false for cancelled', () => {
    expect(isPaidTier('cancelled')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isPaidTier('')).toBe(false);
  });

  it('returns false for unknown tier', () => {
    expect(isPaidTier('enterprise')).toBe(false);
  });
});

// ─── getStripePriceIdForTier ──────────────────────────────────────────────

describe('getStripePriceIdForTier', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_test_123');
    vi.stubEnv('STRIPE_PLUS_PRICE_ID', 'price_plus_test_456');
    vi.stubEnv('STRIPE_ULTRA_PRICE_ID', 'price_ultra_test_789');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('pro → STRIPE_PRO_PRICE_ID', () => {
    expect(getStripePriceIdForTier('pro')).toBe('price_pro_test_123');
  });

  it('plus → STRIPE_PLUS_PRICE_ID', () => {
    expect(getStripePriceIdForTier('plus')).toBe('price_plus_test_456');
  });

  it('ultra → STRIPE_ULTRA_PRICE_ID', () => {
    expect(getStripePriceIdForTier('ultra')).toBe('price_ultra_test_789');
  });

  it('returns null when env var is not set', () => {
    vi.unstubAllEnvs();
    expect(getStripePriceIdForTier('pro')).toBeNull();
    expect(getStripePriceIdForTier('plus')).toBeNull();
    expect(getStripePriceIdForTier('ultra')).toBeNull();
  });

  it('falls back to STRIPE_PRICE_PRO legacy env var for pro', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('STRIPE_PRICE_PRO', 'price_legacy_pro');
    expect(getStripePriceIdForTier('pro')).toBe('price_legacy_pro');
  });
});

// ─── getTierFromStripePriceId ─────────────────────────────────────────────

describe('getTierFromStripePriceId', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro_test_123');
    vi.stubEnv('STRIPE_PLUS_PRICE_ID', 'price_plus_test_456');
    vi.stubEnv('STRIPE_ULTRA_PRICE_ID', 'price_ultra_test_789');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('recognises pro price ID', () => {
    expect(getTierFromStripePriceId('price_pro_test_123')).toBe('pro');
  });

  it('recognises plus price ID', () => {
    expect(getTierFromStripePriceId('price_plus_test_456')).toBe('plus');
  });

  it('recognises ultra price ID', () => {
    expect(getTierFromStripePriceId('price_ultra_test_789')).toBe('ultra');
  });

  it('returns null for unknown price ID', () => {
    expect(getTierFromStripePriceId('price_unknown_000')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getTierFromStripePriceId('')).toBeNull();
  });

  it('round-trips: getStripePriceIdForTier → getTierFromStripePriceId', () => {
    const tiers = ['pro', 'plus', 'ultra'] as const;
    tiers.forEach((tier) => {
      const priceId = getStripePriceIdForTier(tier)!;
      expect(getTierFromStripePriceId(priceId)).toBe(tier);
    });
  });
});
