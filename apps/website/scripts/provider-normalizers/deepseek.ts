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

export const deepSeekNormalizer: ProviderNormalizer = {
  providerSlug: "deepseek",
  normalize(result: ProviderParseResult) {
    const groups = new Map<string, ReturnType<typeof buildEmptyGroup>>();

    for (const model of result.models) {
      const normalizedModelId = sanitizeModelId(model.canonicalModelId);
      const group = groups.get(normalizedModelId) ?? buildEmptyGroup(result.provider, normalizedModelId);

      addSourceModelToGroup(group, model, {
        identityKind: "concrete",
      });

      addAlias(group, createAlias(model, model.sourceModelId, "official_alias"));

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
