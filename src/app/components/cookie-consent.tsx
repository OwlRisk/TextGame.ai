"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Shield, Settings, Cookie } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_PREFERENCES_KEY = "textgame-cookie-preferences";

function getConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )ga_consent=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsentCookie(value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `ga_consent=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CookieConsent({ inEEA }: { inEEA: boolean }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (!inEEA) return;
    const consent = getConsentCookie();
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
    const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (saved) {
      try { setPreferences(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [inEEA]);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setConsentCookie(prefs.analytics ? "granted" : "denied", 365);
    setShowBanner(false);
    setShowSettings(false);
    if (prefs.analytics) {
      window.location.reload();
    }
  };

  const handleAcceptAll = () => {
    savePreferences({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    savePreferences({ necessary: true, analytics: false, marketing: false });
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base mb-1">
                  We value your privacy
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  We use cookies to enhance your browsing experience and analyze site traffic.
                  By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies.
                  You can customize your preferences or learn more in our{" "}
                  <a href="/privacy" className="text-violet-400 hover:text-violet-300 underline">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Cookie className="w-5 h-5 text-violet-400" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="necessary" className="text-base font-semibold text-white">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-zinc-400 mt-1">
                  Essential for the website to function properly. These cookies enable core functionality
                  such as security and accessibility. They cannot be disabled.
                </p>
              </div>
              <Switch id="necessary" checked disabled className="shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="analytics" className="text-base font-semibold text-white">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-zinc-400 mt-1">
                  Help us understand how visitors interact with our website by collecting and reporting
                  information anonymously. This helps us improve our services.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                className="shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="marketing" className="text-base font-semibold text-white">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-zinc-400 mt-1">
                  Used to track visitors across websites. The intention is to display ads that are relevant
                  and engaging for the individual user.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                className="shrink-0"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => savePreferences(preferences)}
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Save Preferences
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
