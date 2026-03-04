import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";
import { ALL_GAME_SLUGS } from "@/lib/game-seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const gamePages: MetadataRoute.Sitemap = ALL_GAME_SLUGS.map((slug) => ({
    url: `${SITE_DOMAIN}/games/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE_DOMAIN,                        lastModified: now, changeFrequency: "weekly",  priority: 1   },
    { url: `${SITE_DOMAIN}/discover`,           lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_DOMAIN}/games`,              lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    ...gamePages,
    { url: `${SITE_DOMAIN}/blog`,                lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_DOMAIN}/blog/character-ai-alternatives`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_DOMAIN}/subscription`,       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_DOMAIN}/signin`,             lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_DOMAIN}/help`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_DOMAIN}/terms`,              lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_DOMAIN}/privacy`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
