import type { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/seo-locales";
import GalleryClient from "./gallery-client";

export const metadata: Metadata = {
  title: "Character Gallery | TextGame.ai",
  description:
    "Browse AI RPG character archetypes — knights, mages, assassins, swordmasters and more. Explore their personalities, goals, fears, and avatar art across Western Fantasy and Wuxia worlds.",
  keywords: [
    "rpg characters",
    "ai rpg archetypes",
    "fantasy character gallery",
    "wuxia characters",
    "ai game characters",
    "character art gallery",
    "rpg npc gallery",
    "textgame characters",
  ],
  alternates: {
    canonical: "/gallery",
    languages: buildHreflangAlternates("/gallery"),
  },
  openGraph: {
    title: "Character Gallery · TextGame.ai",
    description:
      "Browse AI RPG character archetypes — personalities, goals, fears, and avatar art across Fantasy and Wuxia worlds.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Character Gallery · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Gallery · TextGame.ai",
    description: "Browse AI RPG character archetypes — personalities, goals, fears, and avatar art.",
    images: ["/hero.webp"],
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
