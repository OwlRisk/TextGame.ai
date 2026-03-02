import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCachedBalance, setCachedBalance, invalidateBalanceCache } from '../balance-cache';

const SAMPLE = { tokens: 500, isPro: true, subscriptionStatus: 'pro' };
const USER_A = 'user-aaa';
const USER_B = 'user-bbb';

// Each test starts with a clean cache by invalidating both users
beforeEach(() => {
  invalidateBalanceCache(USER_A);
  invalidateBalanceCache(USER_B);
});

// ─── setCachedBalance / getCachedBalance ──────────────────────────────────

describe('setCachedBalance + getCachedBalance', () => {
  it('returns null when nothing is cached', () => {
    expect(getCachedBalance(USER_A)).toBeNull();
  });

  it('returns the cached value immediately after setting', () => {
    setCachedBalance(USER_A, SAMPLE);
    expect(getCachedBalance(USER_A)).toEqual(SAMPLE);
  });

  it('stores separate caches for different users', () => {
    const dataA = { tokens: 100, isPro: false, subscriptionStatus: 'free' };
    const dataB = { tokens: 999, isPro: true, subscriptionStatus: 'ultra' };
    setCachedBalance(USER_A, dataA);
    setCachedBalance(USER_B, dataB);
    expect(getCachedBalance(USER_A)).toEqual(dataA);
    expect(getCachedBalance(USER_B)).toEqual(dataB);
  });

  it('overwrites previous cached value for the same user', () => {
    setCachedBalance(USER_A, SAMPLE);
    const updated = { tokens: 200, isPro: false, subscriptionStatus: 'free' };
    setCachedBalance(USER_A, updated);
    expect(getCachedBalance(USER_A)).toEqual(updated);
  });
});

// ─── invalidateBalanceCache ───────────────────────────────────────────────

describe('invalidateBalanceCache', () => {
  it('removes the cached entry for the given user', () => {
    setCachedBalance(USER_A, SAMPLE);
    invalidateBalanceCache(USER_A);
    expect(getCachedBalance(USER_A)).toBeNull();
  });

  it('does not affect other users when one is invalidated', () => {
    setCachedBalance(USER_A, SAMPLE);
    setCachedBalance(USER_B, SAMPLE);
    invalidateBalanceCache(USER_A);
    expect(getCachedBalance(USER_A)).toBeNull();
    expect(getCachedBalance(USER_B)).toEqual(SAMPLE);
  });

  it('is safe to call when no cache exists for that user', () => {
    expect(() => invalidateBalanceCache('non-existent-user')).not.toThrow();
  });
});

// ─── TTL expiry ───────────────────────────────────────────────────────────

describe('getCachedBalance – TTL expiry', () => {
  it('returns null after the 2-second TTL has passed', () => {
    // Freeze time at T=0, then advance by 3 seconds
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValueOnce(now).mockReturnValue(now + 3000);

    setCachedBalance(USER_A, SAMPLE);
    expect(getCachedBalance(USER_A)).toBeNull();

    vi.restoreAllMocks();
  });

  it('returns the value while still within the TTL window', () => {
    const now = Date.now();
    // Write at T=0, read at T=1000 (1 second, within 2s TTL)
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now)   // setCachedBalance call
      .mockReturnValue(now + 1000); // getCachedBalance call

    setCachedBalance(USER_A, SAMPLE);
    expect(getCachedBalance(USER_A)).toEqual(SAMPLE);

    vi.restoreAllMocks();
  });
});
