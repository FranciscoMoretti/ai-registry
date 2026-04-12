import type { ProviderParseResult } from "../provider-parsers/types";
import { anthropicNormalizer } from "./anthropic";
import { deepSeekNormalizer } from "./deepseek";
import { googleGeminiNormalizer } from "./google-gemini";
import { mistralNormalizer } from "./mistral";
import { openAiNormalizer } from "./openai";
import type { ProviderNormalizer } from "./types";

const normalizers = new Map<string, ProviderNormalizer>([
  [openAiNormalizer.providerSlug, openAiNormalizer],
  [anthropicNormalizer.providerSlug, anthropicNormalizer],
  [googleGeminiNormalizer.providerSlug, googleGeminiNormalizer],
  [mistralNormalizer.providerSlug, mistralNormalizer],
  [deepSeekNormalizer.providerSlug, deepSeekNormalizer],
]);

export function normalizeProviderResult(result: ProviderParseResult) {
  const normalizer = normalizers.get(result.provider);
  if (!normalizer) {
    throw new Error(`No provider normalizer registered for '${result.provider}'`);
  }

  return normalizer.normalize(result);
}
