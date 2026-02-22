import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getCustomerId, updateSubscriptionStatus, grantMonthlyAllowance } from '@/lib/tokens';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import { getTierFromStripePriceId, type SubscriptionTier } from '@/lib/subscription';

/**
 * Sync subscription from Stripe to our DB.
 * Use when user already paid but the app still shows Free (e.g. fulfill-session or webhook didn't run).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokenFromBody = body?.accessToken;

    let user =
      typeof tokenFromBody === 'string' && tokenFromBody.trim()
        ? await getAuthUserFromToken(tokenFromBody.trim())
        : null;
    if (!user) user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customerId = await getCustomerId(user.id);
    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer linked. Subscribe first via Get Pro / Plus / Ultra.' },
        { status: 400 }
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const sub = subscriptions.data[0];
    if (!sub) {
      await updateSubscriptionStatus(user.id, 'free');
      invalidateBalanceCache(user.id);
      return NextResponse.json({ synced: true, tier: 'free' });
    }

    const priceId = sub.items?.data?.[0]?.price?.id;
    const tier = (priceId ? getTierFromStripePriceId(priceId) : null) as SubscriptionTier | null;
    const status = tier === 'pro' || tier === 'plus' || tier === 'ultra' ? tier : 'free';
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : undefined;

    const { getUserBalance } = await import('@/lib/tokens');
    const before = await getUserBalance(user.id);
    const currentStatus = before.subscriptionStatus;

    await updateSubscriptionStatus(
      user.id,
      status,
      sub.id,
      periodEnd
    );

    const shouldGrant =
      (status === 'pro' || status === 'plus' || status === 'ultra') &&
      (currentStatus === 'free' || currentStatus !== status);
    if (shouldGrant) {
      await grantMonthlyAllowance(user.id, status);
    }

    invalidateBalanceCache(user.id);

    return NextResponse.json({
      synced: true,
      tier: status,
      granted: shouldGrant,
    });
  } catch (error) {
    console.error('[sync-subscription]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to sync subscription', details: message },
      { status: 500 }
    );
  }
}
