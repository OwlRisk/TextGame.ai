import type { Metadata } from "next";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Discover Games — AI Murder Mystery & Custom Games",
  description:
    "Browse murder mystery cases or create your own game from scratch. Every game features AI characters with real personalities, secrets, and agendas.",
  keywords: [
    "AI murder mystery",
    "detective game online",
    "script kill cases",
    "create AI game",
    "custom text game",
    "AI interrogation game",
    "interactive mystery",
  ],
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover Games · TextGame.ai",
    description:
      "Browse murder mystery cases or create your own game. AI characters that think for themselves.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Discover Games · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Games · TextGame.ai",
    description: "Browse murder mystery cases or create your own game. AI characters that think for themselves.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
