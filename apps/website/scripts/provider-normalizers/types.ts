import type {
  ParsedProviderModel,
  ProviderLifecycle,
  ProviderParseResult,
  ReasoningMode,
} from "../provider-parsers/types";

export type ProviderAliasType =
  | "official_alias"
  | "platform_alias"
  | "surface_alias"
  | "latest_alias"
  | "snapshot_alias"
  | "historical_alias";

export type NormalizedIdentityKind = "concrete" | "conceptual";

export type NormalizedProviderAlias = {
  alias: string;
  aliasType: ProviderAliasType;
  sourceModelId: string;
  lifecycle: ProviderLifecycle;
  reasoningMode: ReasoningMode;
  snapshotDate: string | null;
  metadata: Record<string, unknown>;
};

export type NormalizedProviderModel = {
  providerSlug: string;
  normalizedModelId: string;
  displayName: string;
  identityKind: NormalizedIdentityKind;
  lifecycle: ProviderLifecycle;
  reasoningMode: ReasoningMode;
  releaseDate: string | null;
  snapshotDate: string | null;
  isSnapshot: boolean;
  userFacing: boolean;
  apiRecommended: boolean | null;
  contextWindow: string | null;
  maxOutputTokens: string | null;
  sourceModelIds: string[];
  aliases: NormalizedProviderAlias[];
  evidence: Record<string, unknown>;
};

export type ProviderNormalizeResult = {
  provider: string;
  parsedModelCount: number;
  normalizedModelCount: number;
  aliasCount: number;
  sourceUrl: string;
  fetchedAt: string;
  models: NormalizedProviderModel[];
};

export type ProviderNormalizer = {
  providerSlug: string;
  normalize(result: ProviderParseResult): ProviderNormalizeResult;
};

export type ProviderGroupDraft = {
  providerSlug: string;
  normalizedModelId: string;
  displayName: string | null;
  identityKind: NormalizedIdentityKind;
  lifecycle: ProviderLifecycle;
  reasoningMode: ReasoningMode;
  releaseDate: string | null;
  snapshotDate: string | null;
  isSnapshot: boolean;
  userFacing: boolean;
  apiRecommended: boolean | null;
  contextWindow: string | null;
  maxOutputTokens: string | null;
  sourceModelIds: string[];
  aliases: NormalizedProviderAlias[];
  evidence: Record<string, unknown>;
  sourceModels: ParsedProviderModel[];
};
