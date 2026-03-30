import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { pool } from '@/lib/pg-pool';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';

import { getTierFromStripePriceId } from '@/lib/subscription';

type Tier = 'free' | 'pro' | 'plus' | 'ultra';

interface SubscriptionDetails {
  tier: Tier;
  status: string;
  subscriptionId: string | null;
  subscribedAt: string | null;
  renewalAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  canManageBilling: boolean;
}

function toIsoOrNull(ts: number | null | undefined): string | null {
  if (!ts || ts <= 0) return null;
  return new Date(ts * 1000).toISOString();
}

function normalizeTier(status: string | null | undefined): Tier {
  const s = (status || 'free').toLowerCase();
  if (s === 'pro' || s === 'plus' || s === 'ultra') return s as Tier;
  return 'free';
}

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const tokenFromBody = body?.accessToken;

    let user =
      typeof tokenFromBody === 'string' && tokenFromBody.trim()
        ? await getAuthUserFromToken(tokenFromBody.trim())
        : null;
    if (!user) user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await pool.query(
      `SELECT subscription_status, subscription_id, subscription_current_period_end, customer_id
       FROM user_profiles
       WHERE user_id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      const empty: SubscriptionDetails = {
        tier: 'free',
        status: 'free',
        subscriptionId: null,
        subscribedAt: null,
        renewalAt: null,
        cancelAtPeriodEnd: false,
        cancelAt: null,
        canceledAt: null,
        canManageBilling: false,
      };
      return NextResponse.json(empty);
    }

    const row = result.rows[0] as {
      subscription_status?: string | null;
      subscription_id?: string | null;
      subscription_current_period_end?: string | Date | null;
      customer_id?: string | null;
    };

    const tier = normalizeTier(row.subscription_status);
    const fallbackRenewalAt = row.subscription_current_period_end
      ? new Date(row.subscription_current_period_end).toISOString()
      : null;

    const base: SubscriptionDetails = {
      tier,
      status: row.subscription_status || 'free',
      subscriptionId: row.subscription_id || null,
      subscribedAt: null,
      renewalAt: fallbackRenewalAt,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: null,
      canManageBilling: !!row.customer_id,
    };

    const isPaidTier = tier === 'pro' || tier === 'plus' || tier === 'ultra';
    if (!row.subscription_id || !isPaidTier) {
      return NextResponse.json(base);
    }

    try {
      const sub = await stripe.subscriptions.retrieve(row.subscription_id);
      const priceId = sub.items?.data?.[0]?.price?.id;
      const resolvedTier = (priceId ? getTierFromStripePriceId(priceId) : null) ?? tier;
      const details: SubscriptionDetails = {
        tier: resolvedTier,
        status: sub.status,
        subscriptionId: sub.id,
        subscribedAt: toIsoOrNull(sub.start_date),
        renewalAt: toIsoOrNull(sub.current_period_end) ?? fallbackRenewalAt,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        cancelAt: toIsoOrNull(sub.cancel_at),
        canceledAt: toIsoOrNull(sub.canceled_at),
        canManageBilling: !!row.customer_id,
      };
      return NextResponse.json(details);
    } catch (error) {
      console.warn('[subscription-details] stripe retrieve failed:', (error as Error)?.message);
      return NextResponse.json(base);
    }
  } catch (error) {
    console.error('[subscription-details] error:', error);
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

