import type { Metadata, Viewport } from "next";
import "../styles/index.css";
import { GameProvider } from "@/app/contexts/GameContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { SuppressFastRefreshLogs } from "@/app/components/suppress-fast-refresh-logs";
import { SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0b",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_DOMAIN),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/site.webmanifest",
  keywords: [
    "AI text game",
    "text-based game",
    "AI game host",
    "multiplayer text adventure",
    "werewolf game AI",
    "AI role-playing game",
    "game design AI",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_DOMAIN,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/hero.webp",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden [-webkit-tap-highlight-color:transparent]">
      <body className="antialiased h-full overflow-hidden safe-area-padding" suppressHydrationWarning>
        <SuppressFastRefreshLogs />
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
