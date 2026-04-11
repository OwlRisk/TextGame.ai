import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { SITE_DOMAIN } from "@/lib/site";
import { SEO_LOCALES } from "@/lib/seo-locales";

/**
 * Tests for the localized sitemap entries introduced by the SEO overhaul.
 * Supplements sitemap-integrity.test.ts with locale-specific checks.
 */

const entries = sitemap();
const urls = entries.map((e) => e.url);

describe("sitemap locale entries", () => {
  it("includes locale variants for homepage", () => {
    for (const locale of SEO_LOCALES) {
      expect(urls, `Missing /${locale} homepage`).toContain(`${SITE_DOMAIN}/${locale}`);
    }
  });

  it("includes locale variants for /discover", () => {
    for (const locale of SEO_LOCALES) {
      expect(urls, `Missing /${locale}/discover`).toContain(`${SITE_DOMAIN}/${locale}/discover`);
    }
  });

  it("includes locale variants for /games", () => {
    for (const locale of SEO_LOCALES) {
      expect(urls, `Missing /${locale}/games`).toContain(`${SITE_DOMAIN}/${locale}/games`);
    }
  });

  it("locale homepage entries have lower priority than English homepage", () => {
    const enHome = entries.find((e) => e.url === SITE_DOMAIN);
    const zhHome = entries.find((e) => e.url === `${SITE_DOMAIN}/zh`);
    expect(enHome).toBeDefined();
    expect(zhHome).toBeDefined();
    expect(zhHome!.priority!).toBeLessThan(enHome!.priority!);
  });

  it("locale discover entries have lower priority than English discover", () => {
    const enDiscover = entries.find((e) => e.url === `${SITE_DOMAIN}/discover`);
    const jaDiscover = entries.find((e) => e.url === `${SITE_DOMAIN}/ja/discover`);
    expect(enDiscover).toBeDefined();
    expect(jaDiscover).toBeDefined();
    expect(jaDiscover!.priority!).toBeLessThan(enDiscover!.priority!);
  });

  it("total locale entries = 18 locales × 3 pages = 54", () => {
    const localeUrls = urls.filter((u) => {
      const path = u.replace(SITE_DOMAIN, "");
      const first = path.split("/").filter(Boolean)[0];
      return first && (SEO_LOCALES as readonly string[]).includes(first);
    });
    expect(localeUrls).toHaveLength(54);
  });

  it("no duplicate locale URLs", () => {
    const localeUrls = urls.filter((u) => {
      const path = u.replace(SITE_DOMAIN, "");
      const first = path.split("/").filter(Boolean)[0];
      return first && (SEO_LOCALES as readonly string[]).includes(first);
    });
    const dupes = localeUrls.filter((u, i) => localeUrls.indexOf(u) !== i);
    expect(dupes).toEqual([]);
  });

  it("all locale entries have lastModified set", () => {
    const localeEntries = entries.filter((e) => {
      const path = e.url.replace(SITE_DOMAIN, "");
      const first = path.split("/").filter(Boolean)[0];
      return first && (SEO_LOCALES as readonly string[]).includes(first);
    });
    for (const entry of localeEntries) {
      expect(entry.lastModified).toBeDefined();
    }
  });

  it("all locale entries have valid changeFrequency", () => {
    const validFreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
    const localeEntries = entries.filter((e) => {
      const path = e.url.replace(SITE_DOMAIN, "");
      const first = path.split("/").filter(Boolean)[0];
      return first && (SEO_LOCALES as readonly string[]).includes(first);
    });
    for (const entry of localeEntries) {
      expect(validFreqs).toContain(entry.changeFrequency);
    }
  });
});

describe("sitemap includes /cases page", () => {
  it("includes /cases", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/cases`);
  });
});
