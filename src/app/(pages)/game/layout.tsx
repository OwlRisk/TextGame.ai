import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Room",
  description:
    "Play an AI-hosted text game with friends. The AI game master runs the story, assigns roles, and keeps the game moving.",
  robots: { index: false, follow: false },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
