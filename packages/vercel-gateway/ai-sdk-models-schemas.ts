import { z } from "zod";

// Common helpers
const PricingValueSchema = z.union([z.string(), z.number()]);

// Endpoints response schema
export const AiGatewayEndpointEntrySchema = z.object({
  name: z.string(),
  model_name: z.string(),
  context_length: z.number().nullable().optional(),
  pricing: z.record(z.string(), PricingValueSchema).optional(),
  provider_name: z.string().optional(),
  tag: z.string().optional(),
  quantization: z.string().nullable().optional(),
  max_completion_tokens: z.number().nullable().optional(),
  max_prompt_tokens: z.number().nullable().optional(),
  supported_parameters: z.array(z.string()).optional(),
  status: z.number().nullable().optional(),
  uptime_last_30m: z.number().nullable().optional(),
  supports_implicit_caching: z.boolean().optional(),
});

export const AiGatewayEndpointsResponseSchema = z.object({
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      created: z.number(),
      description: z.string(),
      architecture: z
        .object({
          tokenizer: z.string().nullable(),
          instruct_type: z.string().nullable(),
          modality: z.string().nullable().optional(),
          input_modalities: z.array(z.string()).optional(),
          output_modalities: z.array(z.string()).optional(),
        })
        .optional(),
      endpoints: z.array(AiGatewayEndpointEntrySchema).optional(),
    })
    .nullable(),
});

export type AiGatewayEndpointsResponse = z.infer<
  typeof AiGatewayEndpointsResponseSchema
>;

// Models response schema
export const AiGatewayModelsResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(
    z.object({
      id: z.string(),
      object: z.literal("model"),
      created: z.number(),
      owned_by: z.string(),
      name: z.string(),
      description: z.string(),
      context_window: z.number(),
      max_tokens: z.number(),
      type: z.union([z.literal("language"), z.literal("embedding")]),
      tags: z.array(z.string()).optional(),
      pricing: z.object({
        input: z.string(),
        output: z.string(),
        input_cache_read: z.string().optional(),
        input_cache_write: z.string().optional(),
      }),
    })
  ),
});

export type AiGatewayModelsResponse = z.infer<
  typeof AiGatewayModelsResponseSchema
>;
