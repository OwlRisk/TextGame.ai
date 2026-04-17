import { NextRequest, NextResponse } from 'next/server';
import { getTokenPackages } from '@/lib/tokens';

export async function GET(_request: NextRequest) {
  try {
    const packages = await getTokenPackages();
    
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Packages fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token packages' },
      { status: 500 }
    );
  }
}
