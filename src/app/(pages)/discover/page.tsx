import type { Metadata } from "next";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Discover Games",
  description:
    "Browse AI-powered text games created by the community. Find werewolf, mystery, adventure and more — play instantly with an AI host.",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover Games · textgame.ai",
    description:
      "Browse AI-powered text games created by the community. Find werewolf, mystery, adventure and more.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Discover Games · textgame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Games · textgame.ai",
    description: "Browse AI-powered text games created by the community. Find werewolf, mystery, adventure and more.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
