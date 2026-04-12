export type ProviderLifecycle =
  | "stable"
  | "preview"
  | "latest"
  | "experimental"
  | "deprecated"
  | "shut_down"
  | "unknown";

export type ReasoningMode = "thinking" | "non-thinking" | "optional" | "unknown";

export type ParsedProviderModel = {
  providerSlug: string;
  sourceModelId: string;
  canonicalModelId: string;
  displayName: string;
  aliases: string[];
  lifecycle: ProviderLifecycle;
  reasoningMode: ReasoningMode;
  snapshotDate: string | null;
  releaseDate: string | null;
  contextWindow: string | null;
  maxOutputTokens: string | null;
  sourceUrl: string;
  evidence: Record<string, unknown>;
};

export type ProviderParseResult = {
  provider: string;
  reportPath: string;
  sourceUrl: string;
  fetchedAt: string;
  modelCount: number;
  models: ParsedProviderModel[];
};
