import type { AiGatewayModel } from "../ai-gateway-models-schemas";

export interface GatewayProvider<TGateway extends string = string> {
  readonly type: TGateway;

  /** Fetch the list of available models from the gateway's API */
  fetchModels(): Promise<AiGatewayModel[]>;
}
