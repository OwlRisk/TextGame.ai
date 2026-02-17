import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getCustomerId, setCustomerId, getTokenPackages } from '@/lib/tokens';

/** Match reference design package ids (starter, popular, pro, ...); price_cents and total tokens */
const REFERENCE_PACKAGES: Record<string, { name: string; price_cents: number; tokens: number }> = {
  starter: { name: 'Starter', price_cents: 500, tokens: 500 },
  popular: { name: 'Popular', price_cents: 1000, tokens: 1200 },
  pro: { name: 'Pro', price_cents: 2500, tokens: 3250 },
  ultimate: { name: 'Ultimate', price_cents: 5000, tokens: 7000 },
  mega: { name: 'Mega', price_cents: 10000, tokens: 15000 },
  legendary: { name: 'Legendary', price_cents: 20000, tokens: 32000 },
  immortal: { name: 'Immortal', price_cents: 50000, tokens: 85000 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { packageId, accessToken: tokenFromBody } = body;

    let user = (typeof tokenFromBody === 'string' && tokenFromBody.trim())
      ? await getAuthUserFromToken(tokenFromBody.trim())
      : null;
    if (!user) user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'X-Auth-Result': 'no-user' } }
      );
    }

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required for coin purchase' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer (DB failure is non-fatal)
    let customerId: string | null = null;
    try {
      customerId = await getCustomerId(user.id);
    } catch (e) {
      console.warn('getCustomerId failed, will create new Stripe customer:', (e as Error)?.message);
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
          supabaseId: user.id,
        },
      });
      customerId = customer.id;
      try {
        await setCustomerId(user.id, customerId);
      } catch (e) {
        console.warn('setCustomerId failed (session will still work):', (e as Error)?.message);
      }
    }

    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/recharge?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/recharge?cancelled=true`;

    const packages = await getTokenPackages();
    let selected = packages.find((pkg: { id: string }) => pkg.id === packageId);
    if (!selected && REFERENCE_PACKAGES[packageId]) {
      const ref = REFERENCE_PACKAGES[packageId];
      selected = { id: packageId, name: ref.name, price_cents: ref.price_cents, tokens: ref.tokens, bonus_percentage: 0 };
    }
    if (!selected) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const price_cents = selected.price_cents ?? (selected as { price_cents?: number }).price_cents;
    const tokens = selected.tokens ?? (selected as { tokens?: number }).tokens;
    const name = selected.name ?? (selected as { name?: string }).name;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price_cents,
            product_data: {
              name: name ?? 'Coins',
              description: `${Number(tokens).toLocaleString()} coins`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        packageId: String(selected.id),
        tokens: String(tokens),
        type: 'tokens',
      },
      allow_promotion_codes: true,
    });

    const checkoutUrl = session.url ?? null;
    if (!checkoutUrl) {
      console.error('Stripe checkout session created but url is null', { sessionId: session.id });
      return NextResponse.json(
        { error: 'Stripe did not return checkout URL', details: 'session.url is empty' },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stripeMessage = error && typeof error === 'object' && 'raw' in error
      ? String((error as { raw?: { message?: string } }).raw?.message ?? message)
      : message;
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: stripeMessage },
      { status: 500 }
    );
  }
}
