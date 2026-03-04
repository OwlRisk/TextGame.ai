import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";

const PUBLIC_ALLOW = ["/", "/discover", "/games", "/games/", "/blog", "/blog/", "/play/", "/signin", "/terms", "/privacy", "/help"];
const PRIVATE_DISALLOW = ["/profile", "/settings", "/recharge", "/usage", "/subscription", "/my-games", "/create", "/game/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: all crawlers
      {
        userAgent: "*",
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
      // AI search crawlers — explicitly welcome on public content
      { userAgent: "GPTBot",        allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      { userAgent: "ClaudeBot",     allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      { userAgent: "PerplexityBot", allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      { userAgent: "Google-Extended", allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      { userAgent: "Amazonbot",     allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
    ],
    sitemap: `${SITE_DOMAIN}/sitemap.xml`,
  };
}
