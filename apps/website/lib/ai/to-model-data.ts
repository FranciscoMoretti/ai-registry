import type { AiGatewayModel } from "./ai-gateway-models-schemas";
import type { ModelData } from "./model-data";

export function toModelData(model: AiGatewayModel): ModelData {
  const tags = model.tags ?? [];

  return {
    ...model,
    reasoning: tags.includes("reasoning"),
    toolCall: tags.includes("tool-use"),
    input: {
      image: tags.includes("vision") || model.type === "image",
      text: model.type === "language",
      pdf: tags.includes("file-input"),
      audio: false,
      video: false,
    },
    output: {
      image: tags.includes("image-generation") || model.type === "image",
      text: model.type === "language",
      audio: false,
      video: model.type === "video",
    },
  };
}
