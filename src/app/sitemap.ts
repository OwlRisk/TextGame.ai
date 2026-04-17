import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";

const SITE_LAUNCH = new Date("2026-03-04");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const SEO_LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "it", "ar", "hi", "tr", "id", "vi", "th", "pl", "nl", "uk"];

  const indexablePages = [
    { path: "",          changeFrequency: "weekly" as const, priority: 1   },
    { path: "/discover", changeFrequency: "daily"  as const, priority: 0.9 },
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
    { url: `${SITE_DOMAIN}/recharge`, lastModified: SITE_LAUNCH, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_DOMAIN}/signin`,   lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_DOMAIN}/help`,     lastModified: SITE_LAUNCH, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_DOMAIN}/terms`,    lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_DOMAIN}/privacy`,  lastModified: SITE_LAUNCH, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
