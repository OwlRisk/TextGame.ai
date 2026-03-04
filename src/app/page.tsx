import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "textgame.ai — AI-Powered Text Games with a Live Game Master",
  description:
    "Design and play text-based games in a conversation. An AI game master runs every phase — roles, rules, night actions, and votes. No setup, no moderator needed. Free to play.",
  keywords: [
    "AI game master",
    "text-based games online",
    "AI party games",
    "online social deduction game",
    "werewolf online",
    "AI host game",
    "multiplayer text game",
    "free online games",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "textgame.ai — AI-Powered Text Games with a Live Game Master",
    description:
      "Design and play text-based games in a conversation. An AI host runs every phase automatically — no moderator needed.",
    type: "website",
    url: SITE_DOMAIN,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "textgame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "textgame.ai — AI-Powered Text Games with a Live Game Master",
    description:
      "Design and play text-based games in a conversation. An AI host runs every phase automatically.",
    images: ["/hero.webp"],
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
        text: `Sign in with Google, then describe your game idea in plain English to the AI Game Master — or pick a template like Werewolf, Mafia, or Who's the Spy. Set player count and optional rules. Your game is ready in about 2 minutes, no coding needed.`,
      },
    },
    {
      "@type": "Question",
      name: `What is ${SITE_NAME}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${SITE_NAME} is an AI-powered platform for creating and playing multiplayer text-based games. An AI Game Master hosts every session — assigning roles, managing phases, and narrating the story. AI characters fill every seat so you can play solo or with friends.`,
      },
    },
    {
      "@type": "Question",
      name: `Is ${SITE_NAME} a Character.AI alternative?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes — ${SITE_NAME} offers AI characters with unique personalities, voices, and strategies in a game context. Unlike Character.AI, it focuses on multiplayer social deduction and RPG games with structured rules, an AI host, and real-time interaction between multiple AI and human players.`,
      },
    },
    {
      "@type": "Question",
      name: "Can I play Werewolf online with AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Absolutely! ${SITE_NAME} has a ready-to-play Werewolf template. The AI Game Master runs day/night phases, assigns roles like Seer and Doctor, and AI players make strategic decisions. Play solo against AI or invite friends to join.`,
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
