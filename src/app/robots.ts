import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";

/**
 * Simplified robots.txt: allow everything by default, only block private/auth pages.
 * Public pages like /recharge are allowed (and listed in sitemap).
 */
const PRIVATE_DISALLOW = ["/profile", "/settings", "/usage", "/my-games", "/create", "/game/", "/api/"];

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
