import type { Metadata } from "next";
import { SITE_DOMAIN } from "@/lib/site";
import { FAQ_ITEMS } from "@/data/landing-content";
import { buildHreflangAlternates } from "@/lib/seo-locales";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "TextGame.ai — AI-Powered RPG Adventures with Living Companions",
  description:
    "Embark on persistent RPG adventures with an AI Game Master and party companions who have real personalities. Explore open worlds, fight epic battles, and shape your own story — no download needed.",
  keywords: [
    "AI RPG",
    "text RPG online",
    "AI game master",
    "AI dungeon",
    "text adventure",
    "RPG with AI companions",
    "persistent RPG",
    "open world text game",
    "AI DnD",
    "wuxia RPG",
    "fantasy RPG online",
  ],
  alternates: {
    canonical: "/",
    languages: buildHreflangAlternates("/"),
  },
  openGraph: {
    title: "TextGame.ai — AI-Powered RPG Adventures",
    description:
      "Persistent RPG adventures with an AI Game Master and party companions who argue, joke, and fight alongside you.",
    type: "website",
    url: SITE_DOMAIN,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "TextGame.ai — AI RPG Adventures" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TextGame.ai — AI-Powered RPG Adventures",
    description:
      "Persistent RPG adventures with AI companions. Explore open worlds, fight bosses, design your own realm.",
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
            Your AI-powered{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              RPG adventure
            </span>{" "}
            awaits
          </h2>
        }
      />
    </>
  );
}
