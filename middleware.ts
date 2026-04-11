import { NextRequest, NextResponse } from "next/server";

// Inlined to avoid cross-module imports that break Sentry + Turbopack edge bundling.
// Must stay in sync with SEO_LOCALES in src/lib/seo-locales.ts.
const SEO_LOCALE_SET = new Set([
  "zh", "ja", "ko", "es", "fr", "de", "pt", "ru",
  "it", "ar", "hi", "tr", "id", "vi", "th", "pl", "nl", "uk",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./, "");
    return NextResponse.redirect(url, 301);
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 301);
  }

  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && SEO_LOCALE_SET.has(maybeLocale)) {
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
