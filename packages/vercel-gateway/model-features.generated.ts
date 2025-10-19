import type { ModelId } from "./model-id";

type GeneratedFeatureDelta = {
  releaseDate: Date;
};

export const generatedModelFeatures = {
  "amazon/nova-lite": {
    releaseDate: new Date("2024-12-03"),
  },
  "amazon/nova-micro": {
    releaseDate: new Date("2024-12-03"),
  },
  "amazon/nova-pro": {
    releaseDate: new Date("2024-12-03"),
  },
  "anthropic/claude-3-haiku": {
    releaseDate: new Date("2024-03-13"),
  },
  "anthropic/claude-3-opus": {
    releaseDate: new Date("2024-02-29"),
  },
  "anthropic/claude-3.5-haiku": {
    releaseDate: new Date("2024-10-22"),
  },
  "anthropic/claude-3.5-sonnet": {
    releaseDate: new Date("2024-10-22"),
  },
  "anthropic/claude-3.7-sonnet": {
    releaseDate: new Date("2025-02-19"),
  },
  "anthropic/claude-opus-4": {
    releaseDate: new Date("2025-05-22"),
  },
  "anthropic/claude-opus-4.1": {
    releaseDate: new Date("2025-08-05"),
  },
  "anthropic/claude-sonnet-4": {
    releaseDate: new Date("2025-05-22"),
  },
  "anthropic/claude-sonnet-4.5": {
    releaseDate: new Date("2025-09-29"),
  },
  "deepseek/deepseek-r1": {
    releaseDate: new Date("2025-01-20"),
  },
  "deepseek/deepseek-r1-distill-llama-70b": {
    releaseDate: new Date("2025-01-23"),
  },
  "deepseek/deepseek-v3.1-terminus": {
    releaseDate: new Date("2025-09-22"),
  },
  "google/gemini-2.0-flash": {
    releaseDate: new Date("2024-12-11"),
  },
  "google/gemini-2.0-flash-lite": {
    releaseDate: new Date("2024-12-11"),
  },
  "google/gemini-2.5-flash": {
    releaseDate: new Date("2025-06-17"),
  },
  "google/gemini-2.5-pro": {
    releaseDate: new Date("2025-06-17"),
  },
  "meta/llama-3.3-70b": {
    releaseDate: new Date("2024-12-06"),
  },
  "meta/llama-4-maverick": {
    releaseDate: new Date("2025-04-05"),
  },
  "meta/llama-4-scout": {
    releaseDate: new Date("2025-04-05"),
  },
  "mistral/codestral": {
    releaseDate: new Date("2024-05-29"),
  },
  "mistral/magistral-medium": {
    releaseDate: new Date("2025-03-17"),
  },
  "mistral/magistral-small": {
    releaseDate: new Date("2025-03-17"),
  },
  "mistral/ministral-3b": {
    releaseDate: new Date("2024-10-01"),
  },
  "mistral/ministral-8b": {
    releaseDate: new Date("2024-10-01"),
  },
  "mistral/mistral-large": {
    releaseDate: new Date("2024-11-01"),
  },
  "mistral/mistral-small": {
    releaseDate: new Date("2024-09-01"),
  },
  "mistral/mixtral-8x22b-instruct": {
    releaseDate: new Date("2024-04-17"),
  },
  "mistral/pixtral-12b": {
    releaseDate: new Date("2024-09-01"),
  },
  "mistral/pixtral-large": {
    releaseDate: new Date("2024-11-01"),
  },
  "moonshotai/kimi-k2": {
    releaseDate: new Date("2025-07-11"),
  },
  "moonshotai/kimi-k2-0905": {
    releaseDate: new Date("2025-09-05"),
  },
  "morph/morph-v3-fast": {
    releaseDate: new Date("2024-08-15"),
  },
  "morph/morph-v3-large": {
    releaseDate: new Date("2024-08-15"),
  },
  "openai/gpt-4-turbo": {
    releaseDate: new Date("2023-11-06"),
  },
  "openai/gpt-4.1": {
    releaseDate: new Date("2025-04-14"),
  },
  "openai/gpt-4.1-mini": {
    releaseDate: new Date("2025-04-14"),
  },
  "openai/gpt-4.1-nano": {
    releaseDate: new Date("2025-04-14"),
  },
  "openai/gpt-4o": {
    releaseDate: new Date("2024-05-13"),
  },
  "openai/gpt-4o-mini": {
    releaseDate: new Date("2024-07-18"),
  },
  "openai/gpt-5": {
    releaseDate: new Date("2025-08-07"),
  },
  "openai/gpt-5-codex": {
    releaseDate: new Date("2025-09-15"),
  },
  "openai/gpt-5-mini": {
    releaseDate: new Date("2025-08-07"),
  },
  "openai/gpt-5-nano": {
    releaseDate: new Date("2025-08-07"),
  },
  "openai/gpt-oss-120b": {
    releaseDate: new Date("2025-08-23"),
  },
  "openai/gpt-oss-20b": {
    releaseDate: new Date("2025-08-05"),
  },
  "openai/o1": {
    releaseDate: new Date("2024-09-12"),
  },
  "openai/o3": {
    releaseDate: new Date("2025-01-31"),
  },
  "openai/o3-mini": {
    releaseDate: new Date("2025-01-31"),
  },
  "openai/o4-mini": {
    releaseDate: new Date("2025-04-16"),
  },
  "vercel/v0-1.0-md": {
    releaseDate: new Date("2025-05-22"),
  },
  "vercel/v0-1.5-md": {
    releaseDate: new Date("2025-06-09"),
  },
  "xai/grok-2": {
    releaseDate: new Date("2024-08-20"),
  },
  "xai/grok-2-vision": {
    releaseDate: new Date("2024-08-20"),
  },
  "xai/grok-3": {
    releaseDate: new Date("2024-12-09"),
  },
  "xai/grok-3-fast": {
    releaseDate: new Date("2025-02-17"),
  },
  "xai/grok-3-mini": {
    releaseDate: new Date("2024-12-09"),
  },
  "xai/grok-3-mini-fast": {
    releaseDate: new Date("2025-02-17"),
  },
  "xai/grok-4": {
    releaseDate: new Date("2025-07-09"),
  },
  "xai/grok-4-fast-non-reasoning": {
    releaseDate: new Date("2025-09-19"),
  },
  "xai/grok-code-fast-1": {
    releaseDate: new Date("2025-08-28"),
  },
} satisfies Partial<Record<ModelId, GeneratedFeatureDelta>>;
