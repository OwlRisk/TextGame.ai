import type { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/seo-locales";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Discover RPG Adventures — Fantasy, Wuxia & Custom Worlds",
  description:
    "Browse RPG adventures powered by AI. Explore fantasy dungeons, wuxia tournaments, and open-world quests — or design your own custom world with the AI Game Master.",
  keywords: [
    "ai rpg",
    "text rpg online",
    "ai dungeon master",
    "fantasy rpg",
    "wuxia rpg",
    "ai adventure game",
    "text adventure",
    "rpg with ai companions",
    "persistent rpg",
    "custom rpg world",
  ],
  alternates: {
    canonical: "/discover",
    languages: buildHreflangAlternates("/discover"),
  },
  openGraph: {
    title: "Discover RPG Adventures · TextGame.ai",
    description:
      "RPG adventures with an AI Game Master. Fantasy, Wuxia, open-world — or design your own.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Discover RPG Adventures · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover RPG Adventures · TextGame.ai",
    description: "RPG adventures with an AI Game Master. Fantasy, Wuxia, open-world — or design your own.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
