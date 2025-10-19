#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AiGatewayModelsResponse } from "../../packages/models/ai-sdk-models-schemas";
import { AiGatewayModelsResponseSchema } from "../../packages/models/ai-sdk-models-schemas";

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

async function main() {
  const ROOT = join(__dirname, "..", "..");
  const MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";
  const snapshotPath = join(ROOT, "lib/models/responses/gateway/models.json");
  const listPath = join(ROOT, "lib/models/outputs/models-list.json");
  const providersJsonPath = join(
    ROOT,
    "lib/models/outputs/providers-list.json"
  );

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

  ensureDir(listPath);
  writeFileSync(listPath, JSON.stringify(models, null, 2));
  console.log("Generated models list:", listPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
