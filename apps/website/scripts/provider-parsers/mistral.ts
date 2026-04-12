import { ProviderParser } from "./base";
import {
  compareModels,
  extractSnapshotDate,
  sanitizeModelId,
  slugToDisplayName,
  stripHtml,
  uniqueStrings,
} from "./shared";
import type { ProviderParseResult } from "./types";

const MODEL_PATTERN =
  /\b(?:open-(?:codestral|mistral|mixtral)(?:-[a-z0-9x]+)+|(?:mistral|ministral|pixtral|codestral|magistral|devstral|mixtral)(?:-[a-z0-9x]+)+)\b/gi;

export class MistralProviderParser extends ProviderParser {
  readonly providerSlug = "mistral";
  readonly reportPath = "docs/provider-reports/mistral.md";
  readonly sourceUrl = "https://docs.mistral.ai/getting-started/models";

  parse(html: string): ProviderParseResult["models"] {
    const text = stripHtml(html);
    const ids = uniqueStrings(
      [...text.matchAll(MODEL_PATTERN)]
        .map((match) => sanitizeModelId(match[0] ?? ""))
        .filter(
          (id) =>
            id.startsWith("open-") ||
            /\d/.test(id) ||
            id.endsWith("mamba") ||
            id.includes("embed")
        )
    );

    return ids
      .map((id) => ({
        providerSlug: this.providerSlug,
        sourceModelId: id,
        canonicalModelId: id,
        displayName: slugToDisplayName(id),
        aliases: [],
        lifecycle: "stable" as const,
        reasoningMode: id.includes("magistral") ? ("thinking" as const) : ("unknown" as const),
        snapshotDate: extractSnapshotDate(id),
        releaseDate: null,
        contextWindow: null,
        maxOutputTokens: null,
        sourceUrl: this.sourceUrl,
        evidence: {
          sourceKind: id.startsWith("open-") ? "open" : "hosted",
        },
      }))
      .sort(compareModels);
  }
}
