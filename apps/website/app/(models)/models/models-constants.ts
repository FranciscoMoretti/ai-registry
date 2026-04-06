import type { ModelData } from "@/lib/ai/model-data";

export type ModelRangeLimits = {
  context: [number, number];
  maxTokens: [number, number];
  inputPricing: [number, number];
  outputPricing: [number, number];
};

export function computeModelRangeLimits(
  allModels: readonly ModelData[]
): ModelRangeLimits {
  const contextWindows = allModels
    .map((m) => m.context_window)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const maxTokensValues = allModels
    .map((m) => m.max_tokens)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const inputPrices = allModels
    .map((m) => Number.parseFloat(m.pricing.input ?? "0") * 1_000_000)
    .filter((n) => Number.isFinite(n));
  const outputPrices = allModels
    .map((m) => Number.parseFloat(m.pricing.output ?? "0") * 1_000_000)
    .filter((n) => Number.isFinite(n));

  const minContext =
    contextWindows.length > 0 ? Math.min(...contextWindows) : 0;
  const maxContext =
    contextWindows.length > 0 ? Math.max(...contextWindows) : 0;
  const minMaxTokens =
    maxTokensValues.length > 0 ? Math.min(...maxTokensValues) : 0;
  const maxMaxTokens =
    maxTokensValues.length > 0 ? Math.max(...maxTokensValues) : 0;
  const minInputPrice = inputPrices.length > 0 ? Math.min(...inputPrices) : 0;
  const maxInputPrice = inputPrices.length > 0 ? Math.max(...inputPrices) : 0;
  const minOutputPrice =
    outputPrices.length > 0 ? Math.min(...outputPrices) : 0;
  const maxOutputPrice =
    outputPrices.length > 0 ? Math.max(...outputPrices) : 0;

  return {
    context: [minContext, maxContext],
    maxTokens: [minMaxTokens, maxMaxTokens],
    inputPricing: [minInputPrice, maxInputPrice],
    outputPricing: [minOutputPrice, maxOutputPrice],
  };
}
