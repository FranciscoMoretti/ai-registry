import "server-only";

import { unstable_cache } from "next/cache";
import { getActiveGateway } from "./active-gateway";
import type { ModelData } from "./model-data";
import { toModelData } from "./to-model-data";

export const fetchModels = unstable_cache(
  async (): Promise<ModelData[]> => {
    const gateway = getActiveGateway();
    const models = await gateway.fetchModels();
    return models.map(toModelData);
  },
  ["ai-gateway-models"],
  {
    revalidate: 3600,
    tags: ["ai-gateway-models"],
  }
);

export async function getModelById(id: string): Promise<ModelData | null> {
  const models = await fetchModels();
  return models.find((m) => m.id === id) ?? null;
}

export async function getProviders(): Promise<string[]> {
  const models = await fetchModels();
  return Array.from(new Set(models.map((m) => m.owned_by))).sort();
}
