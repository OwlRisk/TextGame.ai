import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs on the Edge before any page is rendered.
 * If the user has a valid auth cookie and visits the root path,
 * redirect them server-side to /create so no login-page flash occurs.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept the root path
  if (pathname !== '/') return NextResponse.next();

  const token = request.cookies.get('sb-access-token')?.value;
  if (!token) return NextResponse.next();

  // Decode the JWT payload (no signature verification needed here —
  // the real auth check still happens client-side via Supabase).
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );
    const exp: number = payload?.exp ?? 0;
    // Only redirect if the token hasn't expired yet
    if (exp > Date.now() / 1000) {
      return NextResponse.redirect(new URL('/create', request.url));
    }
  } catch {
    // Malformed token — let the page handle it normally
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
