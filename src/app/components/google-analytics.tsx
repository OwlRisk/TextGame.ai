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
  const [shouldLoad, setShouldLoad] = useState(!inEEA);

  useEffect(() => {
    if (!inEEA) {
      setShouldLoad(true);
      return;
    }
    setShouldLoad(getCookie("ga_consent") === "granted");
  }, [inEEA]);

  if (!gaId || !shouldLoad) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
