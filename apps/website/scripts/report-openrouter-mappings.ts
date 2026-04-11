import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type VercelModel = {
  id: string;
  name: string;
  description: string;
  created: number;
  context_window: number;
  type: string;
};

type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  created: number;
  context_length: number;
};

type SafeMapping = {
  vercelId: string;
  openrouterId: string;
  kind: "exact" | "provider_alias";
};

type CuratedMapping = {
  vercelId: string;
  kind:
    | "provider_alias_plus_suffix"
    | "snapshot_suffix"
    | "renamed_family"
    | "variant_collapse"
    | "ambiguous_family_match";
  candidates: string[];
  notes: string;
};

type CuratedReview = {
  vercelId: string;
  review: "high_confidence" | "risky" | "should_be_unsupported";
  reason: string;
};

type UnsupportedMapping = {
  vercelId: string;
  reason: string;
};

const VERCEL_URL = "https://ai-gateway.vercel.sh/v1/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/models";

const providerAliases = new Map<string, string>([
  ["alibaba", "qwen"],
  ["bytedance", "bytedance-seed"],
  ["meta", "meta-llama"],
  ["mistral", "mistralai"],
  ["xai", "x-ai"],
  ["zai", "z-ai"],
]);

function stripProvider(id: string): string {
  return id.includes("/") ? id.split("/").slice(1).join("/") : id;
}

function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 2);
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function getProvider(id: string): string {
  return id.split("/")[0] ?? "";
}

function buildCandidateList(
  model: VercelModel,
  openRouterModels: OpenRouterModel[]
): string[] {
  const vercelSuffix = stripProvider(model.id);
  const vercelSuffixCompact = compact(vercelSuffix);
  const vercelTokens = tokenize(vercelSuffix);
  const provider = getProvider(model.id);
  const aliasedProvider = providerAliases.get(provider) ?? provider;

  const pool = openRouterModels.filter((candidate) => {
    const candidateProvider = getProvider(candidate.id);
    return candidateProvider === provider || candidateProvider === aliasedProvider;
  });

  const scored = pool
    .map((candidate) => {
      const candidateSuffix = stripProvider(candidate.id);
      const candidateCompact = compact(candidateSuffix);
      const candidateTokens = tokenize(candidateSuffix);
      const sharedTokens = vercelTokens.filter((token) => candidateTokens.includes(token));
      let score = 0;

      if (
        model.id.startsWith("openai/gpt-image-") &&
        !candidate.id.startsWith("openai/gpt-image-")
      ) {
        return { id: candidate.id, score: -100 };
      }

      if (candidateCompact === vercelSuffixCompact) score += 100;
      if (
        candidateCompact.startsWith(vercelSuffixCompact) ||
        vercelSuffixCompact.startsWith(candidateCompact)
      ) {
        score += 40;
      }

      score += sharedTokens.length * 12;

      const vercelNameCompact = compact(model.name);
      const candidateNameCompact = compact(candidate.name);
      if (
        vercelNameCompact &&
        candidateNameCompact &&
        (candidateNameCompact.includes(vercelNameCompact) ||
          vercelNameCompact.includes(candidateNameCompact))
      ) {
        score += 20;
      }

      if (candidate.context_length === model.context_window) score += 10;

      const desc = compact(candidate.description ?? "");
      if (desc && (desc.includes(vercelSuffixCompact) || desc.includes(vercelNameCompact))) {
        score += 5;
      }

      const isEmbedding = vercelTokens.includes("embedding") || vercelTokens.includes("embed");
      const candidateIsEmbedding =
        candidateTokens.includes("embedding") || candidateTokens.includes("embed");
      if (isEmbedding !== candidateIsEmbedding) {
        score -= 30;
      }

      const isVisionFamily =
        vercelTokens.includes("image") ||
        vercelTokens.includes("video") ||
        vercelTokens.includes("i2v") ||
        vercelTokens.includes("t2v") ||
        vercelTokens.includes("r2v") ||
        vercelTokens.includes("veo") ||
        vercelTokens.includes("imagen") ||
        vercelTokens.includes("wan");
      const candidateIsVisionFamily =
        candidateTokens.includes("image") ||
        candidateTokens.includes("video") ||
        candidateTokens.includes("i2v") ||
        candidateTokens.includes("t2v") ||
        candidateTokens.includes("veo") ||
        candidateTokens.includes("imagen") ||
        compact(candidate.name).includes("image") ||
        compact(candidate.name).includes("video");
      if (isVisionFamily !== candidateIsVisionFamily) {
        score -= 30;
      }

      if (sharedTokens.length === 0 && candidateCompact !== vercelSuffixCompact) {
        score -= 40;
      }

      return { id: candidate.id, score };
    })
    .filter((candidate) => candidate.score >= 20)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return dedupe(scored.map((candidate) => candidate.id)).slice(0, 8);
}

