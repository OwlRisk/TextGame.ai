"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!gaId) return;
    const allowed = inEEA ? getCookie("ga_consent") === "granted" : true;
    if (!allowed) return;

    // Delay GA to keep it off the critical rendering path.
    // 3.5s is enough for LCP to complete on slow 4G.
    const timer = setTimeout(() => setShouldLoad(true), 3500);
    return () => clearTimeout(timer);
  }, [gaId, inEEA]);

  if (!shouldLoad) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
