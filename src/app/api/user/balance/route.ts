import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getCachedBalance, setCachedBalance } from '@/lib/balance-cache';
import { getUserBalance } from '@/lib/tokens';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ tokens: 0, isPro: false, subscriptionStatus: 'free' });
    }
    const cached = getCachedBalance(user.id);
    if (cached) return NextResponse.json(cached);
    const balance = await getUserBalance(user.id);
    setCachedBalance(user.id, balance);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('[balance] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}

/** POST 支持 body.accessToken，与 create-checkout 一致，确保能拿到用户余额 */
export async function POST(request: NextRequest) {
  try {
    let user = null;
    const body = await request.json().catch(() => ({}));
    const token = body?.accessToken;
    if (typeof token === 'string' && token.trim()) {
      user = await getAuthUserFromToken(token.trim());
    }
    if (!user) user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ tokens: 0, isPro: false, subscriptionStatus: 'free' });
    }
    const cached = getCachedBalance(user.id);
    if (cached) return NextResponse.json(cached);
    const balance = await getUserBalance(user.id);
    setCachedBalance(user.id, balance);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('[balance] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
