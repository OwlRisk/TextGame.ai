import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getUserBalance, getRecentTransactions, getTokenPackages } from '@/lib/tokens';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ tokens: 0, isPro: false, subscriptionStatus: 'free' });
    }
    const balance = await getUserBalance(user.id);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('Balance fetch error:', error);
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
    const balance = await getUserBalance(user.id);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
