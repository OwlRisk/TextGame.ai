/**
 * Sitemap integrity tests:
 *  - All game slugs are in the sitemap
 *  - All blog slugs are in the sitemap
 *  - No duplicate URLs
 *  - All URLs start with the correct domain
 *  - Essential pages are included
 */
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { ALL_GAME_SLUGS } from "@/lib/game-seo-data";
import { SITE_DOMAIN } from "@/lib/site";
import * as fs from "fs";
import * as path from "path";

const entries = sitemap();
const urls = entries.map((e) => e.url);

function getBlogSlugs(): string[] {
  const blogDir = path.resolve(__dirname, "../../app/blog");
  const indexContent = fs.readFileSync(path.join(blogDir, "page.tsx"), "utf-8");
  const slugRegex = /slug:\s*"([^"]+)"/g;
  const slugs: string[] = [];
  let match;
  while ((match = slugRegex.exec(indexContent)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

const blogSlugs = getBlogSlugs();

describe("sitemap structure", () => {
  it("has at least 60 entries", () => {
    expect(entries.length).toBeGreaterThanOrEqual(60);
  });

  it("has no duplicate URLs", () => {
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
    expect(dupes, `Duplicate URLs: ${dupes.join(", ")}`).toEqual([]);
  });

  it("all URLs start with SITE_DOMAIN", () => {
    for (const url of urls) {
      expect(url, `Invalid URL: ${url}`).toMatch(new RegExp(`^${SITE_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    }
  });

  it("every entry has lastModified", () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeDefined();
    }
  });

  it("every entry has a valid changeFrequency", () => {
    const validFreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
    for (const entry of entries) {
      expect(validFreqs).toContain(entry.changeFrequency);
    }
  });

  it("every entry has a priority between 0 and 1", () => {
    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });
});

describe("sitemap includes all game pages", () => {
  it("has all game slugs", () => {
    for (const slug of ALL_GAME_SLUGS) {
      const expectedUrl = `${SITE_DOMAIN}/games/${slug}`;
      expect(urls, `Missing game: ${slug}`).toContain(expectedUrl);
    }
  });
});

describe("sitemap includes all blog pages", () => {
  it("has the blog index", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/blog`);
  });

  it("has all blog post slugs", () => {
    for (const slug of blogSlugs) {
      const expectedUrl = `${SITE_DOMAIN}/blog/${slug}`;
      expect(urls, `Missing blog: ${slug}`).toContain(expectedUrl);
    }
  });
});

describe("sitemap includes essential pages", () => {
  const essentialPaths = [
    "",          // home
    "/discover",
    "/games",
    "/blog",
    "/subscription",
    "/signin",
    "/help",
    "/terms",
    "/privacy",
  ];

  for (const p of essentialPaths) {
    it(`includes ${p || "/"}`, () => {
      expect(urls).toContain(`${SITE_DOMAIN}${p}`);
    });
  }
});
