import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
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

// FAQ items must exactly match what's rendered in FAQSection on the landing page
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I create a game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign in with Google, then go to Create. You can either chat with the Game Master to describe your idea in plain English, or pick a template from Discover (e.g. Werewolf, Who's the Spy, Mafia, Tarot). Set player count and optional rules — no coding or complex setup. Your game is ready in about 2 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Game Master and how does it work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Game Master is an AI host that runs your game: it explains rules, runs day/night or discussion phases, and keeps the flow. You can also add AI players so the room is filled even when playing alone. The host and players use natural dialogue so it feels like a real tabletop session.",
      },
    },
    {
      "@type": "Question",
      name: "Can I play with friends?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Share an invite link from your game room — friends can join instantly in their browser without creating an account. They play as guests alongside your AI characters. You can have any mix of human and AI players in the same game.",
      },
    },
    {
      "@type": "Question",
      name: "What templates or game types are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We include 20+ templates like Werewolf (social deduction), Who's the Spy (word game), Mafia, Murder Mystery, Secret Hitler, and Tarot Reading. Browse them in Discover for one-click start. You can also create a fully custom game by describing your own rules and roles to the Game Master.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to sign in? Is it free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign in with Google to create games — it only takes a few seconds. New accounts get free starting credits so you can try the platform right away. Friends who join your game don't need an account at all.",
      },
    },
    {
      "@type": "Question",
      name: "Do AI characters have voices?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Each AI character speaks with a unique voice powered by text-to-speech. You can toggle voice on or off for any game. It adds a layer of immersion that makes the game feel like a real tabletop session.",
      },
    },
    {
      "@type": "Question",
      name: "Can I create any type of game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! While we offer 20+ templates for popular games, you have complete freedom to design custom games with unique rules, roles, and victory conditions. Just describe your idea to the Game Master in plain English.",
      },
    },
    {
      "@type": "Question",
      name: "How much does it cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "New accounts start with free credits. After that, you can purchase additional credits as needed — pricing is transparent and based on actual usage. No subscriptions or hidden fees.",
      },
    },
  ],
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
