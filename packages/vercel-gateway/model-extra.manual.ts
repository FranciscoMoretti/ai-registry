import type { generatedModelExtra } from "./model-extra.generated";
import type { ModelId } from "./model-id";

export type ModelExtra = {
  knowledgeCutoff?: Date;
  releaseDate: Date;
  // temperature: boolean; // TODO: does it replace fixedTemperature?
  // last updated: Date;
  // weights: "Open" | "Closed"
  fixedTemperature?: number;
};

// All the literals in ModelId that are not keys of generatedModelExtra
type GeneratedModelExtraModelId = keyof typeof generatedModelExtra;
type CustomModelExtraModelId = Exclude<ModelId, GeneratedModelExtraModelId>;

export const manualModelExtra: Record<CustomModelExtraModelId, ModelExtra> = {
  // OpenAI GPT-3.5 family
  "openai/gpt-3.5-turbo": {
    releaseDate: new Date("2023-03-01"),
    knowledgeCutoff: new Date("2021-09-01"),
  },
  "openai/gpt-3.5-turbo-instruct": {
    releaseDate: new Date("2023-08-22"),
    knowledgeCutoff: new Date("2021-09-01"),
  },

  // Cohere Command family (official: docs.cohere.com)
  "cohere/command-a": {
    releaseDate: new Date("2024-10-21"),
  },

  // Meta Llama 3.2 Vision Instruct (official: ai.meta.com)
  "meta/llama-3.2-11b": {
    releaseDate: new Date("2024-09-25"),
  },
  "meta/llama-3.2-90b": {
    releaseDate: new Date("2024-09-25"),
  },

  // DeepSeek (manual dates for variants not in models.dev)
  "deepseek/deepseek-v3": {
    releaseDate: new Date("2025-03-24"),
  },
  "deepseek/deepseek-v3.1": {
    releaseDate: new Date("2025-07-10"),
  },

  // Inception
  "inception/mercury-coder-small": {
    releaseDate: new Date("2025-02-01"),
  },

  // Meta Llama (text-only)
  "meta/llama-3.1-70b": {
    releaseDate: new Date("2024-07-23"),
  },
  "meta/llama-3.1-8b": {
    releaseDate: new Date("2024-07-23"),
  },
  "meta/llama-3.2-1b": {
    releaseDate: new Date("2024-09-25"),
  },
  "meta/llama-3.2-3b": {
    releaseDate: new Date("2024-09-25"),
  },

  // Mistral
  "mistral/devstral-small": {
    releaseDate: new Date("2024-06-26"),
  },
  "mistral/mistral-medium": {
    releaseDate: new Date("2023-12-11"),
  },

  // Alibaba Qwen3 family (manual baseline date for consolidated release)
  "alibaba/qwen-3-14b": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen-3-235b": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen-3-30b": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen-3-32b": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen3-coder": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen3-coder-30b-a3b": {
    releaseDate: new Date("2025-07-15"),
  },
  "alibaba/qwen3-max-preview": {
    releaseDate: new Date("2025-07-15"),
  },

  // Google Gemini flash image
  "google/gemini-2.5-flash-image-preview": {
    releaseDate: new Date("2025-08-26"),
  },
  "google/gemini-2.5-flash-image": {
    releaseDate: new Date("2025-06-17"),
    knowledgeCutoff: new Date("2025-06-01"),
  },

  // Anthropic Claude
  "anthropic/claude-3.5-sonnet-20240620": {
    releaseDate: new Date("2024-06-20"),
  },

  // OpenAI
  "openai/gpt-5.1-instant": {
    releaseDate: new Date("2025-10-01"),
  },
  "openai/gpt-5.1-thinking": {
    releaseDate: new Date("2025-10-01"),
  },
  "openai/gpt-oss-safeguard-20b": {
    releaseDate: new Date("2025-08-05"),
  },
  "openai/o3-deep-research": {
    releaseDate: new Date("2024-06-26"),
  },
  // Meituan LongCat Flash
  "meituan/longcat-flash-chat": {
    releaseDate: new Date("2025-08-20"),
  },
  "meituan/longcat-flash-thinking": {
    releaseDate: new Date("2025-08-20"),
  },

  // Mistral Magistral 2506 (June 2025 builds)
  "mistral/magistral-medium-2506": {
    releaseDate: new Date("2025-06-25"),
  },
  "mistral/magistral-small-2506": {
    releaseDate: new Date("2025-06-25"),
  },

  // Moonshot Kimi
  "moonshotai/kimi-k2-thinking-turbo": {
    releaseDate: new Date("2025-11-06"),
  },
  "moonshotai/kimi-k2-turbo": {
    releaseDate: new Date("2025-09-05"),
  },

  // Stealth Sonoma
  "stealth/sonoma-dusk-alpha": {
    releaseDate: new Date("2025-08-15"),
  },
  "stealth/sonoma-sky-alpha": {
    releaseDate: new Date("2025-08-15"),
  },

  // xAI Grok 4 fast reasoning
  "xai/grok-4-fast-reasoning": {
    releaseDate: new Date("2025-08-30"),
  },
};
