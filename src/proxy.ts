import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EEA_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", // EEA non-EU
  "GB", // UK GDPR
]);

/**
 * Locales we ship a localised landing page for. Keep this in sync with
 * SEO_LOCALES in `lib/seo-locales.ts` — duplicated here because the proxy
 * runs at the edge and needs zero deps to start fast.
 */
const SEO_LOCALES = new Set([
  "zh", "ja", "ko", "es", "fr", "de", "pt", "ru",
  "it", "ar", "hi", "tr", "id", "vi", "th", "pl", "nl", "uk",
]);

/** Cookie name set on first auto-redirect / locale switcher click. When
 *  present we trust the user's pinned choice and never auto-redirect again,
 *  so navigating back to "/" stays on "/" (English). */
const LOCALE_COOKIE = "tg_locale";

/** Parse the browser's Accept-Language header, returning the highest-quality
 *  language tag whose primary subtag matches one of our SEO locales.
 *
 *  E.g. "zh-CN,zh;q=0.9,en;q=0.8" → "zh"
 *  Returns null when nothing matches (English-only browsers stay on "/"). */
function pickPreferredSeoLocale(acceptLang: string | null): string | null {
  if (!acceptLang) return null;
  const tags = acceptLang
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.split("=")[1]) : 1;
      return { tag: tag.toLowerCase().trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((t) => t.tag)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    const primary = tag.split("-")[0];
    if (SEO_LOCALES.has(primary)) return primary;
    // English wins explicitly even if it's not first — apex "/" is the
    // English canonical, so we should NOT redirect English speakers.
    if (primary === "en") return null;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auto-redirect "/" to "/<locale>" when the browser's Accept-Language
  // points at a locale we ship and the user hasn't pinned a preference yet.
  // We only act on the EXACT apex "/"; deeper paths (/discover, /game/x, …)
  // are left alone because they're either UX-driven or already locale-prefixed.
  if (pathname === "/") {
    const cookiePin = request.cookies.get(LOCALE_COOKIE)?.value;
    if (!cookiePin) {
      const preferred = pickPreferredSeoLocale(request.headers.get("accept-language"));
      if (preferred) {
        const url = request.nextUrl.clone();
        url.pathname = `/${preferred}`;
        const redirect = NextResponse.redirect(url, 307);
        // Pin the user's auto-selected locale so they're not bounced again
        // and so the locale switcher (if any) can read this default.
        redirect.cookies.set(LOCALE_COOKIE, preferred, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
        return redirect;
      }
    }
  }

  // Visiting a locale-prefixed home (/zh, /ja, …) refreshes the cookie pin
  // so subsequent visits to "/" don't auto-redirect away from the user's
  // explicitly-chosen locale (and so a Chinese visitor who came in via /zh
  // bookmark stays Chinese on later /-typed visits).
  const localePrefixMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  const response = NextResponse.next();
  if (localePrefixMatch && SEO_LOCALES.has(localePrefixMatch[1])) {
    response.cookies.set(LOCALE_COOKIE, localePrefixMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  const country = request.headers.get("x-vercel-ip-country") ?? "";
  response.headers.set("x-in-eea", EEA_COUNTRIES.has(country) ? "1" : "0");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav)$).*)",
  ],
};
