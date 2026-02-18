import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import { addTokens } from '@/lib/tokens';

/**
 * After Stripe Checkout success, the client calls this to credit tokens.
 * Used when webhook doesn't fire (e.g. local dev). Idempotent with webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { session_id: sessionId, accessToken: tokenFromBody } = body;
    console.log('[fulfill-session] sessionId=', sessionId, 'hasAccessToken=', !!tokenFromBody);

    let user = (typeof tokenFromBody === 'string' && tokenFromBody.trim())
      ? await getAuthUserFromToken(tokenFromBody.trim())
      : null;
    if (!user) user = await getAuthUserFromRequest(request);

    if (!user) {
      console.log('[fulfill-session] no user, 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[fulfill-session] userId=', user.id);

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId.trim(), {
      expand: ['payment_intent'],
    });
    console.log('[fulfill-session] Stripe session payment_status=', session.payment_status, 'metadata=', session.metadata);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', payment_status: session.payment_status },
        { status: 400 }
      );
    }

    if (session.metadata?.userId !== user.id) {
      console.log('[fulfill-session] userId mismatch: session.metadata.userId=', session.metadata?.userId, 'user.id=', user.id);
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    if (session.mode !== 'payment') {
      return NextResponse.json(
        { error: 'Not a one-time payment session' },
        { status: 400 }
      );
    }

    const tokens = parseInt(session.metadata?.tokens || '0', 10);
    if (tokens <= 0) {
      return NextResponse.json(
        { error: 'Invalid tokens in session' },
        { status: 400 }
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as { id?: string })?.id;
    console.log('[fulfill-session] calling addTokens userId=', user.id, 'tokens=', tokens, 'paymentIntentId=', paymentIntentId);

    await addTokens(
      user.id,
      tokens,
      'purchase',
      `Purchased ${tokens} coins`,
      paymentIntentId
    );
    invalidateBalanceCache(user.id);

    console.log('[fulfill-session] addTokens done, returning credited=true');
    return NextResponse.json({ credited: true, tokens });
  } catch (error) {
    console.error('[fulfill-session] error:', error);
    console.error('[fulfill-session] error stack:', error instanceof Error ? error.stack : 'no stack');
    return NextResponse.json(
      {
        error: 'Failed to fulfill session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
