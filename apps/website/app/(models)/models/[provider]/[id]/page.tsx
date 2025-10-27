import { allModels } from "@airegistry/vercel-gateway";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WideModelDetails } from "@/app/(models)/models/wide-model-details";
import { Container } from "@/components/container";

// Toggle to include/exclude performance-related copy
const ENABLE_PERFORMANCE_COPY = false;

export default async function SingleModelPage(
  props: PageProps<"/models/[provider]/[id]">
) {
  const { provider, id } = await props.params;
  const modelId = `${provider}/${id}`;
  const model = allModels.find((m) => m.id === modelId);
  if (!model) {
    return notFound();
  }

  return (
    <Container className="mx-auto max-w-5xl p-6">
      <WideModelDetails
        enabledActions={{
          goToModel: false,
          chat: true,
          compare: true,
        }}
        model={model}
      />
    </Container>
  );
}

export async function generateMetadata(
  ctx: PageProps<"/models/[provider]/[id]">
): Promise<Metadata> {
  const resolved = await ctx.params;
  const provider = resolved.provider;
  const id = resolved.id;

  const modelId = `${provider}/${id}`;
  const model = allModels.find((m) => m.id === modelId) || null;

  const capProv = (p?: string) =>
    (p || "").slice(0, 1).toUpperCase() + (p || "").slice(1);
  const displayName = (mId: string | null) => {
    const m = mId ? allModels.find((x) => x.id === mId) || null : null;
    if (!m) {
      return mId ?? "";
    }
    const prov = capProv(m.owned_by);
    return `${prov} ${m.name}`.trim();
  };

  const siteName = "AI Registry";
  const a = displayName(model?.id ?? modelId);

  const benchmarksSuffix = ENABLE_PERFORMANCE_COPY ? " & Benchmarks" : "";
  const buildDetailsList = () => {
    const parts = ["capabilities", "context window", "pricing per 1M tokens"];
    if (ENABLE_PERFORMANCE_COPY) {
      parts.push("speed");
    }
    parts.push("limits", "release date");
    return parts.length > 1
      ? `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`
      : parts[0];
  };
  const detailsList = buildDetailsList();

  const title = `${a}: Specs, Pricing, Context Window${benchmarksSuffix} | ${siteName}`;
  const description = `Full details for ${a}: ${detailsList}.`;

  const path = `/models/${provider}/${id}`;

  const keywordsBase = [
    "ai model details",
    "llm specs",
    "model specs",
    "model pricing",
    "pricing per 1M tokens",
    "context window",
    "capabilities",
    "limits",
  ];
  const perfKeywords = ENABLE_PERFORMANCE_COPY
    ? ["model benchmarks", `${a} benchmarks`]
    : [];
  const keywords = [
    ...keywordsBase,
    ...perfKeywords,
    a,
    `${a} specs`,
    `${a} pricing`,
    `${a} context window`,
    `${a} limits`,
    `${a} release date`,
    `${a} features`,
    `${a} alternatives`,
  ];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords,
    alternates: {
      canonical: path,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export async function generateStaticParams() {
  const sortedIds = [...allModels.map((m) => m.id)].sort((a, b) =>
    a.localeCompare(b)
  );
  return sortedIds.map((fullId) => {
    const [provider, model] = fullId.split("/");
    return { provider, id: model };
  });
}
