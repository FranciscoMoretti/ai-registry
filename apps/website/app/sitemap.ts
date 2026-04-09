import type { MetadataRoute } from "next";
import { generateStaticParamsForSitemap as generateCompareStaticParams } from "@/app/(models)/compare/[[...slug]]/page";
import { generateStaticParams as generateModelStaticParams } from "@/app/(models)/models/[provider]/[id]/page";

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const PRIORITY_HOME = 1;
const PRIORITY_COMPARE_ROOT = 0.8;
const PRIORITY_COMPARE_DYNAMIC = 0.5;
const PRIORITY_MODEL_DETAIL = 0.6;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: PRIORITY_HOME,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: PRIORITY_COMPARE_ROOT,
    },
  ];

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const modelParams = await generateModelStaticParams();
    for (const { provider, id } of modelParams) {
      dynamicEntries.push({
        url: `${SITE_URL}/models/${provider}/${id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: PRIORITY_MODEL_DETAIL,
      });
    }
  } catch {
    // swallow errors from optional imports
    console.error("Error generating model static params");
  }

  try {
    const compareParams = await generateCompareStaticParams();
    for (const { slug } of compareParams) {
      const segments = Array.isArray(slug) ? slug : [];
      const path = segments.length
        ? `/compare/${segments.join("/")}`
        : "/compare";
      dynamicEntries.push({
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: segments.length
          ? PRIORITY_COMPARE_DYNAMIC
          : PRIORITY_COMPARE_ROOT,
      });
    }
  } catch {
    // swallow errors from optional imports
    console.error("Error generating compare static params");
  }

  // Deduplicate by URL (e.g., base /compare may appear twice)
  const dedup = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...staticEntries, ...dynamicEntries]) {
    dedup.set(entry.url, entry);
  }

  return Array.from(dedup.values());
}
