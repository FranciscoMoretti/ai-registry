import type { ProviderId } from '@ai-registry/vercel-gateway';

function getProviderIconSlug(provider: ProviderId): string | null {
  // Best-effort mapping to Simple Icons slugs. Unknown providers fall back to null.
  switch (provider) {
    case 'openai':
      return 'openai';
    case 'anthropic':
      return 'anthropic';
    case 'google':
      return 'google';
    case 'meta':
      return 'meta';
    case 'mistral':
      return 'mistral';
    case 'amazon':
      return 'amazon'; // AWS
    case 'alibaba':
      return 'alibaba';
    case 'cohere':
      return 'cohere';
    case 'perplexity':
      return 'perplexity';
    case 'vercel':
      return 'vercel';
    case 'deepseek':
      return 'deepseek';
    case 'xai':
      return 'xai';
    case 'moonshotai':
      return 'moonshotai';
    case 'zai':
      return 'zai';

    case 'stealth':
      return 'stealth';
    // Slug with no images (yet)
    case 'inception':
    case 'morph':
    case 'meituan':
      return null;
  }
}
export function getProviderIconUrl(
  provider: ProviderId,
  baseUrl: string,
): string | null {
  const iconSlug = getProviderIconSlug(provider);
  return iconSlug ? `${baseUrl}/providers/${iconSlug}.svg` : null;
}
