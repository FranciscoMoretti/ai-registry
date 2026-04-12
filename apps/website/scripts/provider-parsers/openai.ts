import { ProviderParser } from "./base";
import {
  compareModels,
  extractSnapshotDate,
  normalizeWhitespace,
  slugToDisplayName,
  stripHtml,
  uniqueBy,
} from "./shared";
import type { ProviderLifecycle, ProviderParseResult } from "./types";

const MODEL_CARD_PATTERN =
  /<a\b[^>]*href="\/api\/docs\/models\/([^"/?#]+)"[^>]*>([\s\S]*?)<\/a>/gi;

function extractDisplayName(innerHtml: string, id: string): string {
  const headingMatch = innerHtml.match(/<div\b[^>]*class="[^"]*font-semibold[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const heading = headingMatch ? stripHtml(headingMatch[1]) : "";

  if (heading) return heading;
  return slugToDisplayName(id);
}

function extractDescription(innerHtml: string): string | null {
  const descriptionMatch = innerHtml.match(
    /<div\b[^>]*class="[^"]*text-sm[^"]*text-secondary[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );

  const description = descriptionMatch ? stripHtml(descriptionMatch[1]) : "";
  return description || null;
}

function inferLifecycle(
  id: string,
  displayName: string,
  description: string | null,
  innerHtml: string
): ProviderLifecycle {
  const combined = `${id} ${displayName} ${description ?? ""} ${stripHtml(innerHtml)}`.toLowerCase();

  if (combined.includes("deprecated")) return "deprecated";
  if (combined.includes("preview")) return "preview";
  if (combined.includes("latest")) return "latest";
  return "stable";
}

function inferReasoningMode(id: string, description: string | null) {
  const combined = `${id} ${description ?? ""}`.toLowerCase();
  if (combined.includes("non-reasoning")) return "non-thinking" as const;
  if (combined.includes("reasoning")) return "optional" as const;
  if (/^o\d/.test(id)) return "thinking" as const;
  return "unknown" as const;
}

function inferCatalogSection(id: string, description: string | null): string | null {
  if (id.startsWith("chatgpt-") || id.endsWith("-chat-latest")) return "chatgpt";
  if (id.startsWith("gpt-oss-")) return "open-weight";
  if (id.includes("embedding")) return "embeddings";
  if (id.includes("moderation")) return "moderation";
  if (id.includes("audio") || id.includes("realtime") || id.includes("transcribe") || id.startsWith("tts-")) {
    return "audio";
  }
  if (id.includes("image") || id.startsWith("dall-e")) return "image";
  if (id.startsWith("sora")) return "video";
  if (description?.toLowerCase().includes("chatgpt")) return "chatgpt";
  return null;
}

export class OpenAIProviderParser extends ProviderParser {
  readonly providerSlug = "openai";
  readonly reportPath = "docs/provider-reports/openai.md";
  readonly sourceUrl = "https://developers.openai.com/api/docs/models/all";

  parse(html: string): ProviderParseResult["models"] {
    const cards = [...html.matchAll(MODEL_CARD_PATTERN)]
      .map((match) => {
        const id = decodeURIComponent(match[1] ?? "").trim();
        const innerHtml = match[2] ?? "";
        const displayName = extractDisplayName(innerHtml, id);
        const description = extractDescription(innerHtml);
        const catalogSection = inferCatalogSection(id, description);

        return {
          providerSlug: this.providerSlug,
          sourceModelId: id,
          canonicalModelId: id,
          displayName,
          aliases: [],
          lifecycle: inferLifecycle(id, displayName, description, innerHtml),
          reasoningMode: inferReasoningMode(id, description),
          snapshotDate: extractSnapshotDate(id),
          releaseDate: null,
          contextWindow: null,
          maxOutputTokens: null,
          sourceUrl: this.sourceUrl,
          evidence: {
            description,
            catalogSection,
            apiRecommended: catalogSection === "chatgpt" ? false : null,
          },
        };
      })
      .filter((card) => card.sourceModelId.length > 0);

    return uniqueBy(cards, (card) => card.sourceModelId)
      .map((card) => ({
        ...card,
        evidence: {
          href: `/api/docs/models/${card.sourceModelId}`,
          description: normalizeWhitespace(String(card.evidence.description ?? "")) || null,
          catalogSection: card.evidence.catalogSection,
          apiRecommended: card.evidence.apiRecommended,
        },
      }))
      .sort(compareModels);
  }
}
