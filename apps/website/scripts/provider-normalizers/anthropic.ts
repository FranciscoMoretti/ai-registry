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

export const anthropicNormalizer: ProviderNormalizer = {
  providerSlug: "anthropic",
  normalize(result: ProviderParseResult) {
    const groups = new Map<string, ReturnType<typeof buildEmptyGroup>>();

    for (const model of result.models) {
      const normalizedModelId = sanitizeModelId(model.canonicalModelId);
      const group = groups.get(normalizedModelId) ?? buildEmptyGroup(result.provider, normalizedModelId);

      addSourceModelToGroup(group, model, {
        identityKind: "concrete",
        isSnapshot: Boolean(model.snapshotDate),
      });

      for (const alias of model.aliases) {
        addAlias(
          group,
          createAlias(
            model,
            alias,
            alias.includes("anthropic.") || alias.includes("@") ? "platform_alias" : "official_alias"
          )
        );
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
