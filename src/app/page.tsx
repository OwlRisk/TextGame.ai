import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { FAQ_ITEMS } from "@/data/landing-content";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "TextGame.ai — Play Werewolf, Mafia & More with AI Characters",
  description:
    "Play Werewolf, Mafia, Who's the Spy and more with AI characters. No moderator needed — play solo, with friends, or with a mix of both. AI fills every empty seat and reacts like real players.",
  keywords: [
    "AI game master",
    "text-based games online",
    "AI party games",
    "online social deduction game",
    "werewolf online",
    "AI host game",
    "multiplayer text game",
    "play AI games online",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "TextGame.ai — Play Werewolf, Mafia & More with AI Characters",
    description:
      "Play Werewolf, Mafia, Who's the Spy and more with AI characters. No moderator needed — play solo or with friends.",
    type: "website",
    url: SITE_DOMAIN,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TextGame.ai — Play Werewolf, Mafia & More with AI Characters",
    description:
      "Play Werewolf, Mafia, Who's the Spy and more with AI characters. No moderator needed.",
    images: ["/hero.webp"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* heroHeadline is rendered here in the Server Component so the h2 is
          in the initial SSR HTML (critical for LCP). HomeClient/LandingPage
          receive it as a pre-rendered React node and render it in-place,
          so hydration matches and no duplicate element appears. */}
      <HomeClient
        heroHeadline={
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
            Play multiplayer games{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              with AI characters
            </span>
          </h2>
        }
      />
    </>
  );
}
