import { allModels } from '@ai-registry/vercel-gateway';
import type { Metadata } from 'next';
import ComparePage from '../compare-page';

// Toggle to include/exclude "Performance" related copy
const ENABLE_PERFORMANCE_COPY = false;

const SITE_URL = `http://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'localhost:3000'}`;

export default function Page(_props: PageProps<'/compare/[[...slug]]'>) {
  return <ComparePage />;
}

export async function generateMetadata(
  _ctx: PageProps<'/compare/[[...slug]]'>,
): Promise<Metadata> {
  const resolved = await _ctx.params;
  const segments = Array.isArray(resolved?.slug) ? resolved.slug : [];

  const toId = (pair: string[] | undefined): string | null => {
    if (!pair || pair.length < 2) {
      return null;
    }
    return `${pair[0]}/${pair[1]}`;
  };

  const leftId = toId(segments.slice(0, 2));
  const rightId = toId(segments.slice(2, 4));

  const findModel = (id: string | null) =>
    id ? allModels.find((m) => m.id === id) || null : null;

  const left = findModel(leftId);
  const right = findModel(rightId);

  const capProv = (p?: string) =>
    (p || '').slice(0, 1).toUpperCase() + (p || '').slice(1);

  const displayName = (id: string | null) => {
    const model = findModel(id);
    if (!model) {
      return id ?? '';
    }
    const provider = capProv(model.owned_by);
    return `${provider} ${model.name}`.trim();
  };

  const siteName = 'AI Registry';
  const perfSuffix = ENABLE_PERFORMANCE_COPY ? ' & Performance' : '';

  const buildCompareList = () => {
    const parts = ['specs', 'context window', 'pricing'];
    if (ENABLE_PERFORMANCE_COPY) {
      parts.push('speed');
    }
    parts.push('limits');
    return parts.length > 1
      ? `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
      : parts[0];
  };

  const compareList = buildCompareList();

  let title = `AI Model Comparison: Pricing, Specs${perfSuffix} | AI Registry`;
  let description = `Compare AI models by ${compareList}.`;

  const keywordsBase = [
    'model comparison',
    'ai model comparison',
    'llm comparison',
    'model vs model',
    'ai model vs model',
    'pricing per 1M tokens',
    'context window',
  ];
  const perfKeywords = ENABLE_PERFORMANCE_COPY ? ['model benchmarks'] : [];
  let keywords = [...keywordsBase, ...perfKeywords];

  if (left && right) {
    const a = displayName(left.id);
    const b = displayName(right.id);
    title = `${a} vs ${b}: Pricing, Specs${perfSuffix} | ${siteName}`;
    description = `Compare ${a} vs ${b}: ${compareList}.`;
    keywords = [
      ...keywordsBase,
      `${a} vs ${b}`,
      `${b} vs ${a}`,
      `${a} comparison`,
      `${b} comparison`,
    ];
  } else if (left) {
    const a = displayName(left.id);
    title = `${a} Comparison: Pricing, Specs${perfSuffix} | ${siteName}`;
    description = `Compare ${a} with other AI models: ${compareList}.`;
    keywords = [
      ...keywordsBase,
      `${a} comparison`,
      `${a} vs`,
      `${a} alternatives`,
    ];
  }

  const path = ['/compare', ...segments].join(segments.length ? '/' : '');

  const query = new URLSearchParams();
  if (leftId) {
    query.set('modelId1', leftId);
  }
  if (rightId) {
    query.set('modelId2', rightId);
  }

  // Use basic OG when no models are selected; otherwise use compare OG
  let ogImageUrl: string;
  if (leftId) {
    ogImageUrl = `${SITE_URL}/api/og/compare${
      query.toString() ? `?${query.toString()}` : ''
    }`;
  } else {
    const basic = new URLSearchParams();
    basic.set('title', 'AI Model Comparison');
    basic.set('description', description);
    ogImageUrl = `${SITE_URL}/api/og/basic?${basic.toString()}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
  // Sort deterministically to keep generated paths stable if in-memory order changes
  const sortedIds = [...allModels.map((m) => m.id)].sort((a, b) =>
    a.localeCompare(b),
  );

  // Singles: all ids
  const singles = sortedIds.map((id) => {
    const [provider, model] = id.split('/');
    return { slug: [provider, model] };
  });

  // Pairs: all unique combos i<j (avoid left/right duplicates)
  const pairs = [];
  for (let i = 0; i < sortedIds.length; i++) {
    for (let j = i + 1; j < sortedIds.length; j++) {
      const [p1, m1] = sortedIds[i].split('/');
      const [p2, m2] = sortedIds[j].split('/');
      pairs.push({ slug: [p1, m1, p2, m2] });
    }
  }

  // Include the base route `/compare` (optional catch-all allows empty slug)
  const root: { slug: string[] } = { slug: [] };

  return [root, ...singles, ...pairs];
}
