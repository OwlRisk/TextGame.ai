import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addTokens, rechargeCoinsFromPayment } from '@/lib/tokens';
import { invalidateBalanceCache } from '@/lib/balance-cache';
import Stripe from 'stripe';
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
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
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

        if (session.mode === 'payment') {
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
            invalidateBalanceCache(userId);
            logger.log(`[Token Purchase] User ${userId} purchased ${tokens} credits (${amountCents}¢)`);
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
