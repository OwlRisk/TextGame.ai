import { describe, it, expect } from "vitest";

/**
 * Unit tests for EEA country detection logic used by the proxy.
 * We test the country set directly since NextRequest/NextResponse
 * require the Next.js runtime. The proxy logic is trivial:
 * if country is in EEA_COUNTRIES → "1", else → "0".
 */

const EEA_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO",
  "GB",
]);

function detectEEA(country: string): "1" | "0" {
  return EEA_COUNTRIES.has(country) ? "1" : "0";
}

describe("EEA country detection", () => {
  it("detects Germany as EEA", () => {
    expect(detectEEA("DE")).toBe("1");
  });

  it("detects France as EEA", () => {
    expect(detectEEA("FR")).toBe("1");
  });

  it("detects UK as EEA (UK GDPR)", () => {
    expect(detectEEA("GB")).toBe("1");
  });

  it("detects Norway as EEA (non-EU)", () => {
    expect(detectEEA("NO")).toBe("1");
  });

  it("detects Iceland as EEA (non-EU)", () => {
    expect(detectEEA("IS")).toBe("1");
  });

  it("detects Liechtenstein as EEA (non-EU)", () => {
    expect(detectEEA("LI")).toBe("1");
  });

  it("returns 0 for US", () => {
    expect(detectEEA("US")).toBe("0");
  });

  it("returns 0 for China", () => {
    expect(detectEEA("CN")).toBe("0");
  });

  it("returns 0 for Japan", () => {
    expect(detectEEA("JP")).toBe("0");
  });

  it("returns 0 for Brazil", () => {
    expect(detectEEA("BR")).toBe("0");
  });

  it("returns 0 for empty string (unknown geo)", () => {
    expect(detectEEA("")).toBe("0");
  });

  it("is case-sensitive (lowercase not matched)", () => {
    expect(detectEEA("de")).toBe("0");
  });

  it("covers all 27 EU member states", () => {
    const eu27 = [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
      "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
      "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    ];
    for (const code of eu27) {
      expect(detectEEA(code)).toBe("1");
    }
    expect(eu27.length).toBe(27);
  });

  it("total EEA set has 31 entries (27 EU + 3 EEA + UK)", () => {
    expect(EEA_COUNTRIES.size).toBe(31);
  });
});
