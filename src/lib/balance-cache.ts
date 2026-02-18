/** 短期余额缓存，减少重复请求；加币后需 invalidate */

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
