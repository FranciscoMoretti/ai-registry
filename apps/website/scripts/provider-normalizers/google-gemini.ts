import { sanitizeModelId } from "../provider-parsers/shared";
import type { ProviderParseResult } from "../provider-parsers/types";
import {
  addAlias,
  addSourceModelToGroup,
  buildEmptyGroup,
  buildNormalizeResult,
  createAlias,
  finalizeGroup,
} from "./shared";
import type { ProviderNormalizer } from "./types";

function collapseGoogleModelId(sourceModelId: string) {
  if (sourceModelId.endsWith("-latest")) {
    return {
      normalizedModelId: sourceModelId.replace(/-latest$/, ""),
      aliasType: "latest_alias" as const,
      identityKind: "conceptual" as const,
    };
  }

  return {
    normalizedModelId: sourceModelId,
    aliasType: null,
    identityKind: "concrete" as const,
  };
}

export const googleGeminiNormalizer: ProviderNormalizer = {
  providerSlug: "google",
  normalize(result: ProviderParseResult) {
    const groups = new Map<string, ReturnType<typeof buildEmptyGroup>>();

    for (const model of result.models) {
      const collapsed = collapseGoogleModelId(model.canonicalModelId);
      const normalizedModelId = sanitizeModelId(collapsed.normalizedModelId);
      const group = groups.get(normalizedModelId) ?? buildEmptyGroup(result.provider, normalizedModelId);

      addSourceModelToGroup(group, model, {
        identityKind: collapsed.identityKind,
        isSnapshot: false,
      });

      if (collapsed.aliasType) {
        addAlias(group, createAlias(model, model.sourceModelId, collapsed.aliasType));
      }

      groups.set(normalizedModelId, group);
    }

    const models = [...groups.values()]
      .map((group) => finalizeGroup(group))
      .sort((a, b) => a.normalizedModelId.localeCompare(b.normalizedModelId));

    return buildNormalizeResult({
      provider: result.provider,
      parsedModelCount: result.modelCount,
      sourceUrl: result.sourceUrl,
      fetchedAt: result.fetchedAt,
      models,
    });
  },
};
