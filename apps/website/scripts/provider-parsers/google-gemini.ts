import { ProviderParser } from "./base";
import {
  compareModels,
  extractSnapshotDate,
  mergeLifecycles,
  slugToDisplayName,
  stripHtml,
  uniqueBy,
} from "./shared";
import type { ProviderLifecycle, ProviderParseResult } from "./types";

const MODEL_LINK_PATTERN =
  /<a\b[^>]*href="(?:https:\/\/ai\.google\.dev)?\/gemini-api\/docs\/models\/([^"/?#]+)(?:\?[^"]*)?"[^>]*>([\s\S]*?)<\/a>/gi;

function inferLifecycle(modelId: string, text: string): ProviderLifecycle {
  const normalizedSnippet = text.toLowerCase();
  const normalizedId = modelId.toLowerCase();

  if (normalizedSnippet.includes("shut down")) return "shut_down";
  if (normalizedSnippet.includes("deprecated")) return "deprecated";
  if (normalizedId.includes("latest") || normalizedSnippet.includes("latest")) return "latest";
  if (
    normalizedId.includes("preview") ||
    normalizedSnippet.includes("preview") ||
    normalizedSnippet.includes("pre-release")
  ) {
    return "preview";
  }
  if (normalizedId.includes("exp") || normalizedSnippet.includes("experimental")) {
    return "experimental";
  }
  return "stable";
}

export class GoogleGeminiProviderParser extends ProviderParser {
  readonly providerSlug = "google";
  readonly reportPath = "docs/provider-reports/google-gemini.md";
  readonly sourceUrl = "https://ai.google.dev/gemini-api/docs/models?hl=en";

  parse(html: string): ProviderParseResult["models"] {
    const models = [...html.matchAll(MODEL_LINK_PATTERN)].map((match) => {
      const sourceModelId = decodeURIComponent(match[1] ?? "").trim();
      const localHtml = html.slice(Math.max(0, (match.index ?? 0) - 180), (match.index ?? 0) + 280);
      const anchorText = stripHtml(match[2] ?? "");
      const localContext = stripHtml(localHtml);
      const dataTextMatch = localHtml.match(/data-text="([^"]+)"/i);
      const displayCandidate = (dataTextMatch?.[1] ?? anchorText ?? "").trim();
      const displayName =
        displayCandidate &&
        displayCandidate.length <= 60 &&
        !displayCandidate.includes("Our ") &&
        !displayCandidate.includes("Frontier-class")
          ? displayCandidate
          : slugToDisplayName(sourceModelId);

      return {
        providerSlug: this.providerSlug,
        sourceModelId,
        canonicalModelId: sourceModelId,
        displayName,
        aliases: [],
        lifecycle: inferLifecycle(sourceModelId, `${anchorText} ${localContext}`),
        reasoningMode: "unknown" as const,
        snapshotDate: extractSnapshotDate(sourceModelId),
        releaseDate: null,
        contextWindow: null,
        maxOutputTokens: null,
        sourceUrl: this.sourceUrl,
        evidence: {
          href: `/gemini-api/docs/models/${sourceModelId}`,
          lifecycleText: `${anchorText} ${localContext}`.slice(0, 240),
        },
      };
    });

    return uniqueBy(models, (model) => model.sourceModelId)
      .reduce<typeof models>((accumulator, model) => {
        const existing = accumulator.find((candidate) => candidate.sourceModelId === model.sourceModelId);
        if (existing) {
          existing.lifecycle = mergeLifecycles(existing.lifecycle, model.lifecycle);
          return accumulator;
        }

        accumulator.push(model);
        return accumulator;
      }, [])
      .sort(compareModels);
  }
}
