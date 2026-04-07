import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { FAQ_ITEMS } from "@/data/landing-content";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "TextGame.ai — AI Murder Mystery & Detective Games",
  description:
    "Solve AI-powered murder mysteries. Interrogate suspects with real personalities, collect evidence, and crack the case. Each investigation plays differently — 10 minutes per case, free to start.",
  keywords: [
    "AI murder mystery",
    "detective game online",
    "AI interrogation game",
    "script kill",
    "murder mystery game",
    "AI detective",
    "solve murder mystery online",
    "interactive mystery game",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "TextGame.ai — AI Murder Mystery & Detective Games",
    description:
      "Interrogate AI suspects. Collect evidence. Solve the case. Each suspect has a unique personality and hidden secrets.",
    type: "website",
    url: SITE_DOMAIN,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "TextGame.ai — AI Murder Mystery Games" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TextGame.ai — AI Murder Mystery & Detective Games",
    description:
      "Interrogate AI suspects. Collect evidence. Solve the case. Free to play.",
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
            Play with AI characters{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              who think for themselves
            </span>
          </h2>
        }
      />
    </>
  );
}
