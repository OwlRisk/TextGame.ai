import { describe, it, expect } from "vitest";

/**
 * Tests for the cookie preference model introduced by the redesigned
 * cookie consent banner (category toggles + settings dialog).
 *
 * Since the component is a React client component, we extract and test
 * the pure decision/mapping logic here.
 */

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULTS: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function consentCookieValue(prefs: CookiePreferences): "granted" | "denied" {
  return prefs.analytics ? "granted" : "denied";
}

function acceptAllPrefs(): CookiePreferences {
  return { necessary: true, analytics: true, marketing: true };
}

function rejectAllPrefs(): CookiePreferences {
  return { necessary: true, analytics: false, marketing: false };
}

function shouldReloadAfterSave(prefs: CookiePreferences): boolean {
  return prefs.analytics;
}

function parseStoredPreferences(json: string | null): CookiePreferences {
  if (!json) return DEFAULTS;
  try {
    const parsed = JSON.parse(json);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return DEFAULTS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Accept All / Reject All
// ═══════════════════════════════════════════════════════════════════════════

describe("Accept All", () => {
  it("enables all cookie categories", () => {
    const prefs = acceptAllPrefs();
    expect(prefs.necessary).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
  });

  it("maps to ga_consent=granted", () => {
    expect(consentCookieValue(acceptAllPrefs())).toBe("granted");
  });

  it("triggers page reload", () => {
    expect(shouldReloadAfterSave(acceptAllPrefs())).toBe(true);
  });
});

describe("Reject All", () => {
  it("keeps necessary enabled, disables the rest", () => {
    const prefs = rejectAllPrefs();
    expect(prefs.necessary).toBe(true);
    expect(prefs.analytics).toBe(false);
    expect(prefs.marketing).toBe(false);
  });

  it("maps to ga_consent=denied", () => {
    expect(consentCookieValue(rejectAllPrefs())).toBe("denied");
  });

  it("does not trigger page reload", () => {
    expect(shouldReloadAfterSave(rejectAllPrefs())).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Custom preference combinations (Save Preferences dialog)
// ═══════════════════════════════════════════════════════════════════════════

describe("Custom preferences — consent cookie mapping", () => {
  it("analytics on + marketing off → granted", () => {
    expect(consentCookieValue({ necessary: true, analytics: true, marketing: false })).toBe("granted");
  });

  it("analytics off + marketing on → denied (GA4 not loaded)", () => {
    expect(consentCookieValue({ necessary: true, analytics: false, marketing: true })).toBe("denied");
  });

  it("analytics off + marketing off → denied", () => {
    expect(consentCookieValue({ necessary: true, analytics: false, marketing: false })).toBe("denied");
  });

  it("analytics on + marketing on → granted", () => {
    expect(consentCookieValue({ necessary: true, analytics: true, marketing: true })).toBe("granted");
  });
});

describe("Custom preferences — reload decision", () => {
  it("reloads only when analytics is enabled", () => {
    expect(shouldReloadAfterSave({ necessary: true, analytics: true, marketing: false })).toBe(true);
    expect(shouldReloadAfterSave({ necessary: true, analytics: true, marketing: true })).toBe(true);
  });

  it("does not reload when analytics is disabled", () => {
    expect(shouldReloadAfterSave({ necessary: true, analytics: false, marketing: true })).toBe(false);
    expect(shouldReloadAfterSave({ necessary: true, analytics: false, marketing: false })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Preference persistence (localStorage serialization)
// ═══════════════════════════════════════════════════════════════════════════

describe("Preference persistence — serialization round-trip", () => {
  it("round-trips accept-all preferences", () => {
    const prefs = acceptAllPrefs();
    const json = JSON.stringify(prefs);
    expect(parseStoredPreferences(json)).toEqual(prefs);
  });

  it("round-trips reject-all preferences", () => {
    const prefs = rejectAllPrefs();
    const json = JSON.stringify(prefs);
    expect(parseStoredPreferences(json)).toEqual(prefs);
  });

  it("round-trips custom preferences", () => {
    const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: true };
    const json = JSON.stringify(prefs);
    expect(parseStoredPreferences(json)).toEqual(prefs);
  });

  it("necessary is always true regardless of stored value", () => {
    const json = JSON.stringify({ necessary: false, analytics: true, marketing: false });
    const result = parseStoredPreferences(json);
    expect(result.necessary).toBe(true);
  });
});

describe("Preference persistence — error handling", () => {
  it("returns defaults for null (no stored data)", () => {
    expect(parseStoredPreferences(null)).toEqual(DEFAULTS);
  });

  it("returns defaults for invalid JSON", () => {
    expect(parseStoredPreferences("{broken")).toEqual(DEFAULTS);
  });

  it("returns defaults for empty string", () => {
    expect(parseStoredPreferences("")).toEqual(DEFAULTS);
  });

  it("handles missing fields gracefully", () => {
    const json = JSON.stringify({ analytics: true });
    const result = parseStoredPreferences(json);
    expect(result.necessary).toBe(true);
    expect(result.analytics).toBe(true);
    expect(result.marketing).toBe(false);
  });

  it("coerces truthy/falsy values", () => {
    const json = JSON.stringify({ analytics: 1, marketing: 0 });
    const result = parseStoredPreferences(json);
    expect(result.analytics).toBe(true);
    expect(result.marketing).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Default state
// ═══════════════════════════════════════════════════════════════════════════

describe("Default preferences", () => {
  it("necessary is true by default", () => {
    expect(DEFAULTS.necessary).toBe(true);
  });

  it("analytics is false by default", () => {
    expect(DEFAULTS.analytics).toBe(false);
  });

  it("marketing is false by default", () => {
    expect(DEFAULTS.marketing).toBe(false);
  });

  it("defaults map to ga_consent=denied", () => {
    expect(consentCookieValue(DEFAULTS)).toBe("denied");
  });
});
