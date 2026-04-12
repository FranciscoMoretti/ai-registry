import { ProviderParser } from "./base";
import {
  compareModels,
  inferReasoningMode,
  parseTableRows,
  sanitizeModelId,
  slugToDisplayName,
  uniqueStrings,
} from "./shared";
import type { ParsedProviderModel, ProviderParseResult } from "./types";

type DeepSeekAccumulator = {
  sourceModelId: string;
  canonicalModelId: string;
  displayName: string;
  aliases: string[];
  reasoningMode: ParsedProviderModel["reasoningMode"];
  contextWindow: string | null;
  maxOutputTokens: string | null;
  evidence: Record<string, unknown>;
};

function normalizeUnderlyingVersion(value: string): string {
  const match = value.match(/deepseek-[a-z0-9.]+/i);
  return match ? sanitizeModelId(match[0]) : sanitizeModelId(value);
}

export class DeepSeekProviderParser extends ProviderParser {
  readonly providerSlug = "deepseek";
  readonly reportPath = "docs/provider-reports/deepseek.md";
  readonly sourceUrl = "https://api-docs.deepseek.com/quick_start/pricing";

  parse(html: string): ProviderParseResult["models"] {
    const rows = parseTableRows(html);
    let activeColumns: DeepSeekAccumulator[] = [];
    const bySourceId = new Map<string, DeepSeekAccumulator>();

    for (const row of rows) {
      const label = row[0]?.toLowerCase();
      if (!label) continue;

      if (label === "model" && row.length > 1) {
        activeColumns = row.slice(1).map((sourceModelId) => ({
          sourceModelId: sanitizeModelId(sourceModelId),
          canonicalModelId: sanitizeModelId(sourceModelId),
          displayName: slugToDisplayName(sourceModelId),
          aliases: [],
          reasoningMode: inferReasoningMode(sourceModelId),
          contextWindow: null,
          maxOutputTokens: null,
          evidence: {},
        }));
        continue;
      }

      if (activeColumns.length === 0) {
        continue;
      }

      const values =
        row.length === activeColumns.length + 1
          ? row.slice(1)
          : row.length === 2
            ? activeColumns.map(() => row[1] ?? "")
            : null;

      if (!values) continue;

      for (const [index, column] of activeColumns.entries()) {
        const cell = values[index];
        if (!cell || cell === "-" || cell === "—") continue;

        if (label === "model version") {
          const underlyingVersion = normalizeUnderlyingVersion(cell);
          column.canonicalModelId = underlyingVersion;
          column.aliases.push(column.sourceModelId);
          const inferredReasoning = inferReasoningMode(cell);
          if (inferredReasoning !== "unknown") {
            column.reasoningMode = inferredReasoning;
          }
          column.evidence.modelVersion = cell;
        } else if (label.includes("context length")) {
          column.contextWindow = cell;
        } else if (label.includes("max output")) {
          column.maxOutputTokens = cell;
        }
      }

      for (const column of activeColumns) {
        bySourceId.set(column.sourceModelId, {
          ...column,
          aliases: uniqueStrings(column.aliases),
        });
      }
    }

    return [...bySourceId.values()]
      .map((model) => ({
        providerSlug: this.providerSlug,
        sourceModelId: model.sourceModelId,
        canonicalModelId: model.canonicalModelId,
        displayName: model.displayName,
        aliases: uniqueStrings(model.aliases.filter((alias) => alias !== model.canonicalModelId)),
        lifecycle: "stable" as const,
        reasoningMode: model.reasoningMode,
        snapshotDate: null,
        releaseDate: null,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        sourceUrl: this.sourceUrl,
        evidence: model.evidence,
      }))
      .sort(compareModels);
  }
}
