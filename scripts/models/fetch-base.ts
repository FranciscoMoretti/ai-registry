#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AiGatewayModelsResponse,
  AiGatewayModelsResponseSchema,
} from "../../packages/vercel-gateway/ai-sdk-models-schemas";

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

async function main() {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";
  const snapshotPath = join(ROOT, "packages/vercel-gateway/responses/gateway/models.json");
  const listPath = join(ROOT, "packages/vercel-gateway/outputs/models-list.json");
  const providersJsonPath = join(
    ROOT,
    "packages/vercel-gateway/outputs/providers-list.json"
  );
  const generatedTsPath = join(ROOT, "packages/vercel-gateway/models.generated.ts");
  const providersTsPath = join(ROOT, "packages/vercel-gateway/providers.generated.ts");

  console.log("Fetching models from API...", MODELS_URL);
  const response = await fetch(MODELS_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const jsonData: AiGatewayModelsResponse = AiGatewayModelsResponseSchema.parse(
    await response.json()
  );

  ensureDir(snapshotPath);
  writeFileSync(snapshotPath, JSON.stringify(jsonData, null, 2));
  console.log("Saved gateway snapshot:", snapshotPath);

  const nonEmbeddingData = jsonData.data.filter(
    (model) => model.type !== "embedding"
  );

  const providers = [
    ...new Set(nonEmbeddingData.map((model) => model.owned_by)),
  ].sort();

  const models = [...new Set(nonEmbeddingData.map((model) => model.id))].sort();

  ensureDir(providersJsonPath);
  writeFileSync(providersJsonPath, JSON.stringify(providers, null, 2));
  console.log("Generated providers list:", providersJsonPath);

  // Generate TypeScript providers list as const
  const providersTs = `export const providers = ${JSON.stringify(providers, null, 2)} as const;\n\nexport type ProviderId = (typeof providers)[number];\n`;
  ensureDir(providersTsPath);
  writeFileSync(providersTsPath, providersTs);
  console.log("Generated TS providers list:", providersTsPath);

  ensureDir(listPath);
  writeFileSync(listPath, JSON.stringify(models, null, 2));
  console.log("Generated models list:", listPath);

  // Generate TypeScript map: export const models = { ... } as const
  // Keep only base fields and derive simple booleans from tags; other types can be inferred elsewhere.
  const sorted = [...nonEmbeddingData].sort((a, b) => a.id.localeCompare(b.id));
  let tsOut = "export const models = {\n";
  for (const m of sorted) {
    const tags = m.tags ?? [];
    const hasReasoning = tags.includes("reasoning");
    const hasToolUse = tags.includes("tool-use");
    const hasVision = tags.includes("vision");
    const hasImageGen = tags.includes("image-generation");
    const hasFileInput = tags.includes("file-input");
    const pricing = { input: m.pricing.input, output: m.pricing.output };
    tsOut += ` ${JSON.stringify(m.id)}: {\n`;
    tsOut += `    id: ${JSON.stringify(m.id)},\n`;
    tsOut += `    object: ${JSON.stringify("model")},\n`;
    tsOut += `    owned_by: ${JSON.stringify(m.owned_by)},\n`;
    tsOut += `    name: ${JSON.stringify(m.name)},\n`;
    tsOut += `    description: ${JSON.stringify(m.description)},\n`;
    tsOut += `    type: ${JSON.stringify(m.type)},\n`;
    if (tags.length > 0) {
      tsOut += `    tags: ${JSON.stringify(tags)},\n`;
    }
    tsOut += `    context_window: ${m.context_window},\n`;
    tsOut += `    max_tokens: ${m.max_tokens},\n`;
    tsOut += `    pricing: ${JSON.stringify(pricing)},\n`;
    tsOut += `    reasoning: ${hasReasoning},\n`;
    tsOut += `    toolCall: ${hasToolUse},\n`;
    tsOut += `    input: ${JSON.stringify({
      image: hasVision || hasImageGen,
      text: true,
      pdf: hasFileInput,
      video: false,
      audio: false,
    })},\n`;
    tsOut += `    output: ${JSON.stringify({
      image: hasImageGen,
      text: true,
      audio: false,
    })},\n`;
    tsOut += "  },\n";
  }
  tsOut += "} as const\n";

  ensureDir(generatedTsPath);
  writeFileSync(generatedTsPath, tsOut);
  console.log("Generated TS models map:", generatedTsPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
