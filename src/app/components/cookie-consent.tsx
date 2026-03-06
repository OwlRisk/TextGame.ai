"use client";

import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CookieConsent({ inEEA }: { inEEA: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!inEEA) return;
    const consent = getCookie("ga_consent");
    if (!consent) setVisible(true);
  }, [inEEA]);

  if (!visible) return null;

  const handleAccept = () => {
    setCookie("ga_consent", "granted", 365);
    setVisible(false);
    window.location.reload();
  };

  const handleDecline = () => {
    setCookie("ga_consent", "denied", 365);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 pointer-events-none">
      <div className="mx-auto max-w-xl pointer-events-auto rounded-xl border border-zinc-700/60 bg-zinc-900/95 backdrop-blur-md px-5 py-4 shadow-2xl">
        <p className="text-sm text-zinc-300 leading-relaxed">
          We use cookies to understand how visitors interact with our site.
          You can accept or decline analytics cookies.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-sm font-medium text-white transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-lg border border-zinc-600 hover:border-zinc-500 bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors"
          >
            Decline
          </button>
          <a
            href="/privacy"
            className="ml-auto text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
