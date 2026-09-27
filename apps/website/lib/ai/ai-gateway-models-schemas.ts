import { z } from "zod";

// Known tags for IDE hints (accepts any string for forward compatibility)
type KnownTag =
  | "reasoning"
  | "tool-use"
  | "vision"
  | "file-input"
  | "image-generation"
  | "implicit-caching";

const tagSchema = z.string() as z.ZodType<KnownTag>;

export const supportedAiGatewayModelTypes = [
  "language",
  "embedding",
  "image",
  "video",
] as const;

export type AiGatewayModelType = (typeof supportedAiGatewayModelTypes)[number];

const aiGatewayModelSchema = z.object({
  id: z.string(),
  object: z.literal("model"),
  created: z.number(),
  released: z.number().int().positive().optional(),
  owned_by: z.string(),
  name: z.string(),
  description: z.string(),
  context_window: z.number(),
  max_tokens: z.number(),
  type: z.enum(supportedAiGatewayModelTypes),
  tags: z.array(tagSchema).optional(),
  pricing: z.object({
    input: z.string().optional(),
    output: z.string().optional(),
    input_cache_read: z.string().optional(),
    input_cache_write: z.string().optional(),
    web_search: z.string().optional(),
    image: z.string().optional(),
    input_tiers: z
      .array(
        z.object({
          cost: z.string(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
      )
      .optional(),
    output_tiers: z
      .array(
        z.object({
          cost: z.string(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
      )
      .optional(),
    input_cache_read_tiers: z
      .array(
        z.object({
          cost: z.string(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
      )
      .optional(),
  }),
});

export type AiGatewayModel = z.infer<typeof aiGatewayModelSchema>;

export function isAiGatewayModelType(type: string): type is AiGatewayModelType {
  return supportedAiGatewayModelTypes.includes(type as AiGatewayModelType);
}

export const aiGatewayModelsResponseSchema = z.object({
  object: z.literal("list"),
  // New model types may not have language-model limits. Ignore them before
  // applying the schema for the types this app supports.
  data: z
    .array(z.object({ type: z.string() }).passthrough())
    .transform((models) =>
      models.filter((model) => isAiGatewayModelType(model.type))
    )
    .pipe(z.array(aiGatewayModelSchema)),
});
