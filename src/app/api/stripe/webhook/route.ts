import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addTokens, updateSubscriptionStatus, rechargeCoinsFromPayment, grantMonthlyAllowance } from '@/lib/tokens';
import { getTierFromStripePriceId } from '@/lib/subscription';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import { resolveSubscriptionStatus, resolvePaymentFailedStatus } from '@/lib/stripe-helpers';
import Stripe from 'stripe';
import { pool } from '@/lib/pg-pool';
import { logger } from '@/lib/logger';

const processedEvents = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function isEventProcessed(eventId: string): boolean {
  const ts = processedEvents.get(eventId);
  if (!ts) return false;
  if (Date.now() - ts > IDEMPOTENCY_TTL_MS) {
    processedEvents.delete(eventId);
    return false;
  }
  return true;
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
  if (processedEvents.size > 10_000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [id, ts] of processedEvents) {
      if (ts < cutoff) processedEvents.delete(id);
    }
  }
}

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

  if (isEventProcessed(event.id)) {
    logger.log(`[Stripe Webhook] Skipping duplicate event: ${event.id} (${event.type})`);
    return NextResponse.json({ received: true, duplicate: true });
  }
  markEventProcessed(event.id);

  try {
    logger.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        logger.log(`[Checkout Complete] User: ${userId}, Mode: ${session.mode}`);

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = priceId ? getTierFromStripePriceId(priceId) : null;
          if (!tier) {
            console.error(`[Webhook] Unknown price ID: ${priceId} — cannot determine tier, skipping`);
            break;
          }
          const status = tier;

          await updateSubscriptionStatus(
            userId,
            status,
            subscriptionId,
            new Date(subscription.current_period_end * 1000)
          );
          if (status === 'pro' || status === 'plus' || status === 'ultra') {
            await grantMonthlyAllowance(userId, status);
          }
          invalidateBalanceCache(userId);
          logger.log(`[Subscription] User ${userId} → ${status}`);
        } else if (session.mode === 'payment') {
          const metaTokens = session.metadata?.tokens ? parseInt(session.metadata.tokens, 10) : 0;
          const amountCents = session.amount_total ?? 0;
          const tokens = metaTokens > 0 ? metaTokens : rechargeCoinsFromPayment(amountCents);
          if (tokens > 0) {
            await addTokens(
              userId,
              tokens,
              'purchase',
              `Purchased ${tokens} credits`,
              session.payment_intent as string
            );
            logger.log(`[Token Purchase] User ${userId} purchased ${tokens} credits (${amountCents}¢)`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.log(`[Subscription Updated] Status: ${subscription.status}`);

        const result = await pool.query(
          'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
          [subscription.id]
        );
        if (result.rows.length === 0) break;

        const userId = result.rows[0].user_id;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const tier = priceId ? getTierFromStripePriceId(priceId) : null;
        const status = resolveSubscriptionStatus(subscription.status, tier);

        await updateSubscriptionStatus(
          userId,
          status,
          subscription.id,
          new Date(subscription.current_period_end * 1000)
        );
        invalidateBalanceCache(userId);
        logger.log(`[Subscription] User ${userId} → ${status}`);
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
        logger.log(`[Subscription] User ${userId} cancelled`);
        break;
      }

      // Stripe may emit either invoice.payment_succeeded (older) or invoice.paid (newer UI/API)
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
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
            const tier = priceId ? getTierFromStripePriceId(priceId) : null;
            if (!tier) {
              console.error(`[Webhook] invoice.paid: Unknown price ID: ${priceId}, skipping`);
              break;
            }
            await updateSubscriptionStatus(
              userId,
              tier,
              sub.id,
              new Date(sub.current_period_end * 1000)
            );
            if (tier === 'pro' || tier === 'plus' || tier === 'ultra') {
              await grantMonthlyAllowance(userId, tier);
            }
            invalidateBalanceCache(userId);
            logger.log(`[Subscription Renewed] User ${userId} → ${tier}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.log(`[Payment Failed] Subscription: ${invoice.subscription}`);

        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const result = await pool.query(
            'SELECT user_id FROM user_profiles WHERE subscription_id = $1',
            [sub.id]
          );

          if (result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            // Mark as past_due or cancelled depending on Stripe subscription status
            const newStatus = resolvePaymentFailedStatus(sub.status);

            if (newStatus) {
              await updateSubscriptionStatus(
                userId,
                newStatus,
                sub.id,
                new Date(sub.current_period_end * 1000)
              );
              invalidateBalanceCache(userId);
              logger.log(`[Payment Failed] User ${userId} → ${newStatus} (stripe: ${sub.status})`);
            } else {
              logger.log(`[Payment Failed] User ${userId}: stripe status=${sub.status}, no status change (will retry)`);
            }
          }
        }
        break;
      }

      default:
        logger.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook Error]', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
