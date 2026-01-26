import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Game Master",
  description: "AI 游戏平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
