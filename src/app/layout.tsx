import type { Metadata, Viewport } from "next";
import { headers, cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import "../styles/index.css";
import { GameProvider } from "@/app/contexts/GameContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { SuppressFastRefreshLogs } from "@/app/components/suppress-fast-refresh-logs";
import { SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import { buildHreflangAlternates } from "@/lib/seo-locales";

import { GoogleAnalyticsWrapper } from "@/app/components/google-analytics";
import { CookieConsent } from "@/app/components/cookie-consent";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_DOMAIN),
  title: {
    default: SITE_TITLE,
    template: "%s | TextGame.ai",
  },
  description: SITE_DESCRIPTION,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  keywords: [
    "TextGame.ai",
    "AI RPG",
    "AI text adventure",
    "AI dungeon master",
    "AI game master",
    "ai text rpg",
    "text based rpg",
    "AI role-playing game",
    "AI storytelling",
    "AI game maker",
    "create your own RPG",
    "community RPG platform",
    "user-generated AI games",
  ],
  alternates: {
    canonical: "/",
    languages: buildHreflangAlternates("/"),
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_DOMAIN,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/hero.webp",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/hero.webp"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_DOMAIN,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_DOMAIN}/discover?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_DOMAIN,
  logo: `${SITE_DOMAIN}/logo.png`,
  sameAs: [],
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  url: SITE_DOMAIN,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "50",
    priceCurrency: "USD",
    offerCount: "4",
  },
  // aggregateRating omitted — add back when real user review data is available
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const jar = await cookies();
  const inEEA = hdrs.get("x-in-eea") === "1";
  const gaConsent = jar.get("ga_consent")?.value;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

  return (
    <html lang="en" className={`${GeistSans.variable} h-full overflow-hidden [-webkit-tap-highlight-color:transparent]`}>
      <head>
        {/* Reset Safari iOS zoom state on every page load.
            Safari remembers zoom levels between navigations/refreshes.
            Temporarily clamping maximum-scale=1 forces it back to 1,
            then we restore the original value so users can still pinch-zoom. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var m=document.querySelector('meta[name="viewport"]');if(!m)return;var c=m.getAttribute('content')||'';m.setAttribute('content',c+',maximum-scale=1');requestAnimationFrame(function(){m.setAttribute('content',c);});})();` }} />
        <link rel="preconnect" href="https://hazjbhhreltgjexxaazn.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {process.env.NEXT_PUBLIC_SEARCH_CONSOLE_ID && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_SEARCH_CONSOLE_ID} />
        )}
        {process.env.NEXT_PUBLIC_BING_VERIFICATION_ID && (
          <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION_ID} />
        )}
      </head>
      <body className="antialiased h-full overflow-hidden safe-area-padding" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
        {/* Static crawlable content for search engines (hidden from sighted users) */}
        <noscript>
          <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            <h1>{SITE_NAME} — AI RPG Platform</h1>
            <p>{SITE_DESCRIPTION}</p>
            <h2>Create &amp; Play AI Text RPGs</h2>
            <p>
              Build your own AI-powered text RPG in minutes, then share a link so friends can play it
              with you. The AI Game Master narrates every scene, runs every encounter, and brings your
              characters to life.
            </p>
            {/* Plain <a> is intentional inside <noscript> — Next.js <Link> requires JS for SPA nav */}
            <nav>
              {/* eslint-disable @next/next/no-html-link-for-pages */}
              <a href="/discover">Discover RPG Adventures</a>
              <a href="/create">Create Your Own RPG</a>
              <a href="/recharge">Buy Credits</a>
              <a href="/signin">Sign In</a>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
              {/* eslint-enable @next/next/no-html-link-for-pages */}
            </nav>
          </div>
        </noscript>
        <SuppressFastRefreshLogs />
        <AuthProvider>
          <main id="main-content" className="h-full"><GameProvider>{children}</GameProvider></main>
        </AuthProvider>
        <GoogleAnalyticsWrapper gaId={gaId} inEEA={inEEA && gaConsent !== "granted"} />
        <CookieConsent inEEA={inEEA && gaConsent !== "granted" && gaConsent !== "denied"} />
        <Analytics />
      </body>
    </html>
  );
}
