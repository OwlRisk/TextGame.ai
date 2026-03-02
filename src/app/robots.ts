import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/discover", "/play/", "/signin", "/terms", "/privacy", "/help"],
        disallow: [
          "/profile",
          "/settings",
          "/recharge",
          "/usage",
          "/subscription",
          "/my-games",
          "/create",
          "/game/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_DOMAIN}/sitemap.xml`,
  };
}
