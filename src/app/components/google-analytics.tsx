"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function GoogleAnalyticsWrapper({
  gaId,
  inEEA,
}: {
  gaId: string;
  inEEA: boolean;
}) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId) return;
    const allowed = inEEA ? getCookie("ga_consent") === "granted" : true;
    if (!allowed) return;

    // Load GA after LCP settles — 1.5s balances performance vs tracking accuracy.
    // The previous 3.5s delay caused "(not set)" landing pages in GA4 because
    // sessions starting before GA loaded had no page_view event.
    const timer = setTimeout(() => setShouldLoad(true), 1500);
    return () => clearTimeout(timer);
  }, [gaId, inEEA]);

  // Send page_view on client-side navigation so GA4 tracks all pages,
  // not just the initial server-rendered one.
  useEffect(() => {
    if (!shouldLoad || !pathname) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", { page_path: pathname });
  }, [pathname, shouldLoad]);

  if (!shouldLoad) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
