import type { GatewayProvider } from "./gateways/gateway-provider";
import {
  DEFAULT_GATEWAY,
  type GatewayType,
  gatewayRegistry,
} from "./gateways/registry";

let activeGateway: GatewayProvider | null = null;

export function getActiveGateway(): GatewayProvider {
  if (activeGateway) {
    return activeGateway;
  }

  const gatewayType: GatewayType =
    (process.env.AI_GATEWAY as GatewayType | undefined) ?? DEFAULT_GATEWAY;

  const factory = gatewayRegistry[gatewayType];
  if (!factory) {
    throw new Error(
      `Unknown gateway type: ${gatewayType}. Supported: ${Object.keys(gatewayRegistry).join(", ")}`
    );
  }

  activeGateway = factory();
  return activeGateway;
}
