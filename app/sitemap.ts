import type { MetadataRoute } from "next";
import { getOpportunities, getOrganizations } from "@/lib/airtable";

// Crawlers hit sitemaps often — serve a cached copy for an hour instead of
// re-invoking the origin (and Airtable) on every fetch.
export const revalidate = 3600;

// Set NEXT_PUBLIC_SITE_URL to your real domain in production.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1 },
    { url: `${BASE}/about` },
    { url: `${BASE}/for-organizations` },
  ];

  try {
    const [opps, orgs] = await Promise.all([
      getOpportunities(),
      getOrganizations(),
    ]);

    const oppPages = opps.map((o) => ({
      url: `${BASE}/opportunities/${o.id}`,
      lastModified: o.verifiedAt ? new Date(o.verifiedAt) : undefined,
    }));

    const orgPages = orgs.map((o) => ({ url: `${BASE}/orgs/${o.id}` }));

    return [...staticPages, ...oppPages, ...orgPages];
  } catch {
    return staticPages;
  }
}
