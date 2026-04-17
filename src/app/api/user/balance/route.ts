import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, getAuthUserFromToken } from '@/lib/auth-server';
import { getCachedBalance, setCachedBalance } from '@/lib/balance-cache';
import { getUserBalance } from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' },
        { status: 503 }
      );
    }
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ tokens: 0 });
    }
    const cached = getCachedBalance(user.id);
    if (cached) return NextResponse.json(cached);
    const balance = await getUserBalance(user.id);
    setCachedBalance(user.id, balance);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('[balance] GET error:', error);
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}

/** POST accepts body.accessToken (consistent with create-checkout) to ensure balance retrieval */
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' },
        { status: 503 }
      );
    }
    let user = null;
    const body = await request.json().catch(() => ({}));
    const token = body?.accessToken;
    if (typeof token === 'string' && token.trim()) {
      user = await getAuthUserFromToken(token.trim());
    }
    if (!user) user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ tokens: 0 });
    }
    const cached = getCachedBalance(user.id);
    if (cached) return NextResponse.json(cached);
    const balance = await getUserBalance(user.id);
    setCachedBalance(user.id, balance);
    return NextResponse.json(balance);
  } catch (error) {
    console.error('[balance] POST error:', error);
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
