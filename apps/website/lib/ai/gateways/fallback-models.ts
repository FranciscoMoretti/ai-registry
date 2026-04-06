import type { AiGatewayModel } from "../ai-gateway-models-schemas";
import {
  generatedForGateway,
  models as fallbackModels,
} from "../models.generated";
import type { GatewayType } from "./registry";

/**
 * Returns fallback models only if the snapshot was generated for the
 * requested gateway. When there's a mismatch the snapshot contains model
 * IDs from a different provider, so returning them would be misleading —
 * an empty array is safer.
 */
export function getFallbackModels(
  gateway: GatewayType
): readonly AiGatewayModel[] {
  if (generatedForGateway !== gateway) {
    console.warn(
      `[ai/gateways/fallback] Fallback snapshot was generated for "${generatedForGateway}", not "${gateway}". Run \`pnpm fetch:models\` to regenerate.`
    );
    return [];
  }
  return fallbackModels as unknown as AiGatewayModel[];
}
