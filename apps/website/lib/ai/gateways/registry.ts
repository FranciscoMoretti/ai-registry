import type { GatewayProvider } from "./gateway-provider";
import { VercelGateway } from "./vercel-gateway";

export const gatewayRegistry = {
  vercel: () => new VercelGateway(),
} as const satisfies Record<string, () => GatewayProvider>;

export type GatewayType = keyof typeof gatewayRegistry;

/** Single source of truth for the default gateway */
export const DEFAULT_GATEWAY = "vercel" as const satisfies GatewayType;
