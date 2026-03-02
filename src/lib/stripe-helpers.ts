/**
 * Pure business-logic helpers for Stripe payment/subscription flows.
 * Extracted here so they can be unit-tested without importing the Stripe SDK,
 * database pool, or Next.js internals.
 */

import type { SubscriptionStatus } from '@/lib/tokens';

/**
 * Map a Stripe subscription status + resolved tier to the app's subscription status.
 *
 * Used in:
 *  - `customer.subscription.updated` webhook
 *  - sync-subscription route
 *
 * Rules:
 *  - active   → tier (e.g. "pro") or "pro" as fallback when tier is unknown
 *  - canceled → "cancelled" (our spelling)
 *  - anything else (past_due, incomplete, trialing…) → "free"
 */
export function resolveSubscriptionStatus(
  stripeStatus: string,
  tier: string | null
): SubscriptionStatus {
  if (stripeStatus === 'active') return (tier as SubscriptionStatus) ?? 'pro';
  if (stripeStatus === 'canceled') return 'cancelled';
  return 'free';
}

/**
 * Map a Stripe subscription status to the new app status after a payment failure.
 * Returns null when no status change is appropriate (Stripe will retry).
 *
 * Used in the `invoice.payment_failed` webhook handler.
 *
 * Rules:
 *  - canceled | unpaid → "cancelled"
 *  - past_due          → "free"  (access revoked while Stripe retries)
 *  - active | trialing → null    (still retrying, don't change status)
 */
export function resolvePaymentFailedStatus(stripeStatus: string): SubscriptionStatus | null {
  if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') return 'cancelled';
  if (stripeStatus === 'past_due') return 'free';
  return null;
}

/**
 * Whether the monthly usage allowance should be granted during fulfillment.
 * Returns false if the user is already on the target tier to prevent double-grants
 * when both the webhook and the fulfill-session route run.
 *
 * Used in:
 *  - fulfill-session route
 *  - sync-subscription route
 */
export function shouldGrantMonthlyAllowance(
  newTier: string,
  currentStatus: string
): boolean {
  const isPaid = newTier === 'pro' || newTier === 'plus' || newTier === 'ultra';
  return isPaid && currentStatus !== newTier;
}
