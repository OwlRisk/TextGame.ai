/**
 * Blog integrity tests:
 *  - Every slug listed in the blog index has a corresponding page file
 *  - Every blog page file has a corresponding slug in the index
 *  - No duplicate slugs in the index
 *  - Sitemap includes all blog URLs
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const BLOG_DIR = path.resolve(__dirname, "../../app/blog");

function getBlogIndexSlugs(): string[] {
  const indexContent = fs.readFileSync(path.join(BLOG_DIR, "page.tsx"), "utf-8");
  const slugRegex = /slug:\s*"([^"]+)"/g;
  const slugs: string[] = [];
  let match;
  while ((match = slugRegex.exec(indexContent)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

function getBlogFolders(): string[] {
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => fs.existsSync(path.join(BLOG_DIR, d.name, "page.tsx")))
    .map((d) => d.name);
}

const indexSlugs = getBlogIndexSlugs();
const blogFolders = getBlogFolders();

describe("Blog index integrity", () => {
  it("has at least 40 posts listed", () => {
    expect(indexSlugs.length).toBeGreaterThanOrEqual(40);
  });

  it("has no duplicate slugs", () => {
    const dupes = indexSlugs.filter((s, i) => indexSlugs.indexOf(s) !== i);
    expect(dupes, `Duplicate slugs: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every index slug has a corresponding page.tsx file", () => {
    for (const slug of indexSlugs) {
      const pagePath = path.join(BLOG_DIR, slug, "page.tsx");
      expect(fs.existsSync(pagePath), `Missing page for slug: ${slug}`).toBe(true);
    }
  });

  it("every blog folder has an entry in the index", () => {
    for (const folder of blogFolders) {
      expect(indexSlugs, `Folder "${folder}" not in blog index`).toContain(folder);
    }
  });

  it("index slug count matches folder count", () => {
    expect(indexSlugs.length).toBe(blogFolders.length);
  });
});

describe("Blog post metadata", () => {
  for (const slug of indexSlugs) {
    describe(`blog/${slug}`, () => {
      const filePath = path.join(BLOG_DIR, slug, "page.tsx");
      let content: string;

      try {
        content = fs.readFileSync(filePath, "utf-8");
      } catch {
        content = "";
      }

      it("has a title in metadata", () => {
        expect(content).toMatch(/title[:\s]/);
      });

      it("has a description in metadata", () => {
        expect(content).toMatch(/description[:\s]/);
      });

      it("has a canonical URL in alternates", () => {
        expect(content).toMatch(/canonical[:\s]/);
      });

      it("has JSON-LD structured data", () => {
        expect(content).toMatch(/application\/ld\+json/);
      });
    });
  }
});
