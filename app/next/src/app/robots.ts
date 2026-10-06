export const dynamic = "force-static";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: "https://govinda-lamsal.higgsfield.app/sitemap.xml",
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/api/"] },
  };
}
