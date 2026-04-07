import type { Metadata } from "next";
import DiscoverView from "./discover-view";

export const metadata: Metadata = {
  title: "Murder Mystery Cases — AI Detective Games",
  description:
    "Browse AI murder mystery cases. Each case features unique suspects with real personalities, hidden secrets, and breaking points. Choose a case and start investigating — 10 minutes per case, free to start.",
  keywords: [
    "AI murder mystery",
    "detective game online",
    "script kill cases",
    "murder mystery game",
    "AI interrogation game",
    "whodunit game online",
    "interactive mystery",
  ],
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Murder Mystery Cases · TextGame.ai",
    description:
      "Browse AI murder mystery cases. Interrogate suspects, collect evidence, solve the case.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Murder Mystery Cases · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Murder Mystery Cases · TextGame.ai",
    description: "Browse AI murder mystery cases. Interrogate suspects, collect evidence, solve the case.",
    images: ["/hero.webp"],
  },
};

export default function DiscoverPage() {
  return <DiscoverView />;
}
