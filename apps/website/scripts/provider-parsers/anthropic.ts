import { ProviderParser } from "./base";
import {
  compareModels,
  extractSnapshotDate,
  inferReasoningMode,
  parseTableRows,
  sanitizeModelId,
  slugToDisplayName,
  uniqueStrings,
} from "./shared";
import type { ParsedProviderModel, ProviderParseResult } from "./types";

type AnthropicAccumulator = {
  displayName: string;
  apiId: string | null;
  aliases: string[];
  contextWindow: string | null;
  maxOutputTokens: string | null;
  reasoningMode: ParsedProviderModel["reasoningMode"];
  evidence: Record<string, unknown>;
};

export class AnthropicProviderParser extends ProviderParser {
  readonly providerSlug = "anthropic";
  readonly reportPath = "docs/provider-reports/anthropic.md";
  readonly sourceUrl = "https://platform.claude.com/docs/en/about-claude/models/overview";

  parse(html: string): ProviderParseResult["models"] {
    const rows = parseTableRows(html);
    const byApiId = new Map<string, AnthropicAccumulator>();
    let activeColumns: AnthropicAccumulator[] = [];

    for (const row of rows) {
      const label = row[0]?.toLowerCase();
      if (!label) continue;

      if (label === "feature" && row.length > 1) {
        activeColumns = row.slice(1).map((displayName) => ({
          displayName,
          apiId: null,
          aliases: [],
          contextWindow: null,
          maxOutputTokens: null,
          reasoningMode: "unknown",
          evidence: {},
        }));
        continue;
      }

      if (activeColumns.length === 0 || row.length !== activeColumns.length + 1) {
        continue;
      }

      for (const [index, column] of activeColumns.entries()) {
        const cell = row[index + 1];
        if (!cell || cell === "-" || cell === "—") continue;

        if (label.includes("claude api id")) {
          column.apiId = sanitizeModelId(cell);
        } else if (label.includes("claude api alias")) {
          column.aliases.push(sanitizeModelId(cell));
        } else if (label.includes("aws bedrock id")) {
          column.aliases.push(sanitizeModelId(cell));
        } else if (label.includes("vertex ai id")) {
          column.aliases.push(sanitizeModelId(cell));
        } else if (label.includes("context window")) {
          column.contextWindow = cell;
        } else if (label.includes("max output")) {
          column.maxOutputTokens = cell;
        } else if (label.includes("extended thinking")) {
          column.reasoningMode = cell.toLowerCase().includes("yes")
            ? "optional"
            : inferReasoningMode(cell);
        } else if (label.includes("knowledge cutoff")) {
          column.evidence.knowledgeCutoff = cell;
        }
      }

      for (const column of activeColumns) {
        if (!column.apiId || !column.apiId.startsWith("claude-")) continue;
        const existing = byApiId.get(column.apiId);
        if (existing) {
          existing.aliases = uniqueStrings([...existing.aliases, ...column.aliases]);
          existing.contextWindow ??= column.contextWindow;
          existing.maxOutputTokens ??= column.maxOutputTokens;
          if (existing.reasoningMode === "unknown") {
            existing.reasoningMode = column.reasoningMode;
          }
          existing.evidence = {
            ...existing.evidence,
            ...column.evidence,
          };
        } else {
          byApiId.set(column.apiId, {
            ...column,
            aliases: uniqueStrings(column.aliases),
          });
        }
      }
    }

    return [...byApiId.values()]
      .map((model) => ({
        providerSlug: this.providerSlug,
        sourceModelId: model.apiId ?? "",
        canonicalModelId: model.apiId ?? "",
        displayName: model.displayName || slugToDisplayName(model.apiId ?? ""),
        aliases: uniqueStrings(model.aliases.filter((alias) => alias !== model.apiId)),
        lifecycle: "stable" as const,
        reasoningMode: model.reasoningMode,
        snapshotDate: extractSnapshotDate(model.apiId ?? ""),
        releaseDate: null,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        sourceUrl: this.sourceUrl,
        evidence: model.evidence,
      }))
      .sort(compareModels);
  }
}
