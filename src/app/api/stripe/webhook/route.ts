import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addTokens, updateSubscriptionStatus, rechargeCoinsFromPayment, grantMonthlyAllowance } from '@/lib/tokens';
import { getTierFromStripePriceId } from '@/lib/subscription';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import Stripe from 'stripe';
import { pool } from '@/lib/pg-pool';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        console.log(`[Checkout Complete] User: ${userId}, Mode: ${session.mode}`);

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = priceId ? getTierFromStripePriceId(priceId) : null;
          const status = (tier ?? 'pro') as 'pro';

          await updateSubscriptionStatus(
            userId,
            status,
            subscriptionId,
            new Date(subscription.current_period_end * 1000)
          );
          await grantMonthlyAllowance(userId, status);
          invalidateBalanceCache(userId);
          console.log(`[Subscription] User ${userId} → ${status}`);
        } else if (session.mode === 'payment') {
          const amountCents = session.amount_total ?? 0;
          const tokens = rechargeCoinsFromPayment(amountCents);
          if (tokens > 0) {
            await addTokens(
              userId,
              tokens,
              'purchase',
              `Purchased ${tokens} usage`,
              session.payment_intent as string
            );
            console.log(`[Token Purchase] User ${userId} purchased ${tokens} usage (${amountCents}¢)`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Subscription Updated] Status: ${subscription.status}`);

        const result = await pool.query(
          'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
          [subscription.id]
        );
        if (result.rows.length === 0) break;

        const userId = result.rows[0].user_id;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const tier = priceId ? getTierFromStripePriceId(priceId) : null;
        const status =
          subscription.status === 'active'
            ? (tier ?? 'pro')
            : subscription.status === 'canceled'
              ? 'cancelled'
              : 'free';

        await updateSubscriptionStatus(
          userId,
          status,
          subscription.id,
          new Date(subscription.current_period_end * 1000)
        );
        invalidateBalanceCache(userId);
        console.log(`[Subscription] User ${userId} → ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const result = await pool.query(
          'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
          [subscription.id]
        );
        if (result.rows.length === 0) break;
        const userId = result.rows[0].user_id;
        await updateSubscriptionStatus(
          userId,
          'cancelled',
          subscription.id,
          new Date(subscription.current_period_end * 1000)
        );
        invalidateBalanceCache(userId);
        console.log(`[Subscription] User ${userId} cancelled`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const result = await pool.query(
            'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
            [sub.id]
          );
          if (result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            const priceId = sub.items?.data?.[0]?.price?.id;
            const tier = priceId ? getTierFromStripePriceId(priceId) : 'pro';
            await updateSubscriptionStatus(
              userId,
              tier ?? 'pro',
              sub.id,
              new Date(sub.current_period_end * 1000)
            );
            if (tier && tier !== 'free') await grantMonthlyAllowance(userId, tier);
            invalidateBalanceCache(userId);
            console.log(`[Subscription Renewed] User ${userId} → ${tier}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Payment Failed] Subscription: ${invoice.subscription}`);

        if (invoice.subscription) {
          const result = await pool.query(
            'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
            [invoice.subscription]
          );

          if (result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            console.log(`[Payment Failed] User ${userId} payment failed`);
            // Optionally handle failed payment (e.g., send notification)
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook Error]', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
