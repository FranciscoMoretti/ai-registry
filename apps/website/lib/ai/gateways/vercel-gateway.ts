import {
  type AiGatewayModel,
  aiGatewayModelsResponseSchema,
  isAiGatewayModelType,
} from "../ai-gateway-models-schemas";
import { getFallbackModels } from "./fallback-models";
import type { GatewayProvider } from "./gateway-provider";

const VERCEL_AI_GATEWAY_MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";

export class VercelGateway implements GatewayProvider<"vercel"> {
  readonly type = "vercel" as const;

  private getApiKey(): string | undefined {
    return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  }

  async fetchModels(): Promise<AiGatewayModel[]> {
    const apiKey = this.getApiKey();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(VERCEL_AI_GATEWAY_MODELS_URL, {
        headers,
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error(
          `[ai/gateways/vercel] Vercel AI Gateway returned ${response.status} ${response.statusText}`
        );
        return [...getFallbackModels(this.type)];
      }

      const bodyRaw = await response.json();
      const parsed = aiGatewayModelsResponseSchema.safeParse(bodyRaw);
      if (!parsed.success) {
        console.error(
          "[ai/gateways/vercel] Schema validation failed:",
          parsed.error
        );
        return [...getFallbackModels(this.type)];
      }

      const models: AiGatewayModel[] = [];
      const unsupportedTypes = new Set<string>();

      for (const model of parsed.data.data) {
        if (!isAiGatewayModelType(model.type)) {
          unsupportedTypes.add(model.type);
          continue;
        }
        models.push({ ...model, type: model.type });
      }

      if (unsupportedTypes.size > 0) {
        console.warn(
          `[ai/gateways/vercel] Skipping models with unsupported types: ${[...unsupportedTypes].join(", ")}`
        );
      }

      return models;
    } catch (error) {
      console.error(
        "[ai/gateways/vercel] Error fetching models, using fallback:",
        error
      );
      return [...getFallbackModels(this.type)];
    }
  }
}
