"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export function TrackedGameLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (href.startsWith("/games/")) {
          trackEvent("blog_to_game", { game: href.replace("/games/", ""), source: typeof window !== "undefined" ? window.location.pathname : "unknown" });
        }
      }}
    >
      {children}
    </Link>
  );
}
