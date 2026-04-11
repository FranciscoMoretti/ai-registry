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
  const toPerMillionPrice = (value?: string): number | null => {
    if (value === undefined) {
      return null;
    }
    const price = Number.parseFloat(value) * 1_000_000;
    return Number.isFinite(price) ? price : null;
  };

  const contextWindows = allModels
    .map((m) => m.context_window)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const maxTokensValues = allModels
    .map((m) => m.max_tokens)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const inputPrices = allModels
    .map((m) => toPerMillionPrice(m.pricing.input))
    .filter((n): n is number => n !== null);
  const outputPrices = allModels
    .map((m) => toPerMillionPrice(m.pricing.output))
    .filter((n): n is number => n !== null);

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
