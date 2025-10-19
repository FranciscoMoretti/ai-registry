#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type {
  AiGatewayEndpointsResponse,
  AiGatewayModelsResponse,
} from "../../packages/models/ai-sdk-models-schemas";
import {
  AiGatewayEndpointsResponseSchema,
  AiGatewayModelsResponseSchema,
} from "../../packages/models/ai-sdk-models-schemas";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

async function main() {
  const ROOT = join(__dirname, "..", "..");

  const listPath = join(ROOT, "lib/models/outputs/models-list.json");
  const ids: string[] = JSON.parse(readFileSync(listPath, "utf8")) as string[];
  const overwriteAll = process.env.OVERWRITE_MODELS === "1";
  const skipExisting = process.env.SKIP_EXISTING === "1" && !overwriteAll;
  const concurrency = Number(process.env.MODELS_FETCH_CONCURRENCY ?? 6);

  const limit = pLimit(Math.max(1, concurrency));

  async function fetchAndSaveEndpoint(id: string): Promise<void> {
    const [provider, ...rest] = id.split("/");
    const modelName = rest.join("/");
    const dir = join(ROOT, "lib/models/responses/gateway", provider, modelName);
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

  // Build models.generated.ts by joining gateway snapshot + endpoints
  const gatewaySnapshotPath = join(
    ROOT,
    "lib/models/responses/gateway/models.json"
  );
  const gateway = AiGatewayModelsResponseSchema.parse(
    JSON.parse(readFileSync(gatewaySnapshotPath, "utf8")) as unknown
  ) as AiGatewayModelsResponse;

  const nonEmbedding = gateway.data.filter((m) => m.type !== "embedding");

  const lines: string[] = [];
  const providers = [...new Set(nonEmbedding.map((m) => m.owned_by))].sort();
  const modelIds = [...new Set(nonEmbedding.map((m) => m.id))].sort();
  const allTags = [
    ...new Set(gateway.data.flatMap((m) => m.tags ?? [])),
  ].sort();

  lines.push("// List of unique providers extracted from models data");
  lines.push(
    `export const providers = ${JSON.stringify(providers, null, 2)} as const;`
  );
  lines.push("");
  lines.push("export type ProviderId = (typeof providers)[number];");
  lines.push("");
  lines.push("// List of all model ids extracted from models data");
  lines.push(
    `export const models = ${JSON.stringify(modelIds, null, 2)} as const;`
  );
  lines.push("");
  lines.push("export type ModelId = (typeof models)[number];");
  lines.push("");
  lines.push("// List of unique tags extracted from models data");
  lines.push(
    `export const modelTags = ${JSON.stringify(allTags, null, 2)} as const;`
  );
  lines.push("");
  lines.push("export type ModelTag = (typeof modelTags)[number];");
  lines.push("");
  lines.push("export interface ModelData {");
  lines.push("  id: ModelId;");
  lines.push("  object: string;");
  lines.push("  owned_by: ProviderId;");
  lines.push("  name: string;");
  lines.push("  description: string;");
  lines.push("  type: 'language' | 'embedding';");
  lines.push("  tags?: ModelTag[];");
  lines.push("  context_window: number; // Max input tokens");
  lines.push("  max_tokens: number; // Max output tokens");
  lines.push("  pricing: {");
  lines.push("    input: string; // Input price per token");
  lines.push("    output: string; // Output price per token");
  lines.push(
    "    input_cache_read?: string; // Input cache read price per token"
  );
  lines.push(
    "    input_cache_write?: string; // Input cache write price per token"
  );
  lines.push("  };");
  lines.push("  // Derived features from endpoints and tags");
  lines.push("  reasoning: boolean;");
  lines.push("  toolCall: boolean;");
  lines.push("  input: {");
  lines.push("    image: boolean;");
  lines.push("    text: boolean;");
  lines.push("    pdf: boolean;");
  lines.push("    video: boolean;");
  lines.push("    audio: boolean;");
  lines.push("  };");
  lines.push("  output: {");
  lines.push("    image: boolean;");
  lines.push("    text: boolean;");
  lines.push("    audio: boolean;");
  lines.push("  };");
  lines.push("}");
  lines.push("");

  lines.push("// Define the data with proper typing");
  lines.push("export const modelsData: ModelData[] = [");
  for (const m of nonEmbedding) {
    const [provider, ...rest] = m.id.split("/");
    const modelName = rest.join("/");
    const epPath = join(
      ROOT,
      "lib/models/responses/gateway",
      provider,
      modelName,
      "endpoints.json"
    );
    let input = {
      image: false,
      text: true,
      pdf: false,
      video: false,
      audio: false,
    };
    let output = { image: false, text: true, audio: false };
    let reasoning = false;
    let toolCall = false;
    try {
      const ep = AiGatewayEndpointsResponseSchema.parse(
        JSON.parse(readFileSync(epPath, "utf8")) as unknown
      ) as AiGatewayEndpointsResponse;
      const data = ep?.data ?? null;
      const inMods = new Set(data?.architecture?.input_modalities ?? []);
      const outMods = new Set(data?.architecture?.output_modalities ?? []);
      input = {
        image: inMods.has("image"),
        text: inMods.has("text"),
        pdf: inMods.has("file"),
        video: inMods.has("video"),
        audio: inMods.has("audio"),
      };
      output = {
        image: outMods.has("image"),
        text: outMods.has("text"),
        audio: outMods.has("audio"),
      };
      const params = new Set(
        (data?.endpoints ?? []).flatMap((e) => e.supported_parameters ?? [])
      );
      toolCall = params.has("tools") || params.has("tool_choice");
      reasoning = params.has("reasoning") || params.has("include_reasoning");
    } catch {}

    lines.push("  {");
    lines.push(`    id: '${m.id}',`);
    lines.push("    object: 'model',");
    lines.push(`    owned_by: '${provider}',`);
    lines.push(`    name: ${JSON.stringify(m.name)},`);
    lines.push(`    description: ${JSON.stringify(m.description)},`);
    lines.push("    type: 'language',");
    lines.push(`    tags: ${JSON.stringify(m.tags ?? [])},`);
    lines.push(`    context_window: ${m.context_window},`);
    lines.push(`    max_tokens: ${m.max_tokens},`);
    lines.push(`    pricing: ${JSON.stringify(m.pricing)},`);
    lines.push(`    reasoning: ${reasoning},`);
    lines.push(`    toolCall: ${toolCall},`);
    lines.push(`    input: ${JSON.stringify(input)},`);
    lines.push(`    output: ${JSON.stringify(output)},`);
    lines.push("  },");
  }
  lines.push("];");

  const outTs = join(ROOT, "lib/models/models.generated.ts");
  writeFileSync(outTs, lines.join("\n"));
  try {
    execSync(`npx biome format --write ${outTs}`);
  } catch {}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
