#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type ModelsDevModel,
  type ModelsDevResponse,
  ModelsDevResponseSchema,
} from '../../packages/models/models-dev-schemas';

const MODELS_DEV_URL = 'https://models.dev/api.json';

async function fetchModelsDev(): Promise<{
  raw: ModelsDevResponse;
  byId: Record<string, ModelsDevModel>;
}> {
  const res = await fetch(MODELS_DEV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${MODELS_DEV_URL}: ${res.status}`);
  }
  const data = ModelsDevResponseSchema.parse(
    await res.json(),
  ) as ModelsDevResponse;
  const byId: Record<string, ModelsDevModel> = {};
  for (const providerKey of Object.keys(data)) {
    const provider = data[providerKey];
    const models = provider?.models ?? {};
    for (const id of Object.keys(models)) {
      const m = models[id] as ModelsDevModel;
      byId[m.id] = m;
    }
  }
  return { raw: data, byId };
}

async function main() {
  const ROOT = join(__dirname, '..', '..');
  const MODELS_LIST = join(ROOT, 'lib/models/outputs/models-list.json');
  const OUTPUT_TS = join(ROOT, 'lib/models/model-extra.generated.ts');
  const MODELS_DEV_RESPONSE_JSON = join(
    ROOT,
    'lib/models/responses/models-dev/models.json',
  );
  const MISSING_MODEL_EXTRA_JSON = join(
    ROOT,
    'lib/models/outputs/missing-model-extra.json',
  );

  const supportedIds: string[] = JSON.parse(
    readFileSync(MODELS_LIST, 'utf8'),
  ) as string[];

  console.log(`Supported: ${supportedIds.length}`);

  const { raw, byId } = await fetchModelsDev();
  // Ensure output directory exists for models.dev snapshot
  mkdirSync(dirname(MODELS_DEV_RESPONSE_JSON), { recursive: true });
  writeFileSync(MODELS_DEV_RESPONSE_JSON, JSON.stringify(raw, null, 2));

  const lines: string[] = [];
  lines.push("import type { ModelId } from '@airegistry/vercel-gateway';");
  lines.push('');
  lines.push('type GeneratedExtraDelta = {');
  lines.push('  releaseDate: Date;');
  lines.push('};');
  lines.push('');
  lines.push('export const generatedModelExtra = {');

  const stillMissing: string[] = [];

  for (const id of supportedIds) {
    const m = byId[id];
    if (!m) {
      stillMissing.push(id);
      continue;
    }
    const entry: string[] = [];
    entry.push(`  '${id}': {`);
    entry.push(`    releaseDate: new Date('${m.release_date}'),`);
    entry.push('  },');
    lines.push(entry.join('\n'));
  }

  lines.push('} satisfies Partial<Record<ModelId, GeneratedExtraDelta>>;');
  lines.push('');

  const tsOut = lines.join('\n');
  writeFileSync(OUTPUT_TS, tsOut);
  console.log('Wrote', OUTPUT_TS);

  writeFileSync(
    MISSING_MODEL_EXTRA_JSON,
    JSON.stringify(stillMissing, null, 2),
  );
  console.log('Wrote missing extra list:', MISSING_MODEL_EXTRA_JSON);

  try {
    console.log('Formatting with biome...');
    execSync(`npx biome format --write "${OUTPUT_TS}"`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('Warning: biome format failed:', err);
  }
}

main().catch((err) => {
  console.error('Error generating model-extra.ts:', err);
  process.exit(1);
});
