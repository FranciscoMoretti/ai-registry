import { z } from "zod";

export const ModelsDevModalitiesSchema = z.object({
  input: z.array(z.string()).optional(),
  output: z.array(z.string()).optional(),
});

export const ModelsDevModelSchema = z.object({
  id: z.string(),
  knowledge: z.string().optional(),
  reasoning: z.boolean().optional(),
  tool_call: z.boolean().optional(),
  modalities: ModelsDevModalitiesSchema.optional(),
  release_date: z.string(),
});

export const ModelsDevProviderSchema = z.object({
  models: z.record(z.string(), ModelsDevModelSchema).optional(),
});

// The API returns a top-level object keyed by provider
export const ModelsDevResponseSchema = z.record(
  z.string(),
  ModelsDevProviderSchema
);

export type ModelsDevModalities = z.infer<typeof ModelsDevModalitiesSchema>;
export type ModelsDevModel = z.infer<typeof ModelsDevModelSchema>;
export type ModelsDevProvider = z.infer<typeof ModelsDevProviderSchema>;
export type ModelsDevResponse = z.infer<typeof ModelsDevResponseSchema>;
