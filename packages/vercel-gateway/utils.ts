import type { ImageModelId, ModelId } from "./model-id";

export function getModelAndProvider(modelId: ModelId | ImageModelId) {
  const [provider, model] = modelId.split("/");
  if (!(provider && model)) {
    throw new Error(`Invalid model ID: ${modelId}`);
  }
  return { provider, model };
}
