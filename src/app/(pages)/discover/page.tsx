import type { Metadata } from "next";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Discover AI Text Games — Werewolf, Mafia, Mystery & More",
  description:
    "Browse 20+ AI-powered multiplayer text game templates. Play Werewolf, Mafia, Secret Hitler, Who's the Spy, Murder Mystery, Trivia and more — or create your own custom game in minutes.",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover AI Text Games · textgame.ai",
    description:
      "20+ multiplayer text game templates powered by AI. Werewolf, Mafia, Mystery, Trivia — pick a template and play in seconds.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Discover AI Text Games · textgame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover AI Text Games · textgame.ai",
    description: "20+ multiplayer text game templates powered by AI. Werewolf, Mafia, Mystery, Trivia — pick a template and play in seconds.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
