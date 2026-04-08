import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { getSpendingByGame } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const gameIds: string[] = Array.isArray(body.gameIds) ? body.gameIds.slice(0, 100) : [];

    const spending = await getSpendingByGame(user.id, gameIds);
    return NextResponse.json({ spending });
  } catch (error) {
    console.error('Game spending fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch game spending' }, { status: 500 });
  }
}
