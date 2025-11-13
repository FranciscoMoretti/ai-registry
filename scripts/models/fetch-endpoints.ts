#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type {
  AiGatewayEndpointsResponse,
  AiGatewayModelsResponse,
} from "../../packages/vercel-gateway/ai-sdk-models-schemas";
import {
  AiGatewayEndpointsResponseSchema,
  AiGatewayModelsResponseSchema,
} from "../../packages/vercel-gateway/ai-sdk-models-schemas";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

const MODELS_FETCH_CONCURRENCY = 6;
async function main() {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

  const listPath = join(ROOT, "packages/vercel-gateway/outputs/models-list.json");
  const ids: string[] = JSON.parse(readFileSync(listPath, "utf8")) as string[];
  const overwriteAll = process.env.OVERWRITE_MODELS === "1";
  const skipExisting = process.env.SKIP_EXISTING === "1" && !overwriteAll;
  const concurrency = Number(
    process.env.MODELS_FETCH_CONCURRENCY ?? MODELS_FETCH_CONCURRENCY
  );

  const limit = pLimit(Math.max(1, concurrency));

  async function fetchAndSaveEndpoint(id: string): Promise<void> {
    const [provider, ...rest] = id.split("/");
    const modelName = rest.join("/");
    const dir = join(ROOT, "packages/vercel-gateway/responses/gateway", provider, modelName);
    const file = join(dir, "endpoints.json");
    if (!overwriteAll && skipExisting && existsSync(file)) {
      return;
    }
    mkdirSync(dir, { recursive: true });
    const url = `https://ai-gateway.vercel.sh/v1/models/${id}/endpoints`;
    const dataRaw = await pRetry(() => fetchJson<unknown>(url), {
      retries: 5,
      factor: 2,
      minTimeout: 300,
      maxTimeout: 2000,
      randomize: true,
    });
    const data = AiGatewayEndpointsResponseSchema.parse(dataRaw);
    writeFileSync(file, JSON.stringify(data, null, 2));
  }

  await Promise.all(ids.map((id) => limit(() => fetchAndSaveEndpoint(id))));

  // Build models.generated.ts as a dictionary like fetch-base.ts,
  // but augmented with input_modalities and output_modalities from endpoints.
  const gatewaySnapshotPath = join(
    ROOT,
    "packages/vercel-gateway/responses/gateway/models.json"
  );
  const gateway = AiGatewayModelsResponseSchema.parse(
    JSON.parse(readFileSync(gatewaySnapshotPath, "utf8")) as unknown
  ) as AiGatewayModelsResponse;

  const nonEmbedding = gateway.data.filter((m) => m.type !== "embedding");
  const sorted = [...nonEmbedding].sort((a, b) => a.id.localeCompare(b.id));

  let tsOut = "export const models = {\n";
  for (const m of sorted) {
    const [provider, ...rest] = m.id.split("/");
    const modelName = rest.join("/");
    const epPath = join(
      ROOT,
      "packages/vercel-gateway/responses/gateway",
      provider,
      modelName,
      "endpoints.json"
    );

    const tags = m.tags ?? [];
    const hasReasoningTag = tags.includes("reasoning");
    const hasToolUseTag = tags.includes("tool-use");

    let inputModalities: string[] = [];
    let outputModalities: string[] = [];
    let reasoning = false;
    let toolCall = false;

    try {
      const ep = AiGatewayEndpointsResponseSchema.parse(
        JSON.parse(readFileSync(epPath, "utf8")) as unknown
      ) as AiGatewayEndpointsResponse;
      const data = ep?.data ?? null;
      inputModalities = (data?.architecture?.input_modalities ??
        []) as string[];
      outputModalities = (data?.architecture?.output_modalities ??
        []) as string[];
      const params = new Set(
        (data?.endpoints ?? []).flatMap((e) => e.supported_parameters ?? [])
      );
      toolCall = params.has("tools") || params.has("tool_choice");
      reasoning = params.has("reasoning") || params.has("include_reasoning");
    } catch (err) {
      console.error(`Error reading endpoints for ${m.id}:`, err);
    }

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
    tsOut += `    reasoning: ${reasoning || hasReasoningTag},\n`;
    tsOut += `    toolCall: ${toolCall || hasToolUseTag},\n`;
    tsOut += `    input_modalities: ${JSON.stringify(inputModalities)},\n`;
    tsOut += `    output_modalities: ${JSON.stringify(outputModalities)},\n`;
    tsOut += "  },\n";
  }
  tsOut += "} as const\n";

  const outTs = join(ROOT, "packages/vercel-gateway/models.generated.ts");
  writeFileSync(outTs, tsOut);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
