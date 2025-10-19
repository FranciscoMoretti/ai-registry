/// <reference lib="es2015.collection" />

import { allModelsExtra, type ModelExtra } from "./model-extra";
import { type ModelData, type ModelId, modelsData } from "./models.generated";

export type ModelDefinition = ModelData & ModelExtra;

const DEFAULT_MODEL_EXTRA: ModelExtra = {
  releaseDate: new Date(0),
};

export const modelDefinitions: ModelDefinition[] = modelsData.map((model) => ({
  ...model,
  ...(allModelsExtra[model.id] ?? DEFAULT_MODEL_EXTRA),
}));

export const modelDefinitionMap = new Map<ModelId, ModelDefinition>(
  modelDefinitions.map((definition) => [definition.id, definition])
);

export function getModelDefinition(modelId: ModelId): ModelDefinition {
  const definition = modelDefinitionMap.get(modelId);
  if (!definition) {
    throw new Error(`Unknown model ID: ${modelId}`);
  }
  return definition;
}
