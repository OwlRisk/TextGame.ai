import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getCustomerId, setCustomerId, getTokenPackages, rechargeCoinsFromPayment } from '@/lib/tokens';
import { getStripePriceIdForTier } from '@/lib/subscription';

/** 套餐展示用；实际到账 coins 由 rechargeCoinsFromPayment(price_cents) 公式计算 */
const REFERENCE_PACKAGES: Record<string, { name: string; price_cents: number }> = {
  starter: { name: 'Starter', price_cents: 500 },
  popular: { name: 'Popular', price_cents: 1000 },
  pro: { name: 'Pro', price_cents: 2500 },
  ultimate: { name: 'Ultimate', price_cents: 5000 },
  mega: { name: 'Mega', price_cents: 10000 },
  legendary: { name: 'Legendary', price_cents: 20000 },
  immortal: { name: 'Immortal', price_cents: 50000 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { packageId, subscriptionTier, accessToken: tokenFromBody } = body;

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

    const isSubscription = subscriptionTier === 'pro';
    if (!isSubscription && !packageId) {
      return NextResponse.json(
        { error: 'Package ID or subscriptionTier (pro) is required' },
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

    if (isSubscription) {
      const priceId = getStripePriceIdForTier(subscriptionTier);
      if (!priceId) {
        return NextResponse.json(
          { error: `Stripe price not configured for ${subscriptionTier}. Set STRIPE_PRICE_${subscriptionTier.toUpperCase()} in .env` },
          { status: 500 }
        );
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/subscription?cancelled=true`,
        metadata: {
          userId: user.id,
          type: 'subscription',
          tier: subscriptionTier,
        },
        subscription_data: { metadata: { userId: user.id, tier: subscriptionTier } },
        allow_promotion_codes: true,
      });
      const checkoutUrl = session.url ?? null;
      if (!checkoutUrl) {
        return NextResponse.json(
          { error: 'Stripe did not return checkout URL', details: 'session.url is empty' },
          { status: 500 }
        );
      }
      return NextResponse.json({ url: checkoutUrl });
    }

    const successUrl = `${origin}/recharge?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/recharge?cancelled=true`;

    const packages = await getTokenPackages();
    let selected = packages.find((pkg: { id: string }) => pkg.id === packageId);
    if (!selected && REFERENCE_PACKAGES[packageId]) {
      const ref = REFERENCE_PACKAGES[packageId];
      selected = { id: packageId, name: ref.name, price_cents: ref.price_cents, bonus_percentage: 0 };
    }
    if (!selected) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const price_cents = selected.price_cents ?? (selected as { price_cents?: number }).price_cents;
    const tokens = rechargeCoinsFromPayment(price_cents);
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
              name: name ?? 'Usage',
              description: `${Number(tokens).toLocaleString()} usage`,
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
