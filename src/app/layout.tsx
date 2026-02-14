import type { Metadata, Viewport } from "next";
import "../styles/index.css";
import { GameProvider } from "@/app/contexts/GameContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION } from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0b",
};

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/site.webmanifest",
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_DOMAIN,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