function classifyCuratedKind(model: VercelModel, candidates: string[]): CuratedMapping["kind"] {
  const suffix = stripProvider(model.id);

  if (candidates.some((candidate) => compact(stripProvider(candidate)) === compact(suffix))) {
    return "provider_alias_plus_suffix";
  }

  if (
    /(?:-v\d+|-001$|-preview$|-preview-\d{2}-\d{4}$|-250\d$|-251\d$|:\w+$)/.test(
      candidates[0] ?? ""
    )
  ) {
    return "snapshot_suffix";
  }

  if (
    suffix.includes("thinking") ||
    suffix.includes("fast") ||
    suffix.includes("preview") ||
    suffix.includes("beta")
  ) {
    return "variant_collapse";
  }

  if (model.id.startsWith("deepseek/")) {
    return "renamed_family";
  }

  return "ambiguous_family_match";
}

function classifyCuratedNotes(model: VercelModel, candidates: string[]): string {
  if (model.id.startsWith("deepseek/deepseek-v3")) {
    return "DeepSeek names differ across APIs; OpenRouter uses chat/snapshot-style IDs for nearby models.";
  }

  if (model.id.startsWith("google/gemini-2.0-flash")) {
    return "OpenRouter exposes snapshot-suffixed Gemini 2.0 IDs, so this needs a family-specific normalization rule.";
  }

  if (model.id.startsWith("google/gemini-3-")) {
    return "OpenRouter exposes preview-style Gemini 3 IDs rather than the Vercel ID form.";
  }

  if (model.id.startsWith("meta/llama-3")) {
    return "OpenRouter uses meta-llama plus explicit instruct/vision suffixes; mapping is likely correct but requires a curated rule.";
  }

  if (model.id.startsWith("xai/")) {
    return "Vercel splits fast/reasoning/beta variants more finely than the OpenRouter IDs, so this mapping is lossy.";
  }

  if (model.id.startsWith("openai/gpt-5.1-")) {
    return "OpenRouter has nearby GPT-5.1 family IDs but not the same Vercel variant naming.";
  }

  if (model.id.startsWith("mistral/")) {
    return "Mistral families often differ by dated snapshot or family-generation suffix on OpenRouter.";
  }

  if (model.id.startsWith("amazon/nova-")) {
    return "OpenRouter appends a version suffix to the Amazon Nova family.";
  }

  if (model.id.startsWith("alibaba/")) {
    return "Qwen-family IDs differ by provider alias and, for some models, by dated or capability suffixes.";
  }

  if (candidates.length > 1) {
    return "Multiple plausible OpenRouter candidates exist; this cannot be promoted to a safe mapping without a manual rule.";
  }

  return "A plausible OpenRouter counterpart exists, but the ID forms do not match closely enough to call this safe.";
}

function reviewCuratedMapping(mapping: CuratedMapping): CuratedReview {
  const { vercelId, kind, candidates } = mapping;

  if (
    vercelId === "google/gemini-3-pro-preview" ||
    vercelId === "anthropic/claude-3-opus" ||
    vercelId === "inception/mercury-coder-small" ||
    vercelId === "mistral/magistral-small"
  ) {
    return {
      vercelId,
      review: "should_be_unsupported",
      reason: "The candidate set is too indirect or mismatched to support a responsible mapping.",
    };
  }

  if (
    vercelId.startsWith("google/gemini-") ||
    vercelId.startsWith("deepseek/deepseek-v3") ||
    vercelId.startsWith("amazon/nova-") ||
    vercelId.startsWith("meta/llama-3.") ||
    vercelId.startsWith("kwaipilot/kat-coder-pro-v1") ||
    vercelId.startsWith("mistral/codestral") ||
    vercelId.startsWith("mistral/devstral-2") ||
    vercelId.startsWith("mistral/ministral-") ||
    vercelId === "mistral/mistral-small" ||
    vercelId === "alibaba/qwen-3-14b" ||
    vercelId === "alibaba/qwen-3-32b" ||
    vercelId === "moonshotai/kimi-k2-turbo"
  ) {
    return {
      vercelId,
      review: "high_confidence",
      reason: "This looks like a stable family rename or snapshot/version suffix difference with a credible primary candidate.",
    };
  }

  if (
    kind === "variant_collapse" ||
    vercelId.startsWith("xai/") ||
    vercelId.startsWith("openai/gpt-5.1-") ||
    vercelId.startsWith("alibaba/qwen3-vl-") ||
    vercelId.startsWith("alibaba/qwen3-max-preview") ||
    vercelId.startsWith("minimax/") ||
    vercelId.startsWith("zai/") ||
    candidates.length > 1
  ) {
    return {
      vercelId,
      review: "risky",
      reason: "A mapping is plausible, but it collapses variants or leaves multiple reasonable targets.",
    };
  }

  return {
    vercelId,
    review: "high_confidence",
    reason: "The mapping appears specific enough to keep as curated with relatively low ambiguity.",
  };
}

