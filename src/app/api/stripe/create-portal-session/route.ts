import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { pool } from '@/lib/pg-pool';

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

    const result = await pool.query(
      'SELECT customer_id FROM user_profiles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    const customerId = result.rows[0]?.customer_id as string | undefined;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this account' },
        { status: 400 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.nextUrl.origin}/subscription`,
    });

    if (!portal.url) {
      console.error('[create-portal-session] Stripe portal URL is empty');
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
    }

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('[create-portal-session] error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

