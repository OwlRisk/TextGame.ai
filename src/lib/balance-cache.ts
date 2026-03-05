/** Short-lived balance cache to reduce redundant requests; invalidate after adding coins */

const cache = new Map<
  string,
  { data: { tokens: number; isPro: boolean; subscriptionStatus: string }; ts: number }
>();
const TTL_MS = 2000;

export function getCachedBalance(userId: string): { tokens: number; isPro: boolean; subscriptionStatus: string } | null {
  const ent = cache.get(userId);
  if (!ent || Date.now() - ent.ts > TTL_MS) return null;
  return ent.data;
}

export function setCachedBalance(
  userId: string,
  data: { tokens: number; isPro: boolean; subscriptionStatus: string }
) {
  cache.set(userId, { data, ts: Date.now() });
}

export function invalidateBalanceCache(userId: string) {
  cache.delete(userId);
}
