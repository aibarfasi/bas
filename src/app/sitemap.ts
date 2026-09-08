import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "/",
    "/market",
    "/market?cat=monitoring",
    "/market?cat=grid",
    "/market?cat=health",
    "/market?cat=yield",
    "/compare",
    "/advantage",
    "/proofs",
    "/docs/judges",
    "/watch",
    "/claim",
    "/agent/97/bas-rebalance",
    "/hire/97-bas-rebalance",
  ];
  return paths.map((path, i) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: i < 6 ? "daily" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/market") || path === "/docs/judges" ? 0.9 : 0.7,
  }));
}
