/// <reference lib="es2015.collection" />

import { getModels } from "./get-functions";
import { allModelsExtra, type ModelExtra } from "./model-extra";
import { models } from "./models.generated";

export type ModelDefinition = typeof models[keyof typeof models] & ModelExtra;

const DEFAULT_MODEL_EXTRA: ModelExtra = {
  releaseDate: new Date(0),
};

const allModels = getModels();

export const modelDefinitions: ModelDefinition[] = allModels.map((model) => ({
  ...model,
  ...(allModelsExtra[model.id] ?? DEFAULT_MODEL_EXTRA),
}));


