import { describe, it, expect } from "vitest";

/**
 * Tests for the consent decision logic used by the GA4 wrapper and
 * cookie consent components. The actual components are React client
 * components; here we test the pure decision logic.
 */

type ConsentState = "granted" | "denied" | null;

function shouldLoadGA4(inEEA: boolean, consent: ConsentState): boolean {
  if (!inEEA) return true;
  return consent === "granted";
}

function shouldShowBanner(inEEA: boolean, consent: ConsentState): boolean {
  if (!inEEA) return false;
  return consent === null;
}

describe("GA4 loading decision", () => {
  it("loads for non-EEA users regardless of consent", () => {
    expect(shouldLoadGA4(false, null)).toBe(true);
    expect(shouldLoadGA4(false, "granted")).toBe(true);
    expect(shouldLoadGA4(false, "denied")).toBe(true);
  });

  it("loads for EEA users who granted consent", () => {
    expect(shouldLoadGA4(true, "granted")).toBe(true);
  });

  it("does not load for EEA users who denied consent", () => {
    expect(shouldLoadGA4(true, "denied")).toBe(false);
  });

  it("does not load for EEA users with no consent decision", () => {
    expect(shouldLoadGA4(true, null)).toBe(false);
  });
});

describe("Cookie banner visibility", () => {
  it("never shows for non-EEA users", () => {
    expect(shouldShowBanner(false, null)).toBe(false);
    expect(shouldShowBanner(false, "granted")).toBe(false);
    expect(shouldShowBanner(false, "denied")).toBe(false);
  });

  it("shows for EEA users with no consent decision", () => {
    expect(shouldShowBanner(true, null)).toBe(true);
  });

  it("does not show for EEA users who already granted", () => {
    expect(shouldShowBanner(true, "granted")).toBe(false);
  });

  it("does not show for EEA users who already denied", () => {
    expect(shouldShowBanner(true, "denied")).toBe(false);
  });
});

describe("Layout server-side prop computation", () => {
  it("computes correct props for non-EEA visitor", () => {
    const inEEA = false;
    const gaConsent: ConsentState = null;
    const gaWrapperInEEA = inEEA && gaConsent !== "granted";
    const bannerInEEA = inEEA && gaConsent !== "granted" && gaConsent !== "denied";
    expect(gaWrapperInEEA).toBe(false);
    expect(bannerInEEA).toBe(false);
  });

  it("computes correct props for EEA visitor with no consent", () => {
    const inEEA = true;
    const gaConsent: ConsentState = null;
    const gaWrapperInEEA = inEEA && gaConsent !== "granted";
    const bannerInEEA = inEEA && gaConsent !== "granted" && gaConsent !== "denied";
    expect(gaWrapperInEEA).toBe(true);
    expect(bannerInEEA).toBe(true);
  });

  it("computes correct props for EEA visitor who granted", () => {
    const inEEA = true;
    const gaConsent: ConsentState = "granted";
    const gaWrapperInEEA = inEEA && gaConsent !== "granted";
    const bannerInEEA = inEEA && gaConsent !== "granted" && gaConsent !== "denied";
    expect(gaWrapperInEEA).toBe(false);
    expect(bannerInEEA).toBe(false);
  });

  it("computes correct props for EEA visitor who denied", () => {
    const inEEA = true;
    const gaConsent: ConsentState = "denied";
    const gaWrapperInEEA = inEEA && gaConsent !== "granted";
    const bannerInEEA = inEEA && gaConsent !== "granted" && gaConsent !== "denied";
    expect(gaWrapperInEEA).toBe(true);
    expect(bannerInEEA).toBe(false);
  });
});
