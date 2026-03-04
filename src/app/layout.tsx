import type { Metadata, Viewport } from "next";
import "../styles/index.css";
import { GameProvider } from "@/app/contexts/GameContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { SuppressFastRefreshLogs } from "@/app/components/suppress-fast-refresh-logs";
import { SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_DOMAIN),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/site.webmanifest",
  keywords: [
    "textgame.ai",
    "AI text game",
    "text-based game",
    "AI game host",
    "multiplayer text adventure",
    "werewolf game AI",
    "AI role-playing game",
    "game design AI",
    "ai rpg",
    "ai text adventure",
    "character ai alternative",
    "ai character game",
    "roleplay ai",
    "ai dungeon master",
    "ai game generator",
    "ai game maker",
    "character ai",
    "play werewolf online",
    "play mafia online",
    "ai storytelling",
    "social deduction game",
    "ai npc",
    "ai characters",
    "multiplayer ai game",
    "text based rpg",
    "ai role play chat",
    "ai powered game",
    "online werewolf",
    "online mafia game",
    "ai text rpg",
    "character ai game",
    "free ai game",
    "ai board game",
    "custom ai game",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
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
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
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
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_DOMAIN}/games?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_DOMAIN,
  logo: `${SITE_DOMAIN}/icon.svg`,
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
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I create an AI text game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign in with Google, then describe your game idea in plain English to the AI Game Master — or pick a template like Werewolf, Mafia, or Who's the Spy. Set player count and optional rules. Your game is ready in about 2 minutes, no coding needed.",
      },
    },
    {
      "@type": "Question",
      name: "What is textgame.ai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "textgame.ai is an AI-powered platform for creating and playing multiplayer text-based games. An AI Game Master hosts every session — assigning roles, managing phases, and narrating the story. AI characters fill every seat so you can play solo or with friends.",
      },
    },
    {
      "@type": "Question",
      name: "Is textgame.ai a Character.AI alternative?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — textgame.ai offers AI characters with unique personalities, voices, and strategies in a game context. Unlike Character.AI, it focuses on multiplayer social deduction and RPG games with structured rules, an AI host, and real-time interaction between multiple AI and human players.",
      },
    },
    {
      "@type": "Question",
      name: "Can I play Werewolf online with AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! textgame.ai has a ready-to-play Werewolf template. The AI Game Master runs day/night phases, assigns roles like Seer and Doctor, and AI players make strategic decisions. Play solo against AI or invite friends to join.",
      },
    },
    {
      "@type": "Question",
      name: "What games can I create with AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can create any text-based game — social deduction (Werewolf, Mafia, Secret Hitler), RPGs, murder mysteries, trivia, escape rooms, and fully custom games with your own rules. The AI Game Master adapts to whatever you describe.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden [-webkit-tap-highlight-color:transparent]">
      <head>
        {/* Preconnect to Supabase for faster auth/db calls */}
        <link rel="preconnect" href="https://hazjbhhreltgjexxaazn.supabase.co" />
        <link rel="dns-prefetch" href="https://hazjbhhreltgjexxaazn.supabase.co" />
        {/* Preconnect to Vercel Analytics */}
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
      </head>
      <body className="antialiased h-full overflow-hidden safe-area-padding" suppressHydrationWarning>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        {/* Static crawlable content for search engines (hidden from sighted users) */}
        <noscript>
          <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            <h1>{SITE_NAME} — AI-Powered Text Game Platform</h1>
            <p>{SITE_DESCRIPTION}</p>
            <h2>Play AI Text Games Online</h2>
            <p>
              Create and play multiplayer text-based games with an AI Game Master and AI characters.
              The best Character.AI alternative for roleplay, social deduction, and RPG games.
              Design custom games or choose from 20+ templates — Werewolf, Mafia, Murder Mystery, and more.
            </p>
            <h2>AI Game Master &amp; AI Dungeon Master</h2>
            <p>
              Your AI Game Master hosts every session — assigns roles, runs phases, narrates the story,
              and fills every seat with unique AI characters that have their own voice, personality, and strategy.
              Perfect as an AI dungeon master for text-based RPGs and adventures.
            </p>
            <h2>Popular AI Games</h2>
            <nav>
              <a href="/discover">Discover AI Text Games</a>
              <a href="/games">Game Library — Browse All Games</a>
              <a href="/games/werewolf">Play Werewolf Online with AI</a>
              <a href="/games/mafia">Play Mafia Online with AI</a>
              <a href="/games/undercover">Play Who&apos;s the Spy / Undercover Online</a>
              <a href="/games/avalon">Play Avalon Online with AI</a>
              <a href="/games/escape-room">AI Escape Room Game</a>
              <a href="/games/trivia">AI Trivia Game</a>
              <a href="/games/tarot">AI Tarot Reading</a>
              <a href="/games/secret-hitler">Play Secret Hitler Online with AI</a>
              <a href="/games/murder-mystery">AI Murder Mystery Game</a>
              <a href="/subscription">Plans &amp; Pricing</a>
              <a href="/signin">Sign In</a>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
            </nav>
          </div>
        </noscript>
        <SuppressFastRefreshLogs />
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
