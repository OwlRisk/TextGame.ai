import { describe, it, expect } from 'vitest';
import {
  resolveSubscriptionStatus,
  resolvePaymentFailedStatus,
  shouldGrantMonthlyAllowance,
} from '../stripe-helpers';

// ─── resolveSubscriptionStatus ────────────────────────────────────────────

describe('resolveSubscriptionStatus', () => {
  it('active + known tier → returns the tier', () => {
    expect(resolveSubscriptionStatus('active', 'pro')).toBe('pro');
    expect(resolveSubscriptionStatus('active', 'plus')).toBe('plus');
    expect(resolveSubscriptionStatus('active', 'ultra')).toBe('ultra');
  });

  it('active + null tier → falls back to "pro"', () => {
    expect(resolveSubscriptionStatus('active', null)).toBe('pro');
  });

  it('canceled → "cancelled" (our spelling)', () => {
    expect(resolveSubscriptionStatus('canceled', 'pro')).toBe('cancelled');
    expect(resolveSubscriptionStatus('canceled', null)).toBe('cancelled');
  });

  it('past_due → "free"', () => {
    expect(resolveSubscriptionStatus('past_due', 'pro')).toBe('free');
  });

  it('incomplete → "free"', () => {
    expect(resolveSubscriptionStatus('incomplete', 'plus')).toBe('free');
  });

  it('trialing → "free" (not yet active)', () => {
    expect(resolveSubscriptionStatus('trialing', 'ultra')).toBe('free');
  });

  it('unpaid → "free"', () => {
    expect(resolveSubscriptionStatus('unpaid', null)).toBe('free');
  });

  it('empty string → "free"', () => {
    expect(resolveSubscriptionStatus('', null)).toBe('free');
  });
});

// ─── resolvePaymentFailedStatus ───────────────────────────────────────────

describe('resolvePaymentFailedStatus', () => {
  it('canceled → "cancelled"', () => {
    expect(resolvePaymentFailedStatus('canceled')).toBe('cancelled');
  });

  it('unpaid → "cancelled"', () => {
    expect(resolvePaymentFailedStatus('unpaid')).toBe('cancelled');
  });

  it('past_due → "free" (access revoked, Stripe still retrying)', () => {
    expect(resolvePaymentFailedStatus('past_due')).toBe('free');
  });

  it('active → null (payment retry in progress, no status change)', () => {
    expect(resolvePaymentFailedStatus('active')).toBeNull();
  });

  it('trialing → null (will retry)', () => {
    expect(resolvePaymentFailedStatus('trialing')).toBeNull();
  });

  it('unknown status → null', () => {
    expect(resolvePaymentFailedStatus('some_other_status')).toBeNull();
  });

  it('empty string → null', () => {
    expect(resolvePaymentFailedStatus('')).toBeNull();
  });
});

// ─── shouldGrantMonthlyAllowance ──────────────────────────────────────────

describe('shouldGrantMonthlyAllowance', () => {
  it('free → pro: should grant (first upgrade)', () => {
    expect(shouldGrantMonthlyAllowance('pro', 'free')).toBe(true);
  });

  it('free → plus: should grant', () => {
    expect(shouldGrantMonthlyAllowance('plus', 'free')).toBe(true);
  });

  it('free → ultra: should grant', () => {
    expect(shouldGrantMonthlyAllowance('ultra', 'free')).toBe(true);
  });

  it('pro → pro: should NOT grant (already on tier, prevents double-grant)', () => {
    expect(shouldGrantMonthlyAllowance('pro', 'pro')).toBe(false);
  });

  it('plus → plus: should NOT grant', () => {
    expect(shouldGrantMonthlyAllowance('plus', 'plus')).toBe(false);
  });

  it('ultra → ultra: should NOT grant', () => {
    expect(shouldGrantMonthlyAllowance('ultra', 'ultra')).toBe(false);
  });

  it('pro → plus (upgrade): should grant', () => {
    expect(shouldGrantMonthlyAllowance('plus', 'pro')).toBe(true);
  });

  it('ultra → pro (downgrade): should grant', () => {
    expect(shouldGrantMonthlyAllowance('pro', 'ultra')).toBe(true);
  });

  it('pro → cancelled (webhook fired first): should NOT grant', () => {
    expect(shouldGrantMonthlyAllowance('cancelled', 'pro')).toBe(false);
  });

  it('free → free: should NOT grant', () => {
    expect(shouldGrantMonthlyAllowance('free', 'free')).toBe(false);
  });

  it('free tier (new tier=free) → false regardless of current status', () => {
    expect(shouldGrantMonthlyAllowance('free', 'ultra')).toBe(false);
    expect(shouldGrantMonthlyAllowance('free', 'cancelled')).toBe(false);
  });
});
