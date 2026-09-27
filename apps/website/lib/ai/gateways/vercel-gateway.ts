import {
  type AiGatewayModel,
  aiGatewayModelsResponseSchema,
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

      return parsed.data.data;
    } catch (error) {
      console.error(
        "[ai/gateways/vercel] Error fetching models, using fallback:",
        error
      );
      return [...getFallbackModels(this.type)];
    }
  }
}
