import type { Metadata } from "next";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Discover AI Text Games — Werewolf, Mafia, RPG, Mystery & More",
  description:
    "Browse 20+ AI-powered multiplayer text game templates. Play Werewolf, Mafia, Secret Hitler, Who's the Spy, Murder Mystery, Trivia and more — or create your own custom roleplay AI game in minutes. Best Character.AI alternative for social deduction games.",
  keywords: [
    "ai text games",
    "play werewolf online",
    "play mafia online",
    "ai rpg",
    "roleplay ai",
    "character ai alternative",
    "social deduction game",
    "ai game templates",
    "multiplayer ai game",
    "ai dungeon master",
    "text adventure game",
  ],
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover AI Text Games · TextGame.ai",
    description:
      "20+ multiplayer text game templates powered by AI. Werewolf, Mafia, RPG, Mystery, Trivia — pick a template or create your own AI game in seconds.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Discover AI Text Games · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover AI Text Games · TextGame.ai",
    description: "20+ multiplayer text game templates powered by AI. Werewolf, Mafia, RPG, Mystery, Trivia — pick a template or create your own AI game in seconds.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
