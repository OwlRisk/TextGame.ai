import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import { addTokens, rechargeCoinsFromPayment } from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { logger } from '@/lib/logger';

/**
 * After Stripe Checkout success, client calls this to fulfill the recharge.
 * Used when the webhook doesn't fire in local dev.
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId.trim(), {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', payment_status: session.payment_status },
        { status: 400 }
      );
    }

    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    if (session.mode !== 'payment') {
      return NextResponse.json({ error: 'Unsupported session mode' }, { status: 400 });
    }

    const metaTokens = session.metadata?.tokens ? parseInt(session.metadata.tokens, 10) : 0;
    const amountCents = session.amount_total ?? 0;
    const tokens = metaTokens > 0 ? metaTokens : rechargeCoinsFromPayment(amountCents);
    if (tokens <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount in session' }, { status: 400 });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as { id?: string })?.id;

    await addTokens(
      user.id,
      tokens,
      'purchase',
      `Purchased ${tokens} credits`,
      paymentIntentId
    );
    invalidateBalanceCache(user.id);

    return NextResponse.json({ credited: true, tokens });
  } catch (error) {
    logger.error('[fulfill-session] error:', error);
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to fulfill session' }, { status: 500 });
  }
}
