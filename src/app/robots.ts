import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Simplified robots.txt: allow everything by default, only block private/auth pages.
 * Previous approach used explicit Allow lists which caused Bing to flag unlisted public
 * pages as "Blocked by robots.txt". Also removed /subscription from Disallow since it's
 * a public pricing page listed in the sitemap.
 */
const PRIVATE_DISALLOW = ["/profile", "/settings", "/recharge", "/usage", "/my-games", "/create", "/game/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: `${SITE_DOMAIN}/sitemap.xml`,
  };
}
