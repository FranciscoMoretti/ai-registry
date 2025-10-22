import type { MetadataRoute } from "next";
import { generateStaticParams as generateCompareStaticParams } from "@/app/(models)/compare/[[...slug]]/page";
import { generateStaticParams as generateModelStaticParams } from "@/app/(models)/models/[provider]/[id]/page";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `http://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000"}`;
  const now = new Date();
  const PRIORITY_COMPARE = 0.8;
  const PRIORITY_COMPARE_SEGMENTED = 0.5;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/models`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const modelParams = await generateModelStaticParams();
    for (const { provider, id } of modelParams) {
      dynamicEntries.push({
        url: `${baseUrl}/models/${provider}/${id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
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
        url: `${baseUrl}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: segments.length
          ? PRIORITY_COMPARE_SEGMENTED
          : PRIORITY_COMPARE,
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
