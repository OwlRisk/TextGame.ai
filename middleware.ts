import { NextRequest, NextResponse } from "next/server";
import { isValidSEOLocale } from "@/lib/seo-locales";

/**
 * Middleware handles:
 * 1. Locale prefix validation for /[locale]/* routes
 * 2. Trailing slash normalization (remove trailing /)
 * 3. www → non-www canonical redirect
 * 4. Sets x-locale header for downstream use
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ── www → non-www redirect ──
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./, "");
    return NextResponse.redirect(url, 301);
  }

  // ── Trailing slash removal (except root /) ──
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 301);
  }

  // ── Locale detection from URL prefix ──
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && isValidSEOLocale(maybeLocale)) {
    const response = NextResponse.next();
    response.headers.set("x-locale", maybeLocale);
    response.headers.set("Content-Language", maybeLocale === "zh" ? "zh-CN" : maybeLocale);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, site.webmanifest, robots.txt, sitemap.xml
     * - Static assets (images, sounds, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|site\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|mp4|woff2?|ttf|css|js)).*)",
  ],
};
