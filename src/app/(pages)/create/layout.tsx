import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Game",
  description: "Set up your AI-hosted game in minutes.",
  robots: { index: false, follow: false },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
