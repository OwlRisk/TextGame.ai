import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import {
  addTokens,
  getUserBalance,
  grantMonthlyAllowance,
  rechargeCoinsFromPayment,
  setCustomerId,
  updateSubscriptionStatus,
} from '@/lib/tokens';
import { getTierFromStripePriceId, isPaidTier } from '@/lib/subscription';
import { shouldGrantMonthlyAllowance } from '@/lib/stripe-helpers';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { logger } from '@/lib/logger';

/**
 * After Stripe Checkout success, client calls this to fulfill payment/subscription.
 * Used when webhook doesn't fire in local dev.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' },
        { status: 503 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const { session_id: sessionId, accessToken: tokenFromBody } = body;
    logger.log('[fulfill-session] sessionId=', sessionId, 'hasAccessToken=', !!tokenFromBody);

    let user = (typeof tokenFromBody === 'string' && tokenFromBody.trim())
      ? await getAuthUserFromToken(tokenFromBody.trim())
      : null;
    if (!user) user = await getAuthUserFromRequest(request);

    if (!user) {
      logger.log('[fulfill-session] no user, 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.log('[fulfill-session] userId=', user.id);

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId.trim(), {
      expand: ['payment_intent'],
    });
    logger.log('[fulfill-session] Stripe session payment_status=', session.payment_status, 'metadata=', session.metadata);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', payment_status: session.payment_status },
        { status: 400 }
      );
    }

    if (session.metadata?.userId !== user.id) {
      logger.warn('[fulfill-session] userId mismatch: session.metadata.userId=', session.metadata?.userId, 'user.id=', user.id);
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    if (session.mode === 'subscription') {
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as { id?: string })?.id;

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'No subscription id in session' },
          { status: 400 }
        );
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tier = (priceId ? getTierFromStripePriceId(priceId) : 'pro') ?? 'pro';

      // Save customer_id so Sync my plan / Manage subscription work even if setCustomerId failed at checkout
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      if (customerId) {
        try {
          await setCustomerId(user.id, customerId);
        } catch (e) {
          logger.warn('[fulfill-session] setCustomerId failed (non-fatal):', (e as Error)?.message);
        }
      }

      // Avoid duplicate grant when webhook has already fulfilled this subscription.
      const before = await getUserBalance(user.id);
      const shouldGrant = shouldGrantMonthlyAllowance(tier, before.subscriptionStatus);

      await updateSubscriptionStatus(
        user.id,
        tier,
        subscription.id,
        new Date(subscription.current_period_end * 1000)
      );
      if (shouldGrant && isPaidTier(tier)) {
        await grantMonthlyAllowance(user.id, tier);
      }
      invalidateBalanceCache(user.id);

      return NextResponse.json({
        fulfilled: true,
        mode: 'subscription',
        subscriptionStatus: tier,
        grantedMonthlyAllowance: shouldGrant,
      });
    }

    if (session.mode !== 'payment') {
      return NextResponse.json(
        { error: 'Unsupported session mode' },
        { status: 400 }
      );
    }

    // Formula: payment amount × GPT ratio → coins (e.g. $10 → 500 coins = $5 GPT credit)
    const amountCents = session.amount_total ?? 0;
    const tokens = rechargeCoinsFromPayment(amountCents);
    if (tokens <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount in session' },
        { status: 400 }
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as { id?: string })?.id;
    logger.log('[fulfill-session] calling addTokens userId=', user.id, 'tokens=', tokens, 'paymentIntentId=', paymentIntentId);

    await addTokens(
      user.id,
      tokens,
      'purchase',
      `Purchased ${tokens} usage`,
      paymentIntentId
    );
    invalidateBalanceCache(user.id);

    logger.log('[fulfill-session] addTokens done, returning credited=true');
    return NextResponse.json({ credited: true, tokens });
  } catch (error) {
    logger.error('[fulfill-session] error:', error);
    logger.error('[fulfill-session] error stack:', error instanceof Error ? error.stack : 'no stack');
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fulfill session' },
      { status: 500 }
    );
  }
}
