import type { AiGatewayModel } from "./ai-gateway-models-schemas";

export type ModelData = AiGatewayModel & {
  reasoning: boolean;
  toolCall: boolean;
  input: {
    image: boolean;
    text: boolean;
    pdf: boolean;
    audio: boolean;
    video: boolean;
  };
  output: {
    image: boolean;
    text: boolean;
    audio: boolean;
    video: boolean;
  };
};
