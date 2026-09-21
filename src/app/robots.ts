import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Páginas com dados de cliente nunca devem ser rastreadas.
      disallow: ["/checkout/", "/onboarding/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
