import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Games",
  robots: { index: false, follow: false },
};

export default function MyGamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
