import type { AiGatewayModel } from "./ai-gateway-models-schemas";
import type { GatewayType } from "./gateways/registry";

export const generatedForGateway = "vercel" satisfies GatewayType;

export const models = [] as const satisfies readonly AiGatewayModel[];
