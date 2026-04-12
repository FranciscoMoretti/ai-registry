import {
  mergeLifecycles,
  normalizeWhitespace,
  slugToDisplayName,
  uniqueStrings,
} from "../provider-parsers/shared";
import type {
  ParsedProviderModel,
  ProviderLifecycle,
  ReasoningMode,
} from "../provider-parsers/types";
import type {
  NormalizedIdentityKind,
  NormalizedProviderAlias,
  NormalizedProviderModel,
  ProviderGroupDraft,
  ProviderNormalizeResult,
} from "./types";

export function mergeReasoningModes(current: ReasoningMode, next: ReasoningMode): ReasoningMode {
  if (current === "unknown") return next;
  if (next === "unknown") return current;
  if (current === next) return current;
  if (current === "optional" || next === "optional") return "optional";
  if (
    (current === "thinking" && next === "non-thinking") ||
    (current === "non-thinking" && next === "thinking")
  ) {
    return "optional";
  }

  const priority: ReasoningMode[] = ["optional", "thinking", "non-thinking", "unknown"];
  return priority.indexOf(next) < priority.indexOf(current) ? next : current;
}

export function chooseDisplayName(current: string | null, next: string, fallbackId: string): string {
  const candidate = normalizeWhitespace(next);
  if (!current) return candidate || slugToDisplayName(fallbackId);
  if (!candidate) return current;

  const currentLooksSlug = current === current.toLowerCase();
  const nextLooksBetter = !candidate.includes("latest") && candidate.length < 50;
  if (currentLooksSlug && nextLooksBetter) return candidate;
  if (candidate.length < current.length && nextLooksBetter) return candidate;
  return current;
}

export function buildEmptyGroup(
  providerSlug: string,
  normalizedModelId: string
): ProviderGroupDraft {
  return {
    providerSlug,
    normalizedModelId,
    displayName: null,
    identityKind: "concrete",
    lifecycle: "unknown",
    reasoningMode: "unknown",
    releaseDate: null,
    snapshotDate: null,
    isSnapshot: false,
    userFacing: true,
    apiRecommended: null,
    contextWindow: null,
    maxOutputTokens: null,
    sourceModelIds: [],
    aliases: [],
    evidence: {},
    sourceModels: [],
  };
}

export function finalizeGroup(group: ProviderGroupDraft): NormalizedProviderModel {
  return {
    providerSlug: group.providerSlug,
    normalizedModelId: group.normalizedModelId,
    displayName: group.displayName ?? slugToDisplayName(group.normalizedModelId),
    identityKind: group.identityKind,
    lifecycle: group.lifecycle,
    reasoningMode: group.reasoningMode,
    releaseDate: group.releaseDate,
    snapshotDate: group.snapshotDate,
    isSnapshot: group.isSnapshot,
    userFacing: group.userFacing,
    apiRecommended: group.apiRecommended,
    contextWindow: group.contextWindow,
    maxOutputTokens: group.maxOutputTokens,
    sourceModelIds: uniqueStrings(group.sourceModelIds).sort(),
    aliases: group.aliases.sort((a, b) => a.alias.localeCompare(b.alias)),
    evidence: group.evidence,
  };
}

export function buildNormalizeResult(
  result: {
    provider: string;
    parsedModelCount: number;
    sourceUrl: string;
    fetchedAt: string;
    models: NormalizedProviderModel[];
  }
): ProviderNormalizeResult {
  return {
    provider: result.provider,
    parsedModelCount: result.parsedModelCount,
    normalizedModelCount: result.models.length,
    aliasCount: result.models.reduce((sum, model) => sum + model.aliases.length, 0),
    sourceUrl: result.sourceUrl,
    fetchedAt: result.fetchedAt,
    models: result.models,
  };
}

export function addSourceModelToGroup(
  group: ProviderGroupDraft,
  model: ParsedProviderModel,
  options?: {
    displayName?: string;
    identityKind?: NormalizedIdentityKind;
    userFacing?: boolean;
    apiRecommended?: boolean | null;
    isSnapshot?: boolean;
    snapshotDate?: string | null;
    releaseDate?: string | null;
  }
) {
  group.sourceModels.push(model);
  group.sourceModelIds.push(model.sourceModelId);
  group.displayName = chooseDisplayName(
    group.displayName,
    options?.displayName ?? model.displayName,
    group.normalizedModelId
  );
  group.lifecycle = group.lifecycle === "unknown"
    ? model.lifecycle
    : mergeLifecycles(group.lifecycle, model.lifecycle);
  group.reasoningMode = mergeReasoningModes(group.reasoningMode, model.reasoningMode);
  group.releaseDate ??= options?.releaseDate ?? model.releaseDate;
  group.snapshotDate ??= options?.snapshotDate ?? model.snapshotDate;
  if (!group.contextWindow) {
    group.contextWindow = model.contextWindow;
  } else if (model.contextWindow && group.contextWindow !== model.contextWindow) {
    group.contextWindow = null;
    group.evidence.contextWindowConflict = true;
  }

  if (!group.maxOutputTokens) {
    group.maxOutputTokens = model.maxOutputTokens;
  } else if (model.maxOutputTokens && group.maxOutputTokens !== model.maxOutputTokens) {
    group.maxOutputTokens = null;
    group.evidence.maxOutputTokensConflict = true;
  }
  group.isSnapshot = options?.isSnapshot ?? group.isSnapshot;
  group.userFacing = options?.userFacing ?? group.userFacing;
  if (options?.apiRecommended !== undefined) {
    group.apiRecommended = options.apiRecommended;
  } else if (group.apiRecommended === null && typeof model.evidence.apiRecommended === "boolean") {
    group.apiRecommended = model.evidence.apiRecommended as boolean;
  }
  if (options?.identityKind) {
    group.identityKind = options.identityKind;
  }
}

export function addAlias(
  group: ProviderGroupDraft,
  alias: NormalizedProviderAlias | null
) {
  if (!alias) return;
  if (alias.alias === group.normalizedModelId) return;
  if (group.aliases.some((existing) => existing.alias === alias.alias)) return;
  group.aliases.push(alias);
}

export function createAlias(
  model: ParsedProviderModel,
  alias: string,
  aliasType: NormalizedProviderAlias["aliasType"],
  metadata?: Record<string, unknown>
): NormalizedProviderAlias | null {
  const normalized = normalizeWhitespace(alias);
  if (!normalized) return null;

  return {
    alias: normalized,
    aliasType,
    sourceModelId: model.sourceModelId,
    lifecycle: model.lifecycle,
    reasoningMode: model.reasoningMode,
    snapshotDate: model.snapshotDate,
    metadata: metadata ?? {},
  };
}

export function groupModelsBy<T extends string>(
  models: ParsedProviderModel[],
  getKey: (model: ParsedProviderModel) => T
): Map<T, ParsedProviderModel[]> {
  const map = new Map<T, ParsedProviderModel[]>();
  for (const model of models) {
    const key = getKey(model);
    const current = map.get(key);
    if (current) current.push(model);
    else map.set(key, [model]);
  }
  return map;
}
