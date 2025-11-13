export const providers = [
  "alibaba",
  "amazon",
  "anthropic",
  "cohere",
  "deepseek",
  "google",
  "inception",
  "meituan",
  "meta",
  "minimax",
  "mistral",
  "moonshotai",
  "morph",
  "openai",
  "perplexity",
  "stealth",
  "vercel",
  "xai",
  "zai"
] as const;

export type ProviderId = (typeof providers)[number];
