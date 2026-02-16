import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { getCustomerId, setCustomerId, getTokenPackages } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, packageId } = body; // type: 'subscription' | 'tokens'

    if (!type || !['subscription', 'tokens'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "subscription" or "tokens"' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = await getCustomerId(user.id);

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { 
          userId: user.id,
          supabaseId: user.id,
        },
      });
      customerId = customer.id;
      await setCustomerId(user.id, customerId);
    }

    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`;
    const cancelUrl = `${origin}/pricing?cancelled=true`;

    if (type === 'subscription') {
      // Create subscription checkout session
      if (!STRIPE_PRO_PRICE_ID) {
        return NextResponse.json(
          { error: 'Stripe Pro Price ID not configured' },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: STRIPE_PRO_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          type: 'subscription',
        },
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Token purchase
      if (!packageId) {
        return NextResponse.json(
          { error: 'Package ID is required for token purchase' },
          { status: 400 }
        );
      }

      const packages = await getTokenPackages();
      const selectedPackage = packages.find((pkg: any) => pkg.id === packageId);

      if (!selectedPackage) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: selectedPackage.price_cents,
              product_data: {
                name: selectedPackage.name,
                description: `${selectedPackage.tokens.toLocaleString()} tokens${selectedPackage.bonus_percentage > 0 ? ` (+${selectedPackage.bonus_percentage}% bonus)` : ''}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          packageId: selectedPackage.id,
          tokens: selectedPackage.tokens.toString(),
          type: 'tokens',
        },
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
