"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface BlogCTAButtonProps {
  href: string;
  /** Blog slug or identifier for analytics (e.g. "chai-ai-alternatives") */
  source: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

export function BlogCTAButton({
  href,
  source,
  children,
  className,
  variant = "primary",
}: BlogCTAButtonProps) {
  const baseClass =
    variant === "primary"
      ? "inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      : "inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors";

  return (
    <Link
      href={href}
      className={className ?? baseClass}
      onClick={() =>
        trackEvent("blog_cta_click", {
          source,
          destination: href,
        })
      }
    >
      {children}
    </Link>
  );
}
