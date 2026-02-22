import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { pool } from '@/lib/pg-pool';
import { getStripePriceIdForTier, getTierFromStripePriceId, type SubscriptionTier } from '@/lib/subscription';
import { grantMonthlyAllowance } from '@/lib/tokens';
import { invalidateBalanceCache } from '@/lib/balance-cache';

const PAID_TIERS: SubscriptionTier[] = ['pro', 'plus', 'ultra'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetTier, accessToken: tokenFromBody } = body as { targetTier?: string; accessToken?: string };

    let user =
      typeof tokenFromBody === 'string' && tokenFromBody.trim()
        ? await getAuthUserFromToken(tokenFromBody.trim())
        : null;
    if (!user) user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tier = (targetTier === 'pro' || targetTier === 'plus' || targetTier === 'ultra' ? targetTier : null) as SubscriptionTier | null;
    if (!tier) {
      return NextResponse.json(
        { error: 'targetTier must be pro, plus, or ultra' },
        { status: 400 }
      );
    }

    const priceId = getStripePriceIdForTier(tier);
    if (!priceId || !priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${tier}` },
        { status: 500 }
      );
    }

    const row = await pool.query<{ subscription_id: string | null; subscription_status: string | null }>(
      'SELECT subscription_id, subscription_status FROM user_profiles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    const subscriptionId = row.rows[0]?.subscription_id;
    const currentStatus = (row.rows[0]?.subscription_status || 'free') as string;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription. Use Subscribe to start a plan.' },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscription is not active. Use Manage subscription to reactivate.' },
        { status: 400 }
      );
    }

    const currentPriceId = subscription.items?.data?.[0]?.price?.id;
    const currentTier = currentPriceId ? getTierFromStripePriceId(currentPriceId) : null;
    if (currentTier === tier) {
      return NextResponse.json(
        { error: `Already on ${tier}` },
        { status: 400 }
      );
    }

    const itemId = subscription.items?.data?.[0]?.id;
    if (!itemId) {
      return NextResponse.json(
        { error: 'Subscription has no line item' },
        { status: 500 }
      );
    }

    // Reset billing cycle to upgrade day so next renewal = upgrade date + 1 month
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      billing_cycle_anchor: 'now',
      proration_behavior: 'create_prorations',
    });
    const periodEnd = updated.current_period_end
      ? new Date(updated.current_period_end * 1000)
      : null;

    await pool.query(
      `UPDATE user_profiles SET subscription_status = $1, subscription_current_period_end = $2 WHERE user_id = $3`,
      [tier, periodEnd, user.id]
    );

    if (PAID_TIERS.includes(tier)) {
      await grantMonthlyAllowance(user.id, tier);
    }
    invalidateBalanceCache(user.id);

    return NextResponse.json({
      ok: true,
      tier,
      message: `Plan changed to ${tier}. Proration applied by Stripe.`,
    });
  } catch (error) {
    console.error('[change-plan]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to change plan', details: message },
      { status: 500 }
    );
  }
}
