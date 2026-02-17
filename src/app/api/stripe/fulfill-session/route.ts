import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { addTokens } from '@/lib/tokens';

/**
 * After Stripe Checkout success, the client calls this to credit tokens.
 * Used when webhook doesn't fire (e.g. local dev). Idempotent with webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { session_id: sessionId, accessToken: tokenFromBody } = body;

    let user = (typeof tokenFromBody === 'string' && tokenFromBody.trim())
      ? await getAuthUserFromToken(tokenFromBody.trim())
      : null;
    if (!user) user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
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

    await addTokens(
      user.id,
      tokens,
      'purchase',
      `Purchased ${tokens} coins`,
      paymentIntentId
    );

    return NextResponse.json({ credited: true, tokens });
  } catch (error) {
    console.error('[fulfill-session]', error);
    return NextResponse.json(
      {
        error: 'Failed to fulfill session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
