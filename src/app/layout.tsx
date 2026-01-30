import type { Metadata } from "next";
import "../styles/index.css";

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
    <html lang="zh-CN" className="h-full overflow-hidden">
      <body className="antialiased h-full overflow-hidden" suppressHydrationWarning>{children}</body>
    </html>
  );
}
