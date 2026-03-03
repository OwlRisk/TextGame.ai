import type { Metadata } from "next";
import { SITE_DOMAIN } from "@/lib/site";
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

export default function HomePage() {
  return <HomeClient />;
}
