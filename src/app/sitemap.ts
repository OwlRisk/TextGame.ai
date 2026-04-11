import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { SITE_DOMAIN } from "@/lib/site";
import { ALL_GAME_SLUGS } from "@/lib/game-seo-data";
import { BLOG_DATES } from "@/data/blog-dates";

function getBlogSlugs(): string[] {
  const blogDir = join(process.cwd(), "src/app/blog");
  return readdirSync(blogDir).filter((name) => {
    const full = join(blogDir, name);
    return statSync(full).isDirectory();
  });
}

const SITE_LAUNCH = new Date("2026-03-04");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const gamePages: MetadataRoute.Sitemap = ALL_GAME_SLUGS.map((slug) => ({
    url: `${SITE_DOMAIN}/games/${slug}`,
    lastModified: SITE_LAUNCH,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = getBlogSlugs().map((slug) => ({
    url: `${SITE_DOMAIN}/blog/${slug}`,
    lastModified: BLOG_DATES[slug] ? new Date(BLOG_DATES[slug]) : SITE_LAUNCH,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const SEO_LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "it", "ar", "hi", "tr", "id", "vi", "th", "pl", "nl", "uk"];

  const indexablePages = [
    { path: "",         changeFrequency: "weekly"  as const, priority: 1   },
    { path: "/discover", changeFrequency: "daily"   as const, priority: 0.9 },
    { path: "/games",    changeFrequency: "weekly"  as const, priority: 0.9 },
  ];

  const localizedPages: MetadataRoute.Sitemap = indexablePages.flatMap(({ path, changeFrequency, priority }) => [
    { url: `${SITE_DOMAIN}${path}`, lastModified: now, changeFrequency, priority },
    ...SEO_LOCALES.map((locale) => ({
      url: `${SITE_DOMAIN}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority: priority * 0.9,
    })),
  ]);

  return [
    ...localizedPages,
    ...gamePages,
    { url: `${SITE_DOMAIN}/blog`,               lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    ...blogPages,
    { url: `${SITE_DOMAIN}/cases`,              lastModified: SITE_LAUNCH, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_DOMAIN}/recharge`,           lastModified: SITE_LAUNCH, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_DOMAIN}/signin`,             lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_DOMAIN}/help`,               lastModified: SITE_LAUNCH, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_DOMAIN}/terms`,              lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_DOMAIN}/privacy`,            lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
