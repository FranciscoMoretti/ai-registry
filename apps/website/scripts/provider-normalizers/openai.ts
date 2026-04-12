import { sanitizeModelId } from "../provider-parsers/shared";
import type { ParsedProviderModel, ProviderParseResult } from "../provider-parsers/types";
import {
  addAlias,
  addSourceModelToGroup,
  buildEmptyGroup,
  buildNormalizeResult,
  createAlias,
  finalizeGroup,
} from "./shared";
import type { ProviderNormalizer } from "./types";

const DASHED_DATE_SUFFIX = /-(20\d{2}-\d{2}-\d{2})$/;

function collapseOpenAiModelId(sourceModelId: string) {
  if (sourceModelId.endsWith("-latest")) {
    return {
      normalizedModelId: sourceModelId.replace(/-latest$/, ""),
      aliasType: "latest_alias" as const,
      identityKind: "conceptual" as const,
    };
  }

  if (sourceModelId.endsWith("-stable")) {
    return {
      normalizedModelId: sourceModelId.replace(/-stable$/, ""),
      aliasType: "official_alias" as const,
      identityKind: "conceptual" as const,
    };
  }

  if (DASHED_DATE_SUFFIX.test(sourceModelId)) {
    return {
      normalizedModelId: sourceModelId.replace(DASHED_DATE_SUFFIX, ""),
      aliasType: "snapshot_alias" as const,
      identityKind: "conceptual" as const,
    };
  }

  return {
    normalizedModelId: sourceModelId,
    aliasType: null,
    identityKind: "concrete" as const,
  };
}

function inferUserFacing(model: ParsedProviderModel): boolean {
  return model.evidence.catalogSection !== "chatgpt";
}

export const openAiNormalizer: ProviderNormalizer = {
  providerSlug: "openai",
  normalize(result: ProviderParseResult) {
    const groups = new Map<string, ReturnType<typeof buildEmptyGroup>>();

    for (const model of result.models) {
      const collapsed = collapseOpenAiModelId(model.canonicalModelId);
      const normalizedModelId = sanitizeModelId(collapsed.normalizedModelId);
      const group = groups.get(normalizedModelId) ?? buildEmptyGroup(result.provider, normalizedModelId);

      addSourceModelToGroup(group, model, {
        identityKind: collapsed.identityKind,
        userFacing: inferUserFacing(model),
        apiRecommended:
          typeof model.evidence.apiRecommended === "boolean"
            ? (model.evidence.apiRecommended as boolean)
            : null,
        isSnapshot: false,
      });

      if (collapsed.aliasType) {
        addAlias(group, createAlias(model, model.sourceModelId, collapsed.aliasType, {
          surface: "provider_catalog",
        }));
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