function buildUnsupportedReason(model: VercelModel): string {
  const provider = getProvider(model.id);

  if (["bfl", "klingai", "recraft", "voyage", "prodia"].includes(provider)) {
    return "This provider family is not present in the current OpenRouter models response.";
  }

  if (
    model.id.includes("embedding") ||
    model.id.includes("text-embedding") ||
    model.id.includes("embed")
  ) {
    return "No OpenRouter model with a comparable embedding ID was found.";
  }

  if (
    model.id.includes("image") ||
    model.id.includes("imagen") ||
    model.id.includes("veo") ||
    model.id.includes("wan-") ||
    model.id.includes("seedance")
  ) {
    return "No OpenRouter model with a comparable image or video generation ID was found.";
  }

  return "No credible OpenRouter counterpart was found in the current live model list.";
}

async function main() {
  const vercelResponse = await fetchJson<{ data: VercelModel[] }>(VERCEL_URL);
  const openRouterResponse = await fetchJson<{ data: OpenRouterModel[] }>(OPENROUTER_URL);
  const vercelModels = vercelResponse.data;
  const openRouterModels = openRouterResponse.data;

  const openRouterIds = new Set(openRouterModels.map((model) => model.id));

  const safe: SafeMapping[] = [];
  const curated: CuratedMapping[] = [];
  const curatedReview: CuratedReview[] = [];
  const unsupported: UnsupportedMapping[] = [];

  for (const model of vercelModels) {
    if (openRouterIds.has(model.id)) {
      safe.push({
        vercelId: model.id,
        openrouterId: model.id,
        kind: "exact",
      });
      continue;
    }

    const provider = getProvider(model.id);
    const alias = providerAliases.get(provider);
    const suffix = stripProvider(model.id);
    const aliasId = alias ? `${alias}/${suffix}` : null;

    if (aliasId && openRouterIds.has(aliasId)) {
      safe.push({
        vercelId: model.id,
        openrouterId: aliasId,
        kind: "provider_alias",
      });
      continue;
    }

    const candidates = buildCandidateList(model, openRouterModels);
    if (candidates.length > 0) {
      const curatedItem = {
        vercelId: model.id,
        kind: classifyCuratedKind(model, candidates),
        candidates,
        notes: classifyCuratedNotes(model, candidates),
      } satisfies CuratedMapping;
      curated.push(curatedItem);
      curatedReview.push(reviewCuratedMapping(curatedItem));
      continue;
    }

    unsupported.push({
      vercelId: model.id,
      reason: buildUnsupportedReason(model),
    });
  }

  safe.sort((a, b) => a.vercelId.localeCompare(b.vercelId));
  curated.sort((a, b) => a.vercelId.localeCompare(b.vercelId));
  curatedReview.sort((a, b) => a.vercelId.localeCompare(b.vercelId));
  unsupported.sort((a, b) => a.vercelId.localeCompare(b.vercelId));

  const outputDir = join(process.cwd(), "scripts", "outputs", "openrouter-mapping");
  mkdirSync(outputDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    vercelSource: VERCEL_URL,
    openrouterSource: OPENROUTER_URL,
    counts: {
      vercelModels: vercelModels.length,
      openrouterModels: openRouterModels.length,
      safe: safe.length,
      curated: curated.length,
      unsupported: unsupported.length,
    },
    providerAliases: Object.fromEntries(providerAliases),
  };

  writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
  writeFileSync(join(outputDir, "safe-map.json"), JSON.stringify(safe, null, 2));
  writeFileSync(join(outputDir, "curated-map.json"), JSON.stringify(curated, null, 2));
  writeFileSync(
    join(outputDir, "curated-review.json"),
    JSON.stringify(curatedReview, null, 2)
  );
  writeFileSync(
    join(outputDir, "unsupported.json"),
    JSON.stringify(unsupported, null, 2)
  );

  console.log(
    `Wrote ${safe.length} safe, ${curated.length} curated, and ${unsupported.length} unsupported mappings to ${outputDir}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
