import type { Metadata } from "next";
import "../styles/index.css";
import { GameProvider } from "@/app/contexts/GameContext";
import { AuthProvider } from "@/app/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Game Master",
  description: "AI-powered social deduction gaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="antialiased h-full overflow-hidden" suppressHydrationWarning>
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
